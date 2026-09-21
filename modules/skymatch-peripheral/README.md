# skymatch-peripheral

Two pieces of native iOS that the app can't do from JavaScript, in one pod
so there is one thing to install rather than two.

| File | What it does |
| --- | --- |
| `SkyMatchPeripheral` | The BLE peripheral role: advertises the mesh service and hosts the characteristic peers write into. `react-native-ble-plx` can only scan and connect, so without this two phones can find each other and neither can answer. |
| `SkyMatchNotifications` | Local notifications for private messages that land while the app is in the background. There is no server behind SkyMatch, so the phone posts them itself. |

## After changing anything in `ios/`

```sh
cd ios && bundle exec pod install
```

New files here are only picked up by that.

## There was a glass layer here

SwiftUI's Liquid Glass - `glassEffect(_:in:)` and `.buttonStyle(.glass)` -
lived in this pod for a while and was taken out again. Two things sank it:
React Native lays out with Yoga and cannot measure a SwiftUI label, so the
button had to report its own size back and came out small; and taps on a
SwiftUI button hosted inside the renderer never reached their handler. The
code is in the history at `f645534` if it is ever worth another go, and it
needs a C++ shadow node for measurement to be worth restarting from.
