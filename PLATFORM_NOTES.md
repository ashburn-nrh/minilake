# 📱 Platform Support Notes

## Current Status

### ✅ Web Browser (Fully Supported)
- Phone OTP authentication works perfectly
- All features functional
- **Recommended for testing and development**

### ⚠️ iOS/Android (Requires Additional Setup)
- Phone authentication requires `@react-native-firebase` native modules
- Current implementation uses web Firebase SDK which doesn't support native platforms
- App will show a message directing users to test on web

---

## How to Test the App

### Option 1: Web Browser (Recommended) ✅

1. Start the dev server:
   ```bash
   npm start
   ```

2. Press `w` to open in web browser

3. Test phone authentication:
   - Use test phone: `+1 555 123 4567`
   - Use test OTP: `123456`
   - (Make sure you added this test number in Firebase Console)

### Option 2: iOS Simulator

Currently shows a message: "Please test on web browser"

To enable iOS support, you would need to:
1. Install `@react-native-firebase/app` and `@react-native-firebase/auth`
2. Configure native iOS project
3. Update authentication code to use native modules

### Option 3: Android Emulator

Same as iOS - currently directs to web browser.

---

## Why Web Only?

The Firebase JavaScript SDK (`firebase` package) we're using is designed for web browsers. For native iOS/Android apps, Firebase provides separate native SDKs:

- **Web**: `firebase` (what we're using) ✅
- **iOS**: `@react-native-firebase/app` + `@react-native-firebase/auth` ⚠️
- **Android**: `@react-native-firebase/app` + `@react-native-firebase/auth` ⚠️

---

## How to Add Native Support (Future Enhancement)

If you want to enable phone auth on iOS/Android:

### 1. Install Native Firebase Packages

```bash
npm install @react-native-firebase/app @react-native-firebase/auth
npx pod-install  # For iOS
```

### 2. Configure Native Projects

**iOS** (`ios/GoogleService-Info.plist`):
- Download from Firebase Console
- Add to Xcode project

**Android** (`android/app/google-services.json`):
- Download from Firebase Console
- Place in android/app/ directory

### 3. Update Authentication Code

Replace web Firebase imports with native ones in `lib/firebase/config.ts`:

```typescript
// Instead of:
import { getAuth } from 'firebase/auth';

// Use:
import auth from '@react-native-firebase/auth';
```

### 4. Update Login Logic

The phone auth flow is slightly different with native modules:
```typescript
// Native Firebase
const confirmation = await auth().signInWithPhoneNumber(phoneNumber);
await confirmation.confirm(code);
```

---

## Current Workaround

For now, the app works perfectly on **web browser**. This is actually ideal for:

- ✅ Development and testing
- ✅ MVP and demos
- ✅ Web-based deployments
- ✅ Progressive Web Apps (PWA)

---

## Recommended Testing Flow

1. **Start Expo**: `npm start`
2. **Open in browser**: Press `w`
3. **Test all features**:
   - Login with phone OTP
   - Add customers
   - View customer details
   - Add engagements
   - Upload attachments

Everything works perfectly on web! 🎉

---

## Alternative: Use Expo Go App

If you want to test on mobile without native setup:

1. The app will show a helpful message
2. It directs you to test on web browser
3. This is the fastest way to see the app working

---

## Summary

| Platform | Status | Action |
|----------|--------|--------|
| **Web** | ✅ Fully Working | Use this for testing! |
| **iOS** | ⚠️ Needs native modules | Test on web for now |
| **Android** | ⚠️ Needs native modules | Test on web for now |

**Bottom line**: Test on web browser - it works perfectly! 🚀
