# 🚀 Deployment Guide

Complete guide to deploying your Customer Management App to production.

---

## 📋 Pre-Deployment Checklist

### 1. Firebase Security Rules ✅

**Apply Firestore Rules:**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Firestore Database** → **Rules**
4. Copy contents from `firestore.rules` file
5. Click **Publish**

**Apply Storage Rules:**
1. Navigate to **Storage** → **Rules**
2. Copy contents from `storage.rules` file
3. Click **Publish**

### 2. Environment Variables ✅

Ensure your `.env` file has production Firebase credentials:
```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_production_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_PROJECT_ID=your_expo_project_id
```

### 3. App Configuration ✅

Update `app.json` with production details:
```json
{
  "expo": {
    "name": "Customer Manager",
    "slug": "customer-manager",
    "version": "1.0.0",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png"
    },
    "ios": {
      "bundleIdentifier": "com.yourcompany.customermanager",
      "buildNumber": "1.0.0"
    },
    "android": {
      "package": "com.yourcompany.customermanager",
      "versionCode": 1
    }
  }
}
```

---

## 🌐 Web Deployment

### Option 1: Netlify (Recommended)

1. **Build the web version:**
   ```bash
   npx expo export:web
   ```

2. **Deploy to Netlify:**
   ```bash
   npm install -g netlify-cli
   netlify deploy --prod --dir=web-build
   ```

3. **Configure redirects** (create `web-build/_redirects`):
   ```
   /*    /index.html   200
   ```

### Option 2: Vercel

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Build and deploy:**
   ```bash
   npx expo export:web
   vercel --prod
   ```

### Option 3: Firebase Hosting

1. **Install Firebase CLI:**
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

2. **Initialize hosting:**
   ```bash
   firebase init hosting
   # Select your project
   # Public directory: web-build
   # Configure as single-page app: Yes
   # Set up automatic builds: No
   ```

3. **Build and deploy:**
   ```bash
   npx expo export:web
   firebase deploy --only hosting
   ```

---

## 📱 iOS Deployment

### Prerequisites
- Mac with Xcode installed
- Apple Developer Account ($99/year)
- iOS device for testing

### Steps

1. **Configure iOS bundle identifier:**
   ```json
   // app.json
   {
     "ios": {
       "bundleIdentifier": "com.yourcompany.customermanager",
       "buildNumber": "1.0.0"
     }
   }
   ```

2. **Build with EAS:**
   ```bash
   npm install -g eas-cli
   eas login
   eas build:configure
   eas build --platform ios
   ```

3. **Submit to App Store:**
   ```bash
   eas submit --platform ios
   ```

4. **Alternative - Local build:**
   ```bash
   npx expo prebuild
   npx expo run:ios --configuration Release
   ```

---

## 🤖 Android Deployment

### Prerequisites
- Android Studio installed
- Google Play Developer Account ($25 one-time)

### Steps

1. **Configure Android package:**
   ```json
   // app.json
   {
     "android": {
       "package": "com.yourcompany.customermanager",
       "versionCode": 1
     }
   }
   ```

2. **Build with EAS:**
   ```bash
   eas build --platform android
   ```

3. **Submit to Play Store:**
   ```bash
   eas submit --platform android
   ```

4. **Alternative - Local build:**
   ```bash
   npx expo prebuild
   npx expo run:android --variant release
   ```

---

## 🔐 Security Best Practices

### 1. Firebase Security Rules

✅ **Already configured** in `firestore.rules` and `storage.rules`

Key features:
- Users can only access their own data
- Customers are scoped to userId
- Subcollections inherit parent permissions
- Storage files are protected

### 2. Environment Variables

❌ **Never commit `.env` to git**

Add to `.gitignore`:
```
.env
.env.local
.env.production
```

### 3. API Keys

✅ Firebase API keys are safe to expose in client apps
- They identify your Firebase project
- Security is enforced by Firebase Security Rules
- Rate limiting is handled by Firebase

### 4. Authentication

✅ Already implemented:
- Phone OTP authentication
- Session persistence with AsyncStorage
- Auth state listeners
- Protected routes

---

## 📊 Monitoring & Analytics

### Firebase Analytics

1. **Enable in Firebase Console:**
   - Go to **Analytics** → **Dashboard**
   - Enable Google Analytics

2. **Track events in code:**
   ```typescript
   import { logEvent } from 'firebase/analytics';
   
   // Track customer creation
   logEvent(analytics, 'customer_created', {
     method: 'manual'
   });
   ```

### Error Tracking

Consider adding Sentry:
```bash
npm install @sentry/react-native
npx @sentry/wizard -i reactNative
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npx expo export:web
      - run: netlify deploy --prod --dir=web-build
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

---

## 📱 Push Notifications Setup

### 1. Get Expo Push Token

Already implemented in `setup/notifications.ts`

### 2. Configure Firebase Cloud Messaging (FCM)

1. Go to Firebase Console → **Project Settings**
2. Navigate to **Cloud Messaging** tab
3. Copy **Server Key**
4. Add to Expo project:
   ```bash
   eas credentials
   ```

### 3. Send Test Notification

Use the Expo Push Tool:
https://expo.dev/notifications

---

## 🧪 Testing Before Deployment

### 1. Test on Physical Devices

```bash
# iOS
npm run ios

# Android
npm run android
```

### 2. Test Web Build Locally

```bash
npx expo export:web
npx serve web-build
```

### 3. Test Production Build

```bash
# iOS
eas build --platform ios --profile production

# Android
eas build --platform android --profile production
```

---

## 📈 Performance Optimization

### 1. Image Optimization

- Use WebP format for images
- Compress images before upload
- Implement lazy loading

### 2. Code Splitting

Already implemented with Expo Router:
- Each screen is a separate bundle
- Loads on demand

### 3. Caching

Firebase automatically caches:
- Firestore data (offline support)
- Storage downloads
- Authentication state

---

## 🆘 Troubleshooting

### Build Fails

```bash
# Clear cache
npx expo start -c

# Clear node modules
rm -rf node_modules
npm install

# Clear EAS build cache
eas build --clear-cache
```

### Firebase Connection Issues

1. Check `.env` file has correct values
2. Verify Firebase project is active
3. Check Firebase quota limits
4. Review Firebase Console logs

### App Store Rejection

Common issues:
- Missing privacy policy
- Incomplete app information
- Screenshots don't match app
- Missing required permissions explanations

---

## 📝 Post-Deployment

### 1. Monitor Usage

- Firebase Console → Analytics
- Check for errors in Firestore logs
- Monitor Storage usage

### 2. Gather Feedback

- Add in-app feedback form
- Monitor app store reviews
- Track user engagement

### 3. Plan Updates

- Fix bugs based on user reports
- Add requested features
- Improve performance

---

## 🎉 Deployment Checklist

Before going live:

- [ ] Firebase Security Rules applied
- [ ] Storage Rules applied
- [ ] Environment variables configured
- [ ] App icons and splash screens added
- [ ] Privacy policy created
- [ ] Terms of service created
- [ ] Test on iOS device
- [ ] Test on Android device
- [ ] Test on web browser
- [ ] Push notifications tested
- [ ] Offline mode tested
- [ ] Error handling tested
- [ ] Performance optimized
- [ ] Analytics configured
- [ ] Backup strategy in place

---

## 📚 Resources

- [Expo Documentation](https://docs.expo.dev/)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [EAS Submit](https://docs.expo.dev/submit/introduction/)
- [Firebase Console](https://console.firebase.google.com)
- [App Store Connect](https://appstoreconnect.apple.com)
- [Google Play Console](https://play.google.com/console)

---

**Ready to deploy? Start with web deployment - it's the fastest way to get your app live!** 🚀
