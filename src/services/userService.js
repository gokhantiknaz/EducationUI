import apiClient from './api';
import { API_ENDPOINTS } from '../constants/config';

class UserService {
  // Get user profile
  async getProfile() {
    try {
      const response = await apiClient.get(API_ENDPOINTS.USER_PROFILE);
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get detailed profile (with statistics)
  async getFullProfile() {
    try {
      const response = await apiClient.get(API_ENDPOINTS.USER_FULL_PROFILE);
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Update profile
  async updateProfile(profileData) {
    try {
      const response = await apiClient.put(API_ENDPOINTS.UPDATE_PROFILE, profileData);
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Upload avatar
  async uploadAvatar(imageUri) {
    try {
      const formData = new FormData();

      // Extract file info from URI
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

  // Change password
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

  // Get professions list
  async getProfessions() {
    try {
      const response = await apiClient.get(API_ENDPOINTS.PROFESSIONS);
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get interest tags list
  async getInterestTags() {
    try {
      const response = await apiClient.get(API_ENDPOINTS.INTEREST_TAGS);
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Error handling
  handleError(error) {
    if (error.response) {
      return {
        message: error.response.data.message || 'An error occurred',
        status: error.response.status,
        data: error.response.data,
      };
    } else if (error.request) {
      return {
        message: 'Could not connect to server',
        status: 0,
      };
    } else {
      return {
        message: error.message || 'An unknown error occurred',
        status: -1,
      };
    }
  }
}

export default new UserService();
