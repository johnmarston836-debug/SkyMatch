# SkyMatch

Tinder-style matching and chat for passengers on the same flight, running entirely over Bluetooth — no wifi, no cellular data, no server. Onboarding asks for your seat so a match knows where to find you in the cabin.

## How it works

There is no backend. Every phone is simultaneously:

- a **BLE peripheral**, continuously advertising a tiny payload (protocol version + short peer id + packed seat byte) so it shows up on nearby swipe decks without needing a connection;
- a **BLE central**, scanning for those adverts and opening a GATT connection to exchange full profiles, swipes and chat messages.

Two phones directly in range talk to each other straight away. A match whose phone has moved out of range is reached by **flood routing**: any other phone running the app that's still in range of both relays the message on their behalf, decrementing a hop counter (TTL) and deduping by message id, the same approach offline mesh chat apps like Bridgefy or Briar use. See `src/mesh/protocol.ts` for the wire format and `src/mesh/MeshRouter.ts` for the routing logic.

```
src/mesh/
  protocol.ts        wire format: advert payload, envelope shape, chunking
  BleTransport.ts     the interface the rest of the app codes against
  MockBleTransport.ts  simulated peers - no hardware needed, used by default
  RealBleTransport.ts  real hardware: react-native-ble-plx (central) + react-native-ble-advertiser (peripheral)
  MeshRouter.ts        store-and-forward flood routing, dedup cache
  MeshService.ts       turns raw envelopes into typed app events
  meshController.ts    wires MeshService into the zustand stores
```

### Mock vs. real mesh

`USE_MOCK_MESH` in `src/mesh/meshController.ts` defaults to `true`: the app runs against `MockBleTransport`, which simulates a handful of nearby passengers so the full swipe → match → chat flow can be built, demoed and tested on a single device or simulator. Flip it to `false` to switch to `RealBleTransport` on real hardware.

**Read this before testing on real phones:** `react-native-ble-plx` only implements the BLE central role. Peripheral/advertising support comes from `react-native-ble-advertiser`, which is solid on Android but not reliable for background/foreground GATT serving on iOS — a production iOS build needs a small native module around `CBPeripheralManager` (Swift). `RealBleTransport` is written and type-checked but, like any BLE code, can only really be verified on two physical phones — treat it as a reviewed reference implementation, not a tested one, until you've done that.

### Data model

- `Profile` (name, age, bio, interests, seat) is created once during onboarding and stored locally (`src/state/profileStore.ts`, AsyncStorage) — it never leaves the device except as the exact payload sent to phones you're actually near.
- Swipes and matches (`src/state/discoveryStore.ts`, `src/state/matchStore.ts`) are in-memory per session: there is no server to persist a "likes you" list, so a like only becomes a match while both phones are running the app.
- Chat history (`src/state/chatStore.ts`) is also in-memory per session for the same reason — there's nothing to sync it from once the app is closed.

## Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
