# Push Notifications - Quick Reference

## 🚀 Quick Start

```bash
# 1. Deploy Firestore rules
firebase deploy --only firestore:rules

# 2. Run on physical device
npm run ios    # or npm run android

# 3. Grant notification permissions when prompted
```

## 📱 Notification Types

| Type | When | Who Gets It |
|------|------|-------------|
| Engagement Created | New engagement added | All customer owners |
| Status Changed | Engagement status updated | All customer owners |
| Owner Added | User added as owner | New owner |
| New Owner | Owner added to customer | Existing owners |

## 🔧 Key Functions

### Send Notifications
```typescript
// Engagement created
import { notifyEngagementCreated } from '../lib/notifications/pushNotifications';
await notifyEngagementCreated(ownerIds, customerName, engagementTitle);

// Status changed
import { notifyEngagementStatusChanged } from '../lib/notifications/pushNotifications';
await notifyEngagementStatusChanged(ownerIds, customerName, title, oldStatus, newStatus);

// Owner added
import { notifyOwnerAdded } from '../lib/notifications/pushNotifications';
await notifyOwnerAdded(newOwnerId, customerName, addedByUserName);
```

### Manage Owners
```typescript
// Add owner
import { addCustomerOwner } from '../lib/firebase/customers';
await addCustomerOwner(customerId, newOwnerId, currentUserId);

// Remove owner
import { removeCustomerOwner } from '../lib/firebase/customers';
await removeCustomerOwner(customerId, ownerIdToRemove);
```

## 🎯 UI Components

### Manage Owners Modal
```tsx
import { ManageOwnersModal } from '../components/ManageOwnersModal';

<ManageOwnersModal
  visible={showModal}
  customerId={customerId}
  customerName={customerName}
  currentOwnerIds={customer.ownerIds || []}
  onClose={() => setShowModal(false)}
  onUpdate={loadCustomerData}
/>
```

## 🔐 Firestore Rules

```javascript
// Customers accessible by creator OR owners
match /customers/{customerId} {
  allow read: if isCustomerOwner();
  allow update: if isCustomerOwner() || willBeCustomerOwner();
}

// Users readable by all (for search)
match /users/{userId} {
  allow read: if isAuthenticated();
  allow write: if isOwner(userId);
}
```

## 📊 Data Structure

### Customer
```typescript
{
  userId: string;        // Creator
  ownerIds: string[];    // All owners (includes userId)
  // ... other fields
}
```

### User
```typescript
{
  email: string;
  displayName?: string;
  expoPushTokens: string[];  // Expo push tokens
  lastTokenUpdate: string;
}
```

## 🐛 Debugging

### Check Push Token
```typescript
import { getUserPushTokens } from '../lib/notifications/pushNotifications';
const tokens = await getUserPushTokens(userId);
console.log('Push tokens:', tokens);
```

### Test Notification
```bash
curl -H "Content-Type: application/json" \
     -X POST https://exp.host/--/api/v2/push/send \
     -d '{
       "to": "ExponentPushToken[YOUR_TOKEN]",
       "title": "Test",
       "body": "Test notification"
     }'
```

### Common Issues
- **No notification**: Check physical device, permissions, internet
- **Can't find user**: User must have logged in once
- **Permission denied**: Deploy firestore.rules

## 📝 Code Snippets

### Register Push Notifications
```typescript
import { registerForPushNotificationsAsync, savePushToken } from '../setup/notifications';

const token = await registerForPushNotificationsAsync();
if (token && userId) {
  await savePushToken(userId, token);
}
```

### Listen for Notifications
```typescript
import { setupNotificationListeners } from '../setup/notifications';

const listeners = setupNotificationListeners(
  (notification) => {
    console.log('Received:', notification);
  },
  (response) => {
    console.log('Tapped:', response);
    // Handle navigation
  }
);
```

### Query Customers by Owner
```typescript
import { subscribeToCustomers } from '../lib/firebase/customers';

const unsubscribe = subscribeToCustomers(userId, (customers) => {
  // customers includes where user is creator OR in ownerIds
  console.log('My customers:', customers);
});
```

## 🎨 UI Examples

### Show Owner Count
```tsx
<Text>
  {customer.ownerIds?.length || 1} owner(s)
</Text>
```

### Manage Button
```tsx
<TouchableOpacity onPress={() => setShowOwnersModal(true)}>
  <Ionicons name="people" size={20} />
  <Text>Manage</Text>
</TouchableOpacity>
```

## ⚡ Performance Tips

1. **Batch Notifications**: Send to multiple tokens in parallel
2. **Cache User Data**: Store user info locally to reduce queries
3. **Debounce Status Changes**: Avoid spam from rapid updates
4. **Index ownerIds**: Create Firestore index if querying by ownerIds

## 🔗 Useful Links

- [Expo Notifications Docs](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Expo Push Tool](https://expo.dev/notifications)
- [Firebase Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firestore Queries](https://firebase.google.com/docs/firestore/query-data/queries)

## 📞 Quick Help

```typescript
// Get all notification functions
import * as PushNotifications from '../lib/notifications/pushNotifications';

// Get all customer functions
import * as Customers from '../lib/firebase/customers';

// Get notification setup
import * as Notifications from '../setup/notifications';
```

---

**Need more details?** Check:
- `PUSH_NOTIFICATIONS_FEATURE.md` - Full feature documentation
- `PUSH_NOTIFICATIONS_SETUP.md` - Setup and testing guide
- `IMPLEMENTATION_SUMMARY.md` - Complete implementation details
