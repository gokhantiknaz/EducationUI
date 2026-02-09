import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import Button from '../components/Button';
import courseService from '../services/courseService';
import { showInfoToast } from '../utils/toast';

const CourseDetailScreen = ({ route, navigation }) => {
  const { courseId } = route.params;
  const [course, setCourse] = useState(null);
  const [enrollmentStatus, setEnrollmentStatus] = useState(null);
  const [lessonsProgress, setLessonsProgress] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCourseDetail();
  }, [courseId]);

  // Sayfa focus olduğunda progress'i yeniden yükle
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (enrollmentStatus?.isEnrolled) {
        loadLessonsProgress();
      }
    });
    return unsubscribe;
  }, [navigation, enrollmentStatus]);

  const loadCourseDetail = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Kurs detayını ve kayıt durumunu paralel olarak al
      const [courseData, statusData] = await Promise.all([
        courseService.getCourseDetail(courseId),
        courseService.getEnrollmentStatus(courseId).catch(() => null), // Auth gerektiriyor, hata verirse null dön
      ]);

      setCourse(courseData);
      setEnrollmentStatus(statusData);

      // Eğer kayıtlıysa ders ilerlemelerini de al
      if (statusData?.isEnrolled) {
        const progressData = await courseService.getCourseLessonsProgress(courseId).catch(() => []);
        const progressMap = {};
        progressData.forEach(p => {
          progressMap[p.lessonId] = p;
        });
        setLessonsProgress(progressMap);
      }
    } catch (err) {
      console.error('Kurs detayı yüklenemedi:', err);
      setError(err.message || 'Kurs detayları yüklenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const loadLessonsProgress = async () => {
    try {
      const progressData = await courseService.getCourseLessonsProgress(courseId).catch(() => []);
      const progressMap = {};
      progressData.forEach(p => {
        progressMap[p.lessonId] = p;
      });
      setLessonsProgress(progressMap);
    } catch (err) {
      console.log('Progress yüklenemedi:', err);
    }
  };

  const handleEnroll = async () => {
    // TODO: Satın alma işlemi
    console.log('Kursu satın al:', courseId);
    showInfoToast('Satın alma özelliği yakında eklenecek.', 'Bilgi');
  };

  // Tüm dersleri düz bir liste olarak al
  const getAllLessons = () => {
    if (!course?.sections) return [];

    const allLessons = [];
    course.sections.forEach((section, sectionIndex) => {
      if (section.lessons) {
        section.lessons.forEach((lesson, lessonIndex) => {
          allLessons.push({
            ...lesson,
            sectionTitle: section.title,
            sectionIndex,
            lessonIndex,
          });
        });
      }
    });
    return allLessons;
  };

  const handleContinueLearning = () => {
    const allLessons = getAllLessons();

    if (allLessons.length === 0) {
      showInfoToast('Bu kursta henüz ders bulunmuyor.', 'Bilgi');
      return;
    }

    // İlk tamamlanmamış dersi bul veya ilk dersten başla
    const nextLesson = allLessons.find(l => !l.isCompleted) || allLessons[0];

    navigation.navigate('VideoPlayer', {
      lesson: nextLesson,
      courseId: course.id,
      courseName: course.title,
      lessons: allLessons,
    });
  };

  const handleLessonPress = (lesson, allLessons) => {
    navigation.navigate('VideoPlayer', {
      lesson,
      courseId: course.id,
      courseName: course.title,
      lessons: allLessons,
    });
  };

  // Saniyeyi dakika:saniye formatına çevir
  const formatDuration = (seconds) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins >= 60) {
      const hours = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      return `${hours}s ${remainingMins}dk`;
    }
    return secs > 0 ? `${mins}dk ${secs}sn` : `${mins}dk`;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button
            title="Retry"
            onPress={loadCourseDetail}
            variant="primary"
            style={styles.retryButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (!course) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Course not found</Text>
          <Button
            title="Go Back"
            onPress={() => navigation.goBack()}
            variant="outline"
            style={styles.retryButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  const isEnrolled = enrollmentStatus?.isEnrolled;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
        </View>

        {/* Course Thumbnail */}
        {course.thumbnailUrl && (
          <Image
            source={{ uri: course.thumbnailUrl }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        )}

        <View style={styles.content}>
          {/* Course Title & Basic Info */}
          <Text style={styles.title}>{course.title}</Text>
          <Text style={styles.description}>{course.shortDescription || course.fullDescription}</Text>

          {/* Course Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Level</Text>
              <Text style={styles.statValue}>{course.level || 'Beginner'}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Duration</Text>
              <Text style={styles.statValue}>
                {course.durationMinutes
                  ? `${Math.floor(course.durationMinutes / 60)}s ${course.durationMinutes % 60}dk`
                  : 'N/A'}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Price</Text>
              <Text style={styles.statValue}>
                {course.price > 0 ? `${course.price} ₺` : 'Free'}
              </Text>
            </View>
          </View>

          {/* Enrollment Status */}
          {isEnrolled && (
            <View style={styles.enrollmentStatus}>
              <Text style={styles.enrollmentStatusText}>
                ✓ You are enrolled in this course
              </Text>
              {enrollmentStatus.progressPercentage > 0 && (
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${enrollmentStatus.progressPercentage}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {Math.round(enrollmentStatus.progressPercentage)}% completed
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Course Sections */}
          {course.sections && course.sections.length > 0 && (
            <View style={styles.sectionsContainer}>
              <Text style={styles.sectionTitle}>Course Content</Text>
              {course.sections.map((section, sectionIndex) => {
                const allLessons = getAllLessons();

                return (
                  <View key={section.id || sectionIndex} style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionName}>{section.title}</Text>
                      {section.lessons && (
                        <Text style={styles.sectionLessonCount}>
                          {section.lessons.length} lessons
                        </Text>
                      )}
                    </View>
                    {/* Lesson List */}
                    {section.lessons && section.lessons.map((lesson, lessonIndex) => {
                      const lessonWithSection = {
                        ...lesson,
                        sectionTitle: section.title,
                      };
                      const progress = lessonsProgress[lesson.id];
                      const isCompleted = progress?.isCompleted;
                      const watchedPercent = progress && progress.totalSeconds > 0
                        ? Math.round((progress.watchedSeconds / progress.totalSeconds) * 100)
                        : 0;

                      return (
                        <TouchableOpacity
                          key={lesson.id || lessonIndex}
                          style={styles.lessonItem}
                          onPress={() => handleLessonPress(lessonWithSection, allLessons)}
                          disabled={!isEnrolled && !lesson.isFree}
                        >
                          <View style={[
                            styles.lessonNumber,
                            isCompleted && styles.lessonNumberCompleted
                          ]}>
                            <Text style={[
                              styles.lessonNumberText,
                              isCompleted && styles.lessonNumberTextCompleted
                            ]}>
                              {isCompleted ? '✓' : lessonIndex + 1}
                            </Text>
                          </View>
                          <View style={styles.lessonInfo}>
                            <Text style={styles.lessonTitle} numberOfLines={2}>
                              {lesson.title}
                            </Text>
                            <View style={styles.lessonMeta}>
                              {lesson.durationSeconds && (
                                <Text style={styles.lessonDuration}>
                                  {formatDuration(lesson.durationSeconds)}
                                </Text>
                              )}
                              {lesson.isFree && (
                                <View style={styles.freeBadge}>
                                  <Text style={styles.freeBadgeText}>Ücretsiz</Text>
                                </View>
                              )}
                              {isEnrolled && watchedPercent > 0 && !isCompleted && (
                                <View style={styles.progressBadge}>
                                  <Text style={styles.progressBadgeText}>%{watchedPercent}</Text>
                                </View>
                              )}
                            </View>
                            {/* Lesson progress bar */}
                            {isEnrolled && watchedPercent > 0 && (
                              <View style={styles.lessonProgressBar}>
                                <View style={[styles.lessonProgressFill, { width: `${watchedPercent}%` }]} />
                              </View>
                            )}
                          </View>
                          {isEnrolled || lesson.isFree ? (
                            <Text style={styles.playIcon}>{isCompleted ? '✓' : '▶'}</Text>
                          ) : (
                            <Text style={styles.lockIcon}>🔒</Text>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                );
              })}
            </View>
          )}

          {/* What You'll Learn */}
          {course.whatYouWillLearn && course.whatYouWillLearn.length > 0 && (
            <View style={styles.learningOutcomesContainer}>
              <Text style={styles.sectionTitle}>What You'll Learn</Text>
              {course.whatYouWillLearn.map((outcome, index) => (
                <View key={index} style={styles.outcomeItem}>
                  <Text style={styles.outcomeIcon}>✓</Text>
                  <Text style={styles.outcomeText}>{outcome}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Requirements */}
          {course.requirements && course.requirements.length > 0 && (
            <View style={styles.requirementsContainer}>
              <Text style={styles.sectionTitle}>Requirements</Text>
              {course.requirements.map((requirement, index) => (
                <View key={index} style={styles.requirementItem}>
                  <Text style={styles.requirementBullet}>•</Text>
                  <Text style={styles.requirementText}>{requirement}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Instructor Info */}
          {course.instructorName && (
            <View style={styles.instructorContainer}>
              <Text style={styles.sectionTitle}>Instructor</Text>
              <View style={styles.instructorCard}>
                {course.instructorImageUrl ? (
                  <Image
                    source={{ uri: course.instructorImageUrl }}
                    style={styles.instructorAvatarImage}
                  />
                ) : (
                  <View style={styles.instructorAvatar}>
                    <Text style={styles.instructorAvatarText}>
                      {course.instructorName?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </Text>
                  </View>
                )}
                <View style={styles.instructorInfo}>
                  <Text style={styles.instructorName}>
                    {course.instructorName}
                  </Text>
                  {course.instructorBio && (
                    <Text style={styles.instructorTitle}>
                      {course.instructorBio}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action Buttons */}
      <View style={styles.bottomBar}>
        {isEnrolled ? (
          <View style={styles.bottomButtonsRow}>
            <Button
              title="Devam Et"
              onPress={handleContinueLearning}
              variant="primary"
              size="large"
              style={styles.continueButton}
            />
            <TouchableOpacity
              style={styles.quizButton}
              onPress={() => navigation.navigate('QuizList', {
                courseId: course.id,
                courseName: course.title,
              })}
            >
              <Ionicons name="document-text" size={24} color={COLORS.primary} />
              <Text style={styles.quizButtonText}>Quiz</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Button
            title={course.price > 0 ? `${course.price} ₺ - Purchase` : 'Free Kaydol'}
            onPress={handleEnroll}
            variant="primary"
            size="large"
            style={styles.actionButton}
          />
        )}
      </View>
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
  errorText: {
    fontSize: SIZES.body1,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: SIZES.paddingLarge,
  },
  retryButton: {
    minWidth: 200,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.padding,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  backButtonText: {
    fontSize: 24,
    color: COLORS.text,
  },
  thumbnail: {
    width: '100%',
    height: 250,
    backgroundColor: COLORS.card,
  },
  content: {
    padding: SIZES.paddingLarge,
  },
  title: {
    fontSize: SIZES.h2,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.padding,
  },
  description: {
    fontSize: SIZES.body2,
    color: COLORS.textLight,
    lineHeight: 24,
    marginBottom: SIZES.paddingLarge,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.paddingLarge,
    ...SHADOWS.small,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: SIZES.body3,
    color: COLORS.textLight,
    marginBottom: SIZES.paddingSmall,
  },
  statValue: {
    fontSize: SIZES.body1,
    fontWeight: '600',
    color: COLORS.text,
  },
  enrollmentStatus: {
    backgroundColor: COLORS.success + '20',
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.paddingLarge,
  },
  enrollmentStatusText: {
    fontSize: SIZES.body2,
    color: COLORS.success,
    fontWeight: '600',
    marginBottom: SIZES.paddingSmall,
  },
  progressContainer: {
    marginTop: SIZES.paddingSmall,
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.progressBackground,
    borderRadius: 3,
    marginBottom: SIZES.paddingSmall,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.success,
    borderRadius: 3,
  },
  progressText: {
    fontSize: SIZES.body3,
    color: COLORS.textLight,
  },
  sectionsContainer: {
    marginBottom: SIZES.paddingLarge,
  },
  sectionTitle: {
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.padding,
  },
  sectionCard: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.padding,
    ...SHADOWS.small,
  },
  sectionHeader: {
    marginBottom: SIZES.padding,
    paddingBottom: SIZES.paddingSmall,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionName: {
    fontSize: SIZES.body1,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  sectionLessonCount: {
    fontSize: SIZES.body3,
    color: COLORS.textLight,
  },
  lessonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.paddingSmall,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  lessonNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.padding,
  },
  lessonNumberText: {
    fontSize: SIZES.body3,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: SIZES.body2,
    color: COLORS.text,
    marginBottom: 2,
  },
  lessonMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  lessonDuration: {
    fontSize: SIZES.body3,
    color: COLORS.textLight,
  },
  freeBadge: {
    backgroundColor: COLORS.success + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  freeBadgeText: {
    fontSize: 10,
    color: COLORS.success,
    fontWeight: '600',
  },
  progressBadge: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  progressBadgeText: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: '600',
  },
  lessonProgressBar: {
    height: 3,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  lessonProgressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  lessonNumberCompleted: {
    backgroundColor: COLORS.success,
  },
  lessonNumberTextCompleted: {
    color: COLORS.white,
  },
  playIcon: {
    fontSize: 16,
    color: COLORS.primary,
    marginLeft: SIZES.paddingSmall,
  },
  lockIcon: {
    fontSize: 14,
    marginLeft: SIZES.paddingSmall,
  },
  learningOutcomesContainer: {
    marginBottom: SIZES.paddingLarge,
  },
  outcomeItem: {
    flexDirection: 'row',
    marginBottom: SIZES.paddingSmall,
  },
  outcomeIcon: {
    fontSize: SIZES.body2,
    color: COLORS.success,
    marginRight: SIZES.paddingSmall,
  },
  outcomeText: {
    flex: 1,
    fontSize: SIZES.body2,
    color: COLORS.text,
    lineHeight: 22,
  },
  requirementsContainer: {
    marginBottom: SIZES.paddingLarge,
  },
  requirementItem: {
    flexDirection: 'row',
    marginBottom: SIZES.paddingSmall,
  },
  requirementBullet: {
    fontSize: SIZES.body2,
    color: COLORS.textLight,
    marginRight: SIZES.paddingSmall,
  },
  requirementText: {
    flex: 1,
    fontSize: SIZES.body2,
    color: COLORS.textLight,
    lineHeight: 22,
  },
  instructorContainer: {
    marginBottom: SIZES.paddingLarge,
  },
  instructorCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    ...SHADOWS.small,
  },
  instructorAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.padding,
  },
  instructorAvatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: SIZES.padding,
  },
  instructorAvatarText: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.background,
  },
  instructorInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  instructorName: {
    fontSize: SIZES.body1,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SIZES.paddingSmall,
  },
  instructorTitle: {
    fontSize: SIZES.body3,
    color: COLORS.textLight,
  },
  bottomBar: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    padding: SIZES.padding,
    backgroundColor: COLORS.background,
  },
  actionButton: {
    width: '100%',
  },
  bottomButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.paddingSmall,
  },
  continueButton: {
    flex: 1,
  },
  quizButton: {
    width: 70,
    height: 48,
    borderRadius: SIZES.radiusSmall,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  quizButtonText: {
    fontSize: SIZES.body3,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 2,
  },
});

export default CourseDetailScreen;
