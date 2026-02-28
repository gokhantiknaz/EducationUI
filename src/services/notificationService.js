import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';
import { API_ENDPOINTS, STORAGE_KEYS } from '../constants/config';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Register for push notifications and get the Expo push token
 * @returns {Promise<string|null>} The push token or null if registration failed
 */
export const registerForPushNotificationsAsync = async () => {
  let token = null;

  // Check if running on a physical device
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  // Get existing permission status
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permission if not already granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission not granted');
    return null;
  }

  try {
    // Get the native device push token (FCM for Android, APNs for iOS)
    // This is required when sending via Firebase directly
    const deviceToken = await Notifications.getDevicePushTokenAsync();
    token = deviceToken.data;

    console.log('Device push token obtained:', token?.substring(0, 20) + '...');

    // Store the token locally
    if (token) {
      await AsyncStorage.setItem(STORAGE_KEYS.PUSH_TOKEN, token);
    }

    // Configure Android notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return token;
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }
};

/**
 * Send the push token to the backend
 * @param {string} token - The push token
 * @returns {Promise<boolean>} Whether the registration was successful
 */
export const sendTokenToBackend = async (token) => {
  if (!token) return false;

  try {
    const deviceInfo = {
      token,
      platform: Platform.OS === 'ios' ? 'iOS' : 'Android',
      deviceId: Constants.deviceId,
      deviceModel: Device.modelName,
    };

    await api.post(API_ENDPOINTS.REGISTER_DEVICE_TOKEN, deviceInfo);
    console.log('Push token registered with backend');
    return true;
  } catch (error) {
    console.error('Error registering push token:', error);
    return false;
  }
};

/**
 * Remove the push token from the backend (on logout)
 * @returns {Promise<boolean>} Whether the removal was successful
 */
export const removeTokenFromBackend = async () => {
  try {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.PUSH_TOKEN);

    if (token) {
      await api.delete(`${API_ENDPOINTS.REMOVE_DEVICE_TOKEN}?token=${encodeURIComponent(token)}`);
      await AsyncStorage.removeItem(STORAGE_KEYS.PUSH_TOKEN);
      console.log('Push token removed from backend');
    }

    return true;
  } catch (error) {
    console.error('Error removing push token:', error);
    return false;
  }
};

/**
 * Initialize push notifications after login
 * @returns {Promise<string|null>} The push token or null
 */
export const initializePushNotifications = async () => {
  const token = await registerForPushNotificationsAsync();

  if (token) {
    await sendTokenToBackend(token);
  }

  return token;
};

/**
 * Add a listener for received notifications (while app is in foreground)
 * @param {Function} callback - The callback function
 * @returns {Object} The subscription object
 */
export const addNotificationReceivedListener = (callback) => {
  return Notifications.addNotificationReceivedListener(callback);
};

/**
 * Add a listener for notification responses (user interaction)
 * @param {Function} callback - The callback function
 * @returns {Object} The subscription object
 */
export const addNotificationResponseReceivedListener = (callback) => {
  return Notifications.addNotificationResponseReceivedListener(callback);
};

/**
 * Get the last notification response (when app was opened via notification)
 * @returns {Promise<Object|null>} The notification response or null
 */
export const getLastNotificationResponse = async () => {
  return await Notifications.getLastNotificationResponseAsync();
};

/**
 * Schedule a local notification
 * @param {Object} options - Notification options
 * @returns {Promise<string>} The notification identifier
 */
export const scheduleLocalNotification = async ({ title, body, data, trigger }) => {
  return await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
    },
    trigger: trigger || null, // null means immediate
  });
};

/**
 * Cancel all scheduled notifications
 */
export const cancelAllScheduledNotifications = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};

/**
 * Get badge count
 * @returns {Promise<number>} The badge count
 */
export const getBadgeCount = async () => {
  return await Notifications.getBadgeCountAsync();
};

/**
 * Set badge count
 * @param {number} count - The badge count
 */
export const setBadgeCount = async (count) => {
  await Notifications.setBadgeCountAsync(count);
};

/**
 * Dismiss all notifications
 */
export const dismissAllNotifications = async () => {
  await Notifications.dismissAllNotificationsAsync();
};

export default {
  registerForPushNotificationsAsync,
  sendTokenToBackend,
  removeTokenFromBackend,
  initializePushNotifications,
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
  getLastNotificationResponse,
  scheduleLocalNotification,
  cancelAllScheduledNotifications,
  getBadgeCount,
  setBadgeCount,
  dismissAllNotifications,
};
