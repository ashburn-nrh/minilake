# Customer Management App

A modern React Native + Expo Router app with Firebase backend for managing customers, engagements, and attachments.

## 🚀 Features

### 1. **Authentication**
- Phone number OTP authentication via Firebase Auth
- Auto-redirect based on auth state
- 60-second OTP resend cooldown
- Persistent user sessions

### 2. **Customer Management**
- Real-time customer list with Firestore
- Search by name or phone number
- Filter by tags (VIP, Premium, etc.)
- Sort by Recent Activity or Name
- Add/Edit/Delete customers
- Avatar upload to Firebase Storage

### 3. **Customer Details**
- Editable profile (Name, Phone, Email, Tags)
- Avatar upload with camera/gallery
- Engagement tracking with status (Open, In Progress, Won, Lost)
- Attachment management (images, PDFs)
- Real-time updates

## 📦 Tech Stack

- **Framework**: React Native + Expo SDK 53
- **Routing**: Expo Router (file-based routing)
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Forms**: React Hook Form
- **Backend**: Firebase (Auth, Firestore, Storage)
- **Language**: TypeScript

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Firebase

1. Create a Firebase project at [https://console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication** → **Phone** sign-in method
3. Enable **Firestore Database** (start in test mode for development)
4. Enable **Storage** (start in test mode for development)
5. Copy your Firebase config from Project Settings

### 3. Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Fill in your Firebase credentials:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key_here
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 4. Run the App

```bash
# Start Expo dev server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on Web
npm run web
```

## 📁 Project Structure

```
my-expo-app/
├── app/                          # Expo Router screens
│   ├── _layout.tsx              # Root layout with auth logic
│   ├── index.tsx                # Redirect to login/customers
│   ├── login.tsx                # Phone OTP login screen
│   └── customers/
│       ├── index.tsx            # Customer list screen
│       └── [id].tsx             # Customer detail screen
├── components/                   # Reusable components
│   ├── CustomerCard.tsx         # Customer list item
│   ├── EngagementCard.tsx       # Engagement list item
│   ├── FloatingActionButton.tsx # FAB component
│   ├── AddCustomerModal.tsx     # Add customer modal
│   └── AddEngagementModal.tsx   # Add engagement modal
├── lib/
│   └── firebase/                # Firebase utilities
│       ├── config.ts            # Firebase initialization
│       ├── auth.ts              # Auth functions
│       └── customers.ts         # Firestore CRUD operations
├── global.css                   # Global Tailwind styles
├── app.json                     # Expo configuration
├── package.json                 # Dependencies
└── tsconfig.json                # TypeScript config
```

## 🔥 Firestore Data Structure

```
users/
  {uid}/
    - uid: string
    - phoneNumber: string
    - createdAt: string
    - lastLogin: string

customers/
  {customerId}/
    - name: string
    - phone: string
    - email?: string
    - tags: string[]
    - avatar?: string
    - lastActivity: string
    - createdAt: string
    - userId: string
    
    engagements/
      {engagementId}/
        - title: string
        - status: 'open' | 'in_progress' | 'won' | 'lost'
        - lastUpdated: string
        - createdAt: string
    
    attachments/
      {attachmentId}/
        - name: string
        - url: string
        - type: string
        - uploadedAt: string
```

## 🎨 UI Features

- **Modern Design**: Rounded cards, shadows, smooth animations
- **Responsive**: Works on iOS, Android, and Web
- **Dark Mode Ready**: Uses system color scheme
- **Accessibility**: Proper labels and touch targets
- **Loading States**: Spinners and disabled states
- **Error Handling**: User-friendly alerts

## 📱 Screens

### Login Screen (`/login`)
- Phone number input with validation
- OTP verification
- Resend OTP with cooldown timer
- Auto-navigation on success

### Customers List (`/customers`)
- Search bar for filtering
- Tag filter chips
- Sort options (Recent/Name)
- Customer cards with avatar, tags, actions
- Floating Action Button to add customers
- Logout button

### Customer Detail (`/customers/[id]`)
- Profile card with editable fields
- Avatar upload
- Engagements section with status pills
- Attachments grid with upload
- Back navigation

## 🔐 Security Notes

- Never commit `.env` file to version control
- Use Firebase Security Rules in production:

**Firestore Rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /customers/{customerId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      
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

**Storage Rules:**
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /customers/{customerId}/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 🐛 Troubleshooting

### "Cannot resolve entry file" error
- Make sure `package.json` has `"main": "expo-router/entry"`
- Run `npx expo start -c` to clear cache

### Firebase errors
- Verify `.env` file has correct credentials
- Check Firebase console for enabled services
- Ensure phone authentication is enabled

### TypeScript errors
- Run `npm install` to ensure all types are installed
- Check `tsconfig.json` extends `expo/tsconfig.base`

### NativeWind not working
- Verify `global.css` is imported in `app/_layout.tsx`
- Check `metro.config.js` has NativeWind configuration
- Clear cache: `npx expo start -c`

## 📄 License

MIT

## 👨‍💻 Author

Built with ❤️ using Expo Router, NativeWind, and Firebase
