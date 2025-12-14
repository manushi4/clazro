/**
 * ResourceViewerScreen - In-app resource viewer
 * Purpose: Display PDFs, videos, and documents within the app
 * Supports: PDF files, video files, web documents
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Share,
  Linking,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Pdf from 'react-native-pdf';
import Video from 'react-native-video';
import { WebView } from 'react-native-webview';
import RNFS from 'react-native-fs';
import { T } from '../../ui';
import { trackScreenView, trackAction } from '../../utils/navigationAnalytics';

type Props = NativeStackScreenProps<any, 'ResourceViewerScreen'>;

interface ResourceData {
  id: string;
  title: string;
  type: string;
  fileUrl: string;
  subject: string;
}

export default function ResourceViewerScreen({ route, navigation }: Props) {
  const resource = route.params?.resource as ResourceData;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [cachedFileUri, setCachedFileUri] = useState<string | null>(null);

  React.useEffect(() => {
    trackScreenView('ResourceViewerScreen', { resourceId: resource?.id, type: resource?.type });
  }, [resource]);

  // Check for cached PDF and download if needed
  React.useEffect(() => {
    const loadPDF = async () => {
      if (resource?.type?.toUpperCase() !== 'PDF') {
        setLoading(false);
        return;
      }

      try {
        // Generate cache file name from resource ID
        const fileName = `${resource.id}.pdf`;
        const cachedPath = `${RNFS.CachesDirectoryPath}/${fileName}`;

        console.log('Checking cache for:', cachedPath);

        // Check if file already exists in cache
        const fileExists = await RNFS.exists(cachedPath);

        if (fileExists) {
          console.log('✅ Loading from cache:', cachedPath);
          setCachedFileUri(`file://${cachedPath}`);
          setLoading(false);
        } else {
          console.log('⬇️ Downloading to cache...');
          setLoading(true);

          // Download file to cache
          const downloadResult = await RNFS.downloadFile({
            fromUrl: resource.fileUrl,
            toFile: cachedPath,
          }).promise;

          if (downloadResult.statusCode === 200) {
            console.log('✅ Downloaded to cache:', cachedPath);
            setCachedFileUri(`file://${cachedPath}`);
            setLoading(false);
          } else {
            console.error('Download failed:', downloadResult.statusCode);
            setError('Failed to load PDF. Please try again.');
            setLoading(false);
          }
        }
      } catch (err) {
        console.error('Cache error:', err);
        setError('Failed to load PDF. Please check your connection.');
        setLoading(false);
      }
    };

    loadPDF();
  }, [resource]);

  // Download file (works for PDF, VIDEO, DOC, etc.)
  const downloadPDF = async () => {
    try {
      setLoading(true);
      trackAction('download_resource', 'ResourceViewerScreen', { resourceId: resource.id });

      // Get file extension based on type
      const typeToExtension: Record<string, string> = {
        'pdf': 'pdf',
        'video': 'mp4',
        'doc': 'pdf',
        'presentation': 'pdf',
      };
      const fileExtension = typeToExtension[resource.type.toLowerCase()] || 'file';
      const fileName = `${resource.title.replace(/[^a-z0-9]/gi, '_')}.${fileExtension}`;

      // Download path - Downloads folder (scoped storage on Android 10+)
      const downloadPath = `${RNFS.DownloadDirectoryPath}/${fileName}`;

      console.log('Downloading to:', downloadPath);
      console.log('Download URL:', resource.fileUrl);

      // Download file
      const downloadResult = await RNFS.downloadFile({
        fromUrl: resource.fileUrl,
        toFile: downloadPath,
      }).promise;

      console.log('Download result:', downloadResult);

      setLoading(false);

      if (downloadResult.statusCode === 200) {
        Alert.alert(
          '✅ Download Complete!',
          `File saved to Downloads:\n${fileName}`,
          [{ text: 'OK' }]
        );
      } else {
        console.error('Download failed with status:', downloadResult.statusCode);
        Alert.alert('Download Failed', `Status code: ${downloadResult.statusCode}\nPlease try again.`);
      }
    } catch (error) {
      console.error('Download error:', error);
      setLoading(false);
      Alert.alert('Error', `Failed to download: ${error.message || 'Unknown error'}`);
    }
  };

  // Share file (works for PDF, VIDEO, DOC, etc.)
  const sharePDF = async () => {
    try {
      setLoading(true);
      trackAction('share_resource', 'ResourceViewerScreen', { resourceId: resource.id });

      // Get file extension based on type
      const typeToExtension: Record<string, string> = {
        'pdf': 'pdf',
        'video': 'mp4',
        'doc': 'pdf',
        'presentation': 'pdf',
      };
      const fileExtension = typeToExtension[resource.type.toLowerCase()] || 'file';
      const fileName = `${resource.title.replace(/[^a-z0-9]/gi, '_')}.${fileExtension}`;

      // Download to cache directory first
      const cachePath = `${RNFS.CachesDirectoryPath}/${fileName}`;

      console.log('Downloading for sharing to:', cachePath);

      // Download file
      const downloadResult = await RNFS.downloadFile({
        fromUrl: resource.fileUrl,
        toFile: cachePath,
      }).promise;

      setLoading(false);

      if (downloadResult.statusCode === 200) {
        // Share the downloaded file
        const shareResult = await Share.share({
          title: resource.title,
          message: `📚 ${resource.title}\n\nSubject: ${resource.subject}\n\nShared from Manushi Coaching App`,
          url: `file://${cachePath}`,
        });

        console.log('Share result:', shareResult);
      } else {
        Alert.alert('Error', 'Could not download file for sharing. Please try again.');
      }
    } catch (error) {
      console.error('Share error:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to share file. Please try again.');
    }
  };

  if (!resource || !resource.fileUrl) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <T style={styles.backIcon}>←</T>
          </TouchableOpacity>
          <T variant="title" weight="bold" style={styles.topBarTitle}>Resource Viewer</T>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <T variant="h2" style={styles.errorIcon}>⚠️</T>
          <T variant="body" style={styles.errorText}>No resource URL available</T>
          <TouchableOpacity
            style={styles.backToLibraryButton}
            onPress={() => navigation.goBack()}
          >
            <T variant="body" weight="semiBold" style={styles.backToLibraryText}>
              Back to Library
            </T>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const renderContent = () => {
    const fileType = resource.type.toUpperCase();

    // PDF Viewer - Use react-native-pdf with cached local file
    if (fileType === 'PDF') {
      if (!cachedFileUri) {
        // Still downloading to cache
        return null;
      }

      console.log('Rendering PDF from cache:', cachedFileUri);

      return (
        <Pdf
          source={{ uri: cachedFileUri, cache: true }}
          style={styles.pdf}
          onLoadComplete={(numberOfPages, filePath) => {
            console.log(`✅ PDF loaded from cache! Pages: ${numberOfPages}`);
            trackAction('pdf_loaded', 'ResourceViewerScreen', {
              resourceId: resource.id,
              pages: numberOfPages,
              cached: true
            });
          }}
          onPageChanged={(page, numberOfPages) => {
            console.log(`Page ${page} of ${numberOfPages}`);
          }}
          onError={(error) => {
            console.error('PDF error:', error);
            setError('Unable to display PDF. Please try again.');
          }}
          enablePaging={true}
          spacing={10}
          fitWidth={true}
          fitPolicy={2}
          horizontal={false}
        />
      );
    }

    // Video Player
    if (fileType === 'VIDEO') {
      // Check if video URL is valid
      if (!resource.fileUrl || resource.fileUrl.includes('example.com')) {
        return (
          <View style={styles.errorContainer}>
            <T variant="h2" style={styles.errorIcon}>🎥</T>
            <T variant="body" style={styles.errorText}>
              Video not available yet.{'\n\n'}
              This video needs to be uploaded to the server.
            </T>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => navigation.goBack()}
            >
              <T variant="body" weight="semiBold" style={styles.retryText}>Back to Library</T>
            </TouchableOpacity>
          </View>
        );
      }

      return (
        <View style={styles.videoContainer}>
          <Video
            source={{ uri: resource.fileUrl }}
            style={styles.video}
            controls={true}
            paused={paused}
            resizeMode="contain"
            onLoad={() => {
              setLoading(false);
              trackAction('video_loaded', 'ResourceViewerScreen', { resourceId: resource.id });
            }}
            onError={(error) => {
              setLoading(false);
              setError('Unable to play this video. The file may be unavailable or in an unsupported format.');
              console.error('Video error:', error);
            }}
          />
        </View>
      );
    }

    // WebView for DOC/other formats
    return (
      <WebView
        source={{ uri: resource.fileUrl }}
        style={styles.webview}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError('Failed to load document');
        }}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4A90E2" />
          </View>
        )}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => {
            trackAction('close_resource', 'ResourceViewerScreen', { resourceId: resource.id });
            navigation.goBack();
          }}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <T style={styles.backIcon}>←</T>
        </TouchableOpacity>

        <View style={styles.topBarCenter}>
          <T variant="caption" style={styles.topBarLabel} numberOfLines={1}>
            {resource.title}
          </T>
          <T variant="caption" style={styles.topBarSubtext}>
            {resource.type} • {resource.subject}
          </T>
        </View>

        <TouchableOpacity
          onPress={() => {
            const fileType = resource.type.toUpperCase();
            Alert.alert(
              'Resource Options',
              'Choose an action',
              [
                {
                  text: `Download ${fileType}`,
                  onPress: downloadPDF,
                },
                {
                  text: `Share ${fileType}`,
                  onPress: sharePDF,
                },
                { text: 'Cancel', style: 'cancel' },
              ]
            );
          }}
          style={styles.menuButton}
          accessibilityRole="button"
          accessibilityLabel="More options"
        >
          <T style={styles.menuIcon}>⋮</T>
        </TouchableOpacity>
      </View>

      {/* Content Area */}
      <View style={styles.contentArea}>
        {/* Always render content so WebView can load */}
        {!error && renderContent()}

        {/* Loading overlay - shows on top while loading */}
        {loading && !error && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#4A90E2" />
            <T variant="body" style={styles.loadingText}>Loading {resource.type}...</T>
          </View>
        )}

        {/* Error overlay - shows on top if error */}
        {error && (
          <View style={styles.errorOverlay}>
            <T variant="h2" style={styles.errorIcon}>⚠️</T>
            <T variant="body" style={styles.errorText}>{error}</T>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setError(null);
                setLoading(true);
              }}
            >
              <T variant="body" weight="semiBold" style={styles.retryText}>Retry</T>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F7F8',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 24,
    color: '#1F2937',
  },
  topBarCenter: {
    flex: 1,
    paddingHorizontal: 12,
  },
  topBarLabel: {
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '600',
  },
  topBarSubtext: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 2,
  },
  topBarTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#1F2937',
  },
  placeholder: {
    width: 40,
  },
  menuButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIcon: {
    fontSize: 24,
    color: '#1F2937',
    fontWeight: 'bold',
  },
  contentArea: {
    flex: 1,
    backgroundColor: '#F6F7F8',
  },
  pdf: {
    flex: 1,
    width: width,
    height: height,
    backgroundColor: '#FFFFFF',
  },
  videoContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: width,
    height: height - 100,
  },
  webview: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F6F7F8',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F6F7F8',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#F6F7F8',
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#F6F7F8',
    zIndex: 10,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#4A90E2',
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
  },
  backToLibraryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#4A90E2',
    borderRadius: 8,
  },
  backToLibraryText: {
    color: '#FFFFFF',
  },
});
