import apiClient from './api';
import { API_ENDPOINTS } from '../constants/config';

class CourseService {
  // Tüm kursları getir (Public)
  async getCourses(params = {}) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.COURSES, { params });
      // Backend response: { success: true, data: { items: [...], pagination: {...} } }
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Kurs detayını getir (Public)
  async getCourseDetail(courseId) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.COURSE_DETAIL(courseId));
      // Backend response: { success: true, data: courseDetailDto }
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Kullanıcının kayıtlı olduğu kursları getir (Requires Auth)
  // Backend endpoint: GET /api/enrollments/my-courses
  async getMyCourses() {
    try {
      const response = await apiClient.get(API_ENDPOINTS.MY_COURSES);
      console.log('getMyCourses response:', response.data);
      // Backend response: { success: true, data: [enrollmentDto, ...] }
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Öğrenmeye devam edilecek kursları getir (Requires Auth)
  async getContinueLearning() {
    try {
      const response = await apiClient.get(API_ENDPOINTS.CONTINUE_LEARNING);
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Tamamlanmış kursları getir (Requires Auth)
  async getCompletedCourses() {
    try {
      const response = await apiClient.get(API_ENDPOINTS.COMPLETED_COURSES);
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Kurs kayıt durumunu kontrol et (Requires Auth)
  async getEnrollmentStatus(courseId) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.ENROLLMENT_STATUS(courseId));
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Kurs önizleme videosunu getir (Public)
  async getCoursePreviewVideo(courseId) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.COURSE_PREVIEW_VIDEO(courseId));
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Ders video stream URL'ini getir (Requires Auth)
  async getLessonStreamUrl(lessonId) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.LESSON_STREAM_URL(lessonId));
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Ders ilerlemesini getir (Requires Auth)
  async getLessonProgress(lessonId) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.LESSON_PROGRESS(lessonId));
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Ders ilerlemesini kaydet (Requires Auth)
  // data: { watchedSeconds, lastPosition, isCompleted }
  async saveLessonProgress(lessonId, progressData) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.SAVE_LESSON_PROGRESS(lessonId), progressData);
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Kategorileri getir (Public)
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

  // Kategori detayını getir (Public)
  async getCategoryDetail(categoryId) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.CATEGORY_DETAIL(categoryId));
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Sipariş oluştur (Requires Auth)
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

  // Siparişi tamamla (Requires Auth)
  async completeOrder(orderId, paymentData) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.COMPLETE_ORDER(orderId), paymentData);
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Kullanıcının siparişlerini getir (Requires Auth)
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

  // Sipariş detayını getir (Requires Auth)
  async getOrderDetail(orderId) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.ORDER_DETAIL(orderId));
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

export default new CourseService();
