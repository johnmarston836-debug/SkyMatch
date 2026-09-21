# skymatch-peripheral

Three pieces of native iOS that the app can't do from JavaScript, in one pod
so there is one thing to install rather than three.

| File | What it does |
| --- | --- |
| `SkyMatchPeripheral` | The BLE peripheral role: advertises the mesh service and hosts the characteristic peers write into. `react-native-ble-plx` can only scan and connect, so without this two phones can find each other and neither can answer. |
| `SkyMatchNotifications` | Local notifications for private messages that land while the app is in the background. There is no server behind SkyMatch, so the phone posts them itself. |
| `SkyMatchGlassView` | A pane of SwiftUI's `glassEffect(.regular, in:)`, to sit behind React Native content. |
| `SkyMatchGlassButton` | SwiftUI's own `.buttonStyle(.glass)` / `.glassProminent`, laid out by React Native. Its label is a prop, not React children: SwiftUI draws it, and that is the part Apple tunes. |

## After changing anything in `ios/`

```sh
cd ios && bundle exec pod install
```

New files here are only picked up by that, and `SkyMatchGlassView` also needs
it to run React Native's code generator over `js/`.

## Why the glass classes have no header

A pod with Swift in it has to define a module, and CocoaPods builds that
module's umbrella header out of every public header. A Fabric component's
header imports React's renderer headers, which are C++, and the umbrella is
compiled as plain Objective-C - so the module build dies on `'atomic' file
not found`. Both classes are therefore declared inside their `.mm`. Nothing
outside needs them: the generated provider only looks up the `Cls()`
function.

## Why the button measures itself

React Native lays out with Yoga, in JavaScript, and JavaScript cannot know
how wide a string is once SwiftUI has set it. The button reports the size it
wants through `onSizeChange` and the JavaScript side applies it back as a
style. That costs one extra layout pass; the only alternative is a C++ shadow
node with its own `measureContent`.

## If the glass ever blocks a build

It is the only piece the app can live without: `glass.js` resolves both
components inside a `try`, and every button falls back to drawing its own
surface. Deleting `ios/SkyMatchGlass.swift`, `ios/SkyMatchGlassView.{h,mm}`,
`ios/SkyMatchGlassButton.{h,mm}`, `js/`, `glass.js`, `glass.d.ts` and the
`codegenConfig` block in `package.json`, then running `pod install` again,
takes the app back to the drawn buttons with nothing else affected.
