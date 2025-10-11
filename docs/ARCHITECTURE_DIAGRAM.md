# Push Notifications Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                           MOBILE APP                                 │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    App Launch (_layout.tsx)                   │  │
│  │  • Register for push notifications                            │  │
│  │  • Get Expo push token                                        │  │
│  │  • Save token to Firestore                                    │  │
│  │  • Setup notification listeners                               │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                              │                                       │
│                              ▼                                       │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    User Actions                               │  │
│  │                                                               │  │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐ │  │
│  │  │ Create         │  │ Update         │  │ Manage         │ │  │
│  │  │ Engagement     │  │ Status         │  │ Owners         │ │  │
│  │  └────────────────┘  └────────────────┘  └────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      FIREBASE FIRESTORE                              │
│                                                                      │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐ │
│  │   customers/     │  │     users/       │  │  engagements/    │ │
│  │   {customerId}   │  │    {userId}      │  │  {engagementId}  │ │
│  │                  │  │                  │  │                  │ │
│  │  • userId        │  │  • email         │  │  • title         │ │
│  │  • ownerIds[]    │  │  • displayName   │  │  • status        │ │
│  │  • name          │  │  • expoPush      │  │  • createdAt     │ │
│  │  • phone         │  │    Tokens[]      │  │  • lastUpdated   │ │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│              NOTIFICATION PROCESSING LAYER                           │
│                  (lib/notifications/pushNotifications.ts)            │
│                                                                      │
│  1. Get customer.ownerIds                                           │
│  2. For each ownerId:                                               │
│     • Query users/{ownerId}                                         │
│     • Get expoPushTokens[]                                          │
│  3. Build notification payload                                      │
│  4. Send to Expo Push API                                           │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      EXPO PUSH SERVICE                               │
│                   (exp.host/--/api/v2/push/send)                    │
│                                                                      │
│  • Receives notification requests                                   │
│  • Validates push tokens                                            │
│  • Routes to APNs (iOS) or FCM (Android)                           │
│  • Handles delivery receipts                                        │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      DEVICE NOTIFICATION                             │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  Foreground (App Open)                                      │    │
│  │  • Notification received listener triggered                 │    │
│  │  • Show in-app alert/banner                                 │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │  Background (App Closed/Background)                         │    │
│  │  • System notification displayed                            │    │
│  │  • User taps notification                                   │    │
│  │  • App opens, response listener triggered                   │    │
│  │  • Navigate to /customers                                   │    │
│  └────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

## Notification Flow by Type

### 1. Engagement Created

```
User A creates engagement
         │
         ▼
addEngagement(customerId, data)
         │
         ├─► Save to Firestore: customers/{id}/engagements/{engId}
         │
         ├─► Get customer.ownerIds = [userA, userB, userC]
         │
         ├─► getMultipleUsersPushTokens([userA, userB, userC])
         │   └─► Returns: [tokenA1, tokenA2, tokenB1, tokenC1]
         │
         └─► For each token:
             └─► sendPushNotification(token, "New Engagement Created", ...)
                 │
                 ├─► User A: "New engagement 'Demo' created for Acme Corp"
                 ├─► User B: "New engagement 'Demo' created for Acme Corp"
                 └─► User C: "New engagement 'Demo' created for Acme Corp"
```

### 2. Engagement Status Changed

```
User A changes status: Open → In Progress
         │
         ▼
updateEngagement(customerId, engId, { status: 'in_progress' })
         │
         ├─► Get old status from Firestore
         │
         ├─► Update Firestore with new status
         │
         ├─► Get customer.ownerIds = [userA, userB, userC]
         │
         ├─► getMultipleUsersPushTokens([userA, userB, userC])
         │
         └─► For each token:
             └─► sendPushNotification(token, "Engagement Status Updated", ...)
                 │
                 ├─► User A: "Demo for Acme changed from Open to In Progress"
                 ├─► User B: "Demo for Acme changed from Open to In Progress"
                 └─► User C: "Demo for Acme changed from Open to In Progress"
```

### 3. Owner Added

```
User A adds User D as owner
         │
         ▼
addCustomerOwner(customerId, userD, userA)
         │
         ├─► Update Firestore: ownerIds = [userA, userB, userC, userD]
         │
         ├─► Get user names from Firestore
         │   ├─► User A name: "Alice"
         │   └─► User D name: "David"
         │
         ├─► Notify new owner (User D):
         │   └─► notifyOwnerAdded(userD, "Acme Corp", "Alice")
         │       └─► "Alice added you as owner of Acme Corp"
         │
         └─► Notify existing owners (User B, C):
             └─► notifyOwnersAboutNewOwner([userA,userB,userC,userD], "Acme", "David", userA)
                 ├─► User B: "David was added as owner of Acme Corp"
                 └─► User C: "David was added as owner of Acme Corp"
```

## Component Interaction

```
┌─────────────────────────────────────────────────────────────────┐
│                    Customer Detail Screen                        │
│                   (app/customers/[id].tsx)                       │
│                                                                  │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐   │
│  │ Profile Card   │  │ Owners Section │  │ Engagements    │   │
│  │                │  │                │  │                │   │
│  │ • Avatar       │  │ • Owner count  │  │ • List         │   │
│  │ • Name         │  │ • Manage btn   │  │ • Add btn      │   │
│  │ • Phone        │  │                │  │ • Status edit  │   │
│  └────────────────┘  └────────────────┘  └────────────────┘   │
│                             │                      │            │
│                             ▼                      ▼            │
│                   ┌──────────────────┐  ┌──────────────────┐  │
│                   │ ManageOwners     │  │ AddEngagement    │  │
│                   │ Modal            │  │ Modal            │  │
│                   │                  │  │                  │  │
│                   │ • Search users   │  │ • Title input    │  │
│                   │ • Add owner      │  │ • Status select  │  │
│                   │ • Remove owner   │  │ • Submit         │  │
│                   └──────────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                             │                      │
                             ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Firebase Functions                            │
│              (lib/firebase/customers.ts)                         │
│                                                                  │
│  addCustomerOwner()        addEngagement()                      │
│  removeCustomerOwner()     updateEngagement()                   │
│         │                         │                              │
│         └─────────┬───────────────┘                              │
│                   ▼                                              │
│         ┌──────────────────┐                                    │
│         │  Notification    │                                    │
│         │  Functions       │                                    │
│         └──────────────────┘                                    │
└─────────────────────────────────────────────────────────────────┘
```

## Security Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Firestore Security Rules                      │
│                                                                  │
│  Request: Read customer/{customerId}                            │
│     │                                                            │
│     ├─► Check: isAuthenticated() ?                              │
│     │   └─► No → DENY                                           │
│     │                                                            │
│     ├─► Check: resource.data.userId == request.auth.uid ?       │
│     │   └─► Yes → ALLOW (user is creator)                       │
│     │                                                            │
│     └─► Check: request.auth.uid in resource.data.ownerIds ?     │
│         └─► Yes → ALLOW (user is owner)                         │
│         └─► No → DENY                                           │
│                                                                  │
│  Request: Update customer/{customerId}                          │
│     │                                                            │
│     ├─► Check: isCustomerOwner() ?                              │
│     │   └─► Yes → ALLOW                                         │
│     │                                                            │
│     └─► Check: willBeCustomerOwner() ?                          │
│         └─► Yes → ALLOW (being added as owner)                  │
│         └─► No → DENY                                           │
└─────────────────────────────────────────────────────────────────┘
```

## Data Relationships

```
User
 ├─► expoPushTokens[] ────────┐
 │                             │
 └─► userId ──────────┐        │
                      │        │
                      ▼        │
Customer              │        │
 ├─► userId (creator) │        │
 ├─► ownerIds[] ──────┴────────┤
 │                             │
 └─► Engagements/              │
      ├─► Engagement 1          │
      ├─► Engagement 2          │
      └─► Engagement 3          │
                                │
                                ▼
                    Push Notification Sent
                    to all tokens of all owners
```

## Notification Payload Structure

```json
{
  "to": "ExponentPushToken[xxxxxxxxxxxxxx]",
  "sound": "default",
  "title": "Notification Title",
  "body": "Notification Body",
  "data": {
    "type": "engagement_created | engagement_status_changed | owner_added | owner_added_to_customer",
    "customerName": "Acme Corp",
    "engagementTitle": "Demo Project",
    "oldStatus": "open",
    "newStatus": "in_progress",
    "addedByUserName": "Alice",
    "newOwnerName": "David"
  }
}
```

## State Management

```
App State
 │
 ├─► Notification Listeners (useRef)
 │    ├─► notificationListener
 │    └─► responseListener
 │
 ├─► Customer State
 │    ├─► customer: Customer
 │    ├─► engagements: Engagement[]
 │    └─► showOwnersModal: boolean
 │
 └─► Push Token State (Firestore)
      └─► users/{uid}/expoPushTokens[]
```
