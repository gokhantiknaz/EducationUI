import apiClient from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS, STORAGE_KEYS } from '../constants/config';
import axios from "axios";

class AuthService {
  // User registration
  async register(userData) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.REGISTER, userData);

      // Backend response format: { success: true, data: { accessToken, refreshToken, user } }
      if (response.data.success && response.data.data) {
        const { accessToken, refreshToken, user } = response.data.data;
        await this.saveAuthData({ token: accessToken, refreshToken, user });
        return response.data.data;
      }

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Social login (Google, LinkedIn)
  async socialLogin(provider, userData) {
    try {
      const payload = {
        provider,
        idToken: userData.idToken || '',
        accessToken: userData.accessToken || '',
        email: userData.email,
        firstName: userData.firstName || userData.givenName,
        lastName: userData.lastName || userData.familyName,
        profileImageUrl: userData.picture || userData.profileImageUrl,
        externalUserId: userData.id || userData.sub,
      };

      const response = await apiClient.post(API_ENDPOINTS.SOCIAL_LOGIN, payload);

      if (response.data.success && response.data.data) {
        const { accessToken, refreshToken, user } = response.data.data;
        await this.saveAuthData({ token: accessToken, refreshToken, user });
        return response.data.data;
      }

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // User login
  async login(email, password) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.LOGIN, {
        email,
        password,
      });

      console.log('Login response:', response.data);

      // Backend response format: { success: true, data: { accessToken, refreshToken, user } }
      if (response.data.success && response.data.data) {
        const { accessToken, refreshToken, user } = response.data.data;
        await this.saveAuthData({ token: accessToken, refreshToken, user });
        return response.data.data;
      }

      return response.data;
    } catch (error) {
      console.log("Login error:", error);
      throw this.handleError(error);
    }
  }

  // User logout
  async logout() {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.AUTH_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER_DATA,
      ]);
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  // Forgot password request
  async forgotPassword(email) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.FORGOT_PASSWORD, {
        email,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Reset password
  async resetPassword(token, newPassword) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.RESET_PASSWORD, {
        token,
        password: newPassword,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get user profile
  async getUserProfile() {
    try {
      const response = await apiClient.get(API_ENDPOINTS.USER_PROFILE);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Token check
  async isAuthenticated() {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      return !!token;
    } catch (error) {
      return false;
    }
  }

  // Save auth data
  async saveAuthData(data) {
    try {
      const { token, refreshToken, user } = data;

      await AsyncStorage.multiSet([
        [STORAGE_KEYS.AUTH_TOKEN, token],
        [STORAGE_KEYS.REFRESH_TOKEN, refreshToken || ''],
        [STORAGE_KEYS.USER_DATA, JSON.stringify(user)],
      ]);
    } catch (error) {
      console.error('Auth data save error:', error);
      throw error;
    }
  }

  // Get stored user data
  async getStoredUserData() {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Get user data error:', error);
      return null;
    }
  }

  // Error handling
  handleError(error) {
    if (error.response) {
      // Server error
      return {
        message: error.response.data.message || 'An error occurred',
        status: error.response.status,
        data: error.response.data,
      };
    } else if (error.request) {
      // Request sent but no response
      return {
        message: 'Could not connect to server',
        status: 0,
      };
    } else {
      // Error creating request
      return {
        message: error.message || 'An unknown error occurred',
        status: -1,
      };
    }
  }
}

export default new AuthService();
