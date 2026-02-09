import { create } from 'zustand';
import quizService from '../services/quizService';

const useQuizStore = create((set, get) => ({
  // State
  quizzes: [],
  currentQuiz: null,
  currentAttempt: null,
  quizResult: null,
  myAttempts: [],
  answers: {}, // { questionId: answer }
  currentQuestionIndex: 0,
  isLoading: false,
  isSubmitting: false,
  error: null,
  timeRemaining: null, // seconds

  // Actions
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  // Fetch quizzes for a course
  fetchCourseQuizzes: async (courseId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await quizService.getCourseQuizzes(courseId);
      set({
        quizzes: Array.isArray(response) ? response : (response.items || []),
        isLoading: false,
      });
      return response;
    } catch (error) {
      set({
        error: error.message || 'Quiz listesi yüklenemedi',
        isLoading: false,
      });
      throw error;
    }
  },

  // Start a quiz
  startQuiz: async (quizId) => {
    set({ isLoading: true, error: null, answers: {}, currentQuestionIndex: 0 });
    try {
      const response = await quizService.startQuiz(quizId);

      // Response: { attemptId, quiz: { ... questions }, startedAt }
      const quiz = response.quiz || response;
      const attemptId = response.attemptId;

      // Sort questions by displayOrder
      if (quiz.questions) {
        quiz.questions.sort((a, b) => a.displayOrder - b.displayOrder);
        // Sort options for each question
        quiz.questions.forEach(q => {
          if (q.options) {
            q.options.sort((a, b) => a.displayOrder - b.displayOrder);
          }
        });
      }

      set({
        currentQuiz: quiz,
        currentAttempt: {
          id: attemptId,
          startedAt: response.startedAt || new Date().toISOString(),
        },
        timeRemaining: quiz.timeLimit ? quiz.timeLimit * 60 : null, // Convert minutes to seconds
        isLoading: false,
      });

      return response;
    } catch (error) {
      set({
        error: error.message || 'Quiz başlatılamadı',
        isLoading: false,
      });
      throw error;
    }
  },

  // Set answer for a question
  setAnswer: (questionId, answer) => {
    const { answers } = get();
    set({
      answers: {
        ...answers,
        [questionId]: answer,
      },
    });
  },

  // Set answer for SingleChoice/MultipleChoice
  setOptionAnswer: (questionId, optionId, questionType) => {
    const { answers } = get();

    if (questionType === 'MultipleChoice') {
      // Multiple selection - toggle option
      const currentAnswers = answers[questionId] || [];
      const newAnswers = currentAnswers.includes(optionId)
        ? currentAnswers.filter(id => id !== optionId)
        : [...currentAnswers, optionId];

      set({
        answers: {
          ...answers,
          [questionId]: newAnswers,
        },
      });
    } else {
      // Single selection
      set({
        answers: {
          ...answers,
          [questionId]: optionId,
        },
      });
    }
  },

  // Set answer for FillInBlank
  setTextAnswer: (questionId, text) => {
    const { answers } = get();
    set({
      answers: {
        ...answers,
        [questionId]: text,
      },
    });
  },

  // Navigate questions
  nextQuestion: () => {
    const { currentQuestionIndex, currentQuiz } = get();
    if (currentQuiz && currentQuestionIndex < currentQuiz.questions.length - 1) {
      set({ currentQuestionIndex: currentQuestionIndex + 1 });
    }
  },

  prevQuestion: () => {
    const { currentQuestionIndex } = get();
    if (currentQuestionIndex > 0) {
      set({ currentQuestionIndex: currentQuestionIndex - 1 });
    }
  },

  goToQuestion: (index) => {
    const { currentQuiz } = get();
    if (currentQuiz && index >= 0 && index < currentQuiz.questions.length) {
      set({ currentQuestionIndex: index });
    }
  },

  // Update time remaining
  decrementTime: () => {
    const { timeRemaining } = get();
    if (timeRemaining !== null && timeRemaining > 0) {
      set({ timeRemaining: timeRemaining - 1 });
    }
  },

  // Submit quiz
  submitQuiz: async () => {
    const { currentAttempt, answers, currentQuiz } = get();

    if (!currentAttempt) {
      throw new Error('Quiz denemesi bulunamadı');
    }

    set({ isSubmitting: true, error: null });

    try {
      // Format answers for API
      // API expects: [{ questionId, selectedOptionId }] for choice questions
      // or [{ questionId, textAnswer }] for FillInBlank
      const formattedAnswers = [];

      for (const [questionId, answer] of Object.entries(answers)) {
        const question = currentQuiz.questions.find(q => q.id === questionId);

        if (question?.questionType === 'FillInBlank') {
          formattedAnswers.push({
            questionId,
            textAnswer: answer,
          });
        } else if (question?.questionType === 'MultipleChoice') {
          // Multiple choice - send array of option IDs
          const optionIds = Array.isArray(answer) ? answer : [answer];
          optionIds.forEach(optionId => {
            formattedAnswers.push({
              questionId,
              selectedOptionId: optionId,
            });
          });
        } else {
          // Single choice
          formattedAnswers.push({
            questionId,
            selectedOptionId: answer,
          });
        }
      }

      const response = await quizService.submitQuiz(currentAttempt.id, formattedAnswers);

      set({
        quizResult: response,
        isSubmitting: false,
      });

      return response;
    } catch (error) {
      set({
        error: error.message || 'Quiz gönderilemedi',
        isSubmitting: false,
      });
      throw error;
    }
  },

  // Fetch user's quiz attempts
  fetchMyAttempts: async (page = 1, pageSize = 10) => {
    set({ isLoading: true, error: null });
    try {
      const response = await quizService.getMyQuizAttempts(page, pageSize);
      set({
        myAttempts: Array.isArray(response) ? response : (response.items || []),
        isLoading: false,
      });
      return response;
    } catch (error) {
      set({
        error: error.message || 'Deneme geçmişi yüklenemedi',
        isLoading: false,
      });
      throw error;
    }
  },

  // Get answered count
  getAnsweredCount: () => {
    const { answers, currentQuiz } = get();
    if (!currentQuiz) return 0;
    return Object.keys(answers).filter(qId => {
      const answer = answers[qId];
      if (Array.isArray(answer)) return answer.length > 0;
      return answer !== undefined && answer !== '';
    }).length;
  },

  // Check if question is answered
  isQuestionAnswered: (questionId) => {
    const { answers } = get();
    const answer = answers[questionId];
    if (Array.isArray(answer)) return answer.length > 0;
    return answer !== undefined && answer !== '';
  },

  // Reset quiz state
  resetQuiz: () => set({
    currentQuiz: null,
    currentAttempt: null,
    quizResult: null,
    answers: {},
    currentQuestionIndex: 0,
    timeRemaining: null,
  }),

  // Clear all
  clearAll: () => set({
    quizzes: [],
    currentQuiz: null,
    currentAttempt: null,
    quizResult: null,
    myAttempts: [],
    answers: {},
    currentQuestionIndex: 0,
    timeRemaining: null,
    isLoading: false,
    isSubmitting: false,
    error: null,
  }),
}));

export default useQuizStore;
