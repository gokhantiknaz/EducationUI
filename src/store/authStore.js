import { create } from 'zustand';
import authService from '../services/authService';

const useAuthStore = create((set, get) => ({
  // State
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // Actions
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),

  // Login
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.login(email, password);
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return response;
    } catch (error) {
      set({
        error: error.message,
        isLoading: false,
        isAuthenticated: false,
      });
      throw error;
    }
  },

  // Register
  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.register(userData);
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return response;
    } catch (error) {
      set({
        error: error.message,
        isLoading: false,
        isAuthenticated: false,
      });
      throw error;
    }
  },

  // Logout
  logout: async () => {
    console.log('authStore - logout başladı');
    set({ isLoading: true });
    try {
      await authService.logout();
      console.log('authService.logout başarılı');
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
      console.log('authStore - state güncellendi, isAuthenticated: false');
    } catch (error) {
      console.error('authStore - logout hatası:', error);
      set({
        error: error.message,
        isLoading: false,
      });
    }
  },

  // Load user from storage
  loadUser: async () => {
    set({ isLoading: true });
    try {
      const isAuth = await authService.isAuthenticated();
      if (isAuth) {
        const userData = await authService.getStoredUserData();
        set({
          user: userData,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: error.message,
      });
    }
  },

  // Update profile
  updateProfile: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.getUserProfile();
      set({
        user: response,
        isLoading: false,
      });
      return response;
    } catch (error) {
      set({
        error: error.message,
        isLoading: false,
      });
      throw error;
    }
  },

  // Clear error
  clearError: () => set({ error: null }),
}));

export default useAuthStore;
