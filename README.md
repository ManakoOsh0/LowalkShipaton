# Lowalk

Lowalk helps you show up where you planned to be, stay for your focus session, and build consistent real-world routines. The app separates **what you're doing** (Focus Node) from **where you're doing it** (Anchor), with optional app shielding during active sessions.

## Features

- Schedule Focus Nodes (class, study, gym, work) with linked location anchors
- Geofence-based presence verification and session timers
- Native Android app shielding via the `lowalk-app-shield` module
- Local-first storage — no account or cloud sync required

See [PRODUCT.md](./PRODUCT.md) for the full product specification.

## Prerequisites

- Node.js 20+
- npm
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- Android Studio (for emulator or dev builds)
- [EAS CLI](https://docs.expo.dev/build/setup/) (`npm install -g eas-cli`) for native builds

> **Note:** Lowalk uses a custom native module for app shielding. It requires a **development build** — Expo Go is not supported.

## Getting started

```bash
git clone https://github.com/ManakoOsh0/LowalkShipaton.git
cd lowalk
npm install
cp .env.example .env
```

Start the Metro bundler with the dev client:

```bash
npm run start:dev
```

## Android development build

Build and install a development client on a device or emulator:

```bash
npm run build:dev:android
```

Or with EAS directly:

```bash
eas build --profile development --platform android
```

Preview APK (internal distribution):

```bash
npm run build:preview:android
```

## Project structure

```
app/              Expo Router screens
components/       Reusable UI
hooks/            React hooks
lib/              Business logic and helpers
modules/          Native modules (lowalk-app-shield)
store/            Zustand state
assets/           Fonts, images, icons
```

## Environment variables

Copy `.env.example` to `.env` and fill in any values you need. Never commit `.env`.

| Variable | Required | Description |
|----------|----------|-------------|
| `EXPO_PUBLIC_PRESENCE_DEBUG` | No | Set to `1` for location diagnostics in preview builds |
| `EXPO_PUBLIC_REVENUECAT_TEST_STORE_API_KEY` | Dev / Shipaton | RevenueCat Test Store public key (`test_...`) |
| `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY` | Production Android | RevenueCat public SDK key (Android) |
| `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` | Production iOS | RevenueCat public SDK key (iOS) |

Use [EAS Secrets](https://docs.expo.dev/build-reference/variables/) for production build keys.

After installing RevenueCat native modules, rebuild the dev client (`npm run build:dev:android`) — hot reload is not enough.

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start Expo |
| `npm run start:dev` | Start with dev client |
| `npm run android` | Start on Android dev client |
| `npm run lint` | Run ESLint |
| `npm run test:class-completion` | Run class completion unit tests |
| `npm run build:dev:android` | EAS development build (Android) |
| `npm run build:preview:android` | EAS preview APK (Android) |

## License

MIT — see [LICENSE](./LICENSE).
