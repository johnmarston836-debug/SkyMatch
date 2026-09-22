package com.skymatch.peripheral

import android.content.Intent
import android.os.Build
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/** Starts and stops SkyMatchBackgroundService from JavaScript. */
class SkyMatchBackgroundModule(private val context: ReactApplicationContext) :
    ReactContextBaseJavaModule(context) {

  override fun getName() = "SkyMatchBackground"

  @ReactMethod fun addListener(@Suppress("UNUSED_PARAMETER") eventName: String) {}

  @ReactMethod fun removeListeners(@Suppress("UNUSED_PARAMETER") count: Double) {}

  /** Also how the notification's words are updated: calling it again only refreshes them. */
  @ReactMethod
  fun start(title: String, body: String, stopLabel: String, channelName: String, promise: Promise) {
    val intent =
        Intent(context, SkyMatchBackgroundService::class.java)
            .putExtra(SkyMatchBackgroundService.EXTRA_TITLE, title)
            .putExtra(SkyMatchBackgroundService.EXTRA_BODY, body)
            .putExtra(SkyMatchBackgroundService.EXTRA_STOP, stopLabel)
            .putExtra(SkyMatchBackgroundService.EXTRA_CHANNEL, channelName)
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) context.startForegroundService(intent)
      else context.startService(intent)
      promise.resolve(true)
    } catch (error: RuntimeException) {
      // Not allowed right now (app not in the foreground, say): the app
      // keeps working in the foreground as before.
      promise.resolve(false)
    }
  }

  @ReactMethod
  fun stop(promise: Promise) {
    try {
      context.startService(
          Intent(context, SkyMatchBackgroundService::class.java).setAction(SkyMatchBackgroundService.ACTION_STOP))
    } catch (error: RuntimeException) {
      // not running
    }
    promise.resolve(true)
  }
}
