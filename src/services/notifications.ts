import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { api } from '@/services/api';

// Configure foreground notification behavior strictly adhering to Expo SDK 57
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Registers device for Expo Push Notifications and syncs token with backend.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return null;
  }

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF2B66',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[Notifications] Permission not granted for push notifications');
      return null;
    }

    // Resolve EAS projectId if configured
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;

    const tokenResponse = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    const token = tokenResponse.data;

    // Sync token with backend
    if (token) {
      await api.registerPushToken(token, Platform.OS);
      console.log('[Notifications] Expo Push Token registered:', token);
    }

    return token;
  } catch (error) {
    console.warn('[Notifications] Error registering push notification token:', error);
    return null;
  }
}

/**
 * Handles incoming push notification tap to deep link to matches or chat room.
 */
export function handleNotificationTap(
  notification: Notifications.Notification,
  router: { push: (href: any) => void }
) {
  try {
    const data = notification.request.content.data;
    if (!data) return;

    if (typeof data.url === 'string') {
      router.push(data.url);
      return;
    }

    if (data.type === 'MATCH') {
      router.push('/(tabs)/matches');
    } else if (data.type === 'CHAT' || data.type === 'CHAT_UNLOCKED') {
      if (data.matchId) {
        router.push(`/chat/${data.matchId}`);
      } else {
        router.push('/(tabs)/matches');
      }
    }
  } catch (err) {
    console.warn('[Notifications] Failed to route notification tap:', err);
  }
}

/**
 * Initializes notification listeners (both cold start launch & live response).
 */
export function setupNotificationObserver(router: { push: (href: any) => void }) {
  if (Platform.OS === 'web') {
    return () => {};
  }

  // Handle cold start when app was launched via push notification tap
  try {
    const initialResponse = Notifications.getLastNotificationResponse();
    if (initialResponse?.notification) {
      handleNotificationTap(initialResponse.notification, router);
    }
  } catch (err) {
    console.warn('[Notifications] Failed getting initial notification response:', err);
  }

  // Handle warm/foreground notification tap interaction
  const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
    if (response?.notification) {
      handleNotificationTap(response.notification, router);
    }
  });

  // Handle foreground notification incoming event
  const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
    console.log('[Notifications] Received foreground notification:', notification.request.content.title);
  });

  return () => {
    responseSubscription.remove();
    receivedSubscription.remove();
  };
}
