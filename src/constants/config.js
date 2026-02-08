// API Base URL - Backend sunucu adresinizi buraya yazın
// Yerel ağ IP adresi kullanarak Android emülatörden erişim
// export const API_BASE_URL = 'https://172.16.6.113:52564/api'; // Yerel IP adresi
// export const API_BASE_URL = 'http://10.0.2.2:52564/api';// Android emülatör için (alternatif)
//export const API_BASE_URL = 'http://localhost:52564/api'; // iOS Simulator için
export const API_BASE_URL='http://192.168.1.98:52563/api';
// export const API_BASE_URL = 'https://your-production-api.com/api'; // Production için

// API Endpoints - Backend'e uygun endpoint'ler
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  REFRESH_TOKEN: '/auth/refresh-token',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  VERIFY_EMAIL: '/auth/verify-email',

  // User
  USER_PROFILE: '/users/me',
  UPDATE_PROFILE: '/users/me',
  CHANGE_PASSWORD: '/users/me/password',
  UPLOAD_AVATAR: '/users/me/avatar',

  // Courses (Public)
  COURSES: '/courses',
  COURSE_DETAIL: (id) => `/courses/${id}`,
  COURSE_BY_SLUG: (slug) => `/courses/slug/${slug}`,
  COURSE_PREVIEW_VIDEO: (id) => `/courses/${id}/preview-video`,

  // Enrollments (User's Courses - Requires Auth)
  MY_COURSES: '/enrollments/my-courses',
  CONTINUE_LEARNING: '/enrollments/continue-learning',
  COMPLETED_COURSES: '/enrollments/completed',
  ENROLLMENT_STATUS: (courseId) => `/enrollments/course/${courseId}/status`,

  // Categories
  CATEGORIES: '/categories',
  CATEGORY_DETAIL: (id) => `/categories/${id}`,

  // Lessons (Requires Auth)
  LESSON_STREAM_URL: (lessonId) => `/lessons/${lessonId}/stream-url`,
  LESSON_PROGRESS: (lessonId) => `/lessons/${lessonId}/progress`,
  SAVE_LESSON_PROGRESS: (lessonId) => `/lessons/${lessonId}/progress`,
  COURSE_LESSONS_PROGRESS: (courseId) => `/lessons/course/${courseId}/progress`,

  // Orders (Requires Auth)
  CREATE_ORDER: '/orders/create',
  COMPLETE_ORDER: (orderId) => `/orders/${orderId}/complete`,
  MY_ORDERS: '/orders/my-orders',
  ORDER_DETAIL: (orderId) => `/orders/${orderId}`,

  // Quizzes (Requires Auth)
  COURSE_QUIZZES: (courseId) => `/quizzes/course/${courseId}`,
  START_QUIZ: (quizId) => `/quizzes/${quizId}/start`,
  SUBMIT_QUIZ: (attemptId) => `/quizzes/attempts/${attemptId}/submit`,
  MY_QUIZ_ATTEMPTS: '/quizzes/attempts/my-attempts',

  // Certificates (Requires Auth for generate/list, Public for verify)
  MY_CERTIFICATES: '/certificates/my-certificates',
  VERIFY_CERTIFICATE: (certificateNumber) => `/certificates/${certificateNumber}`,
  GENERATE_CERTIFICATE: (courseId) => `/certificates/generate/${courseId}`,

  // Reviews
  CREATE_REVIEW: '/reviews',
  COURSE_REVIEWS: (courseId) => `/reviews/course/${courseId}`,
  UPDATE_REVIEW: (reviewId) => `/reviews/${reviewId}`,
  DELETE_REVIEW: (reviewId) => `/reviews/${reviewId}`,

  // Notifications (Requires Auth)
  NOTIFICATIONS: '/notifications',
  MARK_NOTIFICATION_READ: (notificationId) => `/notifications/${notificationId}/read`,
  MARK_ALL_NOTIFICATIONS_READ: '/notifications/read-all',
};

// Request timeout
export const REQUEST_TIMEOUT = 30000; // 30 seconds

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: '@auth_token',
  REFRESH_TOKEN: '@refresh_token',
  USER_DATA: '@user_data',
  THEME: '@theme',
  LANGUAGE: '@language',
};
