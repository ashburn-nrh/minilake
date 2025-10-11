# Mobile Phone Authentication Setup

This document explains how to set up phone OTP authentication for mobile platforms (iOS/Android).

## Current Status

✅ **Web Platform**: Phone OTP works with reCAPTCHA verification
✅ **Mobile Platform**: Phone OTP enabled with React Native Firebase (requires additional setup)
✅ **Dev Mode**: Bypass available for simulators/emulators

## Setup Requirements for Mobile

### 1. Install React Native Firebase (Already Done)
```bash
npm install @react-native-firebase/app @react-native-firebase/auth
```

### 2. Configure Firebase Project

#### For Android:
1. Download `google-services.json` from Firebase Console
2. Place it in `android/app/google-services.json`
3. Run `expo prebuild` to configure native Android project

#### For iOS:
1. Download `GoogleService-Info.plist` from Firebase Console  
2. Place it in `ios/YourApp/GoogleService-Info.plist`
3. Run `expo prebuild` to configure native iOS project

### 3. Enable Phone Authentication in Firebase Console
1. Go to Firebase Console → Authentication → Sign-in method
2. Enable "Phone" provider
3. Add your app's SHA-1 fingerprint (Android)
4. Add your app's bundle ID (iOS)

### 4. Test Phone Numbers (Development)
For testing, you can add test phone numbers in Firebase Console:
- Go to Authentication → Settings → Phone numbers for testing
- Add test numbers like `+1 555-123-4567` with code `123456`

## How It Works

### Web Platform
- Uses Firebase Web SDK with reCAPTCHA verification
- Requires user to solve reCAPTCHA before sending OTP
- Works in any web browser

### Mobile Platform  
- Uses React Native Firebase SDK
- Leverages native iOS/Android verification systems
- No reCAPTCHA required - uses device-based verification
- Automatically handles SMS interception on supported devices

### Dev Mode Bypass
- Available on simulators/emulators
- Uses anonymous authentication for testing
- Bypasses phone verification entirely
- Useful for development and testing

## Country Support

Phone OTP works for most countries worldwide:
- 🇺🇸 United States (+1)
- 🇮🇳 India (+91)  
- 🇬🇧 United Kingdom (+44)
- 🇩🇪 Germany (+49)
- 🇫🇷 France (+33)
- 🇦🇺 Australia (+61)
- 🇯🇵 Japan (+81)
- And many more...

Users must manually enter the country code (e.g., +91 for India).

## Error Handling

The app includes comprehensive error handling for:
- Invalid phone number formats
- Network connectivity issues
- Firebase configuration problems
- Rate limiting (too many requests)
- Platform-specific errors

## Fallback Strategy

If React Native Firebase fails on mobile:
1. App attempts to use React Native Firebase first
2. Falls back to web Firebase SDK if available
3. Shows dev mode bypass for simulators
4. Provides clear error messages to users

## Next Steps

To fully enable mobile phone auth:
1. Add `google-services.json` (Android) and `GoogleService-Info.plist` (iOS)
2. Run `expo prebuild` to configure native projects
3. Test on physical devices (simulators may have limitations)
4. Configure test phone numbers in Firebase Console for development

## Security Notes

- Phone authentication is secure and recommended for production
- Test phone numbers should only be used in development
- Real phone numbers require actual SMS delivery
- Rate limiting prevents abuse and spam
