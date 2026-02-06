import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import useCourseStore from '../store/courseStore';
import Loading from '../components/Loading';

const MyCoursesScreen = ({ navigation }) => {
  const { myCourses, fetchMyCourses, isLoading } = useCourseStore();

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      await fetchMyCourses();
    } catch (error) {
      console.error('Failed to load courses:', error);
    }
  };

  if (isLoading) {
    return <Loading text="Loading..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Courses</Text>
      </View>

      <ScrollView style={styles.content}>
        {myCourses && myCourses.length > 0 ? (
          myCourses.map((enrollment) => (
            <TouchableOpacity
              key={enrollment.enrollmentId}
              style={styles.courseCard}
              onPress={() =>
                navigation.navigate('CourseDetail', {
                  courseId: enrollment.course.id,
                })
              }
            >
              <View style={styles.courseInfo}>
                <Text style={styles.courseTitle}>
                  {enrollment.course.title}
                </Text>
                <Text style={styles.courseStatus}>
                  {enrollment.completedAt ? 'Completed' : 'In Progress'}
                </Text>

                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${enrollment.progressPercentage || 0}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {Math.round(enrollment.progressPercentage || 0)}%
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📚</Text>
            <Text style={styles.emptyStateText}>
              You haven't enrolled in any courses yet
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SIZES.paddingLarge,
    paddingBottom: SIZES.padding,
  },
  title: {
    fontSize: SIZES.h2,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: SIZES.paddingLarge,
  },
  courseCard: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.padding,
    ...SHADOWS.medium,
  },
  courseInfo: {
    flex: 1,
  },
  courseTitle: {
    fontSize: SIZES.body1,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SIZES.paddingSmall,
  },
  courseStatus: {
    fontSize: SIZES.body3,
    color: COLORS.textLight,
    marginBottom: SIZES.padding,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.progressBackground,
    borderRadius: 3,
    marginRight: SIZES.paddingSmall,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.progressFill,
    borderRadius: 3,
  },
  progressText: {
    fontSize: SIZES.body3,
    color: COLORS.textLight,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SIZES.paddingLarge * 3,
  },
  emptyStateIcon: {
    fontSize: 60,
    marginBottom: SIZES.padding,
  },
  emptyStateText: {
    fontSize: SIZES.body1,
    color: COLORS.textLight,
    textAlign: 'center',
  },
});

export default MyCoursesScreen;
