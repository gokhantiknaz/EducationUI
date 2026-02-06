import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Video, ResizeMode } from 'expo-av';
import * as ScreenOrientation from 'expo-screen-orientation';
import { COLORS, SIZES } from '../constants/theme';
import useCourseStore from '../store/courseStore';
import { showSuccessToast } from '../utils/toast';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const VideoPlayerScreen = ({ navigation, route }) => {
  const { lesson, courseId, courseName, lessons = [] } = route.params || {};

  const [isFullScreen, setIsFullScreen] = useState(false);
  const [status, setStatus] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [currentLesson, setCurrentLesson] = useState(lesson);

  const videoRef = useRef(null);
  const { markLessonComplete } = useCourseStore();

  // Video URL - CDN'den gelen URL
  const videoUrl = currentLesson?.videoUrl || 'https://d3dcmqyicbxyjj.cloudfront.net/raw/sample-20s.mp4';

  // Mevcut ders index'ini bul
  useEffect(() => {
    if (lessons.length > 0 && lesson) {
      const index = lessons.findIndex(l => l.id === lesson.id);
      if (index !== -1) {
        setCurrentLessonIndex(index);
      }
    }
  }, [lessons, lesson]);

  // Back button handler
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isFullScreen) {
        exitFullScreen();
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [isFullScreen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    };
  }, []);

  const enterFullScreen = async () => {
    setIsFullScreen(true);
    StatusBar.setHidden(true);
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
  };

  const exitFullScreen = async () => {
    setIsFullScreen(false);
    StatusBar.setHidden(false);
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
  };

  const onPlaybackStatusUpdate = (playbackStatus) => {
    setStatus(playbackStatus);

    if (playbackStatus.isLoaded) {
      setIsLoading(false);

      // Video bitti mi kontrol et
      if (playbackStatus.didJustFinish) {
        handleLessonComplete();
      }
    }
  };

  const handleLessonComplete = async () => {
    try {
      if (currentLesson?.id) {
        await markLessonComplete(currentLesson.id);
        showSuccessToast('Ders tamamlandı!', 'Tebrikler');
      }
    } catch (error) {
      console.log('Ders tamamlama hatası:', error);
    }
  };

  const togglePlayPause = async () => {
    if (videoRef.current) {
      if (status.isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
    }
  };

  const goToNextLesson = async () => {
    if (currentLessonIndex < lessons.length - 1) {
      const nextLesson = lessons[currentLessonIndex + 1];
      setCurrentLessonIndex(currentLessonIndex + 1);
      setCurrentLesson(nextLesson);
      setIsLoading(true);
      if (videoRef.current) {
        await videoRef.current.unloadAsync();
      }
    } else {
      showSuccessToast('Tüm dersler tamamlandı!', 'Kurs Bitti');
    }
  };

  const goToPreviousLesson = async () => {
    if (currentLessonIndex > 0) {
      const prevLesson = lessons[currentLessonIndex - 1];
      setCurrentLessonIndex(currentLessonIndex - 1);
      setCurrentLesson(prevLesson);
      setIsLoading(true);
      if (videoRef.current) {
        await videoRef.current.unloadAsync();
      }
    }
  };

  const selectLesson = async (lessonItem, index) => {
    setCurrentLessonIndex(index);
    setCurrentLesson(lessonItem);
    setIsLoading(true);
    if (videoRef.current) {
      await videoRef.current.unloadAsync();
    }
  };

  const handleSeek = async (event) => {
    if (!status.durationMillis || !videoRef.current) return;

    const { locationX } = event.nativeEvent;
    const progressBarWidth = SCREEN_WIDTH - 32;
    const seekPosition = (locationX / progressBarWidth) * status.durationMillis;
    await videoRef.current.setPositionAsync(seekPosition);
  };

  const formatTime = (millis) => {
    if (!millis || isNaN(millis)) return '0:00';
    const totalSeconds = Math.floor(millis / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins >= 60) {
      const hours = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      return `${hours}s ${remainingMins}dk`;
    }
    return secs > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${mins}dk`;
  };

  const progress = status.durationMillis > 0
    ? (status.positionMillis / status.durationMillis) * 100
    : 0;

  const isPlaying = status.isPlaying || false;

  // Full screen video player
  if (isFullScreen) {
    return (
      <View style={styles.fullScreenContainer}>
        <StatusBar hidden />
        <Video
          ref={videoRef}
          source={{ uri: videoUrl }}
          style={styles.fullScreenVideo}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay
          onPlaybackStatusUpdate={onPlaybackStatusUpdate}
          useNativeControls={false}
        />

        {/* Full Screen Overlay Controls */}
        <TouchableOpacity
          style={styles.fullScreenOverlay}
          activeOpacity={1}
          onPress={togglePlayPause}
        >
          {/* Top Bar */}
          <View style={styles.fullScreenTopBar}>
            <TouchableOpacity onPress={exitFullScreen} style={styles.fullScreenBackButton}>
              <Text style={styles.fullScreenIcon}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.fullScreenTitle} numberOfLines={1}>
              {currentLesson?.title}
            </Text>
          </View>

          {/* Center Play/Pause */}
          {!isPlaying && (
            <View style={styles.fullScreenCenterButton}>
              <Text style={styles.fullScreenPlayIcon}>▶</Text>
            </View>
          )}

          {/* Bottom Bar */}
          <View style={styles.fullScreenBottomBar}>
            <Text style={styles.fullScreenTime}>{formatTime(status.positionMillis)}</Text>
            <View style={styles.fullScreenProgressContainer}>
              <View style={styles.fullScreenProgressBar}>
                <View style={[styles.fullScreenProgressFill, { width: `${progress}%` }]} />
              </View>
            </View>
            <Text style={styles.fullScreenTime}>{formatTime(status.durationMillis)}</Text>
          </View>
        </TouchableOpacity>

        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={COLORS.white} />
          </View>
        )}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {courseName || 'Kurs'}
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {currentLesson?.title || 'Ders'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.fullScreenButton}
          onPress={enterFullScreen}
        >
          <Text style={styles.controlIcon}>⛶</Text>
        </TouchableOpacity>
      </View>

      {/* Video Player */}
      <View style={styles.videoContainer}>
        <Video
          ref={videoRef}
          source={{ uri: videoUrl }}
          style={styles.video}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay
          onPlaybackStatusUpdate={onPlaybackStatusUpdate}
          useNativeControls={false}
        />

        {/* Video Overlay - Play/Pause on tap */}
        <TouchableOpacity
          style={styles.videoOverlay}
          activeOpacity={1}
          onPress={togglePlayPause}
        >
          {!isPlaying && !isLoading && (
            <View style={styles.bigPlayButton}>
              <Text style={styles.bigPlayIcon}>▶</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Progress Bar */}
        <View style={styles.videoProgressContainer}>
          <TouchableOpacity
            style={styles.progressBarTouchable}
            onPress={handleSeek}
            activeOpacity={1}
          >
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
          </TouchableOpacity>
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>{formatTime(status.positionMillis)}</Text>
            <Text style={styles.timeText}>{formatTime(status.durationMillis)}</Text>
          </View>
        </View>

        {isLoading && (
          <View style={styles.videoLoadingOverlay}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Video yükleniyor...</Text>
          </View>
        )}
      </View>

      {/* Video Controls */}
      <View style={styles.controlsContainer}>
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={[styles.controlButton, currentLessonIndex === 0 && styles.controlButtonDisabled]}
            onPress={goToPreviousLesson}
            disabled={currentLessonIndex === 0}
          >
            <Text style={styles.controlButtonText}>⏮ Önceki</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.playPauseButton}
            onPress={togglePlayPause}
          >
            <Text style={styles.playPauseIcon}>{isPlaying ? '⏸' : '▶️'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, currentLessonIndex === lessons.length - 1 && styles.controlButtonDisabled]}
            onPress={goToNextLesson}
            disabled={currentLessonIndex === lessons.length - 1}
          >
            <Text style={styles.controlButtonText}>Sonraki ⏭</Text>
          </TouchableOpacity>
        </View>

        {/* Progress Info */}
        <View style={styles.progressInfo}>
          <Text style={styles.lessonProgress}>
            Ders {currentLessonIndex + 1} / {lessons.length || 1}
          </Text>
        </View>
      </View>

      {/* Lesson Info & List */}
      <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {/* Current Lesson Info */}
        <View style={styles.lessonInfoCard}>
          <View style={styles.lessonTitleRow}>
            <Text style={styles.lessonTitle}>{currentLesson?.title || 'Ders Başlığı'}</Text>
            {currentLesson?.isFree && (
              <View style={styles.freeBadge}>
                <Text style={styles.freeBadgeText}>Ücretsiz</Text>
              </View>
            )}
          </View>
          {currentLesson?.description && (
            <Text style={styles.lessonDescription}>{currentLesson.description}</Text>
          )}
          {currentLesson?.durationSeconds && (
            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>⏱ {formatDuration(currentLesson.durationSeconds)}</Text>
            </View>
          )}
        </View>

        {/* Lesson List */}
        {lessons.length > 0 && (
          <View style={styles.lessonListContainer}>
            <Text style={styles.sectionTitle}>Ders Listesi</Text>
            {lessons.map((lessonItem, index) => (
              <TouchableOpacity
                key={lessonItem.id || index}
                style={[
                  styles.lessonListItem,
                  index === currentLessonIndex && styles.lessonListItemActive,
                  lessonItem.isCompleted && styles.lessonListItemCompleted,
                ]}
                onPress={() => selectLesson(lessonItem, index)}
              >
                <View style={styles.lessonListNumber}>
                  <Text style={[
                    styles.lessonListNumberText,
                    index === currentLessonIndex && styles.lessonListNumberTextActive,
                  ]}>
                    {lessonItem.isCompleted ? '✓' : index + 1}
                  </Text>
                </View>
                <View style={styles.lessonListContent}>
                  <Text style={[
                    styles.lessonListTitle,
                    index === currentLessonIndex && styles.lessonListTitleActive,
                  ]} numberOfLines={2}>
                    {lessonItem.title}
                  </Text>
                  <View style={styles.lessonListMeta}>
                    {lessonItem.durationSeconds && (
                      <Text style={styles.lessonListDuration}>{formatDuration(lessonItem.durationSeconds)}</Text>
                    )}
                    {lessonItem.isFree && (
                      <View style={styles.lessonListFreeBadge}>
                        <Text style={styles.lessonListFreeBadgeText}>Ücretsiz</Text>
                      </View>
                    )}
                  </View>
                </View>
                {index === currentLessonIndex && (
                  <View style={styles.nowPlayingBadge}>
                    <Text style={styles.nowPlayingText}>▶</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
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
  fullScreenContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  fullScreenVideo: {
    flex: 1,
  },
  fullScreenOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  fullScreenTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 40,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  fullScreenBackButton: {
    padding: 10,
  },
  fullScreenIcon: {
    fontSize: 24,
    color: COLORS.white,
  },
  fullScreenTitle: {
    flex: 1,
    fontSize: 16,
    color: COLORS.white,
    marginLeft: 10,
  },
  fullScreenCenterButton: {
    alignSelf: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenPlayIcon: {
    fontSize: 36,
    color: COLORS.white,
  },
  fullScreenBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 40,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  fullScreenTime: {
    fontSize: 14,
    color: COLORS.white,
    minWidth: 50,
  },
  fullScreenProgressContainer: {
    flex: 1,
    marginHorizontal: 15,
  },
  fullScreenProgressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
  },
  fullScreenProgressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.padding,
  },
  backButton: {
    padding: SIZES.paddingSmall,
  },
  backIcon: {
    fontSize: 24,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  headerTitleContainer: {
    flex: 1,
    marginHorizontal: SIZES.padding,
  },
  headerTitle: {
    fontSize: SIZES.body2,
    color: COLORS.white,
    opacity: 0.8,
  },
  headerSubtitle: {
    fontSize: SIZES.body1,
    color: COLORS.white,
    fontWeight: '600',
  },
  fullScreenButton: {
    padding: SIZES.paddingSmall,
  },
  controlIcon: {
    fontSize: 24,
    color: COLORS.white,
  },
  videoContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 9 / 16,
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bigPlayButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bigPlayIcon: {
    fontSize: 32,
    color: COLORS.white,
    marginLeft: 4,
  },
  videoProgressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  progressBarTouchable: {
    paddingVertical: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  timeText: {
    fontSize: 12,
    color: COLORS.white,
  },
  videoLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.white,
    marginTop: 10,
    fontSize: SIZES.body2,
  },
  controlsContainer: {
    backgroundColor: COLORS.card,
    paddingVertical: SIZES.padding,
    paddingHorizontal: SIZES.paddingLarge,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  controlButton: {
    paddingVertical: SIZES.paddingSmall,
    paddingHorizontal: SIZES.padding,
  },
  controlButtonDisabled: {
    opacity: 0.4,
  },
  controlButtonText: {
    fontSize: SIZES.body2,
    color: COLORS.primary,
    fontWeight: '600',
  },
  playPauseButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playPauseIcon: {
    fontSize: 24,
  },
  progressInfo: {
    alignItems: 'center',
    marginTop: SIZES.paddingSmall,
  },
  lessonProgress: {
    fontSize: SIZES.body2,
    color: COLORS.textLight,
  },
  contentContainer: {
    flex: 1,
  },
  lessonInfoCard: {
    backgroundColor: COLORS.card,
    padding: SIZES.paddingLarge,
    marginHorizontal: SIZES.padding,
    marginTop: SIZES.padding,
    borderRadius: SIZES.radius,
  },
  lessonTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.paddingSmall,
  },
  lessonTitle: {
    fontSize: SIZES.h3,
    fontWeight: 'bold',
    color: COLORS.text,
    flex: 1,
  },
  freeBadge: {
    backgroundColor: COLORS.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  freeBadgeText: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '600',
  },
  lessonDescription: {
    fontSize: SIZES.body1,
    color: COLORS.textLight,
    lineHeight: 22,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SIZES.padding,
  },
  durationText: {
    fontSize: SIZES.body2,
    color: COLORS.primary,
  },
  lessonListContainer: {
    padding: SIZES.padding,
  },
  sectionTitle: {
    fontSize: SIZES.h3,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.padding,
  },
  lessonListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: SIZES.padding,
    marginBottom: SIZES.paddingSmall,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  lessonListItemActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  lessonListItemCompleted: {
    opacity: 0.7,
  },
  lessonListNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.padding,
  },
  lessonListNumberText: {
    fontSize: SIZES.body2,
    fontWeight: 'bold',
    color: COLORS.textLight,
  },
  lessonListNumberTextActive: {
    color: COLORS.primary,
  },
  lessonListContent: {
    flex: 1,
  },
  lessonListTitle: {
    fontSize: SIZES.body1,
    color: COLORS.text,
    fontWeight: '500',
  },
  lessonListTitleActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  lessonListMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  lessonListDuration: {
    fontSize: SIZES.body2,
    color: COLORS.textLight,
  },
  lessonListFreeBadge: {
    backgroundColor: COLORS.success + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  lessonListFreeBadgeText: {
    fontSize: 10,
    color: COLORS.success,
    fontWeight: '600',
  },
  nowPlayingBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  nowPlayingText: {
    color: COLORS.white,
    fontSize: 12,
  },
});

export default VideoPlayerScreen;
