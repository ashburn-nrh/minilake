# ⚙️ Settings Feature

## Overview
The Settings screen allows users to view their profile information, update their display name, and sign out of the application.

## File Structure
```
app/
└── settings/
    ├── _layout.tsx      # Settings stack layout
    └── index.tsx        # Main settings screen
```

## Features

### 📱 Profile Information
- **Phone Number**: Displays the user's registered phone number (read-only)
- **Display Name**: Optional field that users can set/update
- **Account Created Date**: Shows when the account was created

### ✏️ Edit Display Name
- Click "Edit" button to enable editing mode
- Enter or update display name
- Save or Cancel changes
- Real-time update to Firestore

### 🚪 Sign Out
- Red "Sign Out" button at the bottom
- Confirmation dialog before signing out
- Redirects to login screen after successful sign out

## Navigation

### Access Settings
From the Customers screen:
- Tap the **Settings icon** (⚙️) in the top-right corner
- Located next to the logout button

### Return to Customers
- Tap the **Back arrow** (←) in the top-left corner
- Or use device back button

## Data Structure

### Firestore Schema
```typescript
users/{userId}
{
  uid: string;
  phoneNumber: string;
  displayName?: string | null;  // Optional
  createdAt: string;            // ISO timestamp
  lastLogin: string;            // ISO timestamp
}
```

## UI Components

### Profile Card
- Circular avatar icon
- Display name or "User" as fallback
- Phone number with icon
- Display name field with edit functionality
- Account creation date

### Buttons
- **Edit**: Opens display name editor
- **Cancel**: Discards changes
- **Save**: Saves display name to Firestore
- **Sign Out**: Signs out with confirmation

## User Flow

```
Customers Screen
      │
      ▼
[Tap Settings Icon]
      │
      ▼
Settings Screen
      │
      ├─► View phone number
      ├─► View/Edit display name
      ├─► View account info
      └─► Sign out
```

## Implementation Details

### State Management
- `loading`: Initial profile load state
- `saving`: Display name save state
- `profile`: User profile data from Firestore
- `displayName`: Editable display name value
- `isEditing`: Toggle edit mode

### Firebase Integration
- **Read**: Fetches user profile from `users/{userId}`
- **Update**: Updates `displayName` field
- **Auth**: Uses Firebase Auth for sign out

### Error Handling
- Loading state with spinner
- Error messages for failed operations
- Fallback values for missing data
- Redirect to login if not authenticated

## Styling
- Modern card-based design
- Blue accent color (#3b82f6)
- Gray backgrounds and borders
- Rounded corners (rounded-xl, rounded-2xl)
- Shadow effects for depth
- Responsive padding and spacing

## Future Enhancements
- [ ] Profile photo upload
- [ ] Email address field
- [ ] Password/PIN setup
- [ ] Notification preferences
- [ ] Theme selection (light/dark)
- [ ] Language preferences
- [ ] Delete account option
