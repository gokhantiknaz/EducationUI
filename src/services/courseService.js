import apiClient from './api';
import { API_ENDPOINTS, APP_ID } from '../constants/config';

class CourseService {
  // Get all courses (Public) - Filtered by APP_ID
  async getCourses(params = {}) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.COURSES, {
        params: { ...params, appId: APP_ID }
      });
      // Backend response: { success: true, data: { items: [...], pagination: {...} } }
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get course detail (Public)
  async getCourseDetail(courseId) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.COURSE_DETAIL(courseId));
      // Backend response: { success: true, data: courseDetailDto }
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get user's enrolled courses (Requires Auth) - Filtered by APP_ID
  // Backend endpoint: GET /api/enrollments/my-courses
  async getMyCourses() {
    try {
      const response = await apiClient.get(API_ENDPOINTS.MY_COURSES, {
        params: { appId: APP_ID }
      });
      console.log('getMyCourses response:', response.data);
      // Backend response: { success: true, data: [enrollmentDto, ...] }
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get courses to continue learning (Requires Auth) - Filtered by APP_ID
  async getContinueLearning() {
    try {
      const response = await apiClient.get(API_ENDPOINTS.CONTINUE_LEARNING, {
        params: { appId: APP_ID }
      });
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get completed courses (Requires Auth) - Filtered by APP_ID
  async getCompletedCourses() {
    try {
      const response = await apiClient.get(API_ENDPOINTS.COMPLETED_COURSES, {
        params: { appId: APP_ID }
      });
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Check course enrollment status (Requires Auth)
  async getEnrollmentStatus(courseId) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.ENROLLMENT_STATUS(courseId));
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Enroll in a course (Requires Auth)
  async enrollInCourse(courseId) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.ENROLL_COURSE(courseId));
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Unenroll from a course (Requires Auth)
  async unenrollFromCourse(courseId) {
    try {
      const response = await apiClient.delete(API_ENDPOINTS.UNENROLL_COURSE(courseId));
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get course preview video (Public)
  async getCoursePreviewVideo(courseId) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.COURSE_PREVIEW_VIDEO(courseId));
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get lesson video stream URL (Requires Auth)
  async getLessonStreamUrl(lessonId) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.LESSON_STREAM_URL(lessonId));
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get lesson document URL (Requires Auth) - Returns pre-signed URL for S3
  async getLessonDocumentUrl(lessonId) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.LESSON_DOCUMENT_URL(lessonId));
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ===================== Lesson Favorites =====================

  // Get user's favorite lessons (Requires Auth)
  async getFavoriteLessons() {
    try {
      const response = await apiClient.get(API_ENDPOINTS.FAVORITE_LESSONS);
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Add lesson to favorites (Requires Auth)
  async addLessonToFavorites(lessonId) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.ADD_LESSON_FAVORITE(lessonId));
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Remove lesson from favorites (Requires Auth)
  async removeLessonFromFavorites(lessonId) {
    try {
      const response = await apiClient.delete(API_ENDPOINTS.REMOVE_LESSON_FAVORITE(lessonId));
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get favorite status for a single lesson (Requires Auth)
  async getLessonFavoriteStatus(lessonId) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.LESSON_FAVORITE_STATUS(lessonId));
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get favorite statuses for multiple lessons (Requires Auth)
  async getLessonFavoriteStatuses(lessonIds) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.LESSON_FAVORITE_STATUSES, lessonIds);
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get lesson progress (Requires Auth)
  async getLessonProgress(lessonId) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.LESSON_PROGRESS(lessonId));
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get all lesson progress for a course (Requires Auth)
  async getCourseLessonsProgress(courseId) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.COURSE_LESSONS_PROGRESS(courseId));
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Save lesson progress (Requires Auth)
  // data: { watchedSeconds, lastPosition, isCompleted }
  async saveLessonProgress(lessonId, progressData) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.SAVE_LESSON_PROGRESS(lessonId), progressData);
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Mark lesson as complete (Requires Auth)
  async markLessonComplete(lessonId) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.SAVE_LESSON_PROGRESS(lessonId), {
        isCompleted: true,
      });
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get categories (Public)
  async getCategories(isActive = true) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.CATEGORIES, {
        params: { isActive }
      });
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get category detail (Public)
  async getCategoryDetail(categoryId) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.CATEGORY_DETAIL(categoryId));
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Create order (Requires Auth)
  // courseIds: array of course IDs, paymentMethod: string
  async createOrder(courseIds, paymentMethod = 'CreditCard') {
    try {
      const response = await apiClient.post(API_ENDPOINTS.CREATE_ORDER, {
        courseIds,
        paymentMethod,
      });
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Complete order (Requires Auth)
  async completeOrder(orderId, paymentData) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.COMPLETE_ORDER(orderId), paymentData);
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get user's orders (Requires Auth)
  async getMyOrders(page = 1, pageSize = 10) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.MY_ORDERS, {
        params: { page, pageSize }
      });
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get order detail (Requires Auth)
  async getOrderDetail(orderId) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.ORDER_DETAIL(orderId));
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Validate promo code (Requires Auth)
  // Returns: { isValid, errorMessage, promoCodeId, code, discountType, discountValue, discountAmount, finalPrice }
  async validatePromoCode(code, courseId, orderAmount) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.VALIDATE_PROMO_CODE, {
        code,
        courseId,
        orderAmount,
      });
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Apply promo code to order (Requires Auth)
  async applyPromoCode(promoCodeId, orderId, discountAmount) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.APPLY_PROMO_CODE, {
        promoCodeId,
        orderId,
        discountAmount,
      });
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

export default new CourseService();
