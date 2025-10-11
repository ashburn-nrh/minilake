# 🚀 Quick Start Guide

## Step 1: Install Dependencies ✅

Dependencies are already installed! If you need to reinstall:

```bash
npm install --legacy-peer-deps
```

## Step 2: Configure Firebase 🔥

### Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project" and follow the wizard
3. Once created, click the **Web** icon (</>) to add a web app

### Enable Services

**Authentication:**
- Go to **Authentication** → **Sign-in method**
- Enable **Phone** provider
- Add your domain to authorized domains (for web testing)

**Firestore Database:**
- Go to **Firestore Database** → **Create database**
- Start in **test mode** (for development)
- Choose a location

**Storage:**
- Go to **Storage** → **Get started**
- Start in **test mode** (for development)

### Get Firebase Config

1. Go to **Project Settings** (gear icon)
2. Scroll to "Your apps" section
3. Copy the `firebaseConfig` object

### Create .env File

```bash
# Create .env from template
cp .env.example .env
```

Edit `.env` and paste your Firebase credentials:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

## Step 3: Run the App 🎉

```bash
# Start the development server
npm start

# Or run directly on a platform:
npm run ios      # iOS Simulator
npm run android  # Android Emulator
npm run web      # Web Browser
```

## Step 4: Test the App 📱

### Login Flow
1. App opens → redirects to `/login`
2. Enter phone number (format: `+1 5551234567`)
3. Click "Send OTP"
4. Check your phone for OTP code
5. Enter OTP and click "Verify OTP"
6. Success → redirects to `/customers`

### Add a Customer
1. Click the **"Add Customer"** floating button
2. Fill in:
   - Name (required)
   - Phone (required)
   - Email (optional)
   - Tags (comma-separated, optional)
   - Tap camera icon to add avatar (optional)
3. Click "Add Customer"

### View Customer Details
1. Tap any customer card
2. Edit profile by clicking pencil icon
3. Upload avatar by tapping the avatar
4. Add engagements with status tracking
5. Upload attachments (images/PDFs)

## 📂 What Was Created

### Screens
- ✅ `app/login.tsx` - Phone OTP authentication
- ✅ `app/customers/index.tsx` - Customer list with search/filter/sort
- ✅ `app/customers/[id].tsx` - Customer detail with engagements & attachments

### Components
- ✅ `CustomerCard.tsx` - Customer list item with actions
- ✅ `EngagementCard.tsx` - Engagement item with status pill
- ✅ `FloatingActionButton.tsx` - FAB for adding customers
- ✅ `AddCustomerModal.tsx` - Modal form for new customers
- ✅ `AddEngagementModal.tsx` - Modal form for new engagements

### Firebase Functions
- ✅ `lib/firebase/config.ts` - Firebase initialization
- ✅ `lib/firebase/auth.ts` - OTP send/verify functions
- ✅ `lib/firebase/customers.ts` - CRUD operations for customers, engagements, attachments

## 🎨 Features Implemented

### Login Screen
- ✅ Phone number validation
- ✅ OTP send with reCAPTCHA
- ✅ OTP verification
- ✅ 60-second resend cooldown
- ✅ User persistence in Firestore

### Customers List
- ✅ Real-time Firestore sync
- ✅ Search by name/phone
- ✅ Filter by tags (chips)
- ✅ Sort by Recent/Name
- ✅ Edit/Delete actions
- ✅ Avatar display
- ✅ Last activity timestamp

### Customer Detail
- ✅ Editable profile fields
- ✅ Avatar upload to Storage
- ✅ Engagements with status (open/in_progress/won/lost)
- ✅ Attachment upload (images/PDFs)
- ✅ Attachment grid display

## 🔧 Troubleshooting

### "Cannot find module" errors
```bash
npm install --legacy-peer-deps
npx expo start -c
```

### Firebase errors
- Check `.env` file exists and has correct values
- Verify Firebase services are enabled in console
- Check phone auth is enabled

### Phone OTP not working
- For testing, add test phone numbers in Firebase Console:
  - Go to Authentication → Sign-in method → Phone
  - Scroll to "Phone numbers for testing"
  - Add: `+1 555 123 4567` with code `123456`

### App not starting
```bash
# Clear cache and restart
npx expo start -c

# If still issues, reinstall
rm -rf node_modules
npm install --legacy-peer-deps
```

## 🎯 Next Steps

1. **Production Security**: Update Firebase Security Rules (see README.md)
2. **Styling**: Customize colors in `tailwind.config.js`
3. **Features**: Add more fields, notifications, analytics
4. **Testing**: Add unit tests with Jest
5. **Deploy**: Build and deploy to App Store/Play Store

## 📚 Documentation

- [Expo Router Docs](https://docs.expo.dev/router/introduction/)
- [NativeWind Docs](https://www.nativewind.dev/)
- [Firebase Docs](https://firebase.google.com/docs)
- [React Hook Form](https://react-hook-form.com/)

---

**Need help?** Check the full README.md for detailed documentation!
