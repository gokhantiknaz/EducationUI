import { create } from 'zustand';
import courseService from '../services/courseService';

const useCourseStore = create((set, get) => ({
  // State
  courses: [],
  myCourses: [],
  currentCourse: null,
  categories: [],
  lessons: [],
  currentLesson: null,
  courseProgress: {},
  isLoading: false,
  error: null,

  // Actions
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),
  
  clearError: () => set({ error: null }),

  // Get all courses
  fetchCourses: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await courseService.getCourses(params);
      set({
        courses: response.data || response,
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

  // Get my courses
  fetchMyCourses: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await courseService.getMyCourses();
      set({
        myCourses: response.data || response,
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

  // Get course detail
  fetchCourseDetail: async (courseId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await courseService.getCourseDetail(courseId);
      set({
        currentCourse: response.data || response,
        isLoading: false,
      });
      return response;
    } catch (error) {
      set({
        error: error.message,
        isLoading: false,
        currentCourse: null,
      });
      throw error;
    }
  },

  // Get course lessons
  fetchCourseLessons: async (courseId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await courseService.getCourseLessons(courseId);
      set({
        lessons: response.data || response,
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

  // Get lesson detail
  fetchLessonDetail: async (lessonId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await courseService.getLessonDetail(lessonId);
      set({
        currentLesson: response.data || response,
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

  // Mark lesson complete
  markLessonComplete: async (lessonId) => {
    try {
      const response = await courseService.markLessonComplete(lessonId);
      return response;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // Get course progress
  fetchCourseProgress: async (courseId) => {
    try {
      const response = await courseService.getCourseProgress(courseId);
      set({
        courseProgress: {
          ...get().courseProgress,
          [courseId]: response.data || response,
        },
      });
      return response;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // Update progress
  updateProgress: async (progressData) => {
    try {
      const response = await courseService.updateProgress(progressData);
      return response;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // Get categories
  fetchCategories: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await courseService.getCategories();
      set({
        categories: response.data || response,
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

  // Get courses by category
  fetchCoursesByCategory: async (categoryId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await courseService.getCoursesByCategory(categoryId);
      set({
        courses: response.data || response,
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

  // Purchase course
  purchaseCourse: async (courseId, paymentData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await courseService.purchaseCourse(courseId, paymentData);
      
      // Satın alınan kursu myCourses'a ekle
      const { myCourses } = get();
      if (response.course) {
        set({
          myCourses: [...myCourses, response.course],
        });
      }
      
      set({ isLoading: false });
      return response;
    } catch (error) {
      set({
        error: error.message,
        isLoading: false,
      });
      throw error;
    }
  },

  // Clear current course
  clearCurrentCourse: () => set({ currentCourse: null, lessons: [] }),
  
  // Clear current lesson
  clearCurrentLesson: () => set({ currentLesson: null }),
}));

export default useCourseStore;
