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
import Button from '../components/Button';
import courseService from '../services/courseService';
import { showInfoToast } from '../utils/toast';

const CourseDetailScreen = ({ route, navigation }) => {
  const { courseId } = route.params;
  const [course, setCourse] = useState(null);
  const [enrollmentStatus, setEnrollmentStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCourseDetail();
  }, [courseId]);

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
    } catch (err) {
      console.error('Kurs detayı yüklenemedi:', err);
      setError(err.message || 'Kurs detayları yüklenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
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
            // Test için örnek YouTube video ID'leri
            videoUrl: lesson.videoUrl || getTestVideoId(allLessons.length),
          });
        });
      }
    });
    return allLessons;
  };

  // Test için örnek YouTube video ID'leri
  const getTestVideoId = (index) => {
    const testVideos = [
      'dQw4w9WgXcQ',  // Örnek video 1
      'jNQXAC9IVRw',  // Örnek video 2
      '9bZkp7q19f0',  // Örnek video 3
      'kJQP7kiw5Fk',  // Örnek video 4
    ];
    return testVideos[index % testVideos.length];
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
          <Text style={styles.description}>{course.description}</Text>

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
                      const lessonWithVideo = {
                        ...lesson,
                        sectionTitle: section.title,
                        videoUrl: lesson.videoUrl || getTestVideoId(sectionIndex * 10 + lessonIndex),
                      };
                      return (
                        <TouchableOpacity
                          key={lesson.id || lessonIndex}
                          style={styles.lessonItem}
                          onPress={() => handleLessonPress(lessonWithVideo, allLessons)}
                          disabled={!isEnrolled}
                        >
                          <View style={styles.lessonNumber}>
                            <Text style={styles.lessonNumberText}>
                              {lesson.isCompleted ? '✓' : lessonIndex + 1}
                            </Text>
                          </View>
                          <View style={styles.lessonInfo}>
                            <Text style={styles.lessonTitle} numberOfLines={2}>
                              {lesson.title}
                            </Text>
                            {lesson.durationMinutes && (
                              <Text style={styles.lessonDuration}>
                                {lesson.durationMinutes} dk
                              </Text>
                            )}
                          </View>
                          {isEnrolled ? (
                            <Text style={styles.playIcon}>▶</Text>
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
          {course.learningOutcomes && course.learningOutcomes.length > 0 && (
            <View style={styles.learningOutcomesContainer}>
              <Text style={styles.sectionTitle}>What You'll Learn</Text>
              {course.learningOutcomes.map((outcome, index) => (
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
          {course.instructor && (
            <View style={styles.instructorContainer}>
              <Text style={styles.sectionTitle}>Instructor</Text>
              <View style={styles.instructorCard}>
                <View style={styles.instructorAvatar}>
                  <Text style={styles.instructorAvatarText}>
                    {course.instructor.firstName?.[0]}
                    {course.instructor.lastName?.[0]}
                  </Text>
                </View>
                <View style={styles.instructorInfo}>
                  <Text style={styles.instructorName}>
                    {course.instructor.firstName} {course.instructor.lastName}
                  </Text>
                  {course.instructor.title && (
                    <Text style={styles.instructorTitle}>
                      {course.instructor.title}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action Button */}
      <View style={styles.bottomBar}>
        {isEnrolled ? (
          <Button
            title="Continue Learning"
            onPress={handleContinueLearning}
            variant="primary"
            size="large"
            style={styles.actionButton}
          />
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
  lessonDuration: {
    fontSize: SIZES.body3,
    color: COLORS.textLight,
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
});

export default CourseDetailScreen;
