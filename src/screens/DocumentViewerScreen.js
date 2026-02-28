import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { COLORS, SIZES } from '../constants/theme';
import useCourseStore from '../store/courseStore';
import courseService from '../services/courseService';
// Toast imports removed - download/share disabled
import { API_BASE_URL } from '../constants/config';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const DocumentViewerScreen = ({ navigation, route }) => {
  const { lesson, courseName, lessons = [] } = route.params || {};

  const [currentLesson, setCurrentLesson] = useState(lesson);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [documentUrl, setDocumentUrl] = useState(null);

  const { markLessonComplete } = useCourseStore();

  // Find current lesson index
  useEffect(() => {
    if (lessons.length > 0 && currentLesson) {
      const index = lessons.findIndex(l => l.id === currentLesson.id);
      if (index !== -1) {
        setCurrentLessonIndex(index);
      }
    }
  }, [lessons, currentLesson]);

  // Fetch document URL (handles S3 pre-signed URLs)
  useEffect(() => {
    const fetchDocumentUrl = async () => {
      if (!currentLesson?.id) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await courseService.getLessonDocumentUrl(currentLesson.id);
        if (response?.documentUrl) {
          setDocumentUrl(response.documentUrl);
          console.log("url",response.documentUrl);
        } else {
          // Fallback to direct URL for local files
          setDocumentUrl(getFullDocumentUrl(currentLesson));
        }
      } catch (err) {
        console.log('Document URL fetch error:', err);
        // Fallback to direct URL construction
        setDocumentUrl(getFullDocumentUrl(currentLesson));
      }
    };

    fetchDocumentUrl();
  }, [currentLesson]);

  // Mark lesson as complete after viewing
  useEffect(() => {
    const timer = setTimeout(() => {
      markAsComplete();
    }, 5000); // 5 saniye sonra tamamlandı olarak işaretle

    return () => clearTimeout(timer);
  }, [currentLesson]);

  const markAsComplete = async () => {
    try {
      await courseService.saveLessonProgress(currentLesson.id, {
        watchedSeconds: 0,
        lastPosition: 0,
        isCompleted: true,
      });
      markLessonComplete(currentLesson.id);
    } catch (err) {
      console.log('Progress kaydedilemedi:', err);
    }
  };


  const goToNextLesson = () => {
    if (currentLessonIndex < lessons.length - 1) {
      const nextLesson = lessons[currentLessonIndex + 1];
      setDocumentUrl(null);
      setCurrentLesson(nextLesson);
      setIsLoading(true);
    }
  };

  const goToPrevLesson = () => {
    if (currentLessonIndex > 0) {
      const prevLesson = lessons[currentLessonIndex - 1];
      setDocumentUrl(null);
      setCurrentLesson(prevLesson);
      setIsLoading(true);
    }
  };

  const getDocumentIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'pdf':
        return 'document-text';
      case 'ppt':
      case 'pptx':
        return 'easel';
      case 'doc':
      case 'docx':
        return 'document';
      case 'xls':
      case 'xlsx':
        return 'grid';
      default:
        return 'document-attach';
    }
  };

  const getDocumentColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'pdf':
        return '#E74C3C';
      case 'ppt':
      case 'pptx':
        return '#E67E22';
      case 'doc':
      case 'docx':
        return '#3498DB';
      case 'xls':
      case 'xlsx':
        return '#27AE60';
      default:
        return COLORS.primary;
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Get base URL without /api suffix for static files
  const getBaseUrl = () => {
    return API_BASE_URL.replace('/api', '');
  };

  // Get full document URL for uploaded documents
  const getFullDocumentUrl = (lesson) => {
    if (!lesson?.documentUrl) return null;

    // If document is uploaded to our server, construct full URL
    if (lesson.isDocumentUploaded) {
      return `${getBaseUrl()}${lesson.documentUrl}`;
    }

    // Otherwise, it's an external URL
    return lesson.documentUrl;
  };

  // Check if URL is an S3 pre-signed URL or external URL
  const isExternalUrl = (url) => {
    return url?.startsWith('http://') || url?.startsWith('https://');
  };

  // Google Docs Viewer URL for PDF/DOC preview
  const getViewerUrl = () => {
    if (!documentUrl) return null;

    // For external URLs (S3, etc.), always use Google Docs Viewer
    // because Android WebView cannot render PDFs natively
    if (isExternalUrl(documentUrl)) {
      return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(documentUrl)}`;
    }

    // For local files, try direct rendering (with full URL)
    const fullUrl = `${getBaseUrl()}${documentUrl}`;
    return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(fullUrl)}`;
  };

  const documentType = currentLesson?.documentType?.toUpperCase() || 'BELGE';
  const documentColor = getDocumentColor(currentLesson?.documentType);
  const documentIcon = getDocumentIcon(currentLesson?.documentType);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {currentLesson?.title}
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {courseName}
          </Text>
        </View>
        {/* İndirme/paylaşım butonları kaldırıldı - sadece görüntüleme */}
        <View style={styles.headerActions} />
      </View>

      {/* Document Info Card */}
      <View style={styles.docInfoCard}>
        <View style={[styles.docIconContainer, { backgroundColor: documentColor }]}>
          <Ionicons name={documentIcon} size={32} color={COLORS.white} />
        </View>
        <View style={styles.docInfo}>
          <Text style={styles.docName}>{currentLesson?.documentName || currentLesson?.title}</Text>
          <View style={styles.docMeta}>
            <Text style={[styles.docType, { color: documentColor }]}>{documentType}</Text>
            {currentLesson?.documentSize && (
              <Text style={styles.docSize}>{formatFileSize(currentLesson.documentSize)}</Text>
            )}
            {currentLesson?.isDocumentUploaded && (
              <View style={styles.uploadedBadge}>
                <Ionicons name="cloud-done" size={12} color={COLORS.success} />
                <Text style={styles.uploadedText}>Yüklü</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Document Viewer */}
      <View style={styles.viewerContainer}>
        {documentUrl ? (
          <WebView
            source={{ uri: getViewerUrl() }}
            style={styles.webview}
            onLoadStart={() => setIsLoading(true)}
            onLoadEnd={() => setIsLoading(false)}
            onError={(e) => {
              setIsLoading(false);
              setError('Belge yüklenemedi');
            }}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState
            scalesPageToFit
            allowFileAccess
            allowUniversalAccessFromFileURLs
            originWhitelist={['*']}
            mixedContentMode="always"
          />
        ) : !isLoading ? (
          <View style={styles.noDocument}>
            <Ionicons name="document-text-outline" size={64} color={COLORS.textLight} />
            <Text style={styles.noDocumentText}>Belge bulunamadı</Text>
          </View>
        ) : null}

        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Belge yükleniyor...</Text>
          </View>
        )}
      </View>

      {/* Navigation */}
      {lessons.length > 1 && (
        <View style={styles.navigation}>
          <TouchableOpacity
            style={[styles.navButton, currentLessonIndex === 0 && styles.navButtonDisabled]}
            onPress={goToPrevLesson}
            disabled={currentLessonIndex === 0}
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={currentLessonIndex === 0 ? COLORS.textLight : COLORS.primary}
            />
            <Text style={[
              styles.navButtonText,
              currentLessonIndex === 0 && styles.navButtonTextDisabled
            ]}>
              Önceki
            </Text>
          </TouchableOpacity>

          <Text style={styles.lessonCounter}>
            {currentLessonIndex + 1} / {lessons.length}
          </Text>

          <TouchableOpacity
            style={[styles.navButton, currentLessonIndex === lessons.length - 1 && styles.navButtonDisabled]}
            onPress={goToNextLesson}
            disabled={currentLessonIndex === lessons.length - 1}
          >
            <Text style={[
              styles.navButtonText,
              currentLessonIndex === lessons.length - 1 && styles.navButtonTextDisabled
            ]}>
              Sonraki
            </Text>
            <Ionicons
              name="chevron-forward"
              size={24}
              color={currentLessonIndex === lessons.length - 1 ? COLORS.textLight : COLORS.primary}
            />
          </TouchableOpacity>
        </View>
      )}
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
    paddingHorizontal: SIZES.padding,
    paddingVertical: 12,
    backgroundColor: COLORS.primary,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 8,
  },
  docInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.padding,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  docIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  docInfo: {
    flex: 1,
    marginLeft: 12,
  },
  docName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  docMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  docType: {
    fontSize: 12,
    fontWeight: '600',
  },
  docSize: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  uploadedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  uploadedText: {
    fontSize: 10,
    color: COLORS.success,
    fontWeight: '500',
  },
  viewerContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  webview: {
    flex: 1,
  },
  noDocument: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDocumentText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textLight,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.textLight,
  },
  // bottomBar ve downloadButton stilleri kaldırıldı - indirme devre dışı
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.padding,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  navButtonTextDisabled: {
    color: COLORS.textLight,
  },
  lessonCounter: {
    fontSize: 14,
    color: COLORS.textLight,
  },
});

export default DocumentViewerScreen;
