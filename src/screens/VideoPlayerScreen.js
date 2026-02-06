import React, { useState, useRef, useEffect, useCallback } from 'react';
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
import YoutubePlayer from 'react-native-youtube-iframe';
import * as ScreenOrientation from 'expo-screen-orientation';
import { COLORS, SIZES } from '../constants/theme';
import useCourseStore from '../store/courseStore';
import { showSuccessToast, showErrorToast } from '../utils/toast';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const VideoPlayerScreen = ({ navigation, route }) => {
  const { lesson, courseId, courseName, lessons = [] } = route.params || {};

  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false); // Başlangıçta false - kullanıcı başlatsın
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [currentLesson, setCurrentLesson] = useState(lesson);

  const playerRef = useRef(null);
  const progressIntervalRef = useRef(null);

  const { markLessonComplete, updateProgress } = useCourseStore();

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
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      // Ekranı portrait'e döndür
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    };
  }, []);

  // YouTube video ID'sini URL'den çıkar
  const getYoutubeVideoId = (url) => {
    if (!url) return null;

    // Direkt video ID ise
    if (url.length === 11 && !url.includes('/')) {
      return url;
    }

    // YouTube URL formatları
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }

    return null;
  };

  // Video ID - önce videoId alanını kontrol et, sonra URL'den çıkar
  const videoId = currentLesson?.videoId || getYoutubeVideoId(currentLesson?.videoUrl) || 'oPpnCh7InLY';

  // Saniyeyi formatla
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

  const toggleFullScreen = () => {
    if (isFullScreen) {
      exitFullScreen();
    } else {
      enterFullScreen();
    }
  };

  const onReady = useCallback(() => {
    setIsLoading(false);
    setIsReady(true);
    console.log('YouTube Player Ready');
  }, []);

  const onStateChange = useCallback((state) => {
    console.log('YouTube State:', state);
    switch (state) {
      case 'ended':
        setIsPlaying(false);
        setIsLoading(false);
        handleLessonComplete();
        break;
      case 'playing':
        setIsLoading(false);
        setIsPlaying(true);
        break;
      case 'paused':
        setIsPlaying(false);
        setIsLoading(false);
        break;
      case 'buffering':
        // Sadece video başladıktan sonra buffering göster
        // İlk yüklemede gösterme
        break;
      case 'unstarted':
        setIsLoading(false);
        break;
      default:
        break;
    }
  }, []);

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

  const goToNextLesson = () => {
    if (currentLessonIndex < lessons.length - 1) {
      const nextLesson = lessons[currentLessonIndex + 1];
      setCurrentLessonIndex(currentLessonIndex + 1);
      setCurrentLesson(nextLesson);
      setIsPlaying(false);
      setIsReady(false);
      setIsLoading(true);
      setCurrentTime(0);
    } else {
      showSuccessToast('Tüm dersler tamamlandı!', 'Kurs Bitti');
    }
  };

  const goToPreviousLesson = () => {
    if (currentLessonIndex > 0) {
      const prevLesson = lessons[currentLessonIndex - 1];
      setCurrentLessonIndex(currentLessonIndex - 1);
      setCurrentLesson(prevLesson);
      setIsPlaying(false);
      setIsReady(false);
      setIsLoading(true);
      setCurrentTime(0);
    }
  };

  const selectLesson = (lessonItem, index) => {
    setCurrentLessonIndex(index);
    setCurrentLesson(lessonItem);
    setIsPlaying(false);
    setIsReady(false);
    setIsLoading(true);
    setCurrentTime(0);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Full screen video player
  if (isFullScreen) {
    return (
      <View style={styles.fullScreenContainer}>
        <StatusBar hidden />
        <YoutubePlayer
          ref={playerRef}
          height={SCREEN_WIDTH}
          width={SCREEN_HEIGHT}
          play={isPlaying}
          videoId={videoId}
          onReady={onReady}
          onChangeState={onStateChange}
          forceAndroidAutoplay={true}
          initialPlayerParams={{
            preventFullScreen: false,
            controls: true,
            modestbranding: true,
            rel: false,
          }}
          webViewProps={{
            allowsInlineMediaPlayback: true,
            mediaPlaybackRequiresUserAction: false,
            javaScriptEnabled: true,
            domStorageEnabled: true,
            allowsFullscreenVideo: true,
            mixedContentMode: 'always',
            originWhitelist: ['*'],
            injectedJavaScript: `
              var element = document.getElementsByClassName('container')[0];
              if(element) element.style.position = 'unset';
              true;
            `,
          }}
          onError={(error) => console.log('YouTube Error:', error)}
        />

        {/* Full Screen Controls Overlay */}
        <View style={styles.fullScreenControls}>
          <TouchableOpacity
            style={styles.exitFullScreenButton}
            onPress={exitFullScreen}
          >
            <Text style={styles.controlIcon}>⛶</Text>
          </TouchableOpacity>
        </View>

        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        )}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.text} />

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
        <YoutubePlayer
          ref={playerRef}
          height={SCREEN_WIDTH * 9 / 16}
          width={SCREEN_WIDTH}
          play={isPlaying}
          videoId={videoId}
          onReady={onReady}
          onChangeState={onStateChange}
          forceAndroidAutoplay={true}
          initialPlayerParams={{
            preventFullScreen: false,
            controls: true,
            modestbranding: true,
            rel: false,
          }}
          webViewProps={{
            allowsInlineMediaPlayback: true,
            mediaPlaybackRequiresUserAction: false,
            javaScriptEnabled: true,
            domStorageEnabled: true,
            allowsFullscreenVideo: true,
            mixedContentMode: 'always',
            originWhitelist: ['*'],
          }}
          onError={(error) => console.log('YouTube Error:', error)}
        />

        {isLoading && !isReady && (
          <View style={styles.videoLoadingOverlay}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Video yükleniyor...</Text>
          </View>
        )}

        {isReady && !isPlaying && (
          <TouchableOpacity
            style={styles.playOverlay}
            onPress={() => setIsPlaying(true)}
          >
            <View style={styles.bigPlayButton}>
              <Text style={styles.bigPlayIcon}>▶</Text>
            </View>
          </TouchableOpacity>
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
            onPress={() => setIsPlaying(!isPlaying)}
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.text,
    paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.paddingSmall,
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
  videoLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.white,
    marginTop: 10,
    fontSize: SIZES.body2,
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  bigPlayButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bigPlayIcon: {
    fontSize: 32,
    color: COLORS.white,
    marginLeft: 4,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenControls: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  exitFullScreenButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 8,
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
