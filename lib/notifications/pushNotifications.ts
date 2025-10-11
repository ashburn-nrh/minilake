import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { sendPushNotification } from '../../setup/notifications';

/**
 * Get push tokens for a user
 */
export async function getUserPushTokens(userId: string): Promise<string[]> {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return [];
    }
    
    const userData = userDoc.data();
    return userData.expoPushTokens || [];
  } catch (error) {
    console.error('Error getting user push tokens:', error);
    return [];
  }
}

/**
 * Get push tokens for multiple users
 */
export async function getMultipleUsersPushTokens(userIds: string[]): Promise<string[]> {
  try {
    const allTokens: string[] = [];
    
    for (const userId of userIds) {
      const tokens = await getUserPushTokens(userId);
      allTokens.push(...tokens);
    }
    
    return allTokens;
  } catch (error) {
    console.error('Error getting multiple users push tokens:', error);
    return [];
  }
}

/**
 * Send notification to user about engagement creation
 */
export async function notifyEngagementCreated(
  ownerIds: string[],
  customerName: string,
  engagementTitle: string
) {
  try {
    const tokens = await getMultipleUsersPushTokens(ownerIds);
    
    for (const token of tokens) {
      await sendPushNotification(
        token,
        'New Engagement Created',
        `A new engagement "${engagementTitle}" was created for ${customerName}`,
        {
          type: 'engagement_created',
          customerName,
          engagementTitle,
        }
      );
    }
  } catch (error) {
    console.error('Error sending engagement created notification:', error);
  }
}

/**
 * Send notification to user about engagement status change
 */
export async function notifyEngagementStatusChanged(
  ownerIds: string[],
  customerName: string,
  engagementTitle: string,
  oldStatus: string,
  newStatus: string
) {
  try {
    const tokens = await getMultipleUsersPushTokens(ownerIds);
    
    for (const token of tokens) {
      await sendPushNotification(
        token,
        'Engagement Status Updated',
        `"${engagementTitle}" for ${customerName} changed from ${oldStatus} to ${newStatus}`,
        {
          type: 'engagement_status_changed',
          customerName,
          engagementTitle,
          oldStatus,
          newStatus,
        }
      );
    }
  } catch (error) {
    console.error('Error sending engagement status change notification:', error);
  }
}

/**
 * Send notification to user about being added as owner
 */
export async function notifyOwnerAdded(
  newOwnerId: string,
  customerName: string,
  addedByUserName: string
) {
  try {
    const tokens = await getUserPushTokens(newOwnerId);
    
    for (const token of tokens) {
      await sendPushNotification(
        token,
        'Added as Customer Owner',
        `${addedByUserName} added you as an owner of ${customerName}`,
        {
          type: 'owner_added',
          customerName,
          addedByUserName,
        }
      );
    }
  } catch (error) {
    console.error('Error sending owner added notification:', error);
  }
}

/**
 * Send notification to all owners about a new owner being added
 */
export async function notifyOwnersAboutNewOwner(
  ownerIds: string[],
  customerName: string,
  newOwnerName: string,
  excludeUserId?: string
) {
  try {
    const filteredOwnerIds = excludeUserId 
      ? ownerIds.filter(id => id !== excludeUserId)
      : ownerIds;
    
    const tokens = await getMultipleUsersPushTokens(filteredOwnerIds);
    
    for (const token of tokens) {
      await sendPushNotification(
        token,
        'New Owner Added',
        `${newOwnerName} was added as an owner of ${customerName}`,
        {
          type: 'owner_added_to_customer',
          customerName,
          newOwnerName,
        }
      );
    }
  } catch (error) {
    console.error('Error sending new owner notification:', error);
  }
}
