/**
 * MathPreview - Real-time LaTeX/MathML Rendering Component
 * Phase 20: Rich Mathematical Editor
 * Provides live preview of mathematical expressions with WebView rendering
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../context/ThemeContext';
import {
  generateMathHtml,
  validateLatexForRendering,
  generateErrorHtml,
  latexToPlainText,
  RenderOptions,
} from '../../utils/latexRenderer';

export interface MathPreviewProps {
  latex: string;
  fontSize?: number;
  inline?: boolean;
  showControls?: boolean;
  autoHeight?: boolean;
  maxHeight?: number;
  backgroundColor?: string;
  onRenderComplete?: (success: boolean) => void;
  onError?: (error: string) => void;
  accessibilityLabel?: string;
}

interface PreviewState {
  isLoading: boolean;
  hasError: boolean;
  errorMessage: string;
  renderedHeight: number;
  isReady: boolean;
}

const { width: screenWidth } = Dimensions.get('window');

const MathPreview: React.FC<MathPreviewProps> = ({
  latex,
  fontSize = 16,
  inline = false,
  showControls = true,
  autoHeight = true,
  maxHeight = 200,
  backgroundColor,
  onRenderComplete,
  onError,
  accessibilityLabel = 'Mathematical expression preview',
}) => {
  const { theme } = useTheme();
  const webViewRef = useRef<WebView>(null);
  
  const [state, setState] = useState<PreviewState>({
    isLoading: true,
    hasError: false,
    errorMessage: '',
    renderedHeight: 60,
    isReady: false,
  });

  const [zoom, setZoom] = useState(1.0);
  const [showPlainText, setShowPlainText] = useState(false);

  // Generate render options
  const renderOptions: RenderOptions = {
    inline,
    fontSize: fontSize * zoom,
    color: theme.OnSurface,
    backgroundColor: backgroundColor || theme.Surface,
    scale: zoom,
  };

  // Generate HTML content
  const generateContent = useCallback(() => {
    if (!latex.trim()) {
      return `
        <html>
          <body style="margin:0;padding:20px;display:flex;align-items:center;justify-content:center;background-color:${renderOptions.backgroundColor};color:${renderOptions.color};">
            <div style="text-align:center;color:#999;font-style:italic;">
              Enter mathematical expression to see preview
            </div>
          </body>
        </html>
      `;
    }

    const validation = validateLatexForRendering(latex);
    if (!validation.isValid) {
      return generateErrorHtml(validation.error || 'Invalid LaTeX expression', renderOptions);
    }

    return generateMathHtml(latex, renderOptions);
  }, [latex, renderOptions]);

  // Handle WebView messages
  const handleMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      switch (data.type) {
        case 'ready':
          setState(prev => ({ 
            ...prev, 
            isLoading: false, 
            isReady: true, 
            hasError: false 
          }));
          onRenderComplete?.(true);
          break;
          
        case 'resize':
          if (autoHeight && data.height) {
            const newHeight = Math.min(data.height + 20, maxHeight);
            setState(prev => ({ 
              ...prev, 
              renderedHeight: newHeight 
            }));
          }
          break;
          
        case 'error':
          setState(prev => ({ 
            ...prev, 
            isLoading: false, 
            hasError: true, 
            errorMessage: data.message || 'Rendering error' 
          }));
          onError?.(data.message || 'Rendering error');
          onRenderComplete?.(false);
          break;
      }
    } catch (error) {
      console.warn('Failed to parse WebView message:', error);
    }
  }, [autoHeight, maxHeight, onRenderComplete, onError]);

  // Handle WebView load start
  const handleLoadStart = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      hasError: false, 
      isReady: false 
    }));
  }, []);

  // Handle WebView load error
  const handleLoadError = useCallback((error: any) => {
    setState(prev => ({ 
      ...prev, 
      isLoading: false, 
      hasError: true, 
      errorMessage: 'Failed to load preview' 
    }));
    onError?.('Failed to load preview');
    onRenderComplete?.(false);
  }, [onError, onRenderComplete]);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev + 0.1, 2.0));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev - 0.1, 0.5));
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoom(1.0);
  }, []);

  // Refresh preview
  const handleRefresh = useCallback(() => {
    webViewRef.current?.reload();
  }, []);

  // Copy LaTeX
  const handleCopy = useCallback(() => {
    // In a real implementation, you'd use a clipboard library
    Alert.alert(
      'LaTeX Code',
      latex,
      [
        { text: 'OK', style: 'default' },
      ]
    );
  }, [latex]);

  // Toggle plain text view
  const handleTogglePlainText = useCallback(() => {
    setShowPlainText(prev => !prev);
  }, []);

  // Effect to regenerate content when latex or options change
  useEffect(() => {
    if (state.isReady) {
      // Reload WebView with new content
      webViewRef.current?.reload();
    }
  }, [latex, zoom, state.isReady]);

  const getStyles = (theme: any) => StyleSheet.create({
    container: {
      backgroundColor: theme.Surface,
      borderRadius: 12,
      padding: 16,
      marginVertical: 8,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },

    title: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.OnSurface,
    },

    controls: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },

    controlButton: {
      padding: 6,
      borderRadius: 6,
      backgroundColor: theme.SurfaceVariant,
    },

    controlIcon: {
      color: theme.OnSurfaceVariant,
    },

    previewContainer: {
      borderWidth: 1,
      borderColor: theme.Outline,
      borderRadius: 8,
      backgroundColor: theme.background,
      overflow: 'hidden',
      position: 'relative',
    },

    webView: {
      backgroundColor: 'transparent',
    },

    loadingContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.Surface,
    },

    loadingText: {
      marginTop: 8,
      fontSize: 14,
      color: theme.OnSurfaceVariant,
    },

    errorContainer: {
      padding: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.errorContainer,
      borderRadius: 8,
    },

    errorIcon: {
      color: theme.OnErrorContainer,
      marginBottom: 8,
    },

    errorText: {
      fontSize: 14,
      color: theme.OnErrorContainer,
      textAlign: 'center',
      marginBottom: 12,
    },

    retryButton: {
      backgroundColor: theme.error,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
    },

    retryButtonText: {
      color: theme.OnError,
      fontSize: 12,
      fontWeight: '600',
    },

    plainTextContainer: {
      padding: 16,
      backgroundColor: theme.SurfaceVariant,
      borderRadius: 8,
    },

    plainTextLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.OnSurfaceVariant,
      marginBottom: 8,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },

    plainText: {
      fontSize: 14,
      color: theme.OnSurfaceVariant,
      lineHeight: 20,
      fontStyle: 'italic',
    },

    zoomInfo: {
      marginTop: 8,
      alignItems: 'center',
    },

    zoomText: {
      fontSize: 11,
      color: theme.OnSurfaceVariant,
    },

    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.OutlineVariant,
    },

    footerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },

    footerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: theme.SurfaceVariant,
    },

    footerButtonText: {
      fontSize: 12,
      color: theme.OnSurfaceVariant,
      marginLeft: 4,
    },
  });

  const styles = getStyles(theme);
  const previewHeight = autoHeight ? Math.max(state.renderedHeight, 60) : maxHeight;

  if (showPlainText) {
    return (
      <View style={styles.container}>
        {showControls && (
          <View style={styles.header}>
            <Text style={styles.title}>Math Preview (Text)</Text>
            <View style={styles.controls}>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={handleTogglePlainText}
                accessibilityLabel="Switch to visual preview"
              >
                <Icon name="visibility" size={18} style={styles.controlIcon} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        <View style={styles.plainTextContainer}>
          <Text style={styles.plainTextLabel}>Accessible Description</Text>
          <Text style={styles.plainText}>
            {latex ? latexToPlainText(latex) : 'No mathematical expression entered'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {showControls && (
        <View style={styles.header}>
          <Text style={styles.title}>Math Preview</Text>
          <View style={styles.controls}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={handleZoomOut}
              disabled={zoom <= 0.5}
              accessibilityLabel="Zoom out"
            >
              <Icon name="zoom-out" size={18} style={styles.controlIcon} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.controlButton}
              onPress={handleResetZoom}
              accessibilityLabel="Reset zoom"
            >
              <Icon name="crop-free" size={18} style={styles.controlIcon} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.controlButton}
              onPress={handleZoomIn}
              disabled={zoom >= 2.0}
              accessibilityLabel="Zoom in"
            >
              <Icon name="zoom-in" size={18} style={styles.controlIcon} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.controlButton}
              onPress={handleRefresh}
              accessibilityLabel="Refresh preview"
            >
              <Icon name="refresh" size={18} style={styles.controlIcon} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.previewContainer}>
        {state.hasError ? (
          <View style={[styles.errorContainer, { height: previewHeight }]}>
            <Icon name="error-outline" size={32} style={styles.errorIcon} />
            <Text style={styles.errorText}>{state.errorMessage}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <WebView
            ref={webViewRef}
            style={[styles.webView, { height: previewHeight }]}
            source={{ html: generateContent() }}
            onMessage={handleMessage}
            onLoadStart={handleLoadStart}
            onError={handleLoadError}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            scrollEnabled={false}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            accessibilityLabel={accessibilityLabel}
            accessible={true}
          />
        )}

        {state.isLoading && !state.hasError && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator 
              size="small" 
              color={theme.primary} 
            />
            <Text style={styles.loadingText}>Rendering...</Text>
          </View>
        )}
      </View>

      {showControls && (
        <>
          {zoom !== 1.0 && (
            <View style={styles.zoomInfo}>
              <Text style={styles.zoomText}>
                Zoom: {Math.round(zoom * 100)}%
              </Text>
            </View>
          )}

          <View style={styles.footer}>
            <View style={styles.footerLeft}>
              <TouchableOpacity
                style={styles.footerButton}
                onPress={handleTogglePlainText}
                accessibilityLabel="View accessible text description"
              >
                <Icon name="accessibility" size={16} style={styles.controlIcon} />
                <Text style={styles.footerButtonText}>Text View</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.footerButton}
              onPress={handleCopy}
              disabled={!latex.trim()}
              accessibilityLabel="Copy LaTeX code"
            >
              <Icon name="content-copy" size={16} style={styles.controlIcon} />
              <Text style={styles.footerButtonText}>Copy LaTeX</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

export default MathPreview;