import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import useAuthStore from '../store/authStore';
import useAppConfigStore from '../store/appConfigStore';
import useCourseStore from '../store/courseStore';
import Loading from '../components/Loading';

const CourseDashboardScreen = ({ navigation, route }) => {
  const { courseId } = route.params || {};
  const { user, logout } = useAuthStore();
  const { config } = useAppConfigStore();
  const { fetchCourseDetail, currentCourse, isLoading } = useCourseStore();
  const [refreshing, setRefreshing] = useState(false);
  const [enrollment, setEnrollment] = useState(null);

  useEffect(() => {
    if (courseId) {
      loadCourseData();
    }
  }, [courseId]);

  const loadCourseData = async () => {
    try {
      await fetchCourseDetail(courseId);
    } catch (error) {
      console.error('Failed to load course:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCourseData();
    setRefreshing(false);
  };

  const handleContinueLearning = () => {
    navigation.navigate('CourseContent', { courseId });
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (isLoading && !currentCourse) {
    return <Loading text="Loading course..." />;
  }

  const course = currentCourse;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {config?.logoUrl ? (
              <Image
                source={{ uri: config.logoUrl }}
                style={styles.appLogo}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.appLogoPlaceholder}>
                <Text style={styles.appLogoText}>
                  {config?.name?.charAt(0) || 'E'}
                </Text>
              </View>
            )}
            <View>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={styles.userName}>
                {user?.firstName} {user?.lastName}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.avatarContainer} onPress={handleLogout}>
            <Text style={styles.avatarText}>
              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Course Card */}
        {course && (
          <View style={styles.courseCard}>
            {course.thumbnailUrl && (
              <Image
                source={{ uri: course.thumbnailUrl }}
                style={styles.courseThumbnail}
                resizeMode="cover"
              />
            )}
            <View style={styles.courseInfo}>
              <Text style={styles.courseTitle}>{course.title}</Text>
              {course.shortDescription && (
                <Text style={styles.courseDescription} numberOfLines={2}>
                  {course.shortDescription}
                </Text>
              )}

              {/* Progress */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${enrollment?.progressPercentage || 0}%` },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {enrollment?.progressPercentage?.toFixed(0) || 0}% complete
                </Text>
              </View>

              <TouchableOpacity
                style={styles.continueButton}
                onPress={handleContinueLearning}
              >
                <Text style={styles.continueButtonText}>
                  {enrollment?.progressPercentage > 0 ? 'Continue Learning' : 'Start Learning'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Course Stats */}
        {course && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{course.sections?.length || 0}</Text>
              <Text style={styles.statLabel}>Sections</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {course.sections?.reduce((acc, s) => acc + (s.lessons?.length || 0), 0) || 0}
              </Text>
              <Text style={styles.statLabel}>Lessons</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {course.durationMinutes ? `${course.durationMinutes}m` : '-'}
              </Text>
              <Text style={styles.statLabel}>Duration</Text>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionCards}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('CourseContent', { courseId })}
            >
              <Text style={styles.actionIcon}>📖</Text>
              <Text style={styles.actionLabel}>View Content</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('Profile')}
            >
              <Text style={styles.actionIcon}>👤</Text>
              <Text style={styles.actionLabel}>My Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SIZES.padding,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.paddingLarge,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  appLogo: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  appLogoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appLogoText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  greeting: {
    fontSize: SIZES.body3,
    color: COLORS.textLight,
  },
  userName: {
    fontSize: SIZES.body1,
    fontWeight: '600',
    color: COLORS.text,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  courseCard: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    overflow: 'hidden',
    marginBottom: SIZES.paddingLarge,
    ...SHADOWS.medium,
  },
  courseThumbnail: {
    width: '100%',
    height: 180,
  },
  courseInfo: {
    padding: SIZES.padding,
  },
  courseTitle: {
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  courseDescription: {
    fontSize: SIZES.body2,
    color: COLORS.textLight,
    marginBottom: 16,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.progressBackground,
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.progressFill,
    borderRadius: 4,
  },
  progressText: {
    fontSize: SIZES.body3,
    color: COLORS.textLight,
  },
  continueButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: SIZES.radius,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: SIZES.body1,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: SIZES.paddingLarge,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  statNumber: {
    fontSize: SIZES.h3,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: SIZES.body3,
    color: COLORS.textLight,
    marginTop: 4,
  },
  actionsSection: {
    marginBottom: SIZES.paddingLarge,
  },
  sectionTitle: {
    fontSize: SIZES.h4,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SIZES.padding,
  },
  actionCards: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    padding: SIZES.paddingLarge,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: SIZES.body2,
    color: COLORS.text,
    fontWeight: '500',
  },
});

export default CourseDashboardScreen;
