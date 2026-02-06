import apiClient from './api';
import { API_ENDPOINTS } from '../constants/config';

class QuizService {
  // Kursa ait quiz'leri getir (Requires Auth)
  async getCourseQuizzes(courseId) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.COURSE_QUIZZES(courseId));
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Quiz'i başlat (Requires Auth)
  async startQuiz(quizId) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.START_QUIZ(quizId));
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Quiz cevaplarını gönder (Requires Auth)
  // attemptId: quiz attempt ID, answers: array of { questionId, selectedOptionId }
  async submitQuiz(attemptId, answers) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.SUBMIT_QUIZ(attemptId), { answers });
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Kullanıcının quiz denemelerini getir (Requires Auth)
  async getMyQuizAttempts(page = 1, pageSize = 10) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.MY_QUIZ_ATTEMPTS, {
        params: { page, pageSize }
      });
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

export default new QuizService();
