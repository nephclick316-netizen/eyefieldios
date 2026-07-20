# Mobile App Guide for Evefield Webapp

## Overview
This guide explains how to turn the existing React web application (Evefield) into native Android and iOS apps using React Native with Expo. It covers environment setup, project scaffolding, code sharing, UI migration, native features, testing, building, publishing, OTA updates, and CI/CD.

## Prerequisites
- Node.js (>=18) and PNPM (you already have PNPM)
- Git
- Android Studio (including Android SDK and an emulator)
- Xcode (macOS) **or** use Expo Application Services (EAS) for cloud iOS builds
- Expo CLI (`pnpm add -g expo-cli`)

## 1. Set up the development environment
```bash
# Verify Node and PNPM
node -v
pnpm -v

# Install Expo CLI globally
pnpm add -g expo-cli

# Verify Android SDK
adb version

# (macOS) Verify Xcode
xcodebuild -version
```
Run `expo doctor` to check everything.

## 2. Bootstrap a new Expo project
```bash
# From the repository root
expo init evefield-mobile
# Choose "blank (TypeScript)" template
cd evefield-mobile
```

## 3. Install core libraries
```bash
pnpm add @react-navigation/native @react-navigation/native-stack
pnpm add react-native-screens react-native-safe-area-context
pnpm add expo-status-bar
# UI library (choose one)
pnpm add native-base   # or react-native-paper, or @shadcn/ui-react-native
# Tailwind‑like styling (optional)
pnpm add nativewind
# Supabase client (already used in web)
pnpm add @supabase/supabase-js
# Expo modules you may need
pnpm add expo-notifications expo-secure-store expo-asset expo-splash-screen
```

## 4. Configure navigation (example)
Create `src/navigation/RootNavigator.tsx`:
```tsx
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} />
        {/* Add other screens here */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

## 5. Share code between web and mobile
1. At the repository root create a folder `shared/`.
2. Move reusable modules (API clients, utils, custom hooks, type definitions) from `src/lib`, `src/utils`, `src/hooks` into `shared/`.
3. Update imports in both the web app and the mobile app, e.g.:
```tsx
import { useAuth } from '../../shared/auth';
```
4. Replace web‑only APIs:
   - `localStorage` → `expo-secure-store` or `AsyncStorage`
   - `window`/`document` → guard with `if (Platform.OS === 'web')` or use `react-native-web` for web fallback.

## 6. Migrate UI components
- Replace HTML elements (`div`, `span`, `img`) with React Native primitives (`View`, `Text`, `Image`).
- Use the chosen UI library for buttons, inputs, modals, etc.
- If you like Tailwind, keep the same class names and enable `nativewind` in `tailwind.config.ts`.
- Convert React Router routes to React Navigation screens.

## 7. Add native features (optional)
| Feature | Expo / RN module | How to use |
|---|---|---|
| Push notifications | `expo-notifications` | Request permission, get Expo push token, send via your backend |
| Secure storage | `expo-secure-store` | Store JWTs, refresh tokens |
| Deep linking | `expo-linking` + React Navigation | Define linking config in `app.json` |
| Camera / Media | `expo-image-picker`, `expo-camera` | Pick or capture photos |
| In‑app purchases | `expo-in-app-purchases` | Configure products in App Store / Play Console |
| Analytics | `expo-firebase-analytics` or `segment` | Initialize in `App.tsx` |

Add only what you need; each module works out‑of‑the‑box with the managed Expo workflow.

## 8. Testing
```bash
# Android emulator
expo start   # press "a"
# iOS simulator (macOS)
expo start   # press "i"
# Physical device
# Install Expo Go from Play Store / App Store, scan QR code
```
Write unit tests with Jest + `@testing-library/react-native`. For UI tests consider Detox or Expo’s built‑in testing.

## 9. Build & publish
### Android
1. Create a keystore:
```bash
keytool -genkeypair -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```
2. Add keystore info to `eas.json` (or `android/app/build.gradle` if using bare workflow).
3. Build with EAS:
```bash
eas build -p android --profile production
```
4. Download the `.aab` and upload to Google Play Console.

### iOS
1. Ensure you have an Apple Developer account.
2. Configure `eas.json` for iOS (bundle identifier, provisioning profile).
3. Build:
```bash
eas build -p ios --profile production
```
4. Test via TestFlight, then submit to App Store Connect.

## 10. OTA updates & CI/CD
- Expo Updates are enabled by default; push JavaScript changes with `eas update`.
- Set up GitHub Actions:
```yaml
name: EAS Build
on:
  push:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: expo/eas-cli-action@v2
        with:
          eas-version: latest
          token: ${{ secrets.EAS_TOKEN }}
      - run: eas build --platform all --profile production
```
- Add Sentry or Expo’s error reporting for crash monitoring.

## 11. Helpful npm scripts (add to `package.json` in the repo root)
```json
{
  "scripts": {
    "mobile:dev": "cd evefield-mobile && expo start",
    "mobile:android": "cd evefield-mobile && expo start --android",
    "mobile:ios": "cd evefield-mobile && expo start --ios",
    "mobile:build:android": "cd evefield-mobile && eas build -p android --profile production",
    "mobile:build:ios": "cd evefield-mobile && eas build -p ios --profile production"
  }
}
```

## 12. Next steps
- Review the checklist below and tick off completed items.
- If you need a monorepo setup (Yarn/PNPM workspaces or Nx), add a `package.json` at the root with `"workspaces": ["shared", "evefield-mobile"]`.
- Start implementing screens, reusing the shared business logic, and test on both platforms.

---

**Checklist**
- [x] Review current webapp architecture and dependencies
- [ ] Decide on code‑sharing strategy (monorepo vs separate repo)
- [ ] Set up React Native development environment (Node, PNPM, Expo CLI, Android Studio, Xcode/EAS)
- [ ] Bootstrap a new Expo React Native project
- [ ] Add navigation, UI libraries, and essential Expo modules
- [ ] Migrate reusable code to a shared folder/workspace
- [ ] Replace web‑specific UI with React Native components and styling
- [ ] Implement any required native features (push, secure storage, deep linking, etc.)
- [ ] Test on Android emulator, iOS simulator, and physical devices
- [ ] Configure signing and build pipelines for Android (APK/AAB) and iOS (IPA)
- [ ] Publish to Google Play Store and Apple App Store
- [ ] Set up OTA updates and CI/CD (EAS Build, GitHub Actions)
- [ ] Document the mobile workflow and add helpful scripts
