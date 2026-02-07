import React, {useState, useEffect, useRef} from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    Dimensions,
    ScrollView,
    ActivityIndicator,
    BackHandler, Button,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useVideoPlayer, VideoView} from 'expo-video';
import {useEvent} from 'expo';
import * as ScreenOrientation from 'expo-screen-orientation';
import {COLORS, SIZES, SHADOWS} from '../constants/theme';
import useCourseStore from '../store/courseStore';
import {showSuccessToast, showErrorToast} from '../utils/toast';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

// Default CDN URL
const DEFAULT_VIDEO_URL = 'https://d3dcmqyicbxyjj.cloudfront.net/raw/sample-20s.mp4';

// Validate and get proper video URL
const getValidVideoUrl = (url) => {
    if (!url) return DEFAULT_VIDEO_URL;

    // If it's a full URL, use it
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }

    // If it looks like a YouTube ID (short string), use default CDN
    console.warn('Invalid video URL', url);
    return DEFAULT_VIDEO_URL;
};

const VideoPlayerScreen = ({navigation, route}) => {
    const {lesson, courseId, courseName, lessons = []} = route.params || {};

    const [isFullScreen, setIsFullScreen] = useState(false);
    const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
    const [currentLesson, setCurrentLesson] = useState(lesson);
    const [isLoading, setIsLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);
    const [videoDuration, setVideoDuration] = useState(0);
    const [showControls, setShowControls] = useState(true);

    const isMounted = useRef(true);
    const controlsTimeout = useRef(null);
    const {markLessonComplete} = useCourseStore();

    // Video URL - validate and use CDN URL
    const videoUrl = getValidVideoUrl(currentLesson?.videoUrl);

    // Create video player
    const player = useVideoPlayer(videoUrl, (p) => {
        p.loop = true;
        p.play();
    });

    // Listen to playing state changes
    const {isPlaying} = useEvent(player, 'playingChange', {isPlaying: player.playing});

    // Listen to status changes
    const {status} = useEvent(player, 'statusChange', {status: player.status});

    // Set mounted ref
    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    // Update loading state based on status
    useEffect(() => {
        if (!isMounted.current) return;

        if (status === 'readyToPlay') {
            setIsLoading(false);
            try {
                setVideoDuration(player.duration || 0);
            } catch (e) {
                // Player might be released
            }
        } else if (status === 'loading') {
            setIsLoading(true);
        } else if (status === 'error') {
            setIsLoading(false);
            showErrorToast('Video yüklenemedi', 'Hata');
        }
    }, [status]);

    // Track current time
    useEffect(() => {
        if (!player) return;

        const interval = setInterval(() => {
            if (!isMounted.current) return;

            try {
                if (player.currentTime !== undefined) {
                    setCurrentTime(player.currentTime);

                    // Check if video is near completion (90%)
                    if (player.duration > 0 && player.currentTime / player.duration >= 0.9) {
                        if (currentLesson?.id && !currentLesson?.isCompleted) {
                            handleLessonComplete();
                        }
                    }
                }
            } catch (e) {
                // Player might be released
            }
        }, 500);

        return () => clearInterval(interval);
    }, [player, currentLesson]);

    // Find current lesson index
    useEffect(() => {
        if (lessons.length > 0 && lesson) {
            const index = lessons.findIndex(l => l.id === lesson.id);
            if (index !== -1) {
                setCurrentLessonIndex(index);
            }
        }
    }, [lessons, lesson]);

    // // Back button handler
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

    // Cleanup on unmount - DON'T call player methods here (causes "shared object released" error)
    useEffect(() => {
        return () => {
            // Just reset orientation, expo-video handles player cleanup automatically
            ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        };
    }, []);

    // Update video source when lesson changes
    useEffect(() => {
        if (!player || !isMounted.current) return;

        const newUrl = getValidVideoUrl(currentLesson?.videoUrl);

        try {
            setIsLoading(true);
            setCurrentTime(0);
            player.replace(newUrl);
        } catch (e) {
            console.log('Video replace error:', e);
        }
    }, [currentLesson?.id]);

    const handleLessonComplete = async () => {
        if (!currentLesson?.id) return;

        try {
            await markLessonComplete(currentLesson.id);
            showSuccessToast('Ders tamamlandı!', 'Tebrikler');

            if (currentLessonIndex < lessons.length - 1) {
                setTimeout(() => {
                    goToNextLesson();
                }, 2000);
            } else {
                showSuccessToast('Tüm dersler tamamlandı!', 'Kurs Bitti');
            }
        } catch (err) {
            console.error('Lesson completion error:', err);
        }
    };

    const togglePlayPause = () => {
        if (!player) return;

        try {
            if (isPlaying) {
                player.pause();
            } else {
                player.play();
            }
        } catch (e) {
            console.log('Play/Pause error:', e);
        }
    };

    const enterFullScreen = async () => {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        setIsFullScreen(true);
    };

    const exitFullScreen = async () => {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        setIsFullScreen(false);
    };

    const goToNextLesson = () => {
        if (currentLessonIndex < lessons.length - 1) {
            const nextLesson = lessons[currentLessonIndex + 1];
            setCurrentLessonIndex(currentLessonIndex + 1);
            setCurrentLesson(nextLesson);
        }
    };

    const goToPreviousLesson = () => {
        if (currentLessonIndex > 0) {
            const prevLesson = lessons[currentLessonIndex - 1];
            setCurrentLessonIndex(currentLessonIndex - 1);
            setCurrentLesson(prevLesson);
        }
    };

    const selectLesson = (lessonItem, index) => {
        setCurrentLessonIndex(index);
        setCurrentLesson(lessonItem);
    };

    const handleSeek = (event) => {
        if (!videoDuration || !player) return;

        try {
            const {locationX} = event.nativeEvent;
            const progressBarWidth = SCREEN_WIDTH - 32;
            const seekPosition = (locationX / progressBarWidth) * videoDuration;
            player.seekBy(seekPosition - currentTime);
        } catch (e) {
            console.log('Seek error:', e);
        }
    };

    // 10 saniye geri git
    const seekBackward = () => {
        if (!player) return;
        try {
            player.seekBy(-10);
        } catch (e) {
            console.log('Seek backward error:', e);
        }
    };

    // 10 saniye ileri git
    const seekForward = () => {
        if (!player) return;
        try {
            player.seekBy(10);
        } catch (e) {
            console.log('Seek forward error:', e);
        }
    };

    // Ekranı döndür
    const toggleRotation = async () => {
        if (isFullScreen) {
            exitFullScreen();
        } else {
            enterFullScreen();
        }
    };

    // Kontrolleri göster/gizle
    const toggleControls = () => {
        setShowControls(prev => !prev);
        resetControlsTimeout();
    };

    // Kontrolleri otomatik gizle
    const resetControlsTimeout = () => {
        if (controlsTimeout.current) {
            clearTimeout(controlsTimeout.current);
        }
        if (isPlaying) {
            controlsTimeout.current = setTimeout(() => {
                if (isMounted.current) {
                    setShowControls(false);
                }
            }, 3000);
        }
    };

    // Video oynatılınca kontrolleri otomatik gizle
    useEffect(() => {
        if (isPlaying) {
            resetControlsTimeout();
        } else {
            setShowControls(true);
            if (controlsTimeout.current) {
                clearTimeout(controlsTimeout.current);
            }
        }
        return () => {
            if (controlsTimeout.current) {
                clearTimeout(controlsTimeout.current);
            }
        };
    }, [isPlaying]);

    const formatTime = (seconds) => {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatDurationSeconds = (seconds) => {
        if (!seconds) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const progress = videoDuration > 0 ? (currentTime / videoDuration) * 100 : 0;

    // Full screen video player
    if (isFullScreen) {
        return (
            <View style={styles.fullScreenContainer}>
                <StatusBar hidden/>
                <VideoView allowsFullscreen allowsPictureInPicture
                           player={player}
                    style={styles.fullScreenVideo}
                    contentFit="contain"
                    nativeControls={true}
                />
                {/* Exit Full Screen Button */}
                <TouchableOpacity
                    style={styles.exitFullScreenButton}
                    onPress={exitFullScreen}
                >
                    <Text style={styles.exitFullScreenIcon}>✕</Text>
                </TouchableOpacity>

                {isLoading && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color={COLORS.white}/>
                    </View>
                )}
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primary}/>

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => {
                        try {
                            if (player) player.pause();
                        } catch (e) {
                            // Player might be released
                        }
                        navigation.goBack();
                    }}
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
            </View>

            {/* Video Player */}
            <View style={styles.videoContainer}>
                <VideoView allowsFullscreen allowsPictureInPicture
                    player={player}
                    style={styles.video}
                    contentFit="contain"
                    nativeControls={false}
                />

                {/* Video Overlay - Tap to show/hide controls */}
                <TouchableOpacity
                    style={styles.videoOverlay}
                    activeOpacity={1}
                    onPress={toggleControls}
                >
                    {showControls && (
                        <>
                            {/* Dark overlay when controls visible */}
                            <View style={styles.controlsOverlay} />

                            {/* Top Right - Fullscreen */}
                            <View style={styles.topControls}>
                                <TouchableOpacity
                                    style={styles.topButton}
                                    onPress={toggleRotation}
                                >
                                    <Text style={styles.topButtonIcon}>⛶</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Center Controls */}
                            <View style={styles.centerControls}>
                                <TouchableOpacity
                                    style={styles.seekButton}
                                    onPress={seekBackward}
                                >
                                    <Text style={styles.seekIcon}>↺</Text>
                                    <Text style={styles.seekText}>10</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.playButton}
                                    onPress={togglePlayPause}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator size="large" color="#fff"/>
                                    ) : (
                                        <Text style={styles.playIcon}>{isPlaying ? '❚❚' : '▶'}</Text>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.seekButton}
                                    onPress={seekForward}
                                >
                                    <Text style={styles.seekIcon}>↻</Text>
                                    <Text style={styles.seekText}>10</Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    )}
                </TouchableOpacity>

                 {/*Progress Bar - Always visible but more prominent when controls shown*/}
                {showControls && (
                    <View style={styles.videoProgressContainer}>
                        <View style={styles.timeRow}>
                            <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
                            <Text style={styles.timeText}>{formatTime(videoDuration)}</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.progressBarTouchable}
                            onPress={handleSeek}
                            activeOpacity={1}
                        >
                            <View style={styles.progressBar}>
                                <View style={[styles.progressFill, {width: `${progress}%`}]}/>
                                <View style={[styles.progressThumb, {left: `${progress}%`}]}/>
                            </View>
                        </TouchableOpacity>
                    </View>
                )}

                {status === 'error' && (
                    <View style={styles.videoErrorOverlay}>
                        <Text style={styles.errorIcon}>⚠️</Text>
                        <Text style={styles.errorText}>Video yüklenemedi</Text>
                    </View>
                )}
            </View>

            {/* Lesson Navigation */}
            <View style={styles.lessonNavContainer}>
                <TouchableOpacity
                    style={[styles.lessonNavButton, currentLessonIndex === 0 && styles.lessonNavButtonDisabled]}
                    onPress={goToPreviousLesson}
                    disabled={currentLessonIndex === 0}
                >
                    <Text style={styles.lessonNavIcon}>◀</Text>
                    <Text style={[styles.lessonNavText, currentLessonIndex === 0 && styles.lessonNavTextDisabled]}>
                        Önceki Ders
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
                        Sonraki Ders
                    </Text>
                    <Text style={styles.lessonNavIcon}>▶</Text>
                </TouchableOpacity>
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
                            <Text
                                style={styles.durationText}>⏱ {formatDurationSeconds(currentLesson.durationSeconds)}</Text>
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
                                            <Text
                                                style={styles.lessonListDuration}>{formatDurationSeconds(lessonItem.durationSeconds)}</Text>
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
    exitFullScreenButton: {
        position: 'absolute',
        top: 40,
        right: 20,
        padding: 12,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
        zIndex: 100,
    },
    exitFullScreenIcon: {
        fontSize: 20,
        color: COLORS.white,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
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
    controlsOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    topControls: {
        position: 'absolute',
        top: 12,
        right: 12,
        flexDirection: 'row',
        gap: 12,
    },
    topButton: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    topButtonIcon: {
        fontSize: 20,
        color: '#fff',
    },
    centerControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 40,
    },
    seekButton: {
        width: 48,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
    },
    seekIcon: {
        fontSize: 28,
        color: '#fff',
    },
    seekText: {
        fontSize: 12,
        color: '#fff',
        fontWeight: '600',
        marginTop: -4,
    },
    playButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255,255,255,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    playIcon: {
        fontSize: 28,
        color: '#fff',
    },
    videoProgressContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
        paddingBottom: 12,
        paddingTop: 8,
    },
    timeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    progressBarTouchable: {
        paddingVertical: 4,
    },
    progressBar: {
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 2,
        position: 'relative',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#E50914',
        borderRadius: 2,
    },
    progressThumb: {
        position: 'absolute',
        top: -4,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#E50914',
        marginLeft: -6,
    },
    // timeText: {
    //     fontSize: 12,
    //     color: '#fff',
    //     fontWeight: '500',
    // },
    timeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    timeText: {
        fontSize: 12,
        color: COLORS.white,
    },
    videoErrorOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorIcon: {
        fontSize: 48,
        marginBottom: 10,
    },
    errorText: {
        color: COLORS.white,
        fontSize: SIZES.body1,
        marginBottom: 16,
    },
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
    lessonNavButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    lessonNavButtonDisabled: {
        opacity: 0.4,
    },
    lessonNavIcon: {
        fontSize: 12,
        color: COLORS.primary,
    },
    lessonNavText: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: '600',
    },
    lessonNavTextDisabled: {
        color: COLORS.textLight,
    },
    lessonCounter: {
        backgroundColor: COLORS.background,
        paddingVertical: 6,
        paddingHorizontal: 16,
        borderRadius: 16,
    },
    lessonCounterText: {
        fontSize: 14,
        color: COLORS.text,
        fontWeight: '600',
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
        ...SHADOWS.small,
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
