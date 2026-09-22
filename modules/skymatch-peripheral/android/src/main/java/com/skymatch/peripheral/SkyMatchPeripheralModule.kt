package com.skymatch.peripheral

import android.Manifest
import android.annotation.SuppressLint
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothGatt
import android.bluetooth.BluetoothGattCharacteristic
import android.bluetooth.BluetoothGattDescriptor
import android.bluetooth.BluetoothGattServer
import android.bluetooth.BluetoothGattServerCallback
import android.bluetooth.BluetoothGattService
import android.bluetooth.BluetoothManager
import android.bluetooth.BluetoothProfile
import android.bluetooth.le.AdvertiseCallback
import android.bluetooth.le.AdvertiseData
import android.bluetooth.le.AdvertiseSettings
import android.bluetooth.le.BluetoothLeAdvertiser
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.ParcelUuid
import android.util.Base64
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.ByteArrayOutputStream
import java.util.ArrayDeque
import java.util.UUID

/**
 * The BLE peripheral role on Android: advertises the mesh service and hosts
 * the characteristic other phones write frames into and subscribe to.
 *
 * Mirrors SkyMatchPeripheral.m method for method and event for event, so
 * RealBleTransport drives both platforms the same way. Before this existed
 * Android only advertised - nothing answered behind the advert - so every
 * phone that connected to an Android phone found no service and hung up,
 * and two Android phones could never talk at all.
 *
 * Everything runs on the main looper: GATT callbacks arrive on binder
 * threads, and the subscriber set, the write buffers and the notification
 * queue are only safe to touch from one place.
 */
@SuppressLint("MissingPermission") // every entry point checks hasPermissions() first
class SkyMatchPeripheralModule(private val context: ReactApplicationContext) :
    ReactContextBaseJavaModule(context) {

  private val main = Handler(Looper.getMainLooper())
  private val bluetoothManager = context.getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager?

  private var serviceUuid: UUID? = null
  private var charUuid: UUID? = null
  private var localName: String = ""
  private var shouldRun = false

  private var server: BluetoothGattServer? = null
  private var characteristic: BluetoothGattCharacteristic? = null
  private var advertiser: BluetoothLeAdvertiser? = null
  private var advertising = false
  private var receiverRegistered = false

  /** Centrals that enabled notifications: the only way out of the peripheral role. */
  private val subscribers = LinkedHashMap<String, BluetoothDevice>()

  /** Long (prepared) writes, per central, until they are executed. */
  private val preparedWrites = HashMap<String, ByteArrayOutputStream>()

  /**
   * Android sends one notification at a time and says when it is done in
   * onNotificationSent; a second call before that fails. A photo is dozens
   * of frames times every subscriber, so they wait here in order.
   */
  private val outbox = ArrayDeque<Outgoing>()

  /** The central whose notification is on the air, or null when none is. */
  private var inFlight: String? = null

  /**
   * Some stacks never report onNotificationSent for a central that has
   * just gone away. Without a way out the queue would jam and this phone
   * could never answer anyone again.
   */
  private val sendWatchdog = Runnable {
    inFlight = null
    drainOutbox()
  }

  /** Retries a notification the stack was too busy to take. */
  private val retryDrain = Runnable { drainOutbox() }

  override fun getName() = "SkyMatchPeripheral"

  override fun invalidate() {
    main.post {
      shouldRun = false
      tearDown()
    }
    super.invalidate()
  }

  // NativeEventEmitter on Android expects these two to exist.
  @ReactMethod fun addListener(@Suppress("UNUSED_PARAMETER") eventName: String) {}

  @ReactMethod fun removeListeners(@Suppress("UNUSED_PARAMETER") count: Double) {}

  @ReactMethod
  fun start(serviceUUID: String, charUUID: String, localName: String, promise: Promise) {
    main.post {
      try {
        serviceUuid = UUID.fromString(serviceUUID)
        charUuid = UUID.fromString(charUUID)
      } catch (error: IllegalArgumentException) {
        promise.reject("bad_uuid", error)
        return@post
      }
      this.localName = localName
      shouldRun = true
      registerStateReceiver()
      emitState()
      publishIfReady()
      promise.resolve(null)
    }
  }

  @ReactMethod
  fun stop(promise: Promise) {
    main.post {
      shouldRun = false
      tearDown()
      promise.resolve(null)
    }
  }

  /** Queues one frame for every subscribed central; false when nobody is listening. */
  @ReactMethod
  fun notify(base64Value: String, promise: Promise) {
    main.post {
      val data =
          try {
            Base64.decode(base64Value, Base64.DEFAULT)
          } catch (error: IllegalArgumentException) {
            null
          }
      // Same reasoning as the iOS module: with no listeners there is nothing
      // to wait for, and queueing would only grow a backlog nobody drains.
      if (data == null || server == null || characteristic == null || subscribers.isEmpty()) {
        promise.resolve(false)
        return@post
      }
      subscribers.values.forEach { device -> outbox.add(Outgoing(device, data)) }
      drainOutbox()
      promise.resolve(true)
    }
  }

  // ---------------------------------------------------------------------------

  private fun hasPermissions(): Boolean {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return true
    return granted(Manifest.permission.BLUETOOTH_CONNECT) && granted(Manifest.permission.BLUETOOTH_ADVERTISE)
  }

  private fun granted(permission: String) = context.checkSelfPermission(permission) == PackageManager.PERMISSION_GRANTED

  private val adapter: BluetoothAdapter?
    get() = bluetoothManager?.adapter

  private fun publishIfReady() {
    if (!shouldRun) return
    val adapter = adapter ?: return
    if (!hasPermissions() || !adapter.isEnabled) return

    if (server == null) {
      val serviceUuid = serviceUuid ?: return
      val charUuid = charUuid ?: return
      val opened = bluetoothManager?.openGattServer(context, gattCallback) ?: return

      val characteristic =
          BluetoothGattCharacteristic(
              charUuid,
              BluetoothGattCharacteristic.PROPERTY_WRITE or
                  BluetoothGattCharacteristic.PROPERTY_WRITE_NO_RESPONSE or
                  BluetoothGattCharacteristic.PROPERTY_NOTIFY,
              BluetoothGattCharacteristic.PERMISSION_WRITE,
          )
      // A central subscribes by writing this descriptor. CoreBluetooth adds
      // it by itself; Android does not, and without it nobody can listen.
      characteristic.addDescriptor(
          BluetoothGattDescriptor(
              CCCD_UUID,
              BluetoothGattDescriptor.PERMISSION_READ or BluetoothGattDescriptor.PERMISSION_WRITE,
          ),
      )
      val service = BluetoothGattService(serviceUuid, BluetoothGattService.SERVICE_TYPE_PRIMARY)
      service.addCharacteristic(characteristic)

      this.characteristic = characteristic
      server = opened
      // Advertising waits for onServiceAdded: an advert that reaches a phone
      // before the service exists sends it off to find nothing.
      if (!opened.addService(service)) {
        opened.close()
        server = null
        this.characteristic = null
      }
      return
    }
    startAdvertising()
  }

  private fun startAdvertising() {
    if (!shouldRun || advertising) return
    val serviceUuid = serviceUuid ?: return
    val advertiser = adapter?.bluetoothLeAdvertiser ?: return
    this.advertiser = advertiser

    val settings =
        AdvertiseSettings.Builder()
            .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY)
            .setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_MEDIUM)
            .setConnectable(true)
            .setTimeout(0)
            .build()
    // The 128-bit service UUID takes most of the 31 bytes of the advert
    // itself, so the location rides in the scan response, where scanners
    // read it as manufacturer data (see locationFromAdvert in
    // RealBleTransport).
    val data = AdvertiseData.Builder().addServiceUuid(ParcelUuid(serviceUuid)).setIncludeDeviceName(false).build()
    val response =
        AdvertiseData.Builder()
            .setIncludeDeviceName(false)
            .addManufacturerData(MANUFACTURER_ID, localName.toByteArray(Charsets.US_ASCII).take(MAX_NAME_BYTES).toByteArray())
            .build()

    advertising = true
    try {
      advertiser.startAdvertising(settings, data, response, advertiseCallback)
    } catch (error: RuntimeException) {
      advertising = false
    }
  }

  private val advertiseCallback =
      object : AdvertiseCallback() {
        override fun onStartSuccess(settingsInEffect: AdvertiseSettings?) {}

        override fun onStartFailure(errorCode: Int) {
          main.post {
            // Already started counts as success; anything else is retried
            // the next time the radio comes back.
            advertising = errorCode == AdvertiseCallback.ADVERTISE_FAILED_ALREADY_STARTED
          }
        }
      }

  private fun tearDown() {
    main.removeCallbacks(sendWatchdog)
    main.removeCallbacks(retryDrain)
    if (advertising) {
      try {
        advertiser?.stopAdvertising(advertiseCallback)
      } catch (error: RuntimeException) {
        // the radio went away first; nothing left to stop
      }
    }
    advertising = false
    try {
      server?.clearServices()
      server?.close()
    } catch (error: RuntimeException) {
      // same
    }
    server = null
    characteristic = null
    outbox.clear()
    inFlight = null
    preparedWrites.clear()
    subscribers.clear()
    emitSubscribers()
    if (receiverRegistered && !shouldRun) {
      try {
        context.unregisterReceiver(stateReceiver)
      } catch (error: IllegalArgumentException) {
        // never registered
      }
      receiverRegistered = false
    }
  }

  private fun drainOutbox() {
    val server = server ?: return
    val characteristic = characteristic ?: return
    while (inFlight == null && outbox.isNotEmpty()) {
      val next = outbox.peek() ?: return
      if (!subscribers.containsKey(next.device.address)) {
        outbox.poll()
        continue
      }
      val status =
          try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
              server.notifyCharacteristicChanged(next.device, characteristic, false, next.data)
            } else {
              @Suppress("DEPRECATION")
              characteristic.value = next.data
              @Suppress("DEPRECATION")
              if (server.notifyCharacteristicChanged(next.device, characteristic, false)) BluetoothGatt.GATT_SUCCESS
              else BluetoothGatt.GATT_FAILURE
            }
          } catch (error: RuntimeException) {
            BluetoothGatt.GATT_FAILURE
          }
      if (status == BluetoothGatt.GATT_SUCCESS) {
        outbox.poll()
        inFlight = next.device.address
        main.postDelayed(sendWatchdog, SEND_TIMEOUT_MS)
        return
      }
      // Busy is the stack saying "not yet", not "never": a single-chunk
      // frame - a message, a profile beat - has no repair behind it, so it
      // waits its turn rather than being dropped. Only a frame that keeps
      // failing is given up on.
      next.attempts += 1
      if (next.attempts >= MAX_SEND_ATTEMPTS) {
        outbox.poll()
        continue
      }
      main.removeCallbacks(retryDrain)
      main.postDelayed(retryDrain, RETRY_DELAY_MS)
      return
    }
  }

  private val gattCallback =
      object : BluetoothGattServerCallback() {
        override fun onServiceAdded(status: Int, service: BluetoothGattService?) {
          main.post {
            if (status == BluetoothGatt.GATT_SUCCESS) {
              startAdvertising()
            } else {
              server?.close()
              server = null
              characteristic = null
            }
          }
        }

        override fun onConnectionStateChange(device: BluetoothDevice, status: Int, newState: Int) {
          if (newState != BluetoothProfile.STATE_DISCONNECTED) return
          main.post {
            preparedWrites.remove(device.address)
            if (subscribers.remove(device.address) != null) emitSubscribers()
          }
        }

        override fun onCharacteristicWriteRequest(
            device: BluetoothDevice,
            requestId: Int,
            characteristic: BluetoothGattCharacteristic,
            preparedWrite: Boolean,
            responseNeeded: Boolean,
            offset: Int,
            value: ByteArray?,
        ) {
          val bytes = value ?: ByteArray(0)
          main.post {
            if (characteristic.uuid != charUuid) {
              if (responseNeeded) respond(device, requestId, BluetoothGatt.GATT_REQUEST_NOT_SUPPORTED, offset)
              return@post
            }
            if (preparedWrite) {
              // A frame longer than the link's MTU arrives in pieces and only
              // counts once the central says to execute them.
              val buffer = preparedWrites.getOrPut(device.address) { ByteArrayOutputStream() }
              if (offset != buffer.size()) {
                preparedWrites.remove(device.address)
                if (responseNeeded) respond(device, requestId, BluetoothGatt.GATT_INVALID_OFFSET, offset, bytes)
                return@post
              }
              buffer.write(bytes)
              if (responseNeeded) respond(device, requestId, BluetoothGatt.GATT_SUCCESS, offset, bytes)
              return@post
            }
            if (responseNeeded) respond(device, requestId, BluetoothGatt.GATT_SUCCESS, offset)
            emitWrite(device, bytes)
          }
        }

        override fun onExecuteWrite(device: BluetoothDevice, requestId: Int, execute: Boolean) {
          main.post {
            val buffer = preparedWrites.remove(device.address)
            respond(device, requestId, BluetoothGatt.GATT_SUCCESS, 0)
            if (execute && buffer != null) emitWrite(device, buffer.toByteArray())
          }
        }

        override fun onDescriptorWriteRequest(
            device: BluetoothDevice,
            requestId: Int,
            descriptor: BluetoothGattDescriptor,
            preparedWrite: Boolean,
            responseNeeded: Boolean,
            offset: Int,
            value: ByteArray?,
        ) {
          main.post {
            if (descriptor.uuid == CCCD_UUID) {
              val enabled =
                  value != null &&
                      (value.contentEquals(BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE) ||
                          value.contentEquals(BluetoothGattDescriptor.ENABLE_INDICATION_VALUE))
              if (enabled) subscribers[device.address] = device else subscribers.remove(device.address)
              emitSubscribers()
              if (responseNeeded) respond(device, requestId, BluetoothGatt.GATT_SUCCESS, offset)
              // Anything that piled up while nobody was listening can go now.
              if (enabled) drainOutbox()
              return@post
            }
            if (responseNeeded) respond(device, requestId, BluetoothGatt.GATT_REQUEST_NOT_SUPPORTED, offset)
          }
        }

        override fun onDescriptorReadRequest(
            device: BluetoothDevice,
            requestId: Int,
            offset: Int,
            descriptor: BluetoothGattDescriptor,
        ) {
          main.post {
            val value =
                if (subscribers.containsKey(device.address)) BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE
                else BluetoothGattDescriptor.DISABLE_NOTIFICATION_VALUE
            respond(device, requestId, BluetoothGatt.GATT_SUCCESS, offset, value)
          }
        }

        override fun onNotificationSent(device: BluetoothDevice, status: Int) {
          main.post {
            // A report for a notification the watchdog already gave up on
            // must not release the one that has since gone out in its place.
            if (inFlight != device.address) return@post
            main.removeCallbacks(sendWatchdog)
            inFlight = null
            drainOutbox()
          }
        }
      }

  private fun respond(device: BluetoothDevice, requestId: Int, status: Int, offset: Int, value: ByteArray? = null) {
    try {
      server?.sendResponse(device, requestId, status, offset, value)
    } catch (error: RuntimeException) {
      // the central left mid-request
    }
  }

  private fun emitWrite(device: BluetoothDevice, bytes: ByteArray) {
    if (bytes.isEmpty()) return
    val body = Arguments.createMap()
    body.putString("value", Base64.encodeToString(bytes, Base64.NO_WRAP))
    body.putString("centralId", device.address)
    emit(WRITE_EVENT, body)
  }

  private fun emitSubscribers() {
    val body = Arguments.createMap()
    body.putInt("count", subscribers.size)
    emit(SUBSCRIBERS_EVENT, body)
  }

  /** Reported in CoreBluetooth's numbers, so the JS side reads both platforms the same way. */
  private fun emitState() {
    val adapter = adapter
    val state =
        when {
          adapter == null -> CB_UNSUPPORTED
          !hasPermissions() -> CB_UNAUTHORIZED
          adapter.state == BluetoothAdapter.STATE_ON -> CB_POWERED_ON
          adapter.state == BluetoothAdapter.STATE_TURNING_ON ||
              adapter.state == BluetoothAdapter.STATE_TURNING_OFF -> CB_RESETTING
          else -> CB_POWERED_OFF
        }
    val body = Arguments.createMap()
    body.putInt("state", state)
    emit(STATE_EVENT, body)
  }

  private fun emit(event: String, body: Any) {
    if (!context.hasActiveReactInstance()) return
    context.emitDeviceEvent(event, body)
  }

  private val stateReceiver =
      object : BroadcastReceiver() {
        override fun onReceive(receiverContext: Context?, intent: Intent?) {
          if (intent?.action != BluetoothAdapter.ACTION_STATE_CHANGED) return
          main.post {
            emitState()
            when (intent.getIntExtra(BluetoothAdapter.EXTRA_STATE, BluetoothAdapter.ERROR)) {
              BluetoothAdapter.STATE_ON -> publishIfReady()
              BluetoothAdapter.STATE_TURNING_OFF, BluetoothAdapter.STATE_OFF -> {
                // The server dies with the radio; it is rebuilt when it returns.
                val keepRunning = shouldRun
                tearDown()
                shouldRun = keepRunning
              }
            }
          }
        }
      }

  private fun registerStateReceiver() {
    if (receiverRegistered) return
    val filter = IntentFilter(BluetoothAdapter.ACTION_STATE_CHANGED)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      context.registerReceiver(stateReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
    } else {
      context.registerReceiver(stateReceiver, filter)
    }
    receiverRegistered = true
  }

  private class Outgoing(val device: BluetoothDevice, val data: ByteArray) {
    var attempts = 0
  }

  private companion object {
    const val WRITE_EVENT = "SkyMatchPeripheralWrite"
    const val STATE_EVENT = "SkyMatchPeripheralState"
    const val SUBSCRIBERS_EVENT = "SkyMatchPeripheralSubscribers"

    val CCCD_UUID: UUID = UUID.fromString("00002902-0000-1000-8000-00805f9b34fb")

    /** Must match MANUFACTURER_ID in protocol.ts. */
    const val MANUFACTURER_ID = 0xffff

    /** 31 bytes of scan response, less the length, type and company id. */
    const val MAX_NAME_BYTES = 27

    const val SEND_TIMEOUT_MS = 1_000L
    const val RETRY_DELAY_MS = 20L
    const val MAX_SEND_ATTEMPTS = 25

    // CBManagerState values.
    const val CB_RESETTING = 1
    const val CB_UNSUPPORTED = 2
    const val CB_UNAUTHORIZED = 3
    const val CB_POWERED_OFF = 4
    const val CB_POWERED_ON = 5
  }
}
