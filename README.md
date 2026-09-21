# SkyMatch

A common group chat for every passenger on the same flight, running entirely over Bluetooth — no wifi, no cellular data, no server. Your seat is your identity: onboarding asks for it, and every message in the cabin chat is labelled by seat. Tap anyone to open a private 1:1 chat, which (unlike the group chat) can also carry a small image.

## How it works

There is no backend. Every phone is simultaneously:

- a **BLE peripheral**, continuously advertising a tiny payload (protocol version + short peer id + packed seat byte) so it shows up to others without needing a connection;
- a **BLE central**, scanning for those adverts and opening a GATT connection to exchange profiles, the group chat, private messages and presence alerts (the "I'm heading to the bathroom" button).

Two phones directly in range talk to each other straight away. The group chat and presence alerts are **broadcast**: every node that receives one delivers it locally *and* keeps flooding it outward, so it reaches the whole cabin, hop by hop, decrementing a TTL and deduping by message id along the way - the same approach offline mesh chat apps like Bridgefy or Briar use. A private message instead targets one peer id directly, relayed the same way if that person isn't in direct range. See `src/mesh/protocol.ts` for the wire format and `src/mesh/MeshRouter.ts` for the routing logic.

**Images only ever travel privately, never in the group chat** - broadcasting a photo means every relay hop re-sends the whole thing to everyone else's phone, which would flood the cabin's Bluetooth for one picture. A private image only costs the direct connection (or few hops) between the two people actually talking. See `MeshService.sendPrivateMessage` for the full reasoning.

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

`USE_MOCK_MESH` in `src/mesh/meshController.ts` defaults to `true`: the app runs against `MockBleTransport`, which simulates a handful of nearby passengers (profile broadcasts, a couple of group chat lines, private-message echoes) so the full cabin chat → private chat flow can be built, demoed and tested on a single device or simulator. Flip it to `false` to switch to `RealBleTransport` on real hardware.

**Read this before testing on real phones:** `react-native-ble-plx` only implements the BLE central role. Peripheral/advertising support comes from `react-native-ble-advertiser`, which is solid on Android but not reliable for background/foreground GATT serving on iOS — a production iOS build needs a small native module around `CBPeripheralManager` (Swift). `RealBleTransport` is written and type-checked but, like any BLE code, can only really be verified on two physical phones — treat it as a reviewed reference implementation, not a tested one, until you've done that.

### Data model

- `Profile` (seat, nickname) is created once during onboarding and stored locally (`src/state/profileStore.ts`, AsyncStorage) — the seat is the real identity; the nickname just labels it in chat.
- Discovered peers (`src/state/discoveryStore.ts`) and messages (`src/state/chatStore.ts`: `groupMessages` plus `privateMessagesByPeer`) are in-memory per session — there is no server, so there's nothing to sync history from once the app is closed.
- Presence alerts (`src/state/presenceStore.ts`) are even more ephemeral: each one carries its own `expiresAt` and the UI (`PresenceBanner`) prunes expired ones on a timer, same as the button that raises them (`announceBathroomBreak`) being a plain manual toggle rather than any kind of sensor-based detection.

### Languages

The app follows the phone's language: Spanish, English and Catalan, with English as the fallback for anything else (an aeroplane is the one place where that is the likelier shared language, not Spanish).

```
src/i18n/
  es.ts     the Spanish copy, and the shape every other dictionary must match
  en.ts     English - also what a phone set to any other language gets
  ca.ts     Catalan
  index.ts  which language the phone is in, and the `t` every screen reads
```

`es.ts` is the source of truth: `Strings` is inferred from it, so adding a key there makes `en.ts` and `ca.ts` fail to compile until they have it too. `__tests__/i18n.test.ts` covers what the compiler can't see - a leaf that is a function in one language and a bare string in another, an empty value, a venue chip name too long to fit in a quarter of the screen.

Everything with a value in it is a function rather than a template glued together at the call site (`t.sessionStart.greeting(name)`, `t.presence.countdown(minutes)`), because where the value lands in the sentence belongs to the language.

Two places hold words that are not in the dictionaries because they are not words the app says:

- `src/venues.ts` keeps only what doesn't change with the language - the icon, which alert the one-tap button raises, whether the place has seats. `venueOf(kind)` merges it with that venue's copy, per call, so a change of language reaches it.
- `ios/SkyMatch/*.lproj/InfoPlist.strings` holds the Bluetooth and photo-library prompts, because iOS draws those itself before any JavaScript runs.

**Adding a language** is a new file next to `es.ts`, one entry in `LANGUAGES` and `DICTIONARIES` in `src/i18n/index.ts`, and - if its permission prompts should be translated too - a `<code>.lproj/InfoPlist.strings` added to the Xcode target.

Detection has no dependency behind it: iOS's ordered `AppleLanguages`, Android's `I18nManager.localeIdentifier`, then Hermes' `Intl`, each guarded, falling through to English. `setLanguage()` switches everything at runtime; nothing calls it in production yet, which is what an in-app language picker would use.

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
