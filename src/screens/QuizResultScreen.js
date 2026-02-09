import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import Button from '../components/Button';
import useQuizStore from '../store/quizStore';

const QuizResultScreen = ({ route, navigation }) => {
  const { quizTitle, result } = route.params;
  const { resetQuiz } = useQuizStore();

  const isPassed = result?.isPassed;
  const score = result?.score || 0;
  const totalQuestions = result?.totalQuestions || 0;
  const correctAnswers = result?.correctAnswers || 0;
  const timeSpent = result?.timeSpentSeconds || 0;

  const formatTime = (seconds) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins >= 60) {
      const hours = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      return `${hours} saat ${remainingMins} dk`;
    }
    return secs > 0 ? `${mins} dk ${secs} sn` : `${mins} dk`;
  };

  const handleDone = () => {
    resetQuiz();
    // Go back to course detail or quiz list
    navigation.pop(2); // Go back 2 screens (Quiz -> QuizList)
  };

  const handleRetry = () => {
    resetQuiz();
    navigation.goBack(); // Go back to quiz to start again
  };

  const getScoreColor = () => {
    if (score >= 80) return COLORS.success;
    if (score >= 60) return COLORS.warning;
    return COLORS.error;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Result Icon */}
        <View style={[
          styles.iconContainer,
          isPassed ? styles.iconContainerPassed : styles.iconContainerFailed,
        ]}>
          <Ionicons
            name={isPassed ? 'checkmark-circle' : 'close-circle'}
            size={80}
            color={isPassed ? COLORS.success : COLORS.error}
          />
        </View>

        {/* Result Text */}
        <Text style={[
          styles.resultTitle,
          isPassed ? styles.resultTitlePassed : styles.resultTitleFailed,
        ]}>
          {isPassed ? 'Tebrikler!' : 'Maalesef'}
        </Text>

        <Text style={styles.resultSubtitle}>
          {isPassed
            ? 'Quiz\'i başarıyla tamamladınız!'
            : 'Quiz\'i geçemediniz. Tekrar deneyin.'}
        </Text>

        {/* Quiz Title */}
        <Text style={styles.quizTitle}>{quizTitle}</Text>

        {/* Score Card */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreCircle}>
            <Text style={[styles.scoreText, { color: getScoreColor() }]}>
              %{Math.round(score)}
            </Text>
            <Text style={styles.scoreLabel}>Puan</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: COLORS.success + '15' }]}>
              <Ionicons name="checkmark" size={24} color={COLORS.success} />
            </View>
            <Text style={styles.statValue}>{correctAnswers}</Text>
            <Text style={styles.statLabel}>Doğru</Text>
          </View>

          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: COLORS.error + '15' }]}>
              <Ionicons name="close" size={24} color={COLORS.error} />
            </View>
            <Text style={styles.statValue}>{totalQuestions - correctAnswers}</Text>
            <Text style={styles.statLabel}>Yanlış</Text>
          </View>

          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: COLORS.info + '15' }]}>
              <Ionicons name="help" size={24} color={COLORS.info} />
            </View>
            <Text style={styles.statValue}>{totalQuestions}</Text>
            <Text style={styles.statLabel}>Toplam</Text>
          </View>

          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: COLORS.primary + '15' }]}>
              <Ionicons name="time" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.statValue}>{formatTime(timeSpent)}</Text>
            <Text style={styles.statLabel}>Süre</Text>
          </View>
        </View>

        {/* Feedback */}
        {result?.feedback && result.feedback.length > 0 && (
          <View style={styles.feedbackContainer}>
            <Text style={styles.feedbackTitle}>Soru Detayları</Text>
            {result.feedback.map((item, index) => (
              <View key={index} style={styles.feedbackItem}>
                <Ionicons
                  name={item.isCorrect ? 'checkmark-circle' : 'close-circle'}
                  size={20}
                  color={item.isCorrect ? COLORS.success : COLORS.error}
                />
                <Text style={styles.feedbackText}>
                  Soru {index + 1}: {item.isCorrect ? 'Doğru' : 'Yanlış'}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        {!isPassed && (
          <Button
            title="Tekrar Dene"
            onPress={handleRetry}
            variant="outline"
            style={styles.retryButton}
          />
        )}
        <Button
          title="Tamamla"
          onPress={handleDone}
          style={styles.doneButton}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SIZES.padding,
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SIZES.paddingLarge,
  },
  iconContainerPassed: {
    backgroundColor: COLORS.success + '15',
  },
  iconContainerFailed: {
    backgroundColor: COLORS.error + '15',
  },
  resultTitle: {
    fontSize: SIZES.h1,
    fontWeight: 'bold',
    marginTop: SIZES.padding,
  },
  resultTitlePassed: {
    color: COLORS.success,
  },
  resultTitleFailed: {
    color: COLORS.error,
  },
  resultSubtitle: {
    fontSize: SIZES.body1,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: SIZES.paddingSmall,
  },
  quizTitle: {
    fontSize: SIZES.body2,
    color: COLORS.text,
    fontWeight: '500',
    marginTop: SIZES.paddingSmall,
  },
  scoreCard: {
    marginTop: SIZES.paddingLarge,
    padding: SIZES.padding,
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    ...SHADOWS.medium,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 6,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: SIZES.h1,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: SIZES.body3,
    color: COLORS.textLight,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: SIZES.paddingLarge,
    paddingVertical: SIZES.padding,
    backgroundColor: COLORS.backgroundDark,
    borderRadius: SIZES.radius,
  },
  statItem: {
    alignItems: 'center',
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  statValue: {
    fontSize: SIZES.body1,
    fontWeight: '600',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: SIZES.body3,
    color: COLORS.textLight,
    marginTop: 2,
  },
  feedbackContainer: {
    width: '100%',
    marginTop: SIZES.paddingLarge,
    padding: SIZES.padding,
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    ...SHADOWS.small,
  },
  feedbackTitle: {
    fontSize: SIZES.body1,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SIZES.paddingSmall,
  },
  feedbackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  feedbackText: {
    fontSize: SIZES.body2,
    color: COLORS.text,
    marginLeft: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: SIZES.padding,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SIZES.paddingSmall,
  },
  retryButton: {
    flex: 1,
  },
  doneButton: {
    flex: 1,
  },
});

export default QuizResultScreen;
