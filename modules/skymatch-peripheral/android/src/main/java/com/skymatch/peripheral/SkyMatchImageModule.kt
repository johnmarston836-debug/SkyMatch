package com.skymatch.peripheral

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.Base64
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.ByteArrayOutputStream
import java.util.concurrent.Executors
import kotlin.math.max
import kotlin.math.roundToInt

/**
 * Makes the second size of a profile photo, like SkyMatchImage.m.
 *
 * Without it an Android phone sent its 256px portrait where everyone else
 * sends a 64px face: five times the Bluetooth frames, to every phone in the
 * room, every time someone new walked in.
 */
class SkyMatchImageModule(context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {

  override fun getName() = "SkyMatchImage"

  @ReactMethod
  fun resize(base64: String, maxSide: Double, quality: Double, promise: Promise) {
    worker.execute {
      try {
        val bytes = Base64.decode(base64, Base64.DEFAULT)
        val source = BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
        if (source == null) {
          promise.resolve(null)
          return@execute
        }
        val side = max(source.width, source.height)
        val scale = if (side > maxSide) maxSide / side else 1.0
        val width = max(1, (source.width * scale).roundToInt())
        val height = max(1, (source.height * scale).roundToInt())
        val scaled = if (scale < 1.0) Bitmap.createScaledBitmap(source, width, height, true) else source

        val out = ByteArrayOutputStream()
        val jpegQuality = (quality.coerceIn(0.0, 1.0) * 100).roundToInt()
        scaled.compress(Bitmap.CompressFormat.JPEG, jpegQuality, out)
        if (scaled !== source) scaled.recycle()
        source.recycle()
        promise.resolve(Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP))
      } catch (error: Throwable) {
        // An image the system can't read: the caller keeps the one it has.
        promise.resolve(null)
      }
    }
  }

  private companion object {
    /** Decoding a photo is too slow for the JS thread, and one at a time is plenty. */
    val worker = Executors.newSingleThreadExecutor()
  }
}
