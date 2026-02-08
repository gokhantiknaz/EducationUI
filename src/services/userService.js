import apiClient from './api';
import { API_ENDPOINTS } from '../constants/config';

class UserService {
  // Kullanıcı profil bilgilerini getir
  async getProfile() {
    try {
      const response = await apiClient.get(API_ENDPOINTS.USER_PROFILE);
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Detaylı profil bilgilerini getir (istatistiklerle)
  async getFullProfile() {
    try {
      const response = await apiClient.get(API_ENDPOINTS.USER_FULL_PROFILE);
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Profil güncelle
  async updateProfile(profileData) {
    try {
      const response = await apiClient.put(API_ENDPOINTS.UPDATE_PROFILE, profileData);
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Avatar yükle
  async uploadAvatar(imageUri) {
    try {
      const formData = new FormData();

      // URI'den dosya bilgilerini çıkar
      const filename = imageUri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('file', {
        uri: imageUri,
        name: filename,
        type,
      });

      const response = await apiClient.post(API_ENDPOINTS.UPLOAD_AVATAR, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Şifre değiştir
  async changePassword(currentPassword, newPassword) {
    try {
      const response = await apiClient.put(API_ENDPOINTS.CHANGE_PASSWORD, {
        currentPassword,
        newPassword,
      });
      return response.data.success ? response.data : response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Meslek listesini getir
  async getProfessions() {
    try {
      const response = await apiClient.get(API_ENDPOINTS.PROFESSIONS);
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // İlgi alanları (hashtag) listesini getir
  async getInterestTags() {
    try {
      const response = await apiClient.get(API_ENDPOINTS.INTEREST_TAGS);
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Hata yönetimi
  handleError(error) {
    if (error.response) {
      return {
        message: error.response.data.message || 'Bir hata oluştu',
        status: error.response.status,
        data: error.response.data,
      };
    } else if (error.request) {
      return {
        message: 'Sunucuya bağlanılamadı',
        status: 0,
      };
    } else {
      return {
        message: error.message || 'Bilinmeyen bir hata oluştu',
        status: -1,
      };
    }
  }
}

export default new UserService();
