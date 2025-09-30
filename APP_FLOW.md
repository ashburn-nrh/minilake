# 📱 App Flow & Navigation

## 🗺️ Navigation Structure

```
┌─────────────────────────────────────────────────────────────┐
│                      App Entry Point                         │
│                      (app/index.tsx)                         │
│                            │                                 │
│                            ▼                                 │
│                    Check Auth State                          │
│                            │                                 │
│              ┌─────────────┴─────────────┐                  │
│              ▼                           ▼                   │
│      Not Authenticated           Authenticated              │
│              │                           │                   │
│              ▼                           ▼                   │
│      ┌──────────────┐           ┌──────────────┐           │
│      │ Login Screen │           │  Customers   │           │
│      │ /login       │           │  /customers  │           │
│      └──────────────┘           └──────────────┘           │
│              │                           │                   │
│              │                           ▼                   │
│              │                  ┌──────────────┐           │
│              │                  │  Customer    │           │
│              │                  │  Detail      │           │
│              │                  │ /customers/  │           │
│              │                  │    [id]      │           │
│              │                  └──────────────┘           │
│              │                                              │
│              └──────────────────┐                          │
│                                 ▼                           │
│                         On Login Success                    │
│                                 │                           │
│                                 ▼                           │
│                         /customers                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Login Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      Login Screen                            │
│                      (/login)                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Enter Phone      │
                    │ +1 555 123 4567  │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Click "Send OTP" │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Firebase Auth    │
                    │ sends SMS        │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Enter 6-digit    │
                    │ OTP code         │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Click "Verify"   │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Create/Update    │
                    │ user in Firestore│
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Navigate to      │
                    │ /customers       │
                    └──────────────────┘
```

**Features:**
- ✅ Phone validation (regex pattern)
- ✅ OTP resend with 60s cooldown
- ✅ Loading states during API calls
- ✅ Error handling with alerts
- ✅ Auto-navigation on success

---

## 👥 Customers List Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   Customers List Screen                      │
│                   (/customers)                               │
├─────────────────────────────────────────────────────────────┤
│  Header:                                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🔍 Search: [____________] 🚪 Logout                 │   │
│  │ 🏷️ Tags: [VIP] [Premium] [New]                      │   │
│  │ 📊 Sort: [Recent] [Name]                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  Customer List:                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [👤] John Doe              [VIP]        2h ago      │   │
│  │      +1 555 123 4567                    ✏️ 🗑️       │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ [👤] Jane Smith            [Premium]    1d ago      │   │
│  │      +1 555 987 6543                    ✏️ 🗑️       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  [➕ Add Customer] ← Floating Action Button                 │
└─────────────────────────────────────────────────────────────┘
```

**User Actions:**

1. **Search**: Type name/phone → filters list in real-time
2. **Filter by Tag**: Click tag chip → shows only customers with that tag
3. **Sort**: Click Recent/Name → reorders list
4. **View Details**: Tap customer card → navigate to `/customers/[id]`
5. **Edit**: Tap ✏️ icon → navigate to detail screen
6. **Delete**: Tap 🗑️ icon → confirmation alert → delete from Firestore
7. **Add Customer**: Tap FAB → opens modal
8. **Logout**: Tap logout icon → confirmation → sign out

**Data Flow:**
```
Firestore (real-time) → subscribeToCustomers() → State Update → UI Refresh
```

---

## 📝 Add Customer Flow

```
                    Click FAB
                        │
                        ▼
            ┌───────────────────────┐
            │  Add Customer Modal   │
            ├───────────────────────┤
            │  [📷] Tap to add photo│
            │                       │
            │  Name: [___________]  │
            │  Phone: [__________]  │
            │  Email: [__________]  │
            │  Tags: [___________]  │
            │                       │
            │  [Add Customer]       │
            └───────────────────────┘
                        │
                        ▼
              Validate Form (React Hook Form)
                        │
                        ▼
              Create Customer in Firestore
                        │
                        ▼
              Upload Avatar (if selected)
                        │
                        ▼
              Update Customer with Avatar URL
                        │
                        ▼
              Close Modal → List Refreshes
```

---

## 🔍 Customer Detail Flow

```
┌─────────────────────────────────────────────────────────────┐
│                  Customer Detail Screen                      │
│                  (/customers/[id])                           │
├─────────────────────────────────────────────────────────────┤
│  Header: [← Back]  Customer Details  [✏️ Edit]             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Profile Card:                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              [👤 Avatar]                            │   │
│  │              📷 (tap to upload)                      │   │
│  │                                                      │   │
│  │  Name:  John Doe                                    │   │
│  │  Phone: +1 555 123 4567                             │   │
│  │  Email: john@example.com                            │   │
│  │  Tags:  [VIP] [Premium]                             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  Engagements:                              [+ Add]          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Initial Consultation         [IN PROGRESS]          │   │
│  │ Updated Mar 15, 2025                                │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ Follow-up Meeting            [WON]                  │   │
│  │ Updated Mar 10, 2025                                │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  Attachments:                              [☁️ Upload]      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [🖼️]  [🖼️]  [📄]                                    │   │
│  │ img1  img2  doc.pdf                                 │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**User Actions:**

1. **Edit Profile**: 
   - Tap ✏️ → fields become editable
   - Modify fields → tap ✔️ → save to Firestore

2. **Upload Avatar**:
   - Tap avatar → image picker
   - Select image → upload to Storage → update Firestore

3. **Add Engagement**:
   - Tap "+ Add" → modal opens
   - Enter title, select status → submit
   - Saved to subcollection: `/customers/{id}/engagements`

4. **Upload Attachment**:
   - Tap "☁️ Upload" → file picker
   - Select file → upload to Storage
   - Metadata saved to: `/customers/{id}/attachments`

5. **Back Navigation**:
   - Tap "← Back" → return to customers list

---

## 🔄 Data Synchronization

### Real-time Updates

```
┌──────────────────────────────────────────────────────────┐
│                    Firestore Database                     │
└──────────────────────────────────────────────────────────┘
                          │
                          │ Real-time Listener
                          ▼
┌──────────────────────────────────────────────────────────┐
│              subscribeToCustomers()                       │
│              (Firebase SDK)                               │
└──────────────────────────────────────────────────────────┘
                          │
                          │ onSnapshot callback
                          ▼
┌──────────────────────────────────────────────────────────┐
│              React State Update                           │
│              setCustomers(newData)                        │
└──────────────────────────────────────────────────────────┘
                          │
                          │ Re-render
                          ▼
┌──────────────────────────────────────────────────────────┐
│              UI Updates Automatically                     │
└──────────────────────────────────────────────────────────┘
```

**Benefits:**
- ✅ Changes appear instantly across all devices
- ✅ No manual refresh needed
- ✅ Collaborative editing support
- ✅ Offline support (Firebase cache)

---

## 🎯 Key Features Summary

### Authentication
- ✅ Phone OTP with Firebase
- ✅ Session persistence
- ✅ Auto-redirect logic

### Customers
- ✅ CRUD operations
- ✅ Real-time sync
- ✅ Search & filter
- ✅ Avatar upload

### Engagements
- ✅ Status tracking
- ✅ Timestamp tracking
- ✅ Color-coded UI

### Attachments
- ✅ File upload
- ✅ Image preview
- ✅ Storage integration

### UI/UX
- ✅ Modern design
- ✅ Loading states
- ✅ Error handling
- ✅ Responsive layout

---

## 🚀 Ready to Use!

Follow these guides to get started:
1. **FIREBASE_SETUP.md** - Configure Firebase
2. **QUICKSTART.md** - Run the app
3. **README.md** - Full documentation

**Happy coding! 🎉**
