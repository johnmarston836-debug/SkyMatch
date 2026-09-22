package com.skymatch.peripheral

import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * Local notifications for private messages that land while SkyMatch is in
 * the background - the Android side of SkyMatchNotifications.m.
 *
 * Asking for the permission is left to JavaScript (PermissionsAndroid),
 * which already knows how to show the system prompt; this only records that
 * it was asked, because Android can't otherwise tell "never asked" from
 * "said no", and only the second should send someone to Settings.
 */
class SkyMatchNotificationsModule(private val context: ReactApplicationContext) :
    ReactContextBaseJavaModule(context) {

  override fun getName() = "SkyMatchNotifications"

  private val prefs
    get() = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

  private val manager
    get() = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

  @ReactMethod
  fun markAsked(promise: Promise) {
    prefs.edit().putBoolean(ASKED_KEY, true).apply()
    promise.resolve(true)
  }

  /** 'granted' | 'denied' | 'undetermined' */
  @ReactMethod
  fun getPermission(promise: Promise) {
    promise.resolve(permission())
  }

  @ReactMethod
  fun present(title: String, body: String, threadId: String?, channelName: String, promise: Promise) {
    if (permission() != "granted") {
      promise.resolve(false)
      return
    }
    ensureChannel(channelName)

    val launch = context.packageManager.getLaunchIntentForPackage(context.packageName)
    launch?.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
    val tapIntent =
        launch?.let {
          PendingIntent.getActivity(
              context,
              0,
              it,
              PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
          )
        }

    val builder =
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
          Notification.Builder(context, CHANNEL_ID)
        } else {
          @Suppress("DEPRECATION")
          Notification.Builder(context).setPriority(Notification.PRIORITY_HIGH)
        }
    builder
        .setSmallIcon(R.drawable.skymatch_notification)
        .setContentTitle(title)
        .setContentText(body)
        .setStyle(Notification.BigTextStyle().bigText(body))
        .setCategory(Notification.CATEGORY_MESSAGE)
        .setAutoCancel(true)
        .setContentIntent(tapIntent)
    // One conversation, one group - the same as iOS's thread id.
    if (threadId != null) builder.setGroup(threadId)

    // One card per conversation, replaced by its newest message, rather than
    // a stack of every line someone sent while the phone was in a pocket.
    try {
      manager.notify(threadId, NOTIFICATION_ID, builder.build())
      promise.resolve(true)
    } catch (error: SecurityException) {
      promise.resolve(false)
    }
  }

  /** Android launchers count the notifications themselves; there is no number to set. */
  @ReactMethod
  fun setBadge(@Suppress("UNUSED_PARAMETER") count: Double, promise: Promise) {
    promise.resolve(true)
  }

  @ReactMethod
  fun clearDelivered(promise: Promise) {
    manager.cancelAll()
    promise.resolve(true)
  }

  private fun permission(): String {
    val allowed =
        Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
            context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED
    if (allowed && manager.areNotificationsEnabled()) return "granted"
    // Before Android 13 there is no prompt: off means switched off in Settings.
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) return "denied"
    return if (prefs.getBoolean(ASKED_KEY, false)) "denied" else "undetermined"
  }

  /** Creating an existing channel again only renames it, which is how a change of language reaches Settings. */
  private fun ensureChannel(name: String) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    manager.createNotificationChannel(NotificationChannel(CHANNEL_ID, name, NotificationManager.IMPORTANCE_HIGH))
  }

  private companion object {
    const val CHANNEL_ID = "skymatch-messages"
    const val NOTIFICATION_ID = 1
    const val PREFS = "skymatch-notifications"
    const val ASKED_KEY = "asked"
  }
}
