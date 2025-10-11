import { useEffect, useRef } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { auth } from '../lib/firebase/config';
import {
  registerForPushNotificationsAsync,
  savePushToken,
  setupNotificationListeners,
  removeNotificationListeners,
} from '../setup/notifications';
import '../global.css';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    // Register for push notifications
    const registerPushNotifications = async () => {
      const user = auth.currentUser;
      if (user) {
        const token = await registerForPushNotificationsAsync();
        if (token) {
          await savePushToken(user.uid, token);
        }
      }
    };

    registerPushNotifications();

    // Setup notification listeners
    const listeners = setupNotificationListeners(
      (notification) => {
        console.log('Notification received:', notification);
      },
      (response) => {
        console.log('Notification tapped:', response);
        
        // Handle navigation based on notification type
        const data = response.notification.request.content.data;
        
        if (data?.type === 'engagement_created' || data?.type === 'engagement_status_changed') {
          // Navigate to customers screen
          router.push('/customers');
        } else if (data?.type === 'owner_added' || data?.type === 'owner_added_to_customer') {
          // Navigate to customers screen
          router.push('/customers');
        }
      }
    );

    notificationListener.current = listeners.notificationListener;
    responseListener.current = listeners.responseListener;

    return () => {
      if (notificationListener.current && responseListener.current) {
        removeNotificationListeners({
          notificationListener: notificationListener.current,
          responseListener: responseListener.current,
        });
      }
    };
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="login" />
      <Stack.Screen name="customers" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}
