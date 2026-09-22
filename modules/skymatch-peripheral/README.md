# skymatch-peripheral

Three pieces of native iOS that the app can't do from JavaScript, in one pod
so there is one thing to install rather than three.

| File | What it does |
| --- | --- |
| `SkyMatchPeripheral` | The BLE peripheral role: advertises the mesh service and hosts the characteristic peers write into. `react-native-ble-plx` can only scan and connect, so without this two phones can find each other and neither can answer. |
| `SkyMatchNotifications` | Local notifications for private messages that land while the app is in the background. There is no server behind SkyMatch, so the phone posts them itself. |
| `SkyMatchImage` | Rescaling and re-encoding a JPEG. The app needs two sizes of the same profile photo — a 64px face for everyone nearby, a 256px portrait for whoever opens your card — and the image picker returns one size per pick. Asking someone to choose the same photo twice was not an option. |

`SkyMatchImage.resize` resolves to `null` rather than rejecting when it
can't do the job, and `image.js` resolves to `null` when the module isn't
there at all (Android, or an older build). Every caller falls back to the
photo it already has, so the feature degrades to what the app did before
rather than to a blank face.

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
