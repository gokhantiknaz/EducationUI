import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import useQuizStore from '../store/quizStore';

const QuizListScreen = ({ route, navigation }) => {
  const { courseId, courseName } = route.params;
  const { quizzes, isLoading, error, fetchCourseQuizzes, resetQuiz } = useQuizStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadQuizzes();
  }, [courseId]);

  const loadQuizzes = async () => {
    try {
      await fetchCourseQuizzes(courseId);
    } catch (err) {
      console.log('Quiz listesi yüklenemedi:', err);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadQuizzes();
    setRefreshing(false);
  };

  const handleStartQuiz = (quiz) => {
    resetQuiz(); // Clear previous quiz state
    navigation.navigate('Quiz', {
      quizId: quiz.id,
      quizTitle: quiz.title,
      courseId,
      courseName,
    });
  };

  const formatTimeLimit = (minutes) => {
    if (!minutes) return 'Süresiz';
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours} saat ${mins} dk` : `${hours} saat`;
    }
    return `${minutes} dakika`;
  };

  const renderQuizItem = ({ item }) => (
    <TouchableOpacity
      style={styles.quizCard}
      onPress={() => handleStartQuiz(item)}
      activeOpacity={0.7}
    >
      <View style={styles.quizIconContainer}>
        <Ionicons name="document-text" size={28} color={COLORS.primary} />
      </View>

      <View style={styles.quizInfo}>
        <Text style={styles.quizTitle}>{item.title}</Text>
        {item.description && (
          <Text style={styles.quizDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <View style={styles.quizMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="help-circle-outline" size={16} color={COLORS.textLight} />
            <Text style={styles.metaText}>{item.questionCount} Soru</Text>
          </View>

          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={16} color={COLORS.textLight} />
            <Text style={styles.metaText}>{formatTimeLimit(item.timeLimit)}</Text>
          </View>

          <View style={styles.metaItem}>
            <Ionicons name="trophy-outline" size={16} color={COLORS.textLight} />
            <Text style={styles.metaText}>%{item.passingScore} Geçme</Text>
          </View>
        </View>
      </View>

      <Ionicons name="chevron-forward" size={24} color={COLORS.textLight} />
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="document-text-outline" size={64} color={COLORS.textLight} />
      <Text style={styles.emptyTitle}>Quiz Bulunamadı</Text>
      <Text style={styles.emptyText}>
        Bu kurs için henüz quiz eklenmemiş.
      </Text>
    </View>
  );

  if (isLoading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quizler</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Quizler yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Quizler</Text>
          {courseName && (
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {courseName}
            </Text>
          )}
        </View>
        <View style={styles.placeholder} />
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadQuizzes}>
            <Text style={styles.retryText}>Tekrar Dene</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={quizzes}
        renderItem={renderQuizItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.backgroundDark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.paddingSmall,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: SIZES.large,
    fontWeight: '600',
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: SIZES.body3,
    color: COLORS.textLight,
    marginTop: 2,
  },
  placeholder: {
    width: 40,
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
    backgroundColor: COLORS.error + '15',
    padding: SIZES.padding,
    margin: SIZES.padding,
    borderRadius: SIZES.radius,
    alignItems: 'center',
  },
  errorText: {
    color: COLORS.error,
    fontSize: SIZES.body2,
    textAlign: 'center',
  },
  retryText: {
    color: COLORS.primary,
    fontSize: SIZES.body2,
    fontWeight: '600',
    marginTop: SIZES.paddingSmall,
  },
  listContainer: {
    padding: SIZES.padding,
    flexGrow: 1,
  },
  quizCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.paddingSmall,
    ...SHADOWS.small,
  },
  quizIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.padding,
  },
  quizInfo: {
    flex: 1,
  },
  quizTitle: {
    fontSize: SIZES.body1,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  quizDescription: {
    fontSize: SIZES.body3,
    color: COLORS.textLight,
    marginBottom: 8,
  },
  quizMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: SIZES.body3,
    color: COLORS.textLight,
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: SIZES.h4,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: SIZES.padding,
  },
  emptyText: {
    fontSize: SIZES.body2,
    color: COLORS.textLight,
    textAlign: 'center',
    marginTop: SIZES.paddingSmall,
    paddingHorizontal: SIZES.paddingLarge,
  },
});

export default QuizListScreen;
