import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import useAppConfigStore from '../store/appConfigStore';

const CourseSelectionScreen = ({ navigation }) => {
  const { config, getCourses } = useAppConfigStore();
  const courses = getCourses();

  const handleCourseSelect = (course) => {
    // Navigate to course detail
    navigation.navigate('CourseDetail', { courseId: course.id });
  };

  const renderCourseItem = ({ item }) => (
    <TouchableOpacity
      style={styles.courseCard}
      onPress={() => handleCourseSelect(item)}
      activeOpacity={0.7}
    >
      {item.thumbnailUrl ? (
        <Image
          source={{ uri: item.thumbnailUrl }}
          style={styles.courseThumbnail}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.thumbnailPlaceholder}>
          <Text style={styles.thumbnailIcon}>📚</Text>
        </View>
      )}
      <View style={styles.courseInfo}>
        <Text style={styles.courseTitle} numberOfLines={2}>
          {item.title}
        </Text>
        {item.shortDescription && (
          <Text style={styles.courseDescription} numberOfLines={2}>
            {item.shortDescription}
          </Text>
        )}
        {item.isDefault && (
          <View style={styles.defaultBadge}>
            <Text style={styles.defaultBadgeText}>Recommended</Text>
          </View>
        )}
      </View>
      <View style={styles.arrowContainer}>
        <Text style={styles.arrow}>→</Text>
      </View>
    </TouchableOpacity>
  );

  const ListHeader = () => (
    <View style={styles.header}>
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
      <Text style={styles.headerTitle}>Select a Course</Text>
      <Text style={styles.headerSubtitle}>
        Choose a course to start learning
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={courses}
        renderItem={renderCourseItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyTitle}>No Courses Available</Text>
            <Text style={styles.emptyMessage}>
              There are no courses available for this application yet.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    padding: SIZES.padding,
  },
  header: {
    alignItems: 'center',
    marginBottom: SIZES.paddingLarge,
    paddingVertical: SIZES.padding,
  },
  appLogo: {
    width: 80,
    height: 80,
    borderRadius: 16,
    marginBottom: SIZES.padding,
  },
  appLogoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  appLogoText: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: SIZES.h2,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: SIZES.body2,
    color: COLORS.textLight,
  },
  courseCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.padding,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  courseThumbnail: {
    width: 100,
    height: 100,
  },
  thumbnailPlaceholder: {
    width: 100,
    height: 100,
    backgroundColor: COLORS.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailIcon: {
    fontSize: 32,
  },
  courseInfo: {
    flex: 1,
    padding: SIZES.paddingSmall,
    justifyContent: 'center',
  },
  courseTitle: {
    fontSize: SIZES.body1,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  courseDescription: {
    fontSize: SIZES.body3,
    color: COLORS.textLight,
  },
  defaultBadge: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  defaultBadgeText: {
    color: '#FFFFFF',
    fontSize: SIZES.body3,
    fontWeight: '500',
  },
  arrowContainer: {
    justifyContent: 'center',
    paddingRight: SIZES.padding,
  },
  arrow: {
    fontSize: 24,
    color: COLORS.primary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: SIZES.paddingLarge * 2,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: SIZES.padding,
  },
  emptyTitle: {
    fontSize: SIZES.h4,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: SIZES.body2,
    color: COLORS.textLight,
    textAlign: 'center',
  },
});

export default CourseSelectionScreen;
