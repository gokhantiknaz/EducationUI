import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <>
      <StatusBar style="auto" />
      <RootNavigator />
      <Toast />
    </>
  );
}
