# 🏗️ App Architecture

Complete technical architecture of your Customer Management App.

---

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT APPLICATION                       │
│                    (React Native + Expo)                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Screens    │  │  Components  │  │    Hooks     │     │
│  │              │  │              │  │              │     │
│  │ • Login      │  │ • Customer   │  │ • useAuth    │     │
│  │ • Customers  │  │   Card       │  │              │     │
│  │ • Detail     │  │ • Engagement │  │              │     │
│  │              │  │   Card       │  │              │     │
│  │              │  │ • FAB        │  │              │     │
│  │              │  │ • Modals     │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Navigation (Expo Router)                 │  │
│  │  / → /login or /customers (auth check)              │  │
│  │  /login → Phone OTP authentication                   │  │
│  │  /customers → List with search/filter/sort          │  │
│  │  /customers/[id] → Detail with engagements          │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              State Management                         │  │
│  │  • React useState for local state                    │  │
│  │  • Firebase real-time listeners for remote data     │  │
│  │  • AsyncStorage for auth persistence                │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    FIREBASE BACKEND                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │     Auth     │  │  Firestore   │  │   Storage    │     │
│  │              │  │              │  │              │     │
│  │ • Phone OTP  │  │ • users/     │  │ • customers/ │     │
│  │ • Sessions   │  │ • customers/ │  │   {id}/      │     │
│  │ • Tokens     │  │   {id}/      │  │   avatars/   │     │
│  │              │  │   engagements│  │   attachments│     │
│  │              │  │   attachments│  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Security Rules                           │  │
│  │  • User-scoped data access                           │  │
│  │  • Authenticated-only operations                     │  │
│  │  • Subcollection permissions                         │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  EXTERNAL SERVICES                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  • Expo Push Notifications                                  │
│  • SMS Provider (Firebase Auth)                             │
│  • CDN (Firebase Storage)                                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow

### Authentication Flow

```
User Opens App
      │
      ▼
Check Auth State (useAuth hook)
      │
      ├─── Not Authenticated ──→ Redirect to /login
      │                               │
      │                               ▼
      │                         Enter Phone Number
      │                               │
      │                               ▼
      │                         Send OTP (Firebase Auth)
      │                               │
      │                               ▼
      │                         Receive SMS
      │                               │
      │                               ▼
      │                         Enter OTP Code
      │                               │
      │                               ▼
      │                         Verify OTP
      │                               │
      │                               ▼
      │                         Create/Update User in Firestore
      │                               │
      │                               ▼
      │                         Register Push Token
      │                               │
      └───────────────────────────────┘
                    │
                    ▼
            Redirect to /customers
```

### Customer CRUD Flow

```
View Customers List
      │
      ▼
Subscribe to Firestore (/customers)
      │
      ├─── Real-time Updates ──→ UI Auto-Refreshes
      │
      ▼
User Actions:
      │
      ├─── Search ──→ Filter locally
      │
      ├─── Filter by Tag ──→ Filter locally
      │
      ├─── Sort ──→ Re-order locally
      │
      ├─── Add Customer ──→ Open Modal
      │                      │
      │                      ▼
      │                  Fill Form
      │                      │
      │                      ▼
      │                  Upload Avatar (Storage)
      │                      │
      │                      ▼
      │                  Save to Firestore
      │                      │
      │                      ▼
      │                  Real-time Update
      │
      ├─── Edit Customer ──→ Navigate to Detail
      │                      │
      │                      ▼
      │                  Edit Fields
      │                      │
      │                      ▼
      │                  Save to Firestore
      │
      └─── Delete Customer ──→ Confirmation Alert
                               │
                               ▼
                          Delete from Firestore
                               │
                               ▼
                          Real-time Update
```

### Engagement Flow

```
View Customer Detail
      │
      ▼
Fetch Engagements (/customers/{id}/engagements)
      │
      ▼
Display Engagement Cards
      │
      ├─── Click Status Pill ──→ Open Dropdown
      │                           │
      │                           ▼
      │                      Select New Status
      │                           │
      │                           ▼
      │                      Update Firestore
      │                           │
      │                           ▼
      │                      Refresh Data
      │                           │
      │                           ▼
      │                      (Optional) Send Push Notification
      │
      └─── Add Engagement ──→ Open Modal
                              │
                              ▼
                         Fill Form (Title, Status)
                              │
                              ▼
                         Save to Firestore
                              │
                              ▼
                         Update Customer lastActivity
                              │
                              ▼
                         Refresh Data
```

### Attachment Flow

```
View Customer Detail
      │
      ▼
Fetch Attachments (/customers/{id}/attachments)
      │
      ▼
Display Grid View
      │
      └─── Upload Attachment ──→ Open File Picker
                                  │
                                  ▼
                             Select File (Image/PDF)
                                  │
                                  ▼
                             Upload to Storage
                                  │
                                  ▼
                             Get Download URL
                                  │
                                  ▼
                             Save Metadata to Firestore
                                  │
                                  ▼
                             Refresh Data
                                  │
                                  ▼
                             Display in Grid
```

---

## 🗄️ Database Schema

### Firestore Collections

```
/users/{uid}
  ├── uid: string
  ├── phoneNumber: string
  ├── createdAt: timestamp
  ├── lastLogin: timestamp
  └── expoPushTokens: string[]

/customers/{customerId}
  ├── id: string (auto-generated)
  ├── userId: string (owner)
  ├── name: string
  ├── phone: string
  ├── email: string (optional)
  ├── tags: string[]
  ├── avatar: string (Storage URL)
  ├── createdAt: timestamp
  ├── lastActivity: timestamp
  │
  ├── /engagements/{engagementId}
  │   ├── id: string
  │   ├── title: string
  │   ├── status: enum (open | in_progress | won | lost)
  │   ├── createdAt: timestamp
  │   └── lastUpdated: timestamp
  │
  └── /attachments/{attachmentId}
      ├── id: string
      ├── name: string
      ├── url: string (Storage URL)
      ├── type: string (mime type)
      └── uploadedAt: timestamp
```

### Firebase Storage Structure

```
/customers/{customerId}/
  ├── avatar.jpg
  └── attachments/
      ├── file1.jpg
      ├── file2.pdf
      └── file3.png

/users/{userId}/
  └── profile/
      └── avatar.jpg
```

---

## 🔌 API Integration Points

### Firebase Auth API
```typescript
// Send OTP
signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier)

// Verify OTP
confirmationResult.confirm(code)

// Auth state listener
onAuthStateChanged(auth, callback)
```

### Firestore API
```typescript
// Real-time subscription
onSnapshot(query, callback)

// CRUD operations
addDoc(collection, data)
updateDoc(docRef, data)
deleteDoc(docRef)
getDoc(docRef)
getDocs(query)
```

### Storage API
```typescript
// Upload file
uploadBytes(storageRef, blob)

// Get download URL
getDownloadURL(storageRef)
```

### Expo Push API
```typescript
// Register for notifications
registerForPushNotificationsAsync()

// Send notification
fetch('https://exp.host/--/api/v2/push/send', {
  method: 'POST',
  body: JSON.stringify(message)
})
```

---

## 🎨 Component Hierarchy

```
App
└── RootLayout (_layout.tsx)
    ├── Index (index.tsx) - Auth redirect
    ├── Login (login.tsx)
    │   └── LoginForm
    │       ├── PhoneInput
    │       ├── OTPInput
    │       └── SubmitButton
    │
    └── CustomersLayout (customers/_layout.tsx)
        ├── CustomersList (customers/index.tsx)
        │   ├── Header
        │   │   ├── SearchBar
        │   │   ├── FilterChips
        │   │   └── SortDropdown
        │   ├── CustomerList
        │   │   └── CustomerCard (multiple)
        │   │       ├── Avatar
        │   │       ├── CustomerInfo
        │   │       └── ActionButtons
        │   ├── FloatingActionButton
        │   └── AddCustomerModal
        │       ├── AvatarPicker
        │       ├── FormFields
        │       └── SubmitButton
        │
        └── CustomerDetail (customers/[id].tsx)
            ├── Header
            ├── ProfileCard
            │   ├── Avatar (editable)
            │   └── EditableFields
            ├── EngagementsSection
            │   ├── AddButton
            │   └── EngagementCardEditable (multiple)
            │       ├── Title
            │       ├── StatusDropdown
            │       └── Timestamp
            ├── AttachmentsSection
            │   ├── UploadButton
            │   └── AttachmentGrid
            │       └── AttachmentItem (multiple)
            └── Modals
                └── AddEngagementModal
```

---

## 🔐 Security Architecture

### Authentication Layer
```
User Request
    │
    ▼
Check Firebase Auth Token
    │
    ├─── Valid ──→ Allow Request
    │
    └─── Invalid ──→ Redirect to Login
```

### Firestore Security
```
Request to /customers/{id}
    │
    ▼
Check Security Rules
    │
    ├─── resource.data.userId == request.auth.uid?
    │    │
    │    ├─── Yes ──→ Allow
    │    │
    │    └─── No ──→ Deny (Permission Denied)
    │
    └─── Not Authenticated ──→ Deny
```

### Storage Security
```
Request to /customers/{id}/attachments/file.jpg
    │
    ▼
Check Security Rules
    │
    ├─── request.auth != null?
    │    │
    │    ├─── Yes ──→ Allow
    │    │
    │    └─── No ──→ Deny
    │
    └─── Not Authenticated ──→ Deny
```

---

## 📦 Module Dependencies

```
App Dependencies
├── expo (~53.0.6)
├── expo-router (latest)
├── react (19.0.0)
├── react-native (0.79.5)
├── nativewind (^4.1.21)
├── firebase (latest)
├── react-hook-form (latest)
├── expo-image-picker (latest)
├── expo-document-picker (latest)
├── expo-notifications (latest)
├── @react-native-async-storage/async-storage (latest)
└── @expo/vector-icons (included with expo)
```

---

## 🚀 Performance Optimizations

### 1. Real-time Subscriptions
- Only subscribe to user's own data
- Unsubscribe when component unmounts
- Local filtering/sorting (no extra queries)

### 2. Image Optimization
- Compress images before upload
- Use appropriate image sizes
- Cache images locally

### 3. Code Splitting
- Expo Router automatically splits by route
- Each screen is a separate bundle
- Lazy loading of components

### 4. Firestore Optimization
- Use subcollections for related data
- Index frequently queried fields
- Limit query results when possible

### 5. Caching
- Firebase automatically caches data
- Offline support built-in
- AsyncStorage for auth persistence

---

## 🔄 State Management Strategy

### Local State (useState)
- UI state (modals, loading, etc.)
- Form inputs
- Temporary data

### Remote State (Firebase)
- User authentication
- Customer data
- Engagements
- Attachments

### Persistent State (AsyncStorage)
- Auth tokens
- User preferences
- Offline data cache

---

## 📱 Platform Support

### Web ✅
- Full feature support
- Firebase JS SDK
- reCAPTCHA for phone auth
- All features working

### iOS ⚠️
- Requires @react-native-firebase
- Native modules needed
- Currently shows web redirect

### Android ⚠️
- Requires @react-native-firebase
- Native modules needed
- Currently shows web redirect

---

## 🎯 Scalability Considerations

### Current Capacity
- Firestore: 50K reads, 20K writes/day (free tier)
- Storage: 5GB stored, 1GB/day download (free tier)
- Auth: 10K verifications/month (free tier)

### Scaling Strategy
1. **Upgrade to Blaze Plan** when limits reached
2. **Implement pagination** for large customer lists
3. **Add caching layer** (Redis) for frequently accessed data
4. **Use Cloud Functions** for server-side operations
5. **Implement data archiving** for old records

---

## ✅ Architecture Benefits

- ✅ **Modular**: Easy to add/remove features
- ✅ **Scalable**: Firebase handles scaling automatically
- ✅ **Secure**: User-scoped data access
- ✅ **Real-time**: Instant updates across devices
- ✅ **Offline**: Works without internet (cached data)
- ✅ **Type-safe**: TypeScript throughout
- ✅ **Maintainable**: Clean code structure
- ✅ **Testable**: Separated concerns

---

**This architecture supports production-grade applications with thousands of users!** 🚀
