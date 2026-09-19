import { Platform } from 'react-native';
import { isRunningInExpoGo } from 'expo';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Device from 'expo-device';
import { api } from '@/services/api';
import type * as NotificationsType from 'expo-notifications';

// Dynamically resolved reference to expo-notifications
let notificationsModule: typeof NotificationsType | null = null;
let notificationsHandlerConfigured = false;

/**
 * Safely checks if the app is currently executing inside the Expo Go client app.
 */
function isExpoGoClient(): boolean {
  try {
    return (
      isRunningInExpoGo?.() === true ||
      Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
      (Constants as any).appOwnership === 'expo'
    );
  } catch {
    return false;
  }
}

/**
 * Returns expo-notifications module dynamically.
 * Expo SDK 53+ removed remote push notifications from Expo Go on Android, and
 * top-level evaluation of expo-notifications throws an uncaught error on Android Expo Go.
 * This guard ensures safe execution in Expo Go while providing full push notification
 * capabilities in Development Builds (npx expo run:android / iOS) and Production Builds.
 */
function getNotifications(): typeof NotificationsType | null {
  if (notificationsModule) {
    return notificationsModule;
  }

  if (Platform.OS === 'web') {
    return null;
  }

  if (Platform.OS === 'android' && isExpoGoClient()) {
    console.info(
      '[Notifications] Remote push notifications are disabled in Expo Go on Android (Expo SDK 53+ requirement). Use a development build (npx expo run:android) to test push notifications.'
    );
    return null;
  }

  try {
    notificationsModule = require('expo-notifications');
    if (notificationsModule && !notificationsHandlerConfigured) {
      notificationsHandlerConfigured = true;
      notificationsModule.setNotificationHandler({
        handleNotification: async () => ({
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
    }
    return notificationsModule;
  } catch (err) {
    console.warn('[Notifications] Failed to load expo-notifications module:', err);
    return null;
  }
}

/**
 * Registers device for Expo Push Notifications and syncs token with backend.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return null;
  }

  const notifications = getNotifications();
  if (!notifications) {
    return null;
  }

  try {
    if (Platform.OS === 'android') {
      await notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: notifications.AndroidImportance?.MAX ?? 5,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF2B66',
      });
    }

    const { status: existingStatus } = await notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[Notifications] Permission not granted for push notifications');
      return null;
    }

    // Resolve EAS projectId if configured
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;

    const tokenResponse = await notifications.getExpoPushTokenAsync(
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
  notification: NotificationsType.Notification,
  router: { push: (href: any) => void }
) {
  try {
    const data = notification?.request?.content?.data;
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
export function setupNotificationObserver(router: { push: (href: any) => void }): () => void {
  if (Platform.OS === 'web') {
    return () => {};
  }

  const notifications = getNotifications();
  if (!notifications) {
    return () => {};
  }

  // Handle cold start when app was launched via push notification tap
  try {
    const initialResponse = notifications.getLastNotificationResponse();
    if (initialResponse?.notification) {
      handleNotificationTap(initialResponse.notification, router);
    }
  } catch (err) {
    console.warn('[Notifications] Failed getting initial notification response:', err);
  }

  // Handle warm/foreground notification tap interaction
  let responseSubscription: any = null;
  try {
    responseSubscription = notifications.addNotificationResponseReceivedListener((response) => {
      if (response?.notification) {
        handleNotificationTap(response.notification, router);
      }
    });
  } catch (err) {
    console.warn('[Notifications] Failed adding response received listener:', err);
  }

  // Handle foreground notification incoming event
  let receivedSubscription: any = null;
  try {
    receivedSubscription = notifications.addNotificationReceivedListener((notification) => {
      console.log(
        '[Notifications] Received foreground notification:',
        notification?.request?.content?.title
      );
    });
  } catch (err) {
    console.warn('[Notifications] Failed adding notification received listener:', err);
  }

  return () => {
    try {
      responseSubscription?.remove?.();
    } catch {}
    try {
      receivedSubscription?.remove?.();
    } catch {}
  };
}
