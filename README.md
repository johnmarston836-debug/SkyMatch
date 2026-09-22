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
  RealBleTransport.ts  real hardware: react-native-ble-plx (central) + skymatch-peripheral (peripheral)
  MeshRouter.ts        store-and-forward flood routing, dedup cache, per-sender flood limit
  MeshService.ts       turns raw envelopes into typed app events
  validate.ts          checks every payload another phone sends before the app sees it
  meshController.ts    wires MeshService into the zustand stores
```

### Identity, signatures and sealed private messages

Every install makes two key pairs on first launch (`src/crypto/identity.ts`, kept by `src/state/identityStore.ts`): Ed25519 to sign, X25519 to receive sealed messages. The crypto is `tweetnacl` - pure JavaScript, audited, no native code.

- **The id comes from the key.** A profile id is the first 16 bytes of the SHA-512 of the signing key, written as a version-8 UUID. Nobody can speak as you without your secret key, and there is no "first to announce wins" moment for an impostor to race. A profile made before keys existed moves to its keyed id on the first launch of this build, along with the messages it sent.
- **Everything is signed.** Every packet from a keyed id carries an Ed25519 signature over its kind, sender, recipient and payload (`signedText`). An unsigned packet claiming a keyed id, or one whose signature doesn't check out, is dropped. Keys arrive with the sender's profile announcement; a packet that gets there first waits for it (up to 30s).
- **Private messages are sealed** (`SecureChannel.seal`) to the recipient's X25519 key: the phones that relay them can pass them on, not read them. What is sealed is what was said - text, photo, quote; the nickname and seat are announced to the room anyway and stay in the clear, covered by the signature.
- **Older builds still work.** Their random v4 ids carry no keys and are taken on trust, as before; a private message to one of them goes in the clear, and the chat says so under the header.
- **Cost.** Signatures are cached, so an unchanged profile beat costs a string comparison after the first check (signing ~17ms, checking ~26ms in Hermes). On the radio, a profile beat grows from 4 frames to 7, a group message by 1, a private text by 2; a photo barely changes.
- **What it doesn't do:** prove that someone really sits where they say they do - no cryptography can without a server - or protect a phone whose storage is compromised.

### Mock vs. real mesh

`USE_MOCK_MESH` in `src/mesh/meshController.ts` is `false`: the app runs on the real radio. Set it to `true` to run against `MockBleTransport` instead, which simulates a handful of nearby passengers (profile broadcasts, a couple of group chat lines, private-message echoes) - the only way to see the UI work in a simulator, since real Bluetooth needs two physical phones.

### The two Bluetooth roles

Every phone is both ends of the link at once:

| role | iOS | Android |
| --- | --- | --- |
| central (scan, connect, write, subscribe) | `react-native-ble-plx` | `react-native-ble-plx`, asking for a 247-byte MTU |
| peripheral (advertise, host the characteristic, notify) | `skymatch-peripheral`: `CBPeripheralManager` | `skymatch-peripheral`: `BluetoothGattServer` + `BluetoothLeAdvertiser` |

`react-native-ble-plx` only does the central role, so the peripheral is the local native module in `modules/skymatch-peripheral`, the same JavaScript API over both platforms. Two details that matter on the wire:

- **Where the advert says you are.** iOS puts the packed location in the local name. Android can't choose its local name (that is the phone's Bluetooth name), so it sends the same string as manufacturer data in the scan response; `locationFromAdvert` reads either.
- **MTU.** A frame is sized for about 180 bytes. Android starts every link at 23 and never raises it unless the central asks, so the Android central asks on connect, and both peripherals stitch back together a long write that arrives in pieces.

The Android module is compiled against the Android 16 framework; like any BLE code, the radio paths themselves can only really be verified on physical phones.

### What another phone sends is untrusted

Every packet is written by whatever build the other person runs, and whatever this phone accepts it also relays to everyone else in the room. So:

- `decodeEnvelope` and `decodeFrame` refuse anything malformed, clamp the TTL, and cap a send at 4096 chunks.
- `validate.ts` checks every payload type (a message whose body isn't a string used to be able to take down the chat screen), caps lengths, refuses a message whose author isn't who the mesh says, and keeps photos out of the group chat.
- The router drops duplicates *before* counting a sender against the flood limit, so ordinary people in a full room - whose every packet reaches you once through each neighbour - aren't silenced.
- Profile beats - most of the traffic, one per person every ten seconds - wait a random 30-150ms before being relayed, and aren't relayed at all by a phone that heard the same beat three times meanwhile. In simulated cabins that cuts beat traffic by about 40% for a few points of reach; a beat that doesn't make it is replaced ten seconds later. Messages are always relayed straight away. (Cutting the beat's TTL to 2 hops instead was simulated too: it would hide three in four passengers in a wide-body cabin.)

### Data model

- `Profile` (seat, nickname) is created once during onboarding and stored locally (`src/state/profileStore.ts`, AsyncStorage) — the seat is the real identity; the nickname just labels it in chat.
- Discovered peers (`src/state/discoveryStore.ts`) and the group chat (`groupMessages` in `src/state/chatStore.ts`, the last 500 lines) are in-memory per session — there is no server, so there's nothing to sync history from once the app is closed. Private conversations (`privateMessagesByPeer`) are kept on the phone: the last 150 messages per person, the photos of only the newest six.
- Presence alerts (`src/state/presenceStore.ts`) are even more ephemeral: each one carries its own `expiresAt` and the UI (`PresenceBanner`) prunes expired ones on a timer, same as the button that raises them (`togglePresence`) being a plain manual toggle rather than any kind of sensor-based detection.

### Profile photos

Two sizes of the same picture, because what a face costs on a Bluetooth mesh
is not what a portrait costs:

| | size | ~frames on the wire | who gets it |
| --- | --- | --- | --- |
| face | 64px, q0.5 | ~22 | everyone nearby, automatically |
| portrait | 256px, q0.6 | ~119 | only someone who opened your card or your chat |

The portrait is 256 because the profile card draws it at 88 points, which on
a current iPhone is 264 pixels; the 128px photo an earlier build sent was
visibly stretched there. The face is 64 because the lists draw it at 40-48
points, where nobody can tell the difference.

Nothing is pushed. A profile beat carries the fingerprint of the owner's
photo (`avatarHash`, always the portrait's — hashing the face would give an
answer nobody could match). A phone that doesn't hold that fingerprint asks
for the **face**; `requestFullAvatar` asks for the portrait, and only
`ProfileScreen` and `ChatScreen` call it. At most two faces are requested at
once (`MAX_AVATARS_IN_FLIGHT`): walking into a full carriage otherwise puts
a few hundred frames into the radio before anyone has typed a word, and the
beat comes round every ten seconds to ask for whoever didn't fit.

The image picker returns one size per pick, so the second one is made by
`SkyMatchImage.resize` in the native module, on iOS and Android. Where that
isn't available (a build without the native module) the portrait does both
jobs: more expensive on the radio, never a blank face.

### Languages

The app follows the phone's language: Spanish, English, Catalan, French, German, Italian and Portuguese, with English as the fallback for anything else (an aeroplane is the one place where that is the likelier shared language, not Spanish).

```
src/i18n/
  es.ts     the Spanish copy, and the shape every other dictionary must match
  en.ts     English - also what a phone set to any other language gets
  ca.ts     Catalan
  fr.ts     French
  de.ts     German
  it.ts     Italian
  pt.ts     Portuguese (European; pt-BR falls here too - see below)
  index.ts  which language the phone is in, and the `t` every screen reads
```

Only the language is read, never the region: `es-419`, `pt-BR`, `de-AT`, `fr-CA` and `it-CH` each land on the one dictionary for that language. Two dictionaries per language would be two things to keep in step for an app whose longest sentence is a tutorial page.

`es.ts` is the source of truth: `Strings` is inferred from it, so adding a key there makes `en.ts` and `ca.ts` fail to compile until they have it too. `__tests__/i18n.test.ts` covers what the compiler can't see - a leaf that is a function in one language and a bare string in another, an empty value, a dictionary written but never wired into `DICTIONARIES`, a venue chip name too long to fit in a quarter of the screen, a train badge too long for its chip.

Everything with a value in it is a function rather than a template glued together at the call site (`t.sessionStart.greeting(name)`, `t.presence.countdown(minutes)`), because where the value lands in the sentence belongs to the language.

Two places hold words that are not in the dictionaries because they are not words the app says:

- `src/venues.ts` keeps only what doesn't change with the language - the icon, which alert the one-tap button raises, whether the place has seats. `venueOf(kind)` merges it with that venue's copy, per call, so a change of language reaches it.
- `ios/SkyMatch/*.lproj/InfoPlist.strings` holds the Bluetooth and photo-library prompts, because iOS draws those itself before any JavaScript runs.

**Adding a language** is a new file next to `es.ts`, one entry in `LANGUAGES` and `DICTIONARIES` in `src/i18n/index.ts`, and - if its permission prompts should be translated too - a `<code>.lproj/InfoPlist.strings` added to the Xcode target. The compiler names every key the new file is missing, and the tests name every one it left blank.

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
