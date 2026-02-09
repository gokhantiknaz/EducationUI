// Multi-tenant App ID - Her build için farklı APP_ID kullanılır
export const APP_ID = process.env.EXPO_PUBLIC_APP_ID || 'com.education.default';

// API Base URL - Backend sunucu adresinizi buraya yazın
// Yerel ağ IP adresi kullanarak Android emülatörden erişim
// export const API_BASE_URL = 'https://172.16.6.113:52564/api'; // Yerel IP adresi
// export const API_BASE_URL = 'http://10.0.2.2:52564/api';// Android emülatör için (alternatif)
//export const API_BASE_URL = 'http://localhost:52564/api'; // iOS Simulator için
export const API_BASE_URL='http://192.168.1.98:52563/api';
// export const API_BASE_URL = 'https://your-production-api.com/api'; // Production için

// API Endpoints - Mobile App (UI) endpoints
export const API_ENDPOINTS = {
  // App Config (Multi-tenant)
  APP_CONFIG: (appId) => `/ui/applications/config/${appId}`,

  // Auth
  LOGIN: '/ui/auth/login',
  REGISTER: '/ui/auth/register',
  REFRESH_TOKEN: '/ui/auth/refresh-token',
  FORGOT_PASSWORD: '/ui/auth/forgot-password',
  RESET_PASSWORD: '/ui/auth/reset-password',
  VERIFY_EMAIL: '/ui/auth/verify-email',

  // User
  USER_PROFILE: '/ui/users/me',
  USER_FULL_PROFILE: '/ui/users/me/profile',
  UPDATE_PROFILE: '/ui/users/me',
  CHANGE_PASSWORD: '/ui/users/me/password',
  UPLOAD_AVATAR: '/ui/users/me/avatar',
  PROFESSIONS: '/ui/users/professions',
  INTEREST_TAGS: '/ui/users/interests',

  // Courses (Public)
  COURSES: '/ui/courses',
  COURSE_DETAIL: (id) => `/ui/courses/${id}`,
  COURSE_BY_SLUG: (slug) => `/ui/courses/slug/${slug}`,
  COURSE_PREVIEW_VIDEO: (id) => `/ui/courses/${id}/preview-video`,

  // Enrollments (User's Courses - Requires Auth)
  MY_COURSES: '/ui/enrollments/my-courses',
  CONTINUE_LEARNING: '/ui/enrollments/continue-learning',
  COMPLETED_COURSES: '/ui/enrollments/completed',
  ENROLLMENT_STATUS: (courseId) => `/ui/enrollments/course/${courseId}/status`,

  // Categories
  CATEGORIES: '/ui/categories',
  CATEGORY_DETAIL: (id) => `/ui/categories/${id}`,

  // Lessons (Requires Auth)
  LESSON_STREAM_URL: (lessonId) => `/ui/lessons/${lessonId}/stream-url`,
  LESSON_PROGRESS: (lessonId) => `/ui/lessons/${lessonId}/progress`,
  SAVE_LESSON_PROGRESS: (lessonId) => `/ui/lessons/${lessonId}/progress`,
  COURSE_LESSONS_PROGRESS: (courseId) => `/ui/lessons/course/${courseId}/progress`,

  // Orders (Requires Auth)
  CREATE_ORDER: '/ui/orders/create',
  COMPLETE_ORDER: (orderId) => `/ui/orders/${orderId}/complete`,
  MY_ORDERS: '/ui/orders/my-orders',
  ORDER_DETAIL: (orderId) => `/ui/orders/${orderId}`,

  // Quizzes (Requires Auth)
  COURSE_QUIZZES: (courseId) => `/ui/quizzes/course/${courseId}`,
  START_QUIZ: (quizId) => `/ui/quizzes/${quizId}/start`,
  SUBMIT_QUIZ: (attemptId) => `/ui/quizzes/attempts/${attemptId}/submit`,
  MY_QUIZ_ATTEMPTS: '/ui/quizzes/attempts/my-attempts',

  // Certificates (Requires Auth for generate/list, Public for verify)
  MY_CERTIFICATES: '/ui/certificates/my-certificates',
  VERIFY_CERTIFICATE: (certificateNumber) => `/ui/certificates/${certificateNumber}`,
  GENERATE_CERTIFICATE: (courseId) => `/ui/certificates/generate/${courseId}`,

  // Reviews
  CREATE_REVIEW: '/ui/reviews',
  COURSE_REVIEWS: (courseId) => `/ui/reviews/course/${courseId}`,
  UPDATE_REVIEW: (reviewId) => `/ui/reviews/${reviewId}`,
  DELETE_REVIEW: (reviewId) => `/ui/reviews/${reviewId}`,

  // Notifications (Requires Auth)
  NOTIFICATIONS: '/ui/notifications',
  MARK_NOTIFICATION_READ: (notificationId) => `/ui/notifications/${notificationId}/read`,
  MARK_ALL_NOTIFICATIONS_READ: '/ui/notifications/read-all',
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
