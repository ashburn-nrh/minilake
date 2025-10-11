# Push Notifications Setup Guide

## Quick Start

### 1. Deploy Firestore Rules
The updated Firestore security rules support multiple owners. Deploy them:

```bash
firebase deploy --only firestore:rules
```

### 2. Test on Physical Device
Push notifications require a physical device. They will NOT work on iOS Simulator or Android Emulator.

### 3. Grant Permissions
On first app launch, users will be prompted to allow notifications. Make sure to grant permission.

## Testing the Features

### Test Engagement Notifications

1. **Create a Customer**
   - Open the app on Device A (User A)
   - Create a new customer
   - Add User B as an owner (via "Manage Owners")

2. **Create an Engagement**
   - On Device A, open the customer
   - Tap "Add" in the Engagements section
   - Create a new engagement
   - **Expected**: Device B (User B) receives notification "New Engagement Created"

3. **Change Engagement Status**
   - On Device A, tap on the engagement status
   - Change from "Open" to "In Progress"
   - **Expected**: Device B receives notification "Engagement Status Updated"

### Test Owner Management Notifications

1. **Add Owner**
   - Open customer detail screen
   - Tap "Manage" in Owners section
   - Search for a user by email
   - Tap "Add" to add them as owner
   - **Expected**: 
     - New owner receives "Added as Customer Owner" notification
     - Existing owners receive "New Owner Added" notification

2. **Remove Owner**
   - Open "Manage Owners" modal
   - Tap trash icon next to an owner
   - Confirm removal
   - **Expected**: Owner is removed (no notification sent for removal)

## Notification Types

| Type | Trigger | Recipients | Navigation |
|------|---------|-----------|------------|
| `engagement_created` | New engagement added | All customer owners | /customers |
| `engagement_status_changed` | Engagement status updated | All customer owners | /customers |
| `owner_added` | User added as owner | New owner only | /customers |
| `owner_added_to_customer` | New owner added | Existing owners | /customers |

## Troubleshooting

### Notifications Not Received

1. **Check Device**
   - Must be a physical device (not simulator/emulator)
   - Device must have internet connection

2. **Check Permissions**
   - Go to device Settings > [Your App] > Notifications
   - Ensure notifications are enabled

3. **Check Push Token**
   - Verify user document in Firestore has `expoPushTokens` array
   - Token should look like: `ExponentPushToken[xxxxxxxxxxxxxx]`

4. **Check Console Logs**
   - Look for "Error sending notification" messages
   - Check if push token is being saved correctly

### Owner Management Issues

1. **Cannot Find User**
   - Ensure the user has an account and is in Firestore `users` collection
   - Email search is case-sensitive
   - User must have logged in at least once

2. **Cannot Add Owner**
   - Check Firestore rules are deployed
   - Verify user has permission to update customer
   - Check console for error messages

3. **Cannot Remove Last Owner**
   - This is by design - customers must have at least one owner
   - Add another owner before removing the current one

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         App Launch                           │
│  - Register for push notifications                           │
│  - Save push token to Firestore (users/{uid}/expoPushTokens)│
│  - Setup notification listeners                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    User Actions                              │
│  - Create engagement                                         │
│  - Update engagement status                                  │
│  - Add/remove customer owner                                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  Firestore Update                            │
│  - Save data to Firestore                                    │
│  - Fetch customer ownerIds                                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Get Owner Push Tokens                           │
│  - Query users collection for each ownerId                   │
│  - Collect all expoPushTokens                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Send Push Notifications                         │
│  - Call Expo Push API for each token                         │
│  - Include notification data (type, customer, etc.)          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                Device Receives Notification                  │
│  - Foreground: Show in-app alert                             │
│  - Background: Show system notification                      │
│  - Tapped: Navigate to /customers                            │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema Changes

### Before
```typescript
Customer {
  userId: string;  // Single owner
  // ... other fields
}
```

### After
```typescript
Customer {
  userId: string;      // Original creator
  ownerIds: string[];  // Multiple owners (includes userId)
  // ... other fields
}
```

## API Usage

### Add Owner Programmatically
```typescript
import { addCustomerOwner } from '../lib/firebase/customers';
import { auth } from '../lib/firebase/config';

await addCustomerOwner(
  customerId,
  newOwnerId,
  auth.currentUser!.uid  // Who is adding the owner
);
```

### Send Custom Notification
```typescript
import { sendPushNotification } from '../setup/notifications';
import { getUserPushTokens } from '../lib/notifications/pushNotifications';

const tokens = await getUserPushTokens(userId);
for (const token of tokens) {
  await sendPushNotification(
    token,
    'Title',
    'Body',
    { custom: 'data' }
  );
}
```

## Next Steps

1. **Test on Multiple Devices**: Verify notifications work between different users
2. **Monitor Expo Push Service**: Check for delivery issues in Expo dashboard
3. **Add Analytics**: Track notification open rates and engagement
4. **Customize Sounds**: Add custom notification sounds for different types
5. **Rich Notifications**: Add images or action buttons to notifications

## Support

For issues or questions:
- Check console logs for error messages
- Verify Firestore rules are deployed
- Ensure all users have valid push tokens
- Test with Expo's push notification tool: https://expo.dev/notifications
