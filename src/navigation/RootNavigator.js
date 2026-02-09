import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import CourseNavigator from './CourseNavigator';
import useAuthStore from '../store/authStore';
import useAppConfigStore from '../store/appConfigStore';
import Loading from '../components/Loading';
import AppInitScreen from '../screens/AppInitScreen';

const RootNavigator = () => {
  const { isAuthenticated, isLoading: authLoading, loadUser } = useAuthStore();
  const { config, isInitialized, isSingleCourseApp, getDefaultCourseId } = useAppConfigStore();
  const [appReady, setAppReady] = useState(false);
  const [initError, setInitError] = useState(null);

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
    <NavigationContainer>
      {isAuthenticated ? getAuthenticatedNavigator() : <AuthNavigator />}
    </NavigationContainer>
  );
};

export default RootNavigator;
