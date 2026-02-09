import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
  TouchableOpacity,
} from 'react-native';
import useAppConfigStore from '../store/appConfigStore';
import { updateThemeColors, COLORS } from '../constants/theme';
import { APP_ID } from '../constants/config';

const AppInitScreen = ({ onInitComplete, onError }) => {
  const { loadAppConfig, config, isLoading, error } = useAppConfigStore();
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    initializeApp();
  }, [retryCount]);

  const initializeApp = async () => {
    try {
      console.log('AppInitScreen - Initializing app with ID:', APP_ID);
      const appConfig = await loadAppConfig();

      if (appConfig) {
        // Update theme colors
        if (appConfig.theme) {
          updateThemeColors(appConfig.theme);
        }

        console.log('AppInitScreen - App initialized successfully');
        onInitComplete?.(appConfig);
      }
    } catch (err) {
      console.error('AppInitScreen - Initialization error:', err);
      onError?.(err);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  // Show error state
  if (error && !config) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>!</Text>
          <Text style={styles.errorTitle}>Connection Error</Text>
          <Text style={styles.errorMessage}>
            {error}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Show loading state
  return (
    <View style={styles.container}>
      {config?.splashImageUrl ? (
        <Image
          source={{ uri: config.splashImageUrl }}
          style={styles.splashImage}
          resizeMode="contain"
        />
      ) : config?.logoUrl ? (
        <Image
          source={{ uri: config.logoUrl }}
          style={styles.logo}
          resizeMode="contain"
        />
      ) : (
        <View style={styles.logoPlaceholder}>
          <Text style={styles.logoText}>{config?.name?.charAt(0) || 'E'}</Text>
        </View>
      )}

      <Text style={styles.appName}>{config?.name || 'Loading...'}</Text>

      <ActivityIndicator
        size="large"
        color={config?.theme?.primaryColor || COLORS.primary}
        style={styles.loader}
      />

      <Text style={styles.loadingText}>
        {isLoading ? 'Loading configuration...' : 'Starting app...'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  splashImage: {
    width: '80%',
    height: 200,
    marginBottom: 30,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  logoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#6C5CE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 30,
    textAlign: 'center',
  },
  loader: {
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 14,
    color: '#636E72',
  },
  errorContainer: {
    alignItems: 'center',
    padding: 30,
  },
  errorIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#D63031',
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 60,
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 14,
    color: '#636E72',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#6C5CE7',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AppInitScreen;
