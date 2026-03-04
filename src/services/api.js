import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';
import { API_BASE_URL, REQUEST_TIMEOUT, STORAGE_KEYS } from '../constants/config';

// Auth event constants
export const AUTH_EVENTS = {
  LOGOUT_REQUIRED: 'AUTH_LOGOUT_REQUIRED',
};

// Axios instance oluştur
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Her istekte token ekle
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      console.log('API Request:', {
        method: config.method,
        url: config.url,
        baseURL: config.baseURL,
        fullURL: `${config.baseURL}${config.url}`,
        hasToken: !!token,
      });
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Token alınamadı:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Token yenileme ve hata yönetimi
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Token süresi dolmuşsa yenile
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

        if (refreshToken) {
          // Backend endpoint: /auth/refresh-token, Request: { refreshToken }
          // Response: { success: true, data: { accessToken, refreshToken } }
          const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
            refreshToken,
          });

          if (response.data.success && response.data.data) {
            const { accessToken, refreshToken: newRefreshToken } = response.data.data;

            await AsyncStorage.multiSet([
              [STORAGE_KEYS.AUTH_TOKEN, accessToken],
              [STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken],
            ]);

            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return apiClient(originalRequest);
          }
        }
      } catch (refreshError) {
        console.log('Token refresh failed, triggering logout');
        // Refresh token da geçersizse logout yap
        await AsyncStorage.multiRemove([
          STORAGE_KEYS.AUTH_TOKEN,
          STORAGE_KEYS.REFRESH_TOKEN,
          STORAGE_KEYS.USER_DATA,
        ]);

        // Emit logout event - app will navigate to login
        DeviceEventEmitter.emit(AUTH_EVENTS.LOGOUT_REQUIRED);

        return Promise.reject(refreshError);
      }
    }

    // 401 hatası ve refresh token yoksa da logout event'i gönder
    if (error.response?.status === 401) {
      const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      if (!refreshToken) {
        console.log('No refresh token available, triggering logout');
        await AsyncStorage.multiRemove([
          STORAGE_KEYS.AUTH_TOKEN,
          STORAGE_KEYS.REFRESH_TOKEN,
          STORAGE_KEYS.USER_DATA,
        ]);
        DeviceEventEmitter.emit(AUTH_EVENTS.LOGOUT_REQUIRED);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
