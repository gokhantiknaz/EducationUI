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
  isResumed: false, // true if continuing an existing attempt

  // Code Challenge State
  codeSubmissions: {}, // { questionId: submissionData }
  codeLanguages: {}, // { questionId: selectedLanguage }
  codeSources: {}, // { questionId: sourceCode }
  isSubmittingCode: false,
  codeSubmissionPolling: {}, // { submissionId: intervalId }

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
        error: error.message || 'Could not load quiz list',
        isLoading: false,
      });
      throw error;
    }
  },

  // Start a quiz
  startQuiz: async (quizId) => {
    set({ isLoading: true, error: null, answers: {}, currentQuestionIndex: 0, isResumed: false });
    try {
      const response = await quizService.startQuiz(quizId);

      // Response: { attemptId, quiz: { ... questions }, startedAt, isResumed }
      const quiz = response.quiz || response;
      const attemptId = response.attemptId;
      const isResumed = response.isResumed || false;

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

      // Calculate remaining time if resuming
      let timeRemaining = null;
      if (quiz.timeLimit) {
        const startTime = new Date(response.startedAt).getTime();
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - startTime) / 1000);
        const totalSeconds = quiz.timeLimit * 60;
        timeRemaining = Math.max(0, totalSeconds - elapsedSeconds);
      }

      set({
        currentQuiz: quiz,
        currentAttempt: {
          id: attemptId,
          startedAt: response.startedAt || new Date().toISOString(),
        },
        timeRemaining: timeRemaining,
        isResumed: isResumed,
        isLoading: false,
      });

      return response;
    } catch (error) {
      set({
        error: error.message || 'Could not start quiz',
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
      throw new Error('Quiz attempt not found');
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
          // Check if answer is an option ID (GUID format) or text
          const hasOptions = question.options && question.options.length > 0;
          const isOptionId = hasOptions && question.options.some(o => o.id === answer);

          if (isOptionId) {
            // Drag-drop mode - send as selectedOptionId
            formattedAnswers.push({
              questionId,
              selectedOptionId: answer,
            });
          } else {
            // Text input mode - send as textAnswer
            formattedAnswers.push({
              questionId,
              textAnswer: answer,
            });
          }
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
        error: error.message || 'Could not submit quiz',
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
        error: error.message || 'Could not load attempt history',
        isLoading: false,
      });
      throw error;
    }
  },

  // Get answered count
  getAnsweredCount: () => {
    const { answers, currentQuiz, codeSubmissions } = get();
    if (!currentQuiz) return 0;

    let count = 0;
    currentQuiz.questions.forEach(q => {
      if (q.questionType === 'CodeChallenge') {
        // For CodeChallenge, check if there's a submission
        const submission = codeSubmissions[q.id];
        if (submission && (submission.status === 'Accepted' || submission.testCasesPassed > 0)) {
          count++;
        }
      } else {
        const answer = answers[q.id];
        if (Array.isArray(answer)) {
          if (answer.length > 0) count++;
        } else if (answer !== undefined && answer !== '') {
          count++;
        }
      }
    });
    return count;
  },

  // Check if question is answered
  isQuestionAnswered: (questionId) => {
    const { answers, codeSubmissions, currentQuiz } = get();

    // Check if it's a CodeChallenge question
    const question = currentQuiz?.questions?.find(q => q.id === questionId);
    if (question?.questionType === 'CodeChallenge') {
      const submission = codeSubmissions[questionId];
      return submission && (submission.status === 'Accepted' || submission.testCasesPassed > 0);
    }

    const answer = answers[questionId];
    if (Array.isArray(answer)) return answer.length > 0;
    return answer !== undefined && answer !== '';
  },

  // Abandon quiz attempt
  abandonQuiz: async () => {
    const { currentAttempt, codeSubmissionPolling } = get();
    if (!currentAttempt) return;

    // Clear all polling intervals
    Object.values(codeSubmissionPolling).forEach(intervalId => {
      if (intervalId) clearInterval(intervalId);
    });

    try {
      await quizService.abandonQuiz(currentAttempt.id);
    } catch (error) {
      console.log('Abandon error:', error);
    }

    set({
      currentQuiz: null,
      currentAttempt: null,
      quizResult: null,
      answers: {},
      currentQuestionIndex: 0,
      timeRemaining: null,
      isResumed: false,
      codeSubmissions: {},
      codeLanguages: {},
      codeSources: {},
      isSubmittingCode: false,
      codeSubmissionPolling: {},
    });
  },

  // Code Challenge Actions

  // Set code language for a question
  setCodeLanguage: (questionId, language) => {
    const { codeLanguages } = get();
    set({
      codeLanguages: {
        ...codeLanguages,
        [questionId]: language,
      },
    });
  },

  // Set source code for a question
  setCodeSource: (questionId, sourceCode) => {
    const { codeSources } = get();
    set({
      codeSources: {
        ...codeSources,
        [questionId]: sourceCode,
      },
    });
  },

  // Submit code for evaluation
  submitCode: async (questionId) => {
    const { currentAttempt, codeLanguages, codeSources } = get();
    if (!currentAttempt) {
      throw new Error('Quiz attempt not found');
    }

    const language = codeLanguages[questionId];
    const sourceCode = codeSources[questionId];

    if (!language) {
      throw new Error('Please select a programming language');
    }
    if (!sourceCode || sourceCode.trim() === '') {
      throw new Error('Please write some code before submitting');
    }

    set({ isSubmittingCode: true, error: null });

    try {
      const response = await quizService.submitCode(
        currentAttempt.id,
        questionId,
        sourceCode,
        language
      );

      // Store initial submission data
      const { codeSubmissions } = get();
      set({
        codeSubmissions: {
          ...codeSubmissions,
          [questionId]: {
            ...response,
            isPolling: true,
          },
        },
        isSubmittingCode: false,
      });

      // Start polling for status if submission is pending
      if (response.status === 'Pending' || response.status === 'Running') {
        get().startPollingSubmission(questionId, response.submissionId);
      }

      return response;
    } catch (error) {
      set({
        error: error.message || 'Could not submit code',
        isSubmittingCode: false,
      });
      throw error;
    }
  },

  // Start polling for submission status
  startPollingSubmission: (questionId, submissionId) => {
    const { codeSubmissionPolling } = get();

    // Clear existing polling for this question
    if (codeSubmissionPolling[submissionId]) {
      clearInterval(codeSubmissionPolling[submissionId]);
    }

    const pollInterval = setInterval(async () => {
      try {
        const status = await quizService.getCodeSubmissionStatus(submissionId);
        const { codeSubmissions } = get();

        set({
          codeSubmissions: {
            ...codeSubmissions,
            [questionId]: {
              ...status,
              isPolling: status.status === 'Pending' || status.status === 'Running',
            },
          },
        });

        // Stop polling if submission is complete
        if (status.status !== 'Pending' && status.status !== 'Running') {
          get().stopPollingSubmission(submissionId);

          // Update the answer for quiz submission
          const { answers } = get();
          set({
            answers: {
              ...answers,
              [questionId]: {
                type: 'CodeChallenge',
                submissionId: submissionId,
                passed: status.status === 'Accepted',
                testCasesPassed: status.testCasesPassed,
                totalTestCases: status.totalTestCases,
              },
            },
          });
        }
      } catch (error) {
        console.log('Polling error:', error);
      }
    }, 2000); // Poll every 2 seconds

    set({
      codeSubmissionPolling: {
        ...codeSubmissionPolling,
        [submissionId]: pollInterval,
      },
    });
  },

  // Stop polling for a specific submission
  stopPollingSubmission: (submissionId) => {
    const { codeSubmissionPolling } = get();
    if (codeSubmissionPolling[submissionId]) {
      clearInterval(codeSubmissionPolling[submissionId]);
      const newPolling = { ...codeSubmissionPolling };
      delete newPolling[submissionId];
      set({ codeSubmissionPolling: newPolling });
    }
  },

  // Get code submission for a question
  getCodeSubmission: (questionId) => {
    const { codeSubmissions } = get();
    return codeSubmissions[questionId] || null;
  },

  // Check if code question is answered (has successful submission)
  isCodeQuestionAnswered: (questionId) => {
    const { codeSubmissions } = get();
    const submission = codeSubmissions[questionId];
    return submission && submission.status === 'Accepted';
  },

  // Reset quiz state
  resetQuiz: () => {
    const { codeSubmissionPolling } = get();
    // Clear all polling intervals
    Object.values(codeSubmissionPolling).forEach(intervalId => {
      if (intervalId) clearInterval(intervalId);
    });

    set({
      currentQuiz: null,
      currentAttempt: null,
      quizResult: null,
      answers: {},
      currentQuestionIndex: 0,
      timeRemaining: null,
      isResumed: false,
      codeSubmissions: {},
      codeLanguages: {},
      codeSources: {},
      isSubmittingCode: false,
      codeSubmissionPolling: {},
    });
  },

  // Clear all
  clearAll: () => {
    const { codeSubmissionPolling } = get();
    // Clear all polling intervals
    Object.values(codeSubmissionPolling).forEach(intervalId => {
      if (intervalId) clearInterval(intervalId);
    });

    set({
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
      codeSubmissions: {},
      codeLanguages: {},
      codeSources: {},
      isSubmittingCode: false,
      codeSubmissionPolling: {},
    });
  },
}));

export default useQuizStore;
