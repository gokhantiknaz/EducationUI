import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import useQuizStore from '../store/quizStore';
import Button from '../components/Button';

const QuizScreen = ({ route, navigation }) => {
  const { quizId, quizTitle } = route.params;

  const {
    currentQuiz,
    currentAttempt,
    answers,
    currentQuestionIndex,
    timeRemaining,
    isLoading,
    isSubmitting,
    error,
    isResumed,
    startQuiz,
    setOptionAnswer,
    setTextAnswer,
    nextQuestion,
    prevQuestion,
    goToQuestion,
    decrementTime,
    submitQuiz,
    abandonQuiz,
    getAnsweredCount,
    isQuestionAnswered,
  } = useQuizStore();

  const [showQuestionNav, setShowQuestionNav] = useState(false);
  const timerRef = useRef(null);

  // Load quiz on mount
  useEffect(() => {
    loadQuiz();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [quizId]);

  // Handle back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBackPress();
      return true;
    });
    return () => backHandler.remove();
  }, [currentQuiz]);

  // Start timer when quiz loaded
  useEffect(() => {
    if (currentQuiz && timeRemaining !== null && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        decrementTime();
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [currentQuiz]);

  // Auto-submit when time runs out
  useEffect(() => {
    if (timeRemaining === 0) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      Alert.alert(
        'Time\'s Up',
        'Quiz time has expired. Your answers will be submitted automatically.',
        [{ text: 'OK', onPress: handleSubmit }]
      );
    }
  }, [timeRemaining]);

  const loadQuiz = async () => {
    try {
      await startQuiz(quizId);
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not start quiz');
    }
  };

  const handleBackPress = () => {
    if (currentQuiz) {
      Alert.alert(
        'Exit Quiz',
        'Are you sure you want to exit the quiz? Your progress will not be saved.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Exit',
            style: 'destructive',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const handleAbandon = () => {
    Alert.alert(
      'Cancel Attempt',
      'Do you want to cancel this attempt and start from scratch?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            await abandonQuiz();
            // Reload quiz with a fresh attempt
            loadQuiz();
          },
        },
      ]
    );
  };

  const handleSubmit = async () => {
    const answeredCount = getAnsweredCount();
    const totalQuestions = currentQuiz?.questions?.length || 0;

    if (answeredCount < totalQuestions) {
      Alert.alert(
        'Incomplete Answers',
        `${totalQuestions - answeredCount} question(s) not answered. Do you still want to submit?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Submit', onPress: doSubmit },
        ]
      );
    } else {
      doSubmit();
    }
  };

  const doSubmit = async () => {
    try {
      const result = await submitQuiz();
      navigation.replace('QuizResult', {
        quizTitle,
        result,
      });
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not submit quiz');
    }
  };

  const formatTime = (seconds) => {
    if (seconds === null) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const renderOptionQuestion = (question) => {
    const currentAnswer = answers[question.id];
    const isMultiple = question.questionType === 'MultipleChoice';

    return (
      <View style={styles.optionsContainer}>
        {question.options?.map((option, index) => {
          const isSelected = isMultiple
            ? (currentAnswer || []).includes(option.id)
            : currentAnswer === option.id;

          return (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionItem,
                isSelected && styles.optionItemSelected,
              ]}
              onPress={() => setOptionAnswer(question.id, option.id, question.questionType)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.optionIndicator,
                isMultiple ? styles.checkboxIndicator : styles.radioIndicator,
                isSelected && styles.indicatorSelected,
              ]}>
                {isSelected && (
                  <Ionicons
                    name={isMultiple ? 'checkmark' : 'ellipse'}
                    size={isMultiple ? 16 : 8}
                    color={COLORS.background}
                  />
                )}
              </View>
              <Text style={[
                styles.optionText,
                isSelected && styles.optionTextSelected,
              ]}>
                {option.optionText}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderFillInBlankQuestion = (question) => {
    const currentAnswer = answers[question.id];
    const hasOptions = question.options && question.options.length > 0;

    // If no options, use text input mode
    if (!hasOptions) {
      return (
        <View style={styles.fillInBlankContainer}>
          <TextInput
            style={styles.textInput}
            value={currentAnswer || ''}
            onChangeText={(text) => setTextAnswer(question.id, text)}
            placeholder="Type your answer..."
            placeholderTextColor={COLORS.textLight}
            multiline
            numberOfLines={3}
          />
        </View>
      );
    }

    // Drag-drop mode with options
    const questionText = question.questionText || '';
    const blankMarker = '{{blank}}';
    const hasBlankMarker = questionText.includes(blankMarker);

    // Get the selected option object
    const selectedOptionObj = currentAnswer
      ? question.options.find(o => o.id === currentAnswer)
      : null;

    // Handle option tap - directly place in blank
    const handleOptionPress = (option) => {
      // Directly set the answer
      setOptionAnswer(question.id, option.id);
    };

    // Handle blank tap - remove the answer
    const handleBlankPress = () => {
      if (selectedOptionObj) {
        setOptionAnswer(question.id, null);
      }
    };

    // Render question text with blank
    const renderQuestionWithBlank = () => {
      if (!hasBlankMarker) {
        // No marker, show text and blank below
        return (
          <View>
            <Text style={styles.questionTextDragDrop}>{questionText}</Text>
            <TouchableOpacity
              style={[
                styles.blankZone,
                selectedOptionObj && styles.blankZoneFilled,
              ]}
              onPress={handleBlankPress}
              activeOpacity={0.7}
            >
              {selectedOptionObj ? (
                <View style={styles.blankZoneContent}>
                  <Text style={styles.blankZoneText}>{selectedOptionObj.optionText}</Text>
                  <Ionicons name="close-circle" size={18} color={COLORS.error} style={styles.blankRemoveIcon} />
                </View>
              ) : (
                <Text style={styles.blankZonePlaceholder}>Select an option</Text>
              )}
            </TouchableOpacity>
          </View>
        );
      }

      // Split text by blank marker
      const parts = questionText.split(blankMarker);

      return (
        <View style={styles.questionTextContainer}>
          <Text style={styles.questionTextDragDrop}>
            {parts.map((part, index) => (
              <React.Fragment key={index}>
                {part}
                {index < parts.length - 1 && (
                  <Text
                    style={[
                      styles.inlineBlank,
                      selectedOptionObj && styles.inlineBlankFilled,
                    ]}
                    onPress={handleBlankPress}
                  >
                    {selectedOptionObj
                      ? ` ${selectedOptionObj.optionText} ✕ `
                      : ' _______ '}
                  </Text>
                )}
              </React.Fragment>
            ))}
          </Text>
        </View>
      );
    };

    // Filter out the already used option
    const availableOptions = question.options.filter(
      o => !selectedOptionObj || o.id !== selectedOptionObj.id
    );

    return (
      <View style={styles.fillInBlankContainer}>
        {renderQuestionWithBlank()}

        {availableOptions.length > 0 && (
          <View style={styles.optionChipsContainer}>
            <Text style={styles.optionChipsLabel}>Select an option</Text>
            <View style={styles.optionChips}>
              {availableOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={styles.optionChip}
                  onPress={() => handleOptionPress(option)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.optionChipText}>{option.optionText}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderQuestion = () => {
    if (!currentQuiz || !currentQuiz.questions) return null;

    const question = currentQuiz.questions[currentQuestionIndex];
    if (!question) return null;

    return (
      <View style={styles.questionContainer}>
        <View style={styles.questionHeader}>
          <Text style={styles.questionNumber}>
            Question {currentQuestionIndex + 1} / {currentQuiz.questions.length}
          </Text>
          <View style={styles.questionTypeBadge}>
            <Text style={styles.questionTypeText}>
              {question.questionType === 'SingleChoice' && 'Single Choice'}
              {question.questionType === 'MultipleChoice' && 'Multiple Choice'}
              {question.questionType === 'FillInBlank' && 'Fill in the Blank'}
            </Text>
          </View>
        </View>

        {/* For FillInBlank with options, text is rendered inside the component */}
        {!(question.questionType === 'FillInBlank' && question.options?.length > 0) && (
          <Text style={styles.questionText}>{question.questionText}</Text>
        )}

        {question.imageUrl && (
          <View style={styles.questionImageContainer}>
            {/* Image component here if needed */}
          </View>
        )}

        {question.questionType === 'FillInBlank'
          ? renderFillInBlankQuestion(question)
          : renderOptionQuestion(question)}

        <Text style={styles.pointsText}>
          {question.points} Points
        </Text>
      </View>
    );
  };

  const renderQuestionNav = () => {
    if (!currentQuiz || !showQuestionNav) return null;

    return (
      <View style={styles.questionNavOverlay}>
        <View style={styles.questionNavContainer}>
          <View style={styles.questionNavHeader}>
            <Text style={styles.questionNavTitle}>Questions</Text>
            <TouchableOpacity onPress={() => setShowQuestionNav(false)}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.questionNavGrid}>
            {currentQuiz.questions.map((q, index) => {
              const isAnswered = isQuestionAnswered(q.id);
              const isCurrent = index === currentQuestionIndex;

              return (
                <TouchableOpacity
                  key={q.id}
                  style={[
                    styles.questionNavItem,
                    isAnswered && styles.questionNavItemAnswered,
                    isCurrent && styles.questionNavItemCurrent,
                  ]}
                  onPress={() => {
                    goToQuestion(index);
                    setShowQuestionNav(false);
                  }}
                >
                  <Text style={[
                    styles.questionNavItemText,
                    (isAnswered || isCurrent) && styles.questionNavItemTextActive,
                  ]}>
                    {index + 1}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.questionNavLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.success }]} />
              <Text style={styles.legendText}>Answered</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.primary }]} />
              <Text style={styles.legendText}>Current</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.border }]} />
              <Text style={styles.legendText}>Not Answered</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading quiz...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !currentQuiz) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={COLORS.error} />
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorText}>{error || 'Could not load quiz'}</Text>
          <Button title="Go Back" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={handleBackPress}>
          <Ionicons name="close" size={24} color={COLORS.text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>{quizTitle}</Text>
          {timeRemaining !== null && (
            <View style={[
              styles.timerContainer,
              timeRemaining < 60 && styles.timerContainerWarning,
            ]}>
              <Ionicons
                name="time-outline"
                size={16}
                color={timeRemaining < 60 ? COLORS.error : COLORS.text}
              />
              <Text style={[
                styles.timerText,
                timeRemaining < 60 && styles.timerTextWarning,
              ]}>
                {formatTime(timeRemaining)}
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => setShowQuestionNav(true)}
        >
          <Ionicons name="grid-outline" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${((currentQuestionIndex + 1) / currentQuiz.questions.length) * 100}%`,
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {getAnsweredCount()} / {currentQuiz.questions.length} answered
        </Text>
      </View>

      {/* Resumed Banner */}
      {isResumed && (
        <View style={styles.resumedBanner}>
          <Ionicons name="refresh-circle" size={18} color={COLORS.warning} />
          <Text style={styles.resumedText}>Continuing where you left off</Text>
          <TouchableOpacity onPress={handleAbandon} style={styles.abandonButton}>
            <Text style={styles.abandonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Question */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {renderQuestion()}
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity
          style={[
            styles.navArrow,
            currentQuestionIndex === 0 && styles.navArrowDisabled,
          ]}
          onPress={prevQuestion}
          disabled={currentQuestionIndex === 0}
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color={currentQuestionIndex === 0 ? COLORS.border : COLORS.primary}
          />
        </TouchableOpacity>

        <View style={styles.navCenter}>
          {currentQuestionIndex === currentQuiz.questions.length - 1 ? (
            <Button
              title={isSubmitting ? 'Submitting...' : 'Finish Quiz'}
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={styles.submitButton}
            />
          ) : (
            <Button
              title="Next Question"
              onPress={nextQuestion}
              style={styles.nextButton}
            />
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.navArrow,
            currentQuestionIndex === currentQuiz.questions.length - 1 && styles.navArrowDisabled,
          ]}
          onPress={nextQuestion}
          disabled={currentQuestionIndex === currentQuiz.questions.length - 1}
        >
          <Ionicons
            name="chevron-forward"
            size={24}
            color={
              currentQuestionIndex === currentQuiz.questions.length - 1
                ? COLORS.border
                : COLORS.primary
            }
          />
        </TouchableOpacity>
      </View>

      {/* Question Navigation Modal */}
      {renderQuestionNav()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SIZES.padding,
    fontSize: SIZES.body2,
    color: COLORS.textLight,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.paddingLarge,
  },
  errorTitle: {
    fontSize: SIZES.h3,
    fontWeight: '600',
    color: COLORS.error,
    marginTop: SIZES.padding,
  },
  errorText: {
    fontSize: SIZES.body2,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: SIZES.paddingSmall,
    marginBottom: SIZES.padding,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.paddingSmall,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  closeButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: SIZES.body1,
    fontWeight: '600',
    color: COLORS.text,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: COLORS.backgroundDark,
  },
  timerContainerWarning: {
    backgroundColor: COLORS.error + '15',
  },
  timerText: {
    fontSize: SIZES.body3,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 4,
  },
  timerTextWarning: {
    color: COLORS.error,
  },
  navButton: {
    padding: 8,
  },
  progressContainer: {
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.paddingSmall,
    backgroundColor: COLORS.backgroundDark,
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: SIZES.body3,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: 4,
  },
  resumedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.warning + '15',
    paddingVertical: 8,
    paddingHorizontal: SIZES.padding,
    gap: 8,
  },
  resumedText: {
    fontSize: SIZES.body3,
    color: COLORS.warning,
    fontWeight: '500',
    flex: 1,
  },
  abandonButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: COLORS.error + '15',
    borderRadius: 12,
  },
  abandonText: {
    fontSize: SIZES.body3,
    color: COLORS.error,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: SIZES.padding,
  },
  questionContainer: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    ...SHADOWS.small,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  questionNumber: {
    fontSize: SIZES.body3,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  questionTypeBadge: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  questionTypeText: {
    fontSize: SIZES.body3,
    color: COLORS.primary,
    fontWeight: '500',
  },
  questionText: {
    fontSize: SIZES.body1,
    color: COLORS.text,
    lineHeight: 24,
    marginBottom: SIZES.padding,
  },
  optionsContainer: {
    marginTop: SIZES.paddingSmall,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.padding,
    marginBottom: SIZES.paddingSmall,
    backgroundColor: COLORS.backgroundDark,
    borderRadius: SIZES.radiusSmall,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionItemSelected: {
    backgroundColor: COLORS.primary + '10',
    borderColor: COLORS.primary,
  },
  optionIndicator: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.paddingSmall,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  radioIndicator: {
    borderRadius: 12,
  },
  checkboxIndicator: {
    borderRadius: 4,
  },
  indicatorSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionText: {
    flex: 1,
    fontSize: SIZES.body2,
    color: COLORS.text,
  },
  optionTextSelected: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  fillInBlankContainer: {
    marginTop: SIZES.paddingSmall,
  },
  textInput: {
    backgroundColor: COLORS.backgroundDark,
    borderRadius: SIZES.radiusSmall,
    padding: SIZES.padding,
    fontSize: SIZES.body2,
    color: COLORS.text,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  // Drag-drop FillInBlank styles
  questionTextContainer: {
    marginBottom: SIZES.padding,
  },
  questionTextDragDrop: {
    fontSize: SIZES.body1,
    color: COLORS.text,
    lineHeight: 28,
  },
  inlineBlank: {
    backgroundColor: COLORS.primary + '20',
    color: COLORS.primary,
    fontWeight: '600',
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  inlineBlankFilled: {
    backgroundColor: COLORS.success + '20',
    color: COLORS.success,
  },
  inlineBlankActive: {
    backgroundColor: COLORS.warning + '30',
    color: COLORS.warning,
  },
  blankZone: {
    backgroundColor: COLORS.backgroundDark,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: SIZES.radiusSmall,
    padding: SIZES.padding,
    marginTop: SIZES.padding,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  blankZoneFilled: {
    backgroundColor: COLORS.success + '10',
    borderColor: COLORS.success,
    borderStyle: 'solid',
  },
  blankZoneContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  blankRemoveIcon: {
    marginLeft: 4,
  },
  blankZoneText: {
    fontSize: SIZES.body1,
    fontWeight: '600',
    color: COLORS.success,
  },
  blankZonePlaceholder: {
    fontSize: SIZES.body2,
    color: COLORS.textLight,
    fontStyle: 'italic',
  },
  optionChipsContainer: {
    marginTop: SIZES.padding,
    paddingTop: SIZES.padding,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  optionChipsLabel: {
    fontSize: SIZES.body3,
    color: COLORS.textLight,
    marginBottom: SIZES.paddingSmall,
    textAlign: 'center',
  },
  optionChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  optionChip: {
    backgroundColor: COLORS.backgroundDark,
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.paddingSmall,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  optionChipSelected: {
    backgroundColor: COLORS.primary + '15',
    borderColor: COLORS.primary,
  },
  optionChipText: {
    fontSize: SIZES.body2,
    color: COLORS.text,
    fontWeight: '500',
  },
  optionChipTextSelected: {
    color: COLORS.primary,
  },
  clearAnswerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SIZES.padding,
    padding: SIZES.paddingSmall,
  },
  clearAnswerText: {
    fontSize: SIZES.body3,
    color: COLORS.error,
    marginLeft: 4,
  },
  pointsText: {
    fontSize: SIZES.body3,
    color: COLORS.textLight,
    textAlign: 'right',
    marginTop: SIZES.padding,
  },
  navigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.padding,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  navArrow: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: COLORS.backgroundDark,
  },
  navArrowDisabled: {
    backgroundColor: COLORS.border + '30',
  },
  navCenter: {
    flex: 1,
    paddingHorizontal: SIZES.padding,
  },
  nextButton: {
    height: 44,
  },
  submitButton: {
    height: 44,
    backgroundColor: COLORS.success,
  },
  questionNavOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionNavContainer: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
  },
  questionNavHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  questionNavTitle: {
    fontSize: SIZES.h4,
    fontWeight: '600',
    color: COLORS.text,
  },
  questionNavGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  questionNavItem: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: COLORS.backgroundDark,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  questionNavItemAnswered: {
    backgroundColor: COLORS.success + '20',
    borderColor: COLORS.success,
  },
  questionNavItemCurrent: {
    backgroundColor: COLORS.primary + '20',
    borderColor: COLORS.primary,
  },
  questionNavItemText: {
    fontSize: SIZES.body2,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  questionNavItemTextActive: {
    color: COLORS.text,
  },
  questionNavLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SIZES.padding,
    paddingTop: SIZES.padding,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: SIZES.paddingSmall,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 4,
  },
  legendText: {
    fontSize: SIZES.body3,
    color: COLORS.textLight,
  },
});

export default QuizScreen;
