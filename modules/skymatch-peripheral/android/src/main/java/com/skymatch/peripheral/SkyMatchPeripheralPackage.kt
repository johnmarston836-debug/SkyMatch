package com.skymatch.peripheral

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

/** The Android half of `skymatch-peripheral`: same three modules, same names, as the iOS pod. */
class SkyMatchPeripheralPackage : ReactPackage {
  // The legacy registration path, same as react-native-ble-plx: the new
  // architecture's interop layer still serves it, and it keeps this module
  // free of codegen.
  @Suppress("OVERRIDE_DEPRECATION")
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> =
      listOf(
          SkyMatchPeripheralModule(reactContext),
          SkyMatchImageModule(reactContext),
          SkyMatchNotificationsModule(reactContext),
          SkyMatchBackgroundModule(reactContext),
      )

  override fun createViewManagers(
      reactContext: ReactApplicationContext
  ): List<ViewManager<in Nothing, in Nothing>> = emptyList()
}
