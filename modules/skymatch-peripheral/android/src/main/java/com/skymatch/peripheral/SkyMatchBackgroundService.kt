package com.skymatch.peripheral

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import com.facebook.react.HeadlessJsTaskService
import com.facebook.react.bridge.Arguments
import com.facebook.react.jstasks.HeadlessJsTaskConfig

/**
 * Keeps SkyMatch on the mesh while it is not on screen.
 *
 * Two things stop when an Android app goes to the background, and either
 * one takes a phone off the mesh: React Native pauses every JavaScript
 * timer - the profile beat among them, so everyone else's list drops this
 * phone within a minute - and the system freezes the process soon after.
 * A foreground service, with the notification Android requires for one,
 * keeps the process running; the headless JS task it starts is what React
 * Native checks before pausing timers, so the beat and the relaying carry
 * on as if the app were open.
 *
 * Swiping the app away from the recent apps, or tapping "Disconnect" on
 * the notification, stops it: both mean the person wants off.
 */
class SkyMatchBackgroundService : HeadlessJsTaskService() {

  private var taskStarted = false

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    if (intent?.action == ACTION_STOP) {
      stopEverything()
      return START_NOT_STICKY
    }

    val notification = buildNotification(intent)
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_CONNECTED_DEVICE)
      } else {
        startForeground(NOTIFICATION_ID, notification)
      }
    } catch (error: RuntimeException) {
      // Android 14 refuses a connected-device service without the Bluetooth
      // permissions, and 12+ refuses one started from the background: in
      // both cases the app simply works as it did before, in the foreground.
      stopSelf()
      return START_NOT_STICKY
    }

    // Started again only to change the notification's words (a new
    // language): one keep-alive task is enough.
    if (!taskStarted) {
      taskStarted = true
      super.onStartCommand(intent, flags, startId)
    }
    return START_NOT_STICKY
  }

  override fun getTaskConfig(intent: Intent?): HeadlessJsTaskConfig =
      HeadlessJsTaskConfig(TASK_KEY, Arguments.createMap(), 0, true)

  override fun onTaskRemoved(rootIntent: Intent?) {
    stopEverything()
    super.onTaskRemoved(rootIntent)
  }

  private fun stopEverything() {
    // The JS task waits for this to finish, so timers go back to pausing
    // normally in the background.
    reactContext?.emitDeviceEvent(STOPPED_EVENT, null)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
      stopForeground(STOP_FOREGROUND_REMOVE)
    } else {
      @Suppress("DEPRECATION") stopForeground(true)
    }
    stopSelf()
  }

  private fun buildNotification(intent: Intent?): Notification {
    val title = intent?.getStringExtra(EXTRA_TITLE) ?: "SkyMatch"
    val body = intent?.getStringExtra(EXTRA_BODY) ?: ""
    val stopLabel = intent?.getStringExtra(EXTRA_STOP) ?: "Disconnect"
    val channelName = intent?.getStringExtra(EXTRA_CHANNEL) ?: "SkyMatch"

    val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      // Low importance: always there, never a sound or a heads-up banner.
      manager.createNotificationChannel(NotificationChannel(CHANNEL_ID, channelName, NotificationManager.IMPORTANCE_LOW))
    }

    val open = packageManager.getLaunchIntentForPackage(packageName)?.apply {
      flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
    }
    val openIntent =
        open?.let { PendingIntent.getActivity(this, 0, it, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE) }
    val stopIntent =
        PendingIntent.getService(
            this,
            1,
            Intent(this, SkyMatchBackgroundService::class.java).setAction(ACTION_STOP),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )

    val builder =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
          Notification.Builder(this, CHANNEL_ID)
        } else {
          @Suppress("DEPRECATION") Notification.Builder(this).setPriority(Notification.PRIORITY_LOW)
        }
    return builder
        .setSmallIcon(R.drawable.skymatch_notification)
        .setContentTitle(title)
        .setContentText(body)
        .setOngoing(true)
        .setShowWhen(false)
        .setContentIntent(openIntent)
        .addAction(Notification.Action.Builder(null, stopLabel, stopIntent).build())
        .build()
  }

  companion object {
    const val TASK_KEY = "SkyMatchKeepAlive"
    const val STOPPED_EVENT = "SkyMatchBackgroundStopped"
    const val ACTION_STOP = "com.skymatch.peripheral.STOP_BACKGROUND"
    const val EXTRA_TITLE = "title"
    const val EXTRA_BODY = "body"
    const val EXTRA_STOP = "stop"
    const val EXTRA_CHANNEL = "channel"
    private const val CHANNEL_ID = "skymatch-background"
    private const val NOTIFICATION_ID = 7
  }
}
