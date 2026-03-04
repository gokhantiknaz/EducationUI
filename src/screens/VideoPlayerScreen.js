import React, { useState, useEffect, useRef, useCallback } from 'react';
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
    Modal,
    Platform,
    useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEvent } from 'expo';
import * as ScreenOrientation from 'expo-screen-orientation';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import useCourseStore from '../store/courseStore';
import courseService from '../services/courseService';
import { showSuccessToast, showErrorToast, showInfoToast } from '../utils/toast';

const DEFAULT_VIDEO_URL = 'https://d3dcmqyicbxyjj.cloudfront.net/raw/sample-20s.mp4';
const PROGRESS_SAVE_INTERVAL = 10000; // Save every 10 seconds

const getValidVideoUrl = (url) => {
    if (!url) return DEFAULT_VIDEO_URL;
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    console.warn('Invalid video URL', url);
    return DEFAULT_VIDEO_URL;
};

// Helper to get stream URL - calls API for signed URLs when needed
const fetchStreamUrl = async (lessonId, fallbackUrl) => {
    try {
        console.log('Fetching stream URL for lesson:', lessonId);
        const streamData = await courseService.getLessonStreamUrl(lessonId);
        console.log('Stream URL response:', streamData);

        if (streamData?.videoUrl) {
            return streamData.videoUrl;
        }
        return fallbackUrl;
    } catch (error) {
        console.error('Failed to get stream URL:', error);
        return fallbackUrl;
    }
};

const VideoPlayerScreen = ({ navigation, route }) => {
    const { lesson, courseName, lessons = [] } = route.params || {};

    const { width: winW, height: winH } = useWindowDimensions();

    const [isFullScreen, setIsFullScreen] = useState(false);
    const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
    const [currentLesson, setCurrentLesson] = useState(lesson);
    const [isLoading, setIsLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);
    const [videoDuration, setVideoDuration] = useState(0);
    const [showControls, setShowControls] = useState(true);
    const [resumePosition, setResumePosition] = useState(0);
    const [hasResumed, setHasResumed] = useState(false);
    const [lessonsProgress, setLessonsProgress] = useState({});
    const [progressLoaded, setProgressLoaded] = useState(false);
    const [actualVideoUrl, setActualVideoUrl] = useState(null); // Stream URL from API
    const [isFavorite, setIsFavorite] = useState(false); // Favorite status

    // Settings / Speed
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);

    const isMounted = useRef(true);
    const controlsTimeout = useRef(null);
    const progressSaveInterval = useRef(null);
    const lastSavedTime = useRef(0);
    const currentTimeRef = useRef(0);
    const videoDurationRef = useRef(0);
    const currentLessonRef = useRef(currentLesson);

    const { markLessonComplete } = useCourseStore();

    // Ref'leri güncel tut
    useEffect(() => {
        currentTimeRef.current = currentTime;
    }, [currentTime]);

    useEffect(() => {
        videoDurationRef.current = videoDuration;
    }, [videoDuration]);

    useEffect(() => {
        currentLessonRef.current = currentLesson;
    }, [currentLesson]);

    // Favori durumunu yükle
    const loadFavoriteStatus = useCallback(async (lessonId) => {
        try {
            const status = await courseService.getLessonFavoriteStatus(lessonId);
            setIsFavorite(status?.isFavorite || false);
        } catch (err) {
            console.log('Favori durumu yüklenemedi:', err?.message || err);
        }
    }, []);

    // Favori ekle/kaldır
    const toggleFavorite = useCallback(async () => {
        if (!currentLesson?.id) return;

        try {
            if (isFavorite) {
                await courseService.removeLessonFromFavorites(currentLesson.id);
                setIsFavorite(false);
                showInfoToast('Favorilerden kaldırıldı', 'Favoriler');
            } else {
                await courseService.addLessonToFavorites(currentLesson.id);
                setIsFavorite(true);
                showSuccessToast('Favorilere eklendi', 'Favoriler');
            }
        } catch (err) {
            showErrorToast('İşlem başarısız oldu', 'Hata');
            console.log('Favori toggle hatası:', err);
        }
    }, [currentLesson?.id, isFavorite]);

    // Tek ders ilerlemesini yükle
    const loadLessonProgress = useCallback(async (lessonId) => {
        setProgressLoaded(false);
        try {
            console.log('Loading progress for lesson:', lessonId);
            const progress = await courseService.getLessonProgress(lessonId);
            console.log('Progress loaded:', JSON.stringify(progress));

            // lastWatchedPosition kontrolü
            const position = progress?.lastWatchedPosition || 0;
            const isCompleted = progress?.isCompleted || false;

            console.log('Position:', position, 'isCompleted:', isCompleted);

            if (position > 0 && !isCompleted) {
                console.log('Setting resumePosition to:', position);
                setResumePosition(position);
                setHasResumed(false);
            } else {
                setResumePosition(0);
            }
            setProgressLoaded(true);
            return position;
        } catch (err) {
            console.log('Progress yüklenemedi:', err?.message || err);
            setProgressLoaded(true);
        }
        return 0;
    }, []);

    // Tüm derslerin ilerlemesini yükle
    const loadAllLessonsProgress = useCallback(async () => {
        const { courseId } = route.params || {};
        if (!courseId) return;

        try {
            const progressData = await courseService.getCourseLessonsProgress(courseId);
            const progressMap = {};
            progressData.forEach(p => {
                progressMap[p.lessonId] = p;
            });
            setLessonsProgress(progressMap);
        } catch (err) {
            console.log('Tüm progress yüklenemedi:', err);
        }
    }, [route.params]);

    // İlerlemeyi kaydet
    const saveProgress = useCallback(async (force = false) => {
        const lessonId = currentLessonRef.current?.id;
        if (!lessonId || !isMounted.current) return;

        const currentPos = Math.floor(currentTimeRef.current);
        const duration = Math.floor(videoDurationRef.current);

        // 0 saniye ise kaydetme
        if (currentPos <= 0) return;

        // Son kaydedilen ile aynıysa kaydetme (force değilse)
        if (!force && Math.abs(currentPos - lastSavedTime.current) < 5) return;

        const isCompleted = duration > 0 && currentPos / duration >= 0.9;

        try {
            console.log('Saving progress:', { lessonId, currentPos, duration });
            await courseService.saveLessonProgress(lessonId, {
                watchedSeconds: currentPos,
                lastPosition: currentPos,
                isCompleted,
            });
            lastSavedTime.current = currentPos;
            console.log('Progress saved successfully');

            // Local state'i güncelle
            setLessonsProgress(prev => ({
                ...prev,
                [lessonId]: {
                    lessonId,
                    watchedSeconds: currentPos,
                    totalSeconds: duration,
                    lastWatchedPosition: currentPos,
                    isCompleted,
                }
            }));
        } catch (err) {
            console.log('Progress kaydedilemedi:', err);
        }
    }, []);

    // Use actual stream URL if available, otherwise fallback to lesson's videoUrl
    const videoUrl = getValidVideoUrl(actualVideoUrl || currentLesson?.videoUrl);

    const player = useVideoPlayer(videoUrl, (p) => {
        p.loop = false; // Döngü kapalı - video bitince durmalı
        p.play();
    });

    // Fetch stream URL when lesson changes
    useEffect(() => {
        const loadStreamUrl = async () => {
            if (!currentLesson?.id) return;

            // Ders değiştiğinde önce mevcut URL'i sıfırla
            setActualVideoUrl(null);
            setIsLoading(true);

            try {
                // API'den stream URL al (public değilse signed URL döner)
                const streamUrl = await fetchStreamUrl(currentLesson.id, currentLesson.videoUrl);
                console.log('Using video URL:', streamUrl);
                setActualVideoUrl(streamUrl);
            } catch (err) {
                console.error('Stream URL fetch error:', err);
                // Hata durumunda fallback olarak lesson videoUrl kullan
                setActualVideoUrl(currentLesson.videoUrl);
            }
        };

        loadStreamUrl();
    }, [currentLesson?.id]);

    const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });
    const { status } = useEvent(player, 'statusChange', { status: player.status });

    // Zaman güncellemelerini takip et
    const timeUpdateRef = useRef(null);

    useEffect(() => {
        isMounted.current = true;
        loadAllLessonsProgress();

        // Zaman güncelleme interval'i
        timeUpdateRef.current = setInterval(() => {
            if (!isMounted.current || !player) return;

            try {
                const time = player.currentTime;
                const duration = player.duration;

                if (typeof time === 'number' && !isNaN(time)) {
                    setCurrentTime(time);

                    // iOS fix: eğer time > 0 ise video oynuyor demektir, loading'i kapat
                    if (time > 0) {
                        setIsLoading(false);
                    }
                }

                if (typeof duration === 'number' && !isNaN(duration) && duration > 0) {
                    setVideoDuration(prev => prev !== duration ? duration : prev);
                }
            } catch (e) {
                // Sessizce geç
            }
        }, 250); // Daha sık güncelle

        return () => {
            isMounted.current = false;
            if (progressSaveInterval.current) {
                clearInterval(progressSaveInterval.current);
            }
            if (timeUpdateRef.current) {
                clearInterval(timeUpdateRef.current);
            }
        };
    }, [player]);

    // Ekrandan çıkarken progress kaydet
    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', async (e) => {
            console.log('beforeRemove - saving progress');
            const lessonId = currentLessonRef.current?.id;
            const currentPos = Math.floor(currentTimeRef.current);
            const duration = Math.floor(videoDurationRef.current);

            if (lessonId && currentPos > 0) {
                try {
                    console.log('Saving on exit:', { lessonId, currentPos, duration });
                    await courseService.saveLessonProgress(lessonId, {
                        watchedSeconds: currentPos,
                        lastPosition: currentPos,
                        isCompleted: duration > 0 && currentPos / duration >= 0.9,
                    });
                    console.log('Progress saved on exit');
                } catch (err) {
                    console.error('Failed to save progress on exit:', err);
                }
            }
        });
        return unsubscribe;
    }, [navigation]);

    // Ders değiştiğinde ilerlemeyi yükle
    useEffect(() => {
        if (currentLesson?.id) {
            setHasResumed(false);
            setResumePosition(0);
            lastSavedTime.current = 0;
            loadLessonProgress(currentLesson.id);
            loadFavoriteStatus(currentLesson.id);
        }
    }, [currentLesson?.id, loadLessonProgress, loadFavoriteStatus]);

    // iOS ve Android için farklı status değerleri olabilir
    // isPlaying da loading kontrolünde kullanılacak
    useEffect(() => {
        if (!isMounted.current) return;

        console.log('Status changed to:', status, 'isPlaying:', isPlaying);

        // Duration alma fonksiyonu
        const tryGetDuration = () => {
            try {
                const duration = player?.duration;
                if (typeof duration === 'number' && !isNaN(duration) && duration > 0) {
                    console.log('Video duration set to:', duration);
                    setVideoDuration(duration);
                    return true;
                }
            } catch (e) {
                console.log('Duration error:', e);
            }
            return false;
        };

        // readyToPlay veya video oynamaya başladıysa loading'i kapat
        if (status === 'readyToPlay' || isPlaying) {
            setIsLoading(false);

            // Duration'ı al
            if (!tryGetDuration()) {
                setTimeout(() => {
                    if (!tryGetDuration()) {
                        const lessonDuration = currentLesson?.durationSeconds;
                        if (lessonDuration && lessonDuration > 0) {
                            console.log('Using lesson duration:', lessonDuration);
                            setVideoDuration(lessonDuration);
                        }
                    }
                }, 500);
            }
        } else if (status === 'loading') {
            setIsLoading(true);
        } else if (status === 'error') {
            setIsLoading(false);
            showErrorToast('Could not load video', 'Error');
        }
    }, [status, isPlaying, currentLesson?.durationSeconds]);

    // iOS için loading timeout - 5 saniye sonra loading'i kapat
    useEffect(() => {
        const loadingTimeout = setTimeout(() => {
            if (isLoading && isMounted.current) {
                console.log('Loading timeout - forcing isLoading to false');
                setIsLoading(false);
            }
        }, 5000);

        return () => clearTimeout(loadingTimeout);
    }, [currentLesson?.id]);

    // Kaldığı yerden devam et - ayrı useEffect
    // iOS'ta status 'readyToPlay' olmayabilir, isPlaying kontrolü de eklendi
    useEffect(() => {
        // Tüm koşullar sağlanmalı
        if (!player || !isMounted.current) return;

        // Video hazır mı? (readyToPlay VEYA oynamaya başladı)
        const isVideoReady = status === 'readyToPlay' || isPlaying || !isLoading;
        if (!isVideoReady) return;

        if (!progressLoaded) return; // Progress yüklenene kadar bekle
        if (hasResumed) return;
        if (resumePosition <= 0) {
            console.log('No resume position, playing from start');
            return;
        }

        console.log('Resume effect triggered:', { status, isPlaying, resumePosition, hasResumed, progressLoaded });

        const resumeTimer = setTimeout(() => {
            try {
                console.log('Attempting to resume from:', resumePosition);

                // expo-video'da seek için currentTime'ı ayarla
                player.currentTime = resumePosition;
                console.log('Set player.currentTime to:', resumePosition);

                setHasResumed(true);
                setCurrentTime(resumePosition);
                showInfoToast(`Resuming from ${Math.floor(resumePosition)} seconds`, 'Resume');
            } catch (e) {
                console.log('Resume seek error:', e?.message || e);
                // iOS'ta alternatif seek yöntemi dene
                try {
                    player.seekBy(resumePosition - (player.currentTime || 0));
                    console.log('Used seekBy as fallback');
                } catch (e2) {
                    console.log('SeekBy also failed:', e2?.message || e2);
                }
                setHasResumed(true);
            }
        }, 800);

        return () => clearTimeout(resumeTimer);
    }, [status, isPlaying, isLoading, resumePosition, hasResumed, player, progressLoaded]);

    // Video %90 tamamlandığında dersi tamamla
    useEffect(() => {
        if (!player || !currentLesson?.id) return;
        if (currentLesson?.isCompleted) return;

        if (videoDuration > 0 && currentTime > 0) {
            const watchPercentage = currentTime / videoDuration;
            if (watchPercentage >= 0.9) {
                handleLessonComplete();
            }
        }
    }, [currentTime, videoDuration, currentLesson]);

    useEffect(() => {
        if (lessons.length > 0 && lesson) {
            const index = lessons.findIndex((l) => l.id === lesson.id);
            if (index !== -1) setCurrentLessonIndex(index);
        }
    }, [lessons, lesson]);

    // Android back: fullscreen'den çık
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

    // Unmount cleanup
    useEffect(() => {
        return () => {
            ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        };
    }, []);

    // actualVideoUrl değişince video source'u güncelle
    useEffect(() => {
        if (!player || !isMounted.current || !actualVideoUrl) return;

        const newUrl = getValidVideoUrl(actualVideoUrl);
        try {
            console.log('Replacing video source with:', newUrl);
            setCurrentTime(0);
            player.replace(newUrl);
        } catch (e) {
            console.log('Video replace error:', e);
        }
    }, [actualVideoUrl]);

    const handleLessonComplete = async () => {
        if (!currentLesson?.id) return;

        try {
            await markLessonComplete(currentLesson.id);
            showSuccessToast('Lesson completed!', 'Congratulations');

            if (currentLessonIndex < lessons.length - 1) {
                setTimeout(() => goToNextLesson(), 2000);
            } else {
                showSuccessToast('All lessons completed!', 'Course Finished');
            }
        } catch (err) {
            console.error('Lesson completion error:', err);
        }
    };

    const togglePlayPause = () => {
        if (!player) return;
        try {
            if (isPlaying) player.pause();
            else player.play();
        } catch (e) {
            console.log('Play/Pause error:', e);
        }
    };

    const enterFullScreen = async () => {
        try {
            // iOS'ta Orientation lock için bu yeterli (app fullscreen)
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        } catch {}
        setIsFullScreen(true);
    };

    const exitFullScreen = async () => {
        try {
            await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        } catch {}
        setIsFullScreen(false);
    };

    const toggleFullscreen = () => {
        if (isFullScreen) exitFullScreen();
        else enterFullScreen();
    };

    const goToNextLesson = async () => {
        if (currentLessonIndex < lessons.length - 1) {
            await saveProgress(true);
            const nextLesson = lessons[currentLessonIndex + 1];
            setCurrentLessonIndex(currentLessonIndex + 1);
            setCurrentLesson(nextLesson);
        }
    };

    const goToPreviousLesson = async () => {
        if (currentLessonIndex > 0) {
            await saveProgress(true);
            const prevLesson = lessons[currentLessonIndex - 1];
            setCurrentLessonIndex(currentLessonIndex - 1);
            setCurrentLesson(prevLesson);
        }
    };

    const selectLesson = async (lessonItem, index) => {
        await saveProgress(true);
        setCurrentLessonIndex(index);
        setCurrentLesson(lessonItem);
    };

    const handleSeek = (event) => {
        if (!videoDuration || !player) return;

        try {
            const { locationX } = event.nativeEvent;
            const progressBarWidth = winW - 32;
            const seekPosition = (locationX / progressBarWidth) * videoDuration;
            player.seekBy(seekPosition - currentTime);
        } catch (e) {
            console.log('Seek error:', e);
        }
    };

    const seekBackward = () => {
        if (!player) return;
        try {
            player.seekBy(-10);
        } catch (e) {
            console.log('Seek backward error:', e);
        }
    };

    const seekForward = () => {
        if (!player) return;
        try {
            player.seekBy(10);
        } catch (e) {
            console.log('Seek forward error:', e);
        }
    };

    const toggleControls = () => {
        setShowControls((prev) => !prev);
        resetControlsTimeout();
    };

    const resetControlsTimeout = () => {
        if (controlsTimeout.current) clearTimeout(controlsTimeout.current);

        if (isPlaying) {
            controlsTimeout.current = setTimeout(() => {
                if (isMounted.current) setShowControls(false);
            }, 3000);
        }
    };

    useEffect(() => {
        if (isPlaying) {
            resetControlsTimeout();

            // Oynatılırken periyodik kaydet
            progressSaveInterval.current = setInterval(() => {
                saveProgress();
            }, PROGRESS_SAVE_INTERVAL);
        } else {
            setShowControls(true);
            if (controlsTimeout.current) clearTimeout(controlsTimeout.current);

            // Durdurulunca kaydet
            saveProgress(true);

            if (progressSaveInterval.current) {
                clearInterval(progressSaveInterval.current);
                progressSaveInterval.current = null;
            }
        }

        return () => {
            if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
            if (progressSaveInterval.current) {
                clearInterval(progressSaveInterval.current);
                progressSaveInterval.current = null;
            }
        };
    }, [isPlaying, saveProgress]);

    const setRate = (rate) => {
        if (!player) return;
        try {
            player.preservesPitch = true;
            player.playbackRate = rate;
            setPlaybackRate(rate);
            setSettingsOpen(false);
        } catch (e) {
            console.log('setRate error:', e);
        }
    };

    const formatTime = (seconds) => {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const progress = videoDuration > 0 ? (currentTime / videoDuration) * 100 : 0;

    // Video container boyutu:
    // - Normal mod: 16:9
    // - Fullscreen mod: absolute fill
    const videoContainerStyle = isFullScreen
        ? [styles.fullVideoContainer, { width: winW, height: winH }]
        : [styles.videoContainer, { width: winW, height: (winW * 9) / 16 }];

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar
                hidden={isFullScreen}
                barStyle="light-content"
                backgroundColor={COLORS.primary}
            />

            {/* Header fullscreen değilken */}
            {!isFullScreen && (
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={async () => {
                            try {
                                if (player) player.pause();
                            } catch {}

                            // Progress'i kaydet
                            const lessonId = currentLessonRef.current?.id;
                            const currentPos = Math.floor(currentTimeRef.current);
                            const duration = Math.floor(videoDurationRef.current);

                            if (lessonId && currentPos > 0) {
                                try {
                                    console.log('Saving on back:', { lessonId, currentPos, duration });
                                    await courseService.saveLessonProgress(lessonId, {
                                        watchedSeconds: currentPos,
                                        lastPosition: currentPos,
                                        isCompleted: duration > 0 && currentPos / duration >= 0.9,
                                    });
                                    console.log('Progress saved on back');
                                } catch (err) {
                                    console.error('Failed to save progress:', err);
                                }
                            }

                            navigation.goBack();
                        }}
                    >
                        <Text style={styles.backIcon}>←</Text>
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitle} numberOfLines={1}>
                            {courseName || 'Course'}
                        </Text>
                        <Text style={styles.headerSubtitle} numberOfLines={1}>
                            {currentLesson?.title || 'Lesson'}
                        </Text>
                    </View>
                </View>
            )}

            {/* Video */}
            <View style={videoContainerStyle}>
                <VideoView
                    player={player}
                    style={styles.video}
                    contentFit="contain"
                    // iOS'ta custom butonlar için nativeControls kapalı kalsın
                    nativeControls={false}
                    allowsPictureInPicture
                />

                {/* Overlay */}
                <TouchableOpacity
                    style={styles.videoOverlay}
                    activeOpacity={1}
                    onPress={toggleControls}
                >
                    {showControls && (
                        <>
                            <View style={styles.controlsOverlay} />

                            {/* Top Right buttons */}
                            <View style={styles.topControls}>
                                <TouchableOpacity style={styles.topButton} onPress={() => setSettingsOpen(true)}>
                                    <Text style={styles.topButtonIcon}>⚙️</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.topButton} onPress={toggleFullscreen}>
                                    <Text style={styles.topButtonIcon}>{isFullScreen ? '✕' : '⛶'}</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Center controls */}
                            <View style={styles.centerControls}>
                                <TouchableOpacity style={styles.seekButton} onPress={seekBackward}>
                                    <Text style={styles.seekIcon}>↺</Text>
                                    <Text style={styles.seekText}>10</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.playButton} onPress={togglePlayPause}>
                                    {isLoading ? (
                                        <ActivityIndicator size="large" color="#fff" />
                                    ) : (
                                        <Text style={styles.playIcon}>{isPlaying ? '❚❚' : '▶'}</Text>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.seekButton} onPress={seekForward}>
                                    <Text style={styles.seekIcon}>↻</Text>
                                    <Text style={styles.seekText}>10</Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                </TouchableOpacity>

                {/* Progress */}
                {showControls && (
                    <View style={styles.videoProgressContainer}>
                        <View style={styles.timeRow}>
                            <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
                            <Text style={styles.timeText}>{formatTime(videoDuration)}</Text>
                        </View>
                        <TouchableOpacity style={styles.progressBarTouchable} onPress={handleSeek} activeOpacity={1}>
                            <View style={styles.progressBar}>
                                <View style={[styles.progressFill, { width: `${progress}%` }]} />
                                <View style={[styles.progressThumb, { left: `${progress}%` }]} />
                            </View>
                        </TouchableOpacity>
                    </View>
                )}

                {status === 'error' && (
                    <View style={styles.videoErrorOverlay}>
                        <Text style={styles.errorIcon}>⚠️</Text>
                        <Text style={styles.errorText}>Could not load video</Text>
                    </View>
                )}
            </View>

            {/* Fullscreen değilken diğer içerikler */}
            {!isFullScreen && (
                <>
                    {/* Lesson Navigation */}
                    <View style={styles.lessonNavContainer}>
                        <TouchableOpacity
                            style={[styles.lessonNavButton, currentLessonIndex === 0 && styles.lessonNavButtonDisabled]}
                            onPress={goToPreviousLesson}
                            disabled={currentLessonIndex === 0}
                        >
                            <Text style={styles.lessonNavIcon}>◀</Text>
                            <Text style={[styles.lessonNavText, currentLessonIndex === 0 && styles.lessonNavTextDisabled]}>
                                Previous
                            </Text>
                        </TouchableOpacity>

                        <View style={styles.lessonCounter}>
                            <Text style={styles.lessonCounterText}>
                                {currentLessonIndex + 1} / {lessons.length || 1}
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={[styles.lessonNavButton, currentLessonIndex === lessons.length - 1 && styles.lessonNavButtonDisabled]}
                            onPress={goToNextLesson}
                            disabled={currentLessonIndex === lessons.length - 1}
                        >
                            <Text style={[styles.lessonNavText, currentLessonIndex === lessons.length - 1 && styles.lessonNavTextDisabled]}>
                                Next
                            </Text>
                            <Text style={styles.lessonNavIcon}>▶</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Lesson Info & List */}
                    <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
                        <View style={styles.lessonInfoCard}>
                            <View style={styles.lessonTitleRow}>
                                <Text style={styles.lessonTitle}>{currentLesson?.title || 'Lesson Title'}</Text>
                                {currentLesson?.isFree && (
                                    <View style={styles.freeBadge}>
                                        <Text style={styles.freeBadgeText}>Free</Text>
                                    </View>
                                )}
                                <TouchableOpacity
                                    style={styles.favoriteButton}
                                    onPress={toggleFavorite}
                                >
                                    <Ionicons
                                        name={isFavorite ? 'heart' : 'heart-outline'}
                                        size={24}
                                        color={isFavorite ? '#E74C3C' : COLORS.textLight}
                                    />
                                </TouchableOpacity>
                            </View>
                            {currentLesson?.description && (
                                <Text style={styles.lessonDescription}>{currentLesson.description}</Text>
                            )}

                            {/* Document Button - Video ile birlikte belge varsa göster */}
                            {(currentLesson?.hasDocument || currentLesson?.documentUrl) && (
                                <TouchableOpacity
                                    style={styles.documentButton}
                                    onPress={() => {
                                        // Tüm belgeler için DocumentViewer kullan (indirme engellendi)
                                        navigation.navigate('DocumentViewer', {
                                            lesson: currentLesson,
                                            courseName: courseName,
                                            lessons: lessons.filter(l => l.hasDocument || l.documentUrl),
                                        });
                                    }}
                                >
                                    <Ionicons name="document-text" size={20} color="#E74C3C" />
                                    <View style={styles.documentButtonText}>
                                        <Text style={styles.documentButtonTitle}>
                                            {currentLesson.documentName || 'Lesson Document'}
                                        </Text>
                                        <Text style={styles.documentButtonSubtitle}>
                                            {currentLesson.documentType?.toUpperCase() || 'PDF'} - Görüntüle
                                        </Text>
                                    </View>
                                    <Ionicons name="eye-outline" size={18} color={COLORS.textLight} />
                                </TouchableOpacity>
                            )}
                        </View>

                        {lessons.length > 0 && (
                            <View style={styles.lessonListContainer}>
                                <Text style={styles.sectionTitle}>Lesson List</Text>
                                {(() => {
                                    // Dersleri section'lara göre grupla
                                    const sections = [];
                                    let currentSection = null;

                                    lessons.forEach((lessonItem, index) => {
                                        if (!currentSection || currentSection.title !== lessonItem.sectionTitle) {
                                            currentSection = {
                                                title: lessonItem.sectionTitle || 'Section',
                                                sectionIndex: lessonItem.sectionIndex,
                                                lessons: [],
                                                totalDuration: 0,
                                            };
                                            sections.push(currentSection);
                                        }
                                        currentSection.lessons.push({ ...lessonItem, globalIndex: index });
                                        currentSection.totalDuration += lessonItem.durationSeconds || 0;
                                    });

                                    // Format duration
                                    const formatSectionDuration = (seconds) => {
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

                                    return sections.map((section, sectionIdx) => (
                                        <View key={`section-${sectionIdx}`} style={styles.sectionGroup}>
                                            <View style={styles.sectionHeader}>
                                                <Text style={styles.sectionHeaderTitle}>{section.title}</Text>
                                                <Text style={styles.sectionHeaderDuration}>
                                                    {section.lessons.length} lessons • {formatSectionDuration(section.totalDuration)}
                                                </Text>
                                            </View>
                                            {section.lessons.map((lessonItem, lessonIdx) => {
                                                const lessonProgress = lessonsProgress[lessonItem.id];
                                                const isCompleted = lessonProgress?.isCompleted;
                                                const watchedPercent = lessonProgress && lessonProgress.totalSeconds > 0
                                                    ? Math.round((lessonProgress.watchedSeconds / lessonProgress.totalSeconds) * 100)
                                                    : 0;
                                                const globalIndex = lessonItem.globalIndex;

                                                return (
                                                    <TouchableOpacity
                                                        key={lessonItem.id || `lesson-${globalIndex}`}
                                                        style={[
                                                            styles.lessonListItem,
                                                            globalIndex === currentLessonIndex && styles.lessonListItemActive,
                                                            isCompleted && styles.lessonListItemCompleted,
                                                        ]}
                                                        onPress={() => selectLesson(lessonItem, globalIndex)}
                                                    >
                                                        <View style={[
                                                            styles.lessonListNumber,
                                                            isCompleted && styles.lessonListNumberCompleted
                                                        ]}>
                                                            <Text style={[
                                                                styles.lessonListNumberText,
                                                                globalIndex === currentLessonIndex && styles.lessonListNumberTextActive,
                                                                isCompleted && styles.lessonListNumberTextCompleted,
                                                            ]}>
                                                                {isCompleted ? '✓' : lessonIdx + 1}
                                                            </Text>
                                                        </View>
                                                        <View style={styles.lessonListContent}>
                                                            <Text
                                                                style={[
                                                                    styles.lessonListTitle,
                                                                    globalIndex === currentLessonIndex && styles.lessonListTitleActive,
                                                                ]}
                                                                numberOfLines={2}
                                                            >
                                                                {lessonItem.title}
                                                            </Text>
                                                            {/* Ders progress bar */}
                                                            {watchedPercent > 0 && (
                                                                <View style={styles.lessonItemProgressContainer}>
                                                                    <View style={styles.lessonItemProgressBar}>
                                                                        <View style={[styles.lessonItemProgressFill, { width: `${watchedPercent}%` }]} />
                                                                    </View>
                                                                    <Text style={styles.lessonItemProgressText}>{watchedPercent}%</Text>
                                                                </View>
                                                            )}
                                                        </View>
                                                        {globalIndex === currentLessonIndex && (
                                                            <View style={styles.nowPlayingBadge}>
                                                                <Text style={styles.nowPlayingText}>▶</Text>
                                                            </View>
                                                        )}
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </View>
                                    ));
                                })()}
                            </View>
                        )}
                    </ScrollView>
                </>
            )}

            {/* Settings Modal */}
            <Modal
                transparent
                visible={settingsOpen}
                animationType="fade"
                onRequestClose={() => setSettingsOpen(false)}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    style={styles.modalBackdrop}
                    onPress={() => setSettingsOpen(false)}
                >
                    <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
                        <Text style={styles.modalTitle}>Playback Speed</Text>
                        {[0.5, 0.75, 1, 1.25, 1.5, 2].map((r) => (
                            <TouchableOpacity key={r} style={styles.modalRow} onPress={() => setRate(r)}>
                                <Text style={styles.modalRowText}>
                                    {r}x {r === playbackRate ? '✓' : ''}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingHorizontal: SIZES.padding,
        paddingVertical: SIZES.padding,
    },
    backButton: { padding: SIZES.paddingSmall },
    backIcon: { fontSize: 24, color: COLORS.white, fontWeight: 'bold' },
    headerTitleContainer: { flex: 1, marginHorizontal: SIZES.padding },
    headerTitle: { fontSize: SIZES.body2, color: COLORS.white, opacity: 0.8 },
    headerSubtitle: { fontSize: SIZES.body1, color: COLORS.white, fontWeight: '600' },

    videoContainer: {
        backgroundColor: '#000',
    },
    fullVideoContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        backgroundColor: '#000',
        zIndex: 9999,
        elevation: 9999,
    },
    video: { width: '100%', height: '100%' },

    videoOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
    controlsOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },

    topControls: { position: 'absolute', top: 12, right: 12, flexDirection: 'row', gap: 12 },
    topButton: {
        width: 44,
        height: 44,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    topButtonIcon: { fontSize: 18, color: '#fff' },

    centerControls: { flexDirection: 'row', alignItems: 'center', gap: 40 },
    seekButton: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center' },
    seekIcon: { fontSize: 28, color: '#fff' },
    seekText: { fontSize: 12, color: '#fff', fontWeight: '600', marginTop: -4 },
    playButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255,255,255,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    playIcon: { fontSize: 28, color: '#fff' },

    videoProgressContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
        paddingBottom: 12,
        paddingTop: 8,
    },
    timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    timeText: { fontSize: 12, color: COLORS.white },
    progressBarTouchable: { paddingVertical: 4 },
    progressBar: { height: 4, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2, position: 'relative' },
    progressFill: { height: '100%', backgroundColor: '#E50914', borderRadius: 2 },
    progressThumb: { position: 'absolute', top: -4, width: 12, height: 12, borderRadius: 6, backgroundColor: '#E50914', marginLeft: -6 },

    videoErrorOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
    errorIcon: { fontSize: 48, marginBottom: 10 },
    errorText: { color: COLORS.white, fontSize: SIZES.body1, marginBottom: 16 },

    lessonNavContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.card,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    lessonNavButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12 },
    lessonNavButtonDisabled: { opacity: 0.4 },
    lessonNavIcon: { fontSize: 12, color: COLORS.primary },
    lessonNavText: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },
    lessonNavTextDisabled: { color: COLORS.textLight },
    lessonCounter: { backgroundColor: COLORS.background, paddingVertical: 6, paddingHorizontal: 16, borderRadius: 16 },
    lessonCounterText: { fontSize: 14, color: COLORS.text, fontWeight: '600' },

    contentContainer: { flex: 1 },

    lessonInfoCard: {
        backgroundColor: COLORS.card,
        padding: SIZES.paddingLarge,
        marginHorizontal: SIZES.padding,
        marginTop: SIZES.padding,
        borderRadius: SIZES.radius,
        ...SHADOWS.small,
    },
    lessonTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SIZES.paddingSmall },
    lessonTitle: { fontSize: SIZES.h3, fontWeight: 'bold', color: COLORS.text, flex: 1 },
    freeBadge: { backgroundColor: COLORS.success + '20', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginLeft: 8 },
    freeBadgeText: { fontSize: 12, color: COLORS.success, fontWeight: '600' },
    favoriteButton: { padding: 8, marginLeft: 4 },
    lessonDescription: { fontSize: SIZES.body1, color: COLORS.textLight, lineHeight: 22 },

    // Document button styles
    documentButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF2F2',
        padding: 12,
        borderRadius: 8,
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    documentButtonText: {
        flex: 1,
        marginLeft: 10,
    },
    documentButtonTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
    },
    documentButtonSubtitle: {
        fontSize: 12,
        color: COLORS.textLight,
        marginTop: 2,
    },

    lessonListContainer: { padding: SIZES.padding },
    sectionTitle: { fontSize: SIZES.h3, fontWeight: 'bold', color: COLORS.text, marginBottom: SIZES.padding },
    sectionGroup: { marginBottom: SIZES.padding },
    sectionHeader: {
        backgroundColor: COLORS.primary + '15',
        paddingVertical: 12,
        paddingHorizontal: SIZES.padding,
        borderRadius: SIZES.radius,
        marginBottom: SIZES.paddingSmall,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sectionHeaderTitle: {
        fontSize: SIZES.body1,
        fontWeight: '600',
        color: COLORS.primary,
        flex: 1,
    },
    sectionHeaderDuration: {
        fontSize: SIZES.body3,
        color: COLORS.textLight,
        marginLeft: 8,
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
    lessonListItemActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '10' },
    lessonListItemCompleted: { opacity: 0.7 },
    lessonListNumber: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SIZES.padding,
    },
    lessonListNumberText: { fontSize: SIZES.body2, fontWeight: 'bold', color: COLORS.textLight },
    lessonListNumberTextActive: { color: COLORS.primary },
    lessonListNumberCompleted: { backgroundColor: COLORS.success },
    lessonListNumberTextCompleted: { color: COLORS.white },
    lessonListContent: { flex: 1 },
    lessonListTitle: { fontSize: SIZES.body1, color: COLORS.text, fontWeight: '500' },
    lessonListTitleActive: { color: COLORS.primary, fontWeight: '600' },
    lessonItemProgressContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
    lessonItemProgressBar: { flex: 1, height: 4, backgroundColor: COLORS.border, borderRadius: 2, marginRight: 8 },
    lessonItemProgressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 2 },
    lessonItemProgressText: { fontSize: 11, color: COLORS.textLight, fontWeight: '600', minWidth: 32 },
    nowPlayingBadge: { backgroundColor: COLORS.primary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
    nowPlayingText: { color: COLORS.white, fontSize: 12 },

    modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
    modalSheet: { backgroundColor: '#fff', padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
    modalTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
    modalRow: { paddingVertical: 12 },
    modalRowText: { fontSize: 16 },
});

export default VideoPlayerScreen;
