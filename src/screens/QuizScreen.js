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
    startQuiz,
    setOptionAnswer,
    setTextAnswer,
    nextQuestion,
    prevQuestion,
    goToQuestion,
    decrementTime,
    submitQuiz,
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
        'Süre Doldu',
        'Quiz süresi doldu. Cevaplarınız otomatik olarak gönderilecek.',
        [{ text: 'Tamam', onPress: handleSubmit }]
      );
    }
  }, [timeRemaining]);

  const loadQuiz = async () => {
    try {
      await startQuiz(quizId);
    } catch (err) {
      Alert.alert('Hata', err.message || 'Quiz başlatılamadı');
    }
  };

  const handleBackPress = () => {
    if (currentQuiz) {
      Alert.alert(
        'Quizden Çık',
        'Quizden çıkmak istediğinize emin misiniz? İlerlemeniz kaydedilmeyecek.',
        [
          { text: 'İptal', style: 'cancel' },
          {
            text: 'Çık',
            style: 'destructive',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const handleSubmit = async () => {
    const answeredCount = getAnsweredCount();
    const totalQuestions = currentQuiz?.questions?.length || 0;

    if (answeredCount < totalQuestions) {
      Alert.alert(
        'Eksik Cevaplar',
        `${totalQuestions - answeredCount} soru cevaplanmadı. Yine de göndermek istiyor musunuz?`,
        [
          { text: 'İptal', style: 'cancel' },
          { text: 'Gönder', onPress: doSubmit },
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
      Alert.alert('Hata', err.message || 'Quiz gönderilemedi');
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
    const currentAnswer = answers[question.id] || '';

    return (
      <View style={styles.fillInBlankContainer}>
        <TextInput
          style={styles.textInput}
          value={currentAnswer}
          onChangeText={(text) => setTextAnswer(question.id, text)}
          placeholder="Cevabınızı yazın..."
          placeholderTextColor={COLORS.textLight}
          multiline
          numberOfLines={3}
        />
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
            Soru {currentQuestionIndex + 1} / {currentQuiz.questions.length}
          </Text>
          <View style={styles.questionTypeBadge}>
            <Text style={styles.questionTypeText}>
              {question.questionType === 'SingleChoice' && 'Tek Seçim'}
              {question.questionType === 'MultipleChoice' && 'Çoktan Seçmeli'}
              {question.questionType === 'FillInBlank' && 'Boşluk Doldurma'}
            </Text>
          </View>
        </View>

        <Text style={styles.questionText}>{question.questionText}</Text>

        {question.imageUrl && (
          <View style={styles.questionImageContainer}>
            {/* Image component here if needed */}
          </View>
        )}

        {question.questionType === 'FillInBlank'
          ? renderFillInBlankQuestion(question)
          : renderOptionQuestion(question)}

        <Text style={styles.pointsText}>
          {question.points} Puan
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
            <Text style={styles.questionNavTitle}>Sorular</Text>
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
              <Text style={styles.legendText}>Cevaplandı</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.primary }]} />
              <Text style={styles.legendText}>Aktif</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: COLORS.border }]} />
              <Text style={styles.legendText}>Cevaplanmadı</Text>
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
          <Text style={styles.loadingText}>Quiz yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !currentQuiz) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={COLORS.error} />
          <Text style={styles.errorTitle}>Hata</Text>
          <Text style={styles.errorText}>{error || 'Quiz yüklenemedi'}</Text>
          <Button title="Geri Dön" onPress={() => navigation.goBack()} />
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
          {getAnsweredCount()} / {currentQuiz.questions.length} cevaplandı
        </Text>
      </View>

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
              title={isSubmitting ? 'Gönderiliyor...' : 'Quizi Bitir'}
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={styles.submitButton}
            />
          ) : (
            <Button
              title="Sonraki Soru"
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
