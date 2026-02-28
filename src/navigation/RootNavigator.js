import React, { useEffect, useState, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import CourseNavigator from './CourseNavigator';
import useAuthStore from '../store/authStore';
import useAppConfigStore from '../store/appConfigStore';
import useNotificationStore from '../store/notificationStore';
import Loading from '../components/Loading';
import AppInitScreen from '../screens/AppInitScreen';
import notificationService from '../services/notificationService';

const RootNavigator = () => {
  const { isAuthenticated, isLoading: authLoading, loadUser } = useAuthStore();
  const { config, isInitialized, isSingleCourseApp, getDefaultCourseId } = useAppConfigStore();
  const { initializePushNotifications, addNotification, fetchNotifications } = useNotificationStore();
  const [appReady, setAppReady] = useState(false);
  const [initError, setInitError] = useState(null);
  const navigationRef = useRef(null);
  const notificationListener = useRef();
  const responseListener = useRef();

  // Handle app initialization complete
  const handleInitComplete = async (appConfig) => {
    console.log('RootNavigator - App init complete, loading user...');
    await loadUser();
    setAppReady(true);
  };

  // Handle initialization error
  const handleInitError = (error) => {
    console.error('RootNavigator - Init error:', error);
    setInitError(error);
  };

  // Initialize push notifications when authenticated
  useEffect(() => {
    if (isAuthenticated && appReady) {
      console.log('RootNavigator - Initializing push notifications...');
      // Force re-initialization to ensure token is always registered after login
      initializePushNotifications(true);
      fetchNotifications();
    }
  }, [isAuthenticated, appReady]);

  // Set up notification listeners
  useEffect(() => {
    // Listener for notifications received while app is in foreground
    notificationListener.current = notificationService.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
      // Add to local state
      const data = notification.request.content.data;
      addNotification({
        id: notification.request.identifier,
        title: notification.request.content.title,
        message: notification.request.content.body,
        type: data?.type || 'Info',
        isRead: false,
        createdAt: new Date().toISOString(),
        ...data,
      });
    });

    // Listener for when user interacts with notification
    responseListener.current = notificationService.addNotificationResponseReceivedListener((response) => {
      console.log('Notification response:', response);
      const data = response.notification.request.content.data;

      // Navigate based on notification data
      if (data?.courseId && navigationRef.current) {
        navigationRef.current.navigate('CourseDetail', { courseId: data.courseId });
      } else if (data?.actionUrl && navigationRef.current) {
        // Handle custom action URLs
        console.log('Notification action URL:', data.actionUrl);
      }
    });

    // Check if app was opened via notification
    notificationService.getLastNotificationResponse().then((response) => {
      if (response) {
        console.log('App opened via notification:', response);
        const data = response.notification.request.content.data;
        if (data?.courseId && navigationRef.current) {
          navigationRef.current.navigate('CourseDetail', { courseId: data.courseId });
        }
      }
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    console.log('RootNavigator - isAuthenticated changed:', isAuthenticated);
  }, [isAuthenticated]);

  // Show app init screen until config is loaded
  if (!appReady) {
    return (
      <AppInitScreen
        onInitComplete={handleInitComplete}
        onError={handleInitError}
      />
    );
  }

  // Show loading while checking auth
  if (authLoading) {
    return <Loading text="Yükleniyor..." />;
  }

  console.log('RootNavigator rendering - isAuthenticated:', isAuthenticated);
  console.log('RootNavigator - isSingleCourseApp:', isSingleCourseApp());

  // Determine which navigator to use
  const getAuthenticatedNavigator = () => {
    // If single course app, go directly to course content
    if (isSingleCourseApp()) {
      const courseId = getDefaultCourseId();
      console.log('RootNavigator - Single course mode, courseId:', courseId);
      return <CourseNavigator initialCourseId={courseId} />;
    }

    // Multi-course app - show normal navigation with course selection
    return <MainNavigator />;
  };

  return (
    <NavigationContainer ref={navigationRef}>
      {isAuthenticated ? getAuthenticatedNavigator() : <AuthNavigator />}
    </NavigationContainer>
  );
};

export default RootNavigator;
