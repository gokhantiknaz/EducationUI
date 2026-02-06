import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import useAuthStore from '../store/authStore';
import useCourseStore from '../store/courseStore';
import Button from '../components/Button';
import Loading from '../components/Loading';

const DashboardScreen = ({ navigation }) => {
  const { user, logout } = useAuthStore();
  const { myCourses, fetchMyCourses, isLoading } = useCourseStore();
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('Loading courses...');
      const response = await fetchMyCourses();
      console.log('Courses loaded:', response);
    } catch (error) {
      console.error('Failed to load dashboard:', JSON.stringify(error, null, 2));
      alert(`Error: ${error.message}\n\nDetails: ${JSON.stringify(error.data?.errors || error.data, null, 2)}`);
    }
  };

  const handleLogout = async () => {
    try {
      console.log('Starting logout...');
      setShowDropdown(false);
      await logout();
      console.log('Logout completed');
    } catch (error) {
      console.error('Logout error:', error);
      alert('An error occurred during logout: ' + error.message);
    }
  };

  const handleProfilePress = () => {
    setShowDropdown(false);
    // TODO: Navigate to Profile screen
    console.log('Navigate to Profile');
  };

  if (isLoading) {
    return <Loading text="Loading..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello,</Text>
            <Text style={styles.userName}>
              {user?.firstName} {user?.lastName}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={() => {
              console.log('Avatar clicked, current showDropdown:', showDropdown);
              setShowDropdown(!showDropdown);
            }}
          >
            <Text style={styles.avatarText}>
              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {myCourses?.filter(e => !e.completedAt).length || 0}
            </Text>
            <Text style={styles.statLabel}>Active Courses</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {myCourses?.filter(e => e.completedAt).length || 0}
            </Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {myCourses?.filter(e => e.completedAt).length || 0}
            </Text>
            <Text style={styles.statLabel}>Certificates</Text>
          </View>
        </View>

        {/* Continue Learning */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Continue Learning</Text>

          {myCourses && myCourses.length > 0 ? (
            myCourses.map((enrollment) => (
              <TouchableOpacity
                key={enrollment.enrollmentId}
                style={styles.courseCard}
                onPress={() => navigation.navigate('CourseDetail', { courseId: enrollment.course.id })}
              >
                <View style={styles.courseInfo}>
                  <Text style={styles.courseTitle}>{enrollment.course.title}</Text>
                  <Text style={styles.courseCategory}>
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
              <Button
                title="Explore Courses"
                onPress={() => navigation.navigate('Search')}
                variant="primary"
                size="medium"
                style={styles.exploreButton}
              />
            </View>
          )}
        </View>
      </ScrollView>

      {/* Dropdown Menu - Outside ScrollView for proper z-index */}
      {showDropdown && (
        <>
          <Pressable
            style={styles.backdrop}
            onPress={() => {
              console.log('Backdrop clicked');
              setShowDropdown(false);
            }}
          />
          <View style={styles.dropdownContainer}>
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                console.log('Profile clicked');
                handleProfilePress();
              }}
            >
              <Text style={styles.dropdownIcon}>👤</Text>
              <Text style={styles.dropdownText}>My Profile</Text>
            </TouchableOpacity>
            <View style={styles.dropdownDivider} />
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => {
                console.log('Logout clicked');
                handleLogout();
              }}
            >
              <Text style={styles.dropdownIcon}>🚪</Text>
              <Text style={styles.dropdownText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SIZES.paddingLarge,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.paddingLarge,
  },
  greeting: {
    fontSize: SIZES.body1,
    color: COLORS.textLight,
  },
  userName: {
    fontSize: SIZES.h3,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SIZES.paddingSmall,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.background,
  },
  dropdownContainer: {
    position: 'absolute',
    top: 110, // Adjusted for SafeAreaView + header
    right: SIZES.paddingLarge,
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    minWidth: 180,
    zIndex: 1001, // Higher than backdrop
    ...SHADOWS.medium,
    elevation: 5, // For Android
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.padding,
  },
  dropdownIcon: {
    fontSize: 20,
    marginRight: SIZES.paddingSmall,
  },
  dropdownText: {
    fontSize: SIZES.body2,
    color: COLORS.text,
    fontWeight: '500',
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SIZES.paddingSmall,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 999,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SIZES.paddingLarge,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    marginHorizontal: SIZES.paddingSmall / 2,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  statNumber: {
    fontSize: SIZES.h2,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SIZES.paddingSmall,
  },
  statLabel: {
    fontSize: SIZES.body3,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  section: {
    marginBottom: SIZES.paddingLarge,
  },
  sectionTitle: {
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.padding,
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
  courseCategory: {
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
    paddingVertical: SIZES.paddingLarge * 2,
  },
  emptyStateIcon: {
    fontSize: 60,
    marginBottom: SIZES.padding,
  },
  emptyStateText: {
    fontSize: SIZES.body1,
    color: COLORS.textLight,
    textAlign: 'center',
    marginBottom: SIZES.paddingLarge,
  },
  exploreButton: {
    minWidth: 200,
  },
});

export default DashboardScreen;
