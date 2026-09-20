import { Platform } from 'react-native';
import { isRunningInExpoGo } from 'expo';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { api } from '@/services/api';
import type * as NotificationsType from 'expo-notifications';

// Dynamically resolved reference to expo-notifications
let notificationsModule: typeof NotificationsType | null = null;
let notificationsHandlerConfigured = false;

/**
 * Checks whether the app is currently running inside Expo Go on Android.
 * In SDK 53+, remote push notification functionality was removed from Expo Go on Android.
 * Evaluating require('expo-notifications') inside Expo Go Android throws a fatal error.
 * Development builds and standalone production APKs/AABs are unaffected.
 */
export function isExpoGoOnAndroid(): boolean {
  if (Platform.OS !== 'android') return false;

  try {
    if (typeof isRunningInExpoGo === 'function' && isRunningInExpoGo()) {
      return true;
    }
  } catch {}

  return (
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
    (Constants as any).appOwnership === 'expo' ||
    (Constants.executionEnvironment as string) === 'storeClient'
  );
}

/**
 * Returns expo-notifications module dynamically.
 * Skips loading on web and on Android within Expo Go.
 */
export function getNotifications(): typeof NotificationsType | null {
  if (notificationsModule) {
    return notificationsModule;
  }

  if (Platform.OS === 'web' || isExpoGoOnAndroid()) {
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
 * Dismisses all presented system tray notifications related to a specific match ID.
 * Call this when a user opens or reads the chat lounge for that match.
 */
export async function dismissNotificationsForMatch(matchId: string): Promise<void> {
  if (Platform.OS === 'web' || !matchId) return;
  const notifications = getNotifications();
  if (!notifications) return;

  try {
    const presented = await notifications.getPresentedNotificationsAsync();
    const targetMatchId = String(matchId).toLowerCase();

    for (const item of presented) {
      const data = item.request?.content?.data;
      if (
        data &&
        data.matchId &&
        String(data.matchId).toLowerCase() === targetMatchId
      ) {
        await notifications.dismissNotificationAsync(item.request.identifier);
      }
    }
  } catch (err) {
    console.warn('[Notifications] Failed to dismiss notifications for match:', err);
  }
}

/**
 * Dismisses a single notification by identifier from the system tray.
 */
export async function dismissNotificationById(identifier: string): Promise<void> {
  if (Platform.OS === 'web' || !identifier) return;
  const notifications = getNotifications();
  if (!notifications) return;

  try {
    await notifications.dismissNotificationAsync(identifier);
  } catch (err) {
    console.warn('[Notifications] Failed to dismiss notification by ID:', err);
  }
}

/**
 * Dismisses all presented notifications from the system tray.
 */
export async function dismissAllSystemNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;
  const notifications = getNotifications();
  if (!notifications) return;

  try {
    await notifications.dismissAllNotificationsAsync();
  } catch (err) {
    console.warn('[Notifications] Failed to dismiss all notifications:', err);
  }
}

/**
 * Registers device for Expo Push Notifications, sets up sound-enabled notification channels,
 * and syncs token with backend.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === 'web' || isExpoGoOnAndroid()) {
    if (isExpoGoOnAndroid()) {
      console.info(
        '[Notifications] Remote push notifications are disabled in Expo Go on Android (SDK 53+). Push tokens require a development build or standalone build.'
      );
    }
    return null;
  }

  const notifications = getNotifications();
  if (!notifications) {
    return null;
  }

  try {
    // Configure high-priority, sound-enabled channels for Android
    if (Platform.OS === 'android') {
      const channelConfig: NotificationsType.NotificationChannelInput = {
        name: 'Blunderr Messages & Alerts',
        importance: notifications.AndroidImportance?.MAX ?? 7,
        sound: 'default',
        enableVibrate: true,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF2B66',
        enableLights: true,
        showBadge: true,
        lockscreenVisibility: notifications.AndroidNotificationVisibility?.PUBLIC ?? 1,
        audioAttributes: {
          usage: notifications.AndroidAudioUsage?.NOTIFICATION ?? 5,
          contentType: notifications.AndroidAudioContentType?.SONIFICATION ?? 4,
        },
      };

      // Set both the dedicated 'blunderr-alerts' channel and 'default' channel
      await notifications.setNotificationChannelAsync('blunderr-alerts', channelConfig);
      await notifications.setNotificationChannelAsync('default', channelConfig);
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

    let token: string | null = null;
    try {
      const tokenResponse = await notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : undefined
      );
      token = tokenResponse.data;
    } catch (tokenErr) {
      console.info('[Notifications] Note: Remote push token unavailable in this environment:', tokenErr);
    }

    // Sync token with backend if resolved
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
 * Handles incoming push notification tap to deep link to matches or chat room,
 * and immediately vanishes the notification and any sibling notifications for that match.
 */
export function handleNotificationTap(
  notification: NotificationsType.Notification,
  router: { push: (href: any) => void }
) {
  try {
    const notifications = getNotifications();
    if (notifications && notification?.request?.identifier) {
      notifications.dismissNotificationAsync(notification.request.identifier).catch(() => {});
    }

    const data = notification?.request?.content?.data;
    if (!data) return;

    if (data.matchId) {
      dismissNotificationsForMatch(String(data.matchId)).catch(() => {});
    }

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
  if (Platform.OS === 'web' || isExpoGoOnAndroid()) {
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
        '[Notifications] Received foreground notification with sound & banner:',
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
