// Notification Service - Handles push notifications for order updates
// Import suppression FIRST before expo-notifications
import '../utils/suppressNotificationsWarning';

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Check if running in Expo Go
const isExpoGo = Constants.executionEnvironment === 'storeClient';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Request notification permissions
 * @returns {Promise<boolean>} True if permissions granted
 */
export const requestNotificationPermissions = async () => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Notification permissions not granted');
      return false;
    }

    // For Android, create a notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Order Updates',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
};

/**
 * Schedule a notification for order status
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Additional data to pass
 * @param {number} seconds - Delay in seconds (optional)
 */
export const scheduleOrderNotification = async (title, body, data = {}, seconds = 0) => {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.log('Cannot send notification: permissions not granted');
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: seconds > 0 ? { seconds } : null,
    });
  } catch (error) {
    console.error('Error scheduling notification:', error);
  }
};

/**
 * Send immediate notification
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Additional data
 */
export const sendNotification = async (title, body, data = {}) => {
  await scheduleOrderNotification(title, body, data, 0);
};

/**
 * Cancel all scheduled notifications
 */
export const cancelAllNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error canceling notifications:', error);
  }
};

/**
 * Get notification token (for push notifications)
 * Note: Push tokens are not available in Expo Go on Android (SDK 53+)
 * @returns {Promise<string|null>} Notification token
 */
export const getNotificationToken = async () => {
  // Push tokens are not supported in Expo Go on Android
  if (Platform.OS === 'android' && isExpoGo) {
    console.log('Push tokens not available in Expo Go on Android. Use a development build for push notifications.');
    return null;
  }

  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      return null;
    }

    const token = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId || Constants.expoConfig?.extra?.projectId,
    });

    return token.data;
  } catch (error) {
    console.error('Error getting notification token:', error);
    return null;
  }
};

export default {
  requestNotificationPermissions,
  scheduleOrderNotification,
  sendNotification,
  cancelAllNotifications,
  getNotificationToken,
};

