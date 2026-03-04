import { create } from 'zustand';
import api from '../services/api';
import { API_ENDPOINTS } from '../constants/config';
import notificationService from '../services/notificationService';

const useNotificationStore = create((set, get) => ({
  // State
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  pushToken: null,
  isPushInitialized: false,

  // Actions
  setNotifications: (notifications) => set({ notifications }),

  setUnreadCount: (count) => set({ unreadCount: count }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  setPushToken: (token) => set({ pushToken: token }),

  // Initialize push notifications
  initializePushNotifications: async (force = false) => {
    const { isPushInitialized } = get();
    if (isPushInitialized && !force) return get().pushToken;

    try {
      const token = await notificationService.initializePushNotifications();
      if (token) {
        set({
          pushToken: token,
          isPushInitialized: true,
        });
        console.log('Push notifications initialized, token:', token?.substring(0, 20) + '...');
      }
      return token;
    } catch (error) {
      // Silently ignore auth errors - user will be redirected to login
      if (error.response?.status === 401 || error.response?.status === 404) {
        return null;
      }
      console.error('Failed to initialize push notifications:', error);
      set({ error: error.message });
      return null;
    }
  },

  // Fetch notifications from API
  fetchNotifications: async (page = 1, pageSize = 20) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(API_ENDPOINTS.NOTIFICATIONS, {
        params: { page, pageSize },
      });

      const { notifications, unreadCount, pagination } = response.data.data;

      set({
        notifications: page === 1 ? notifications : [...get().notifications, ...notifications],
        unreadCount,
        isLoading: false,
      });

      return { notifications, pagination };
    } catch (error) {
      // Silently ignore auth errors - user will be redirected to login
      if (error.response?.status === 401 || error.response?.status === 404) {
        set({ isLoading: false });
        return null;
      }
      console.error('Error fetching notifications:', error);
      set({
        error: error.message,
        isLoading: false,
      });
      return null;
    }
  },

  // Mark a notification as read
  markAsRead: async (notificationId) => {
    try {
      await api.put(API_ENDPOINTS.MARK_NOTIFICATION_READ(notificationId));

      // Update local state
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));

      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    try {
      await api.put(API_ENDPOINTS.MARK_ALL_NOTIFICATIONS_READ);

      // Update local state
      set((state) => ({
        notifications: state.notifications.map((n) => ({
          ...n,
          isRead: true,
          readAt: n.readAt || new Date().toISOString(),
        })),
        unreadCount: 0,
      }));

      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  },

  // Add a new notification (when push received)
  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  // Clear all notifications from state
  clearNotifications: () => {
    set({
      notifications: [],
      unreadCount: 0,
    });
  },

  // Clean up push notifications (on logout)
  cleanupPushNotifications: async () => {
    try {
      await notificationService.removeTokenFromBackend();
      await notificationService.setBadgeCount(0);
      set({
        pushToken: null,
        isPushInitialized: false,
        notifications: [],
        unreadCount: 0,
      });
    } catch (error) {
      console.error('Error cleaning up push notifications:', error);
    }
  },

  // Update badge count based on unread notifications
  updateBadgeCount: async () => {
    const { unreadCount } = get();
    await notificationService.setBadgeCount(unreadCount);
  },

  // Clear error
  clearError: () => set({ error: null }),
}));

export default useNotificationStore;
