import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Pressable,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import useNotificationStore from '../store/notificationStore';
import Loading from '../components/Loading';

// Notification type icons and colors
const NOTIFICATION_TYPES = {
  Info: { icon: 'ℹ️', color: COLORS.info, bgColor: '#E3F2FD' },
  Success: { icon: '✅', color: COLORS.success, bgColor: '#E8F5E9' },
  Warning: { icon: '⚠️', color: COLORS.warning, bgColor: '#FFF8E1' },
  Error: { icon: '❌', color: COLORS.error, bgColor: '#FFEBEE' },
  NewCourse: { icon: '📚', color: COLORS.primary, bgColor: '#EDE7F6' },
  Announcement: { icon: '📢', color: COLORS.accent, bgColor: '#FCE4EC' },
  Quiz: { icon: '📝', color: COLORS.secondary, bgColor: '#E8EAF6' },
  Certificate: { icon: '🏆', color: '#FFD700', bgColor: '#FFFDE7' },
};

const NotificationsScreen = ({ navigation }) => {
  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  } = useNotificationStore();

  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'unread'
  const [refreshing, setRefreshing] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showClearModal, setShowClearModal] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    await fetchNotifications(1, 50);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications(1, 50);
    setRefreshing(false);
  }, []);

  const handleNotificationPress = async (notification) => {
    // Mark as read if not already
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    // Show notification detail modal
    setSelectedNotification(notification);
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  const handleClearAll = () => {
    setShowClearModal(true);
  };

  const confirmClearAll = () => {
    clearNotifications();
    setShowClearModal(false);
  };

  const getFilteredNotifications = () => {
    if (activeTab === 'unread') {
      return notifications.filter(n => !n.isRead);
    }
    return notifications;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getTypeConfig = (type) => {
    return NOTIFICATION_TYPES[type] || NOTIFICATION_TYPES.Info;
  };

  const renderNotificationItem = ({ item }) => {
    const typeConfig = getTypeConfig(item.type);

    return (
      <TouchableOpacity
        style={[
          styles.notificationCard,
          !item.isRead && styles.unreadCard,
        ]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: typeConfig.bgColor }]}>
          <Text style={styles.iconText}>{typeConfig.icon}</Text>
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
            <Text style={[styles.title, !item.isRead && styles.unreadTitle]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.time}>{formatDate(item.createdAt)}</Text>
          </View>

          <Text style={styles.message} numberOfLines={2}>
            {item.message}
          </Text>

          {!item.isRead && <View style={styles.unreadDot} />}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🔔</Text>
      <Text style={styles.emptyTitle}>
        {activeTab === 'unread' ? 'No Unread Notifications' : 'No Notifications'}
      </Text>
      <Text style={styles.emptyText}>
        {activeTab === 'unread'
          ? "You're all caught up! Check back later for new updates."
          : "You don't have any notifications yet. We'll notify you when something important happens."}
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            All
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'unread' && styles.activeTab]}
          onPress={() => setActiveTab('unread')}
        >
          <Text style={[styles.tabText, activeTab === 'unread' && styles.activeTabText]}>
            Unread
          </Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Actions */}
      {notifications.length > 0 && (
        <View style={styles.actionsContainer}>
          {unreadCount > 0 && (
            <TouchableOpacity style={styles.actionButton} onPress={handleMarkAllRead}>
              <Text style={styles.actionButtonText}>Mark all as read</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.actionButton, styles.clearButton]}
            onPress={handleClearAll}
          >
            <Text style={[styles.actionButtonText, styles.clearButtonText]}>Clear all</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const filteredNotifications = getFilteredNotifications();

  if (isLoading && notifications.length === 0) {
    return <Loading text="Loading notifications..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Screen Header */}
      <View style={styles.screenHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Notifications</Text>
        <View style={styles.placeholder} />
      </View>

      {renderHeader()}

      <FlatList
        data={filteredNotifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          filteredNotifications.length === 0 && styles.emptyListContent,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={renderEmptyState}
      />

      {/* Notification Detail Modal */}
      <Modal
        visible={!!selectedNotification}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedNotification(null)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setSelectedNotification(null)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            {selectedNotification && (
              <>
                <View style={[
                  styles.modalIconContainer,
                  { backgroundColor: getTypeConfig(selectedNotification.type).bgColor }
                ]}>
                  <Text style={styles.modalIcon}>
                    {getTypeConfig(selectedNotification.type).icon}
                  </Text>
                </View>

                <Text style={styles.modalTitle}>{selectedNotification.title}</Text>
                <Text style={styles.modalMessage}>{selectedNotification.message}</Text>
                <Text style={styles.modalTime}>
                  {new Date(selectedNotification.createdAt).toLocaleString()}
                </Text>

                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setSelectedNotification(null)}
                >
                  <Text style={styles.modalCloseButtonText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Clear Confirmation Modal */}
      <Modal
        visible={showClearModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowClearModal(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setShowClearModal(false)}
        >
          <View style={styles.confirmModal}>
            <Text style={styles.confirmIcon}>🗑️</Text>
            <Text style={styles.confirmTitle}>Clear All Notifications?</Text>
            <Text style={styles.confirmText}>
              This action cannot be undone. All notifications will be removed from this device.
            </Text>

            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={[styles.confirmButton, styles.cancelButton]}
                onPress={() => setShowClearModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmButton, styles.deleteButton]}
                onPress={confirmClearAll}
              >
                <Text style={styles.deleteButtonText}>Clear All</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.paddingSmall,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: COLORS.text,
  },
  screenTitle: {
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  placeholder: {
    width: 40,
  },
  headerContainer: {
    paddingHorizontal: SIZES.padding,
    paddingTop: SIZES.padding,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundDark,
    borderRadius: SIZES.radius,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.paddingSmall,
    borderRadius: SIZES.radiusSmall,
  },
  activeTab: {
    backgroundColor: COLORS.card,
    ...SHADOWS.small,
  },
  tabText: {
    fontSize: SIZES.body2,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  activeTabText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  badge: {
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 11,
    color: COLORS.background,
    fontWeight: 'bold',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: SIZES.padding,
    gap: SIZES.paddingSmall,
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: SIZES.paddingSmall,
  },
  actionButtonText: {
    fontSize: SIZES.body3,
    color: COLORS.primary,
    fontWeight: '500',
  },
  clearButton: {},
  clearButtonText: {
    color: COLORS.error,
  },
  listContent: {
    padding: SIZES.padding,
  },
  emptyListContent: {
    flex: 1,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.paddingSmall,
    ...SHADOWS.small,
  },
  unreadCard: {
    backgroundColor: '#F8F9FF',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.paddingSmall,
  },
  iconText: {
    fontSize: 20,
  },
  contentContainer: {
    flex: 1,
    position: 'relative',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: SIZES.body2,
    fontWeight: '500',
    color: COLORS.text,
    flex: 1,
    marginRight: SIZES.paddingSmall,
  },
  unreadTitle: {
    fontWeight: '700',
  },
  time: {
    fontSize: SIZES.body3,
    color: COLORS.textLight,
  },
  message: {
    fontSize: SIZES.body3,
    color: COLORS.textLight,
    lineHeight: 18,
  },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SIZES.paddingLarge,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: SIZES.padding,
  },
  emptyTitle: {
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.paddingSmall,
  },
  emptyText: {
    fontSize: SIZES.body2,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 22,
  },
  // Modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.paddingLarge,
  },
  modalContent: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radiusLarge,
    padding: SIZES.paddingLarge,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.padding,
  },
  modalIcon: {
    fontSize: 32,
  },
  modalTitle: {
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SIZES.paddingSmall,
  },
  modalMessage: {
    fontSize: SIZES.body2,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SIZES.padding,
  },
  modalTime: {
    fontSize: SIZES.body3,
    color: COLORS.textLight,
    marginBottom: SIZES.paddingLarge,
  },
  modalCloseButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.paddingSmall,
    paddingHorizontal: SIZES.paddingLarge,
    borderRadius: SIZES.radius,
    width: '100%',
  },
  modalCloseButtonText: {
    color: COLORS.background,
    fontSize: SIZES.body2,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Confirm modal
  confirmModal: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radiusLarge,
    padding: SIZES.paddingLarge,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  confirmIcon: {
    fontSize: 48,
    marginBottom: SIZES.padding,
  },
  confirmTitle: {
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SIZES.paddingSmall,
  },
  confirmText: {
    fontSize: SIZES.body2,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SIZES.paddingLarge,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: SIZES.paddingSmall,
    width: '100%',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: SIZES.paddingSmall,
    borderRadius: SIZES.radius,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.backgroundDark,
  },
  cancelButtonText: {
    color: COLORS.text,
    fontSize: SIZES.body2,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: COLORS.error,
  },
  deleteButtonText: {
    color: COLORS.background,
    fontSize: SIZES.body2,
    fontWeight: '600',
  },
});

export default NotificationsScreen;
