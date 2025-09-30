# 🔥 Firebase Setup Guide

## Step-by-Step Firebase Configuration

### 1. Create Firebase Project

1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Click **"Add project"**
3. Enter project name: `my-expo-app` (or your choice)
4. Enable/disable Google Analytics (optional)
5. Click **"Create project"**

---

### 2. Add Web App

1. In Firebase Console, click the **Web icon** (`</>`)
2. Register app nickname: `my-expo-app-web`
3. **Don't** check "Set up Firebase Hosting"
4. Click **"Register app"**
5. **Copy the firebaseConfig object** - you'll need this!

Example config:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "my-expo-app-xxxxx.firebaseapp.com",
  projectId: "my-expo-app-xxxxx",
  storageBucket: "my-expo-app-xxxxx.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

---

### 3. Enable Authentication

1. In Firebase Console sidebar, click **"Authentication"**
2. Click **"Get started"**
3. Go to **"Sign-in method"** tab
4. Click **"Phone"**
5. Toggle **"Enable"**
6. Click **"Save"**

#### Add Test Phone Numbers (for development)
1. Scroll down to **"Phone numbers for testing"**
2. Click **"Add phone number"**
3. Add: `+1 555 123 4567` with code `123456`
4. Click **"Add"**

This allows testing without sending real SMS.

---

### 4. Enable Firestore Database

1. In sidebar, click **"Firestore Database"**
2. Click **"Create database"**
3. Select **"Start in test mode"** (for development)
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if request.time < timestamp.date(2025, 12, 31);
       }
     }
   }
   ```
4. Choose a location (e.g., `us-central1`)
5. Click **"Enable"**

#### Production Rules (apply later)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Customers collection
    match /customers/{customerId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      
      // Subcollections
      match /engagements/{engagementId} {
        allow read, write: if request.auth != null;
      }
      
      match /attachments/{attachmentId} {
        allow read, write: if request.auth != null;
      }
    }
  }
}
```

---

### 5. Enable Storage

1. In sidebar, click **"Storage"**
2. Click **"Get started"**
3. Select **"Start in test mode"** (for development)
   ```
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /{allPaths=**} {
         allow read, write: if request.time < timestamp.date(2025, 12, 31);
       }
     }
   }
   ```
4. Use same location as Firestore
5. Click **"Done"**

#### Production Rules (apply later)
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /customers/{customerId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid != null;
    }
  }
}
```

---

### 6. Configure Environment Variables

1. Copy the template:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and paste your Firebase config:
   ```env
   EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=my-expo-app-xxxxx.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=my-expo-app-xxxxx
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=my-expo-app-xxxxx.appspot.com
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
   EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
   ```

3. **Important**: Add `.env` to `.gitignore` (already done)

---

### 7. Test the Setup

1. Start the app:
   ```bash
   npm start
   ```

2. Test login with test phone number:
   - Phone: `+1 555 123 4567`
   - OTP: `123456`

3. If successful, you should:
   - See a new user in **Authentication** → **Users**
   - See a new document in **Firestore** → **users** collection

---

## 🔍 Verify Setup Checklist

- [ ] Firebase project created
- [ ] Web app registered
- [ ] Authentication enabled (Phone provider)
- [ ] Test phone number added
- [ ] Firestore Database created (test mode)
- [ ] Storage enabled (test mode)
- [ ] `.env` file created with credentials
- [ ] App starts without errors
- [ ] Can login with test phone number

---

## 🐛 Troubleshooting

### "Firebase: Error (auth/invalid-api-key)"
- Check `EXPO_PUBLIC_FIREBASE_API_KEY` in `.env`
- Ensure no extra spaces or quotes

### "Firebase: Error (auth/unauthorized-domain)"
- Go to Authentication → Settings → Authorized domains
- Add your domain (e.g., `localhost` for web)

### "Firebase: Error (auth/quota-exceeded)"
- You've exceeded free tier SMS quota
- Use test phone numbers instead
- Or upgrade to Blaze plan

### "Permission denied" in Firestore
- Check you're in test mode
- Or update security rules to allow your operations

### Phone OTP not received
- Use test phone numbers for development
- Check phone number format: `+[country code][number]`
- Ensure Phone auth is enabled in Firebase Console

---

## 📊 Firebase Free Tier Limits

| Service | Free Tier |
|---------|-----------|
| Authentication | 10K verifications/month |
| Firestore | 50K reads, 20K writes, 20K deletes/day |
| Storage | 5 GB stored, 1 GB/day downloaded |
| Functions | 125K invocations/month |

**Note**: Phone auth SMS costs $0.01-0.06 per verification after free tier.

---

## 🚀 Next Steps

1. ✅ Complete Firebase setup
2. ✅ Test login flow
3. ✅ Add your first customer
4. ✅ Test all features
5. 📝 Update security rules for production
6. 🎨 Customize UI/branding
7. 📱 Build and deploy to stores

---

## 📚 Resources

- [Firebase Console](https://console.firebase.google.com)
- [Firebase Auth Docs](https://firebase.google.com/docs/auth)
- [Firestore Docs](https://firebase.google.com/docs/firestore)
- [Storage Docs](https://firebase.google.com/docs/storage)
- [Security Rules](https://firebase.google.com/docs/rules)

---

**Need help?** Check the main README.md or QUICKSTART.md!
