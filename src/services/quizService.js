import apiClient from './api';
import { API_ENDPOINTS } from '../constants/config';

class QuizService {
  // Get quizzes for a course (Requires Auth)
  async getCourseQuizzes(courseId) {
    try {
      const response = await apiClient.get(API_ENDPOINTS.COURSE_QUIZZES(courseId));
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Start quiz (Requires Auth)
  async startQuiz(quizId) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.START_QUIZ(quizId));
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Submit quiz answers (Requires Auth)
  // attemptId: quiz attempt ID, answers: array of { questionId, selectedOptionId }
  async submitQuiz(attemptId, answers) {
    try {
      const response = await apiClient.post(API_ENDPOINTS.SUBMIT_QUIZ(attemptId), { answers });
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Abandon quiz attempt (Requires Auth)
  async abandonQuiz(attemptId) {
    try {
      const response = await apiClient.delete(API_ENDPOINTS.ABANDON_QUIZ(attemptId));
      return response.data.success ? response.data.data : response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Get user's quiz attempts (Requires Auth)
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

export default new QuizService();
