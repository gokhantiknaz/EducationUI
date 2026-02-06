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
import useAuthStore from '../store/authStore';
import useCourseStore from '../store/courseStore';
import Button from '../components/Button';
import Loading from '../components/Loading';

const DashboardScreen = ({ navigation }) => {
  const { user, logout } = useAuthStore();
  const { myCourses, fetchMyCourses, isLoading } = useCourseStore();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('Kurslar yükleniyor...');
      const response = await fetchMyCourses();
      console.log('Kurslar yüklendi:', response);
    } catch (error) {
      console.error('Dashboard yüklenemedi:', JSON.stringify(error, null, 2));
      alert(`Hata: ${error.message}\n\nDetay: ${JSON.stringify(error.data?.errors || error.data, null, 2)}`);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  if (isLoading) {
    return <Loading text="Yükleniyor..." />;
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
            <Text style={styles.greeting}>Merhaba,</Text>
            <Text style={styles.userName}>
              {user?.firstName} {user?.lastName}
            </Text>
          </View>
          <TouchableOpacity style={styles.avatarContainer}>
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
            <Text style={styles.statLabel}>Aktif Kurslar</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {myCourses?.filter(e => e.completedAt).length || 0}
            </Text>
            <Text style={styles.statLabel}>Tamamlanan</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {myCourses?.filter(e => e.completedAt).length || 0}
            </Text>
            <Text style={styles.statLabel}>Sertifika</Text>
          </View>
        </View>

        {/* Continue Learning */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Öğrenmeye Devam Et</Text>
          
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
                    {enrollment.completedAt ? 'Tamamlandı' : 'Devam Ediyor'}
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
                Henüz kurs satın almadınız
              </Text>
              <Button
                title="Kursları Keşfet"
                onPress={() => navigation.navigate('Courses')}
                variant="primary"
                size="medium"
                style={styles.exploreButton}
              />
            </View>
          )}
        </View>

        {/* Logout Button */}
        <Button
          title="Çıkış Yap"
          onPress={handleLogout}
          variant="outline"
          style={styles.logoutButton}
        />
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
  logoutButton: {
    marginTop: SIZES.padding,
  },
});

export default DashboardScreen;
