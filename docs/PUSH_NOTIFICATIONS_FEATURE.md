# Push Notifications Feature

## Overview
This document describes the push notification system implemented for engagement tracking and customer owner management.

## Features Implemented

### 1. Engagement Notifications
- **Engagement Created**: All customer owners receive a push notification when a new engagement is created
- **Engagement Status Changed**: All customer owners receive a push notification when an engagement status changes (e.g., from "open" to "in_progress")

### 2. Customer Owner Management
- **Multiple Owners**: Customers can now have multiple owners (stored in `ownerIds` array)
- **Add Owner**: Users can search for and add other users as owners to a customer
- **Remove Owner**: Users can remove owners (minimum 1 owner required)
- **Owner Added Notification**: New owner receives a notification when added
- **Team Notification**: Existing owners receive a notification when a new owner is added

## Technical Implementation

### Files Modified

#### 1. `/lib/firebase/customers.ts`
- Updated `Customer` interface to include `ownerIds?: string[]`
- Modified `createCustomer` to initialize with creator as owner
- Updated `addEngagement` to send push notifications to all owners
- Updated `updateEngagement` to send notifications on status changes
- Added `addCustomerOwner` function with notification support
- Added `removeCustomerOwner` function

#### 2. `/lib/notifications/pushNotifications.ts` (New)
- `getUserPushTokens`: Retrieves push tokens for a user
- `getMultipleUsersPushTokens`: Retrieves tokens for multiple users
- `notifyEngagementCreated`: Sends notification when engagement is created
- `notifyEngagementStatusChanged`: Sends notification when status changes
- `notifyOwnerAdded`: Notifies new owner when added
- `notifyOwnersAboutNewOwner`: Notifies existing owners about new owner

#### 3. `/components/ManageOwnersModal.tsx` (New)
- Modal UI for managing customer owners
- Search functionality to find users by email
- Add/remove owner functionality
- Displays current owners list

#### 4. `/app/customers/[id].tsx`
- Added "Owners" section with "Manage" button
- Integrated `ManageOwnersModal` component
- Shows owner count

#### 5. `/app/_layout.tsx`
- Setup push notification registration on app start
- Added notification listeners for foreground and background notifications
- Implemented navigation handling when notifications are tapped

### Data Structure

#### Customer Document
```typescript
{
  id: string;
  name: string;
  phone: string;
  email?: string;
  tags: string[];
  avatar?: string;
  lastActivity: string;
  createdAt: string;
  userId: string;
  ownerIds?: string[]; // NEW: Array of user IDs
}
```

#### User Document (Required Fields)
```typescript
{
  email: string;
  displayName?: string;
  expoPushTokens: string[]; // Array of Expo push tokens
  lastTokenUpdate: string;
}
```

## Notification Flow

### Engagement Created
1. User creates engagement via `AddEngagementModal`
2. `addEngagement` function is called
3. Engagement is saved to Firestore
4. Customer data is fetched to get `ownerIds`
5. Push notifications sent to all owners via `notifyEngagementCreated`

### Engagement Status Changed
1. User changes status via `EngagementCardEditable`
2. `updateEngagement` function is called
3. Old status is retrieved before update
4. Engagement is updated in Firestore
5. If status changed, notifications sent to all owners via `notifyEngagementStatusChanged`

### Owner Added
1. User opens "Manage Owners" modal
2. Searches for user by email
3. Clicks "Add" button
4. `addCustomerOwner` is called with new owner ID and current user ID
5. Owner is added to `ownerIds` array
6. Two notifications sent:
   - To new owner: "You were added as owner"
   - To existing owners: "New owner was added"

## Usage

### For Mobile Users
1. **Enable Notifications**: On first app launch, grant notification permissions
2. **Receive Notifications**: 
   - When someone creates an engagement on your customer
   - When engagement status changes
   - When you're added as an owner
   - When a new owner is added to your customer
3. **Tap Notification**: Opens the app and navigates to customers screen

### For Developers

#### Testing Notifications
1. Use a physical device (notifications don't work in simulator)
2. Ensure user has granted notification permissions
3. Create an engagement or change status
4. Check device for notification

#### Adding New Notification Types
1. Create notification function in `/lib/notifications/pushNotifications.ts`
2. Call function from appropriate location (e.g., in Firebase function)
3. Add notification type to data payload
4. Handle navigation in `/app/_layout.tsx` notification response listener

## Firestore Security Rules

Ensure your Firestore rules allow:
- Users to read their own user document (for push tokens)
- Users to read other users' basic info (for owner management)
- Users to update customers they own (check `ownerIds` array)

Example rule:
```javascript
match /customers/{customerId} {
  allow read, write: if request.auth != null && 
    (resource.data.userId == request.auth.uid || 
     resource.data.ownerIds.hasAny([request.auth.uid]));
}

match /users/{userId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null && request.auth.uid == userId;
}
```

## Environment Variables

Ensure `EXPO_PUBLIC_PROJECT_ID` is set in your `.env` file for Expo push notifications to work.

## Known Limitations

1. **Physical Device Required**: Push notifications only work on physical devices, not simulators
2. **Network Dependency**: Notifications require active internet connection
3. **Delivery Not Guaranteed**: Push notifications are best-effort delivery
4. **User Search**: Currently searches by exact email match (case-sensitive)

## Future Enhancements

- [ ] Add notification preferences (allow users to mute certain notification types)
- [ ] Implement in-app notification center
- [ ] Add notification history
- [ ] Support for notification actions (e.g., "View" button)
- [ ] Rich notifications with images
- [ ] Batch notifications to reduce spam
- [ ] Email fallback for failed push notifications
