import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import useAuthStore from '../store/authStore';
import Loading from '../components/Loading';
import {TextInput} from "react-native";

const RootNavigator = () => {
  const { isAuthenticated, isLoading, loadUser } = useAuthStore();

  useEffect(() => {
    // Uygulama açıldığında kullanıcı bilgilerini yükle
    loadUser();
  }, []);

  useEffect(() => {
    console.log('RootNavigator - isAuthenticated changed:', isAuthenticated);
  }, [isAuthenticated]);

  if (isLoading) {
    return <Loading text="Yükleniyor..." />;
  }

  console.log('RootNavigator rendering - isAuthenticated:', isAuthenticated);

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

export default RootNavigator;
