import apiClient from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS, STORAGE_KEYS } from '../constants/config';
import axios from "axios";

class AuthService {
  // Kullanıcı kaydı
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

  // Kullanıcı girişi
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

  // Kullanıcı çıkışı
  async logout() {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.AUTH_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER_DATA,
      ]);
      return true;
    } catch (error) {
      console.error('Logout hatası:', error);
      throw error;
    }
  }

  // Şifre sıfırlama isteği
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

  // Şifre sıfırlama
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

  // Kullanıcı bilgilerini al
  async getUserProfile() {
    try {
      const response = await apiClient.get(API_ENDPOINTS.USER_PROFILE);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Token kontrolü
  async isAuthenticated() {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      return !!token;
    } catch (error) {
      return false;
    }
  }

  // Auth verilerini kaydet
  async saveAuthData(data) {
    try {
      const { token, refreshToken, user } = data;
      
      await AsyncStorage.multiSet([
        [STORAGE_KEYS.AUTH_TOKEN, token],
        [STORAGE_KEYS.REFRESH_TOKEN, refreshToken || ''],
        [STORAGE_KEYS.USER_DATA, JSON.stringify(user)],
      ]);
    } catch (error) {
      console.error('Auth data kaydetme hatası:', error);
      throw error;
    }
  }

  // Kayıtlı kullanıcı verisini al
  async getStoredUserData() {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('User data alma hatası:', error);
      return null;
    }
  }

  // Hata yönetimi
  handleError(error) {
    if (error.response) {
      // Sunucudan gelen hata
      return {
        message: error.response.data.message || 'Bir hata oluştu',
        status: error.response.status,
        data: error.response.data,
      };
    } else if (error.request) {
      // İstek gönderildi ama cevap gelmedi
      return {
        message: 'Sunucuya bağlanılamadı',
        status: 0,
      };
    } else {
      // İstek oluşturulurken hata
      return {
        message: error.message || 'Bilinmeyen bir hata oluştu',
        status: -1,
      };
    }
  }
}

export default new AuthService();
