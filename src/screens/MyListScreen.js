import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import courseService from '../services/courseService';
import { showSuccessToast, showErrorToast } from '../utils/toast';

const MyListScreen = ({ navigation }) => {
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadFavorites = async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    try {
      const data = await courseService.getFavoriteLessons();
      setFavorites(data || []);
    } catch (err) {
      console.log('Favoriler yüklenemedi:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Ekran her focus olduğunda yenile
  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [])
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadFavorites(false);
  };

  const handleRemoveFavorite = async (lessonId) => {
    try {
      await courseService.removeLessonFromFavorites(lessonId);
      setFavorites(prev => prev.filter(f => f.lessonId !== lessonId));
      showSuccessToast('Favorilerden kaldırıldı', 'Favoriler');
    } catch (err) {
      showErrorToast('İşlem başarısız oldu', 'Hata');
    }
  };

  const handleLessonPress = async (item) => {
    try {
      // Kurs detayını al (lessons için navigation params gerekiyor)
      const courseDetail = await courseService.getCourseDetail(item.courseId);

      // Tüm dersleri düz liste haline getir
      const allLessons = [];
      courseDetail?.sections?.forEach((section, sectionIndex) => {
        section.lessons?.forEach((lesson) => {
          allLessons.push({
            ...lesson,
            sectionTitle: section.title,
            sectionIndex,
          });
        });
      });

      // Seçili dersi bul
      const selectedLesson = allLessons.find(l => l.id === item.lessonId) || {
        id: item.lessonId,
        title: item.lessonTitle,
        description: item.lessonDescription,
        durationSeconds: item.durationSeconds,
        isFree: item.isFree,
        hasVideo: item.hasVideo,
        hasDocument: item.hasDocument,
        sectionTitle: item.sectionTitle,
      };

      // Video veya Document içeriğine göre yönlendir
      if (item.hasVideo) {
        navigation.navigate('VideoPlayer', {
          lesson: selectedLesson,
          courseName: item.courseTitle,
          courseId: item.courseId,
          lessons: allLessons,
        });
      } else if (item.hasDocument) {
        navigation.navigate('DocumentViewer', {
          lesson: selectedLesson,
          courseName: item.courseTitle,
          lessons: allLessons.filter(l => l.hasDocument),
        });
      }
    } catch (err) {
      console.log('Ders navigasyonu hatası:', err);
      showErrorToast('Ders açılamadı', 'Hata');
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins >= 60) {
      const hours = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      return `${hours}h ${remainingMins}m`;
    }
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  };

  const renderFavoriteItem = ({ item }) => (
    <TouchableOpacity
      style={styles.favoriteCard}
      onPress={() => handleLessonPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        {/* Thumbnail */}
        <View style={styles.thumbnailContainer}>
          {item.courseThumbnailUrl ? (
            <Image
              source={{ uri: item.courseThumbnailUrl }}
              style={styles.thumbnail}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.thumbnail, styles.placeholderThumbnail]}>
              <Ionicons
                name={item.hasVideo ? 'play-circle' : 'document-text'}
                size={32}
                color={COLORS.primary}
              />
            </View>
          )}
          {/* Content type badge */}
          <View style={styles.contentTypeBadge}>
            <Ionicons
              name={item.hasVideo ? 'videocam' : 'document'}
              size={12}
              color="#fff"
            />
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.lessonTitle} numberOfLines={2}>
            {item.lessonTitle}
          </Text>
          <Text style={styles.courseTitle} numberOfLines={1}>
            {item.courseTitle}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.sectionTitle}>{item.sectionTitle}</Text>
            {item.durationSeconds > 0 && (
              <>
                <Text style={styles.metaDot}>•</Text>
                <Text style={styles.duration}>{formatDuration(item.durationSeconds)}</Text>
              </>
            )}
          </View>
          {item.isFree && (
            <View style={styles.freeBadge}>
              <Text style={styles.freeBadgeText}>Free</Text>
            </View>
          )}
        </View>

        {/* Remove button */}
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveFavorite(item.lessonId)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="heart" size={24} color="#E74C3C" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="heart-outline" size={80} color={COLORS.textLight} />
      <Text style={styles.emptyStateTitle}>No Favorites Yet</Text>
      <Text style={styles.emptyStateText}>
        Save lessons to your list by tapping the heart icon while watching
      </Text>
      <TouchableOpacity
        style={styles.browseButton}
        onPress={() => navigation.navigate('HomeTab')}
      >
        <Text style={styles.browseButtonText}>Browse Courses</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>My List</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My List</Text>
        {favorites.length > 0 && (
          <Text style={styles.countBadge}>{favorites.length} lessons</Text>
        )}
      </View>

      <FlatList
        data={favorites}
        renderItem={renderFavoriteItem}
        keyExtractor={(item) => item.id || item.lessonId}
        contentContainerStyle={favorites.length === 0 ? styles.emptyList : styles.listContent}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SIZES.paddingLarge,
    paddingBottom: SIZES.padding,
  },
  title: {
    fontSize: SIZES.h2,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  countBadge: {
    fontSize: SIZES.body3,
    color: COLORS.textLight,
    backgroundColor: COLORS.card,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: SIZES.padding,
    paddingTop: 0,
  },
  emptyList: {
    flex: 1,
  },
  favoriteCard: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.padding,
    ...SHADOWS.small,
  },
  cardContent: {
    flexDirection: 'row',
    padding: SIZES.padding,
  },
  thumbnailContainer: {
    position: 'relative',
  },
  thumbnail: {
    width: 100,
    height: 70,
    borderRadius: 8,
    backgroundColor: COLORS.background,
  },
  placeholderThumbnail: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentTypeBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  infoContainer: {
    flex: 1,
    marginLeft: SIZES.padding,
    justifyContent: 'center',
  },
  lessonTitle: {
    fontSize: SIZES.body1,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  courseTitle: {
    fontSize: SIZES.body3,
    color: COLORS.primary,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: SIZES.body3,
    color: COLORS.textLight,
  },
  metaDot: {
    color: COLORS.textLight,
    marginHorizontal: 6,
  },
  duration: {
    fontSize: SIZES.body3,
    color: COLORS.textLight,
  },
  freeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 6,
  },
  freeBadgeText: {
    fontSize: 11,
    color: COLORS.success,
    fontWeight: '600',
  },
  removeButton: {
    justifyContent: 'center',
    paddingLeft: SIZES.padding,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SIZES.paddingLarge * 2,
  },
  emptyStateTitle: {
    fontSize: SIZES.h3,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SIZES.paddingLarge,
    marginBottom: SIZES.padding,
  },
  emptyStateText: {
    fontSize: SIZES.body1,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 22,
  },
  browseButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.paddingLarge * 2,
    paddingVertical: SIZES.padding,
    borderRadius: SIZES.radius,
    marginTop: SIZES.paddingLarge,
  },
  browseButtonText: {
    color: COLORS.white,
    fontSize: SIZES.body1,
    fontWeight: '600',
  },
});

export default MyListScreen;
