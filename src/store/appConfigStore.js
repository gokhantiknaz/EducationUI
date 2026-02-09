import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../services/api';
import { APP_ID, API_ENDPOINTS, STORAGE_KEYS } from '../constants/config';

const APP_CONFIG_KEY = '@app_config';

const useAppConfigStore = create((set, get) => ({
  // State
  config: null,
  isLoading: false,
  error: null,
  isInitialized: false,

  // Getters
  isSingleCourseApp: () => {
    const { config } = get();
    return config?.courses?.length === 1;
  },

  getDefaultCourseId: () => {
    const { config } = get();
    if (!config?.courses?.length) return null;

    // Find the default course
    const defaultCourse = config.courses.find(c => c.isDefault);
    if (defaultCourse) return defaultCourse.id;

    // If no default, return the first course
    return config.courses[0]?.id;
  },

  getCourses: () => {
    const { config } = get();
    return config?.courses || [];
  },

  getTheme: () => {
    const { config } = get();
    return config?.theme || null;
  },

  // Actions
  loadAppConfig: async () => {
    set({ isLoading: true, error: null });

    try {
      console.log('AppConfigStore - Loading config for APP_ID:', APP_ID);

      // Try to load from cache first
      const cachedConfig = await AsyncStorage.getItem(APP_CONFIG_KEY);
      if (cachedConfig) {
        const parsed = JSON.parse(cachedConfig);
        // Use cached config if it's for the same app
        if (parsed.appId === APP_ID) {
          console.log('AppConfigStore - Using cached config');
          set({ config: parsed, isLoading: false, isInitialized: true });
        }
      }

      // Fetch fresh config from API
      const response = await apiClient.get(API_ENDPOINTS.APP_CONFIG(APP_ID));

      if (response.data.success && response.data.data) {
        const appConfig = response.data.data;
        console.log('AppConfigStore - Loaded config:', appConfig.name);

        // Cache the config
        await AsyncStorage.setItem(APP_CONFIG_KEY, JSON.stringify(appConfig));

        set({
          config: appConfig,
          isLoading: false,
          error: null,
          isInitialized: true,
        });

        return appConfig;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('AppConfigStore - Load error:', error);

      // If we have cached config, use it despite the error
      const cachedConfig = await AsyncStorage.getItem(APP_CONFIG_KEY);
      if (cachedConfig) {
        const parsed = JSON.parse(cachedConfig);
        if (parsed.appId === APP_ID) {
          set({
            config: parsed,
            isLoading: false,
            error: 'Using cached config',
            isInitialized: true,
          });
          return parsed;
        }
      }

      set({
        error: error.response?.data?.message || error.message || 'Failed to load app configuration',
        isLoading: false,
        isInitialized: true,
      });

      throw error;
    }
  },

  clearConfig: async () => {
    await AsyncStorage.removeItem(APP_CONFIG_KEY);
    set({
      config: null,
      isLoading: false,
      error: null,
      isInitialized: false,
    });
  },

  // Check if app allows registration
  canRegister: () => {
    const { config } = get();
    return config?.allowRegistration ?? true;
  },

  // Check if enrollment is required
  requiresEnrollment: () => {
    const { config } = get();
    return config?.requireEnrollment ?? false;
  },
}));

export default useAppConfigStore;
