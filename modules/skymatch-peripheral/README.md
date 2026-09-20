# skymatch-peripheral

Three pieces of native iOS that the app can't do from JavaScript, in one pod
so there is one thing to install rather than three.

| File | What it does |
| --- | --- |
| `SkyMatchPeripheral` | The BLE peripheral role: advertises the mesh service and hosts the characteristic peers write into. `react-native-ble-plx` can only scan and connect, so without this two phones can find each other and neither can answer. |
| `SkyMatchNotifications` | Local notifications for private messages that land while the app is in the background. There is no server behind SkyMatch, so the phone posts them itself. |
| `SkyMatchGlassView` | A pane of the system's glass (`UIGlassEffect`, or the older frosted material on phones without it) for the app's buttons to sit on. |

## After changing anything in `ios/`

```sh
cd ios && bundle exec pod install
```

New files here are only picked up by that, and `SkyMatchGlassView` also needs
it to run React Native's code generator over `js/`.

## If the glass view ever blocks a build

It is the only piece the app can live without: `glass.js` resolves it inside
a `try`, and every button falls back to drawing its own surface. Deleting
`ios/SkyMatchGlassView.{h,mm}`, `js/`, `glass.js`, `glass.d.ts` and the
`codegenConfig` block in `package.json`, then running `pod install` again,
takes the app back to the drawn buttons with nothing else affected.
