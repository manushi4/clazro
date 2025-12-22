import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  ScrollView,
  Linking,
} from 'react-native';
import type { WidgetProps } from '../../../types/widget.types';
import { useAppTheme } from '../../../theme/useAppTheme';
import { useTranslation } from 'react-i18next';
import { AppText } from '../../../ui/components/AppText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { addBreadcrumb } from '../../../error/errorReporting';
import {
  useMediaBannerQuery,
  MediaItem,
  extractYouTubeId,
  getYouTubeThumbnail,
} from '../../../hooks/queries/useMediaBannerQuery';

const WIDGET_ID = 'media.banner';
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Aspect ratio calculations
const ASPECT_RATIOS: Record<string, number> = {
  '16:9': 9 / 16,
  '4:3': 3 / 4,
  '1:1': 1,
  '21:9': 9 / 21,
  '9:16': 16 / 9,
};

export const MediaBannerWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
  size = 'standard',
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation('common');
  const { trackWidgetEvent } = useAnalytics();
  const scrollRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const autoPlayTimer = useRef<NodeJS.Timeout | null>(null);

  // Config options with defaults - ALL CONFIGURABLE VIA PLATFORM STUDIO
  const bannerId = config?.bannerId as string | undefined;
  const slot = config?.slot as string | undefined;
  
  // Direct media config (for copy-paste reuse)
  const mediaType = (config?.mediaType as string) || 'image';
  const mediaUrl = config?.mediaUrl as string | undefined;
  const mediaItems = config?.mediaItems as MediaItem[] | undefined;
  const title = config?.title as string | undefined;
  const subtitle = config?.subtitle as string | undefined;
  const ctaText = config?.ctaText as string | undefined;
  const ctaAction = config?.ctaAction as string | undefined;
  const ctaUrl = config?.ctaUrl as string | undefined;
  
  // Display options
  const aspectRatio = (config?.aspectRatio as string) || '16:9';
  const autoPlay = config?.autoPlay !== false;
  const autoPlayInterval = (config?.autoPlayInterval as number) || 5000;
  const loop = config?.loop !== false;
  const showIndicators = config?.showIndicators !== false;
  const showControls = config?.showControls !== false;
  const showOverlay = config?.showOverlay !== false;
  const overlayGradient = config?.overlayGradient !== false;
  const customBorderRadius = (config?.borderRadius as number) ?? 12;
  const showPlayButton = config?.showPlayButton !== false;
  const enableTap = config?.enableTap !== false;
  const fullWidth = config?.fullWidth === true;

  // Build fallback items from direct config
  const fallbackItems: MediaItem[] | undefined = mediaUrl
    ? [
        {
          id: 'config-1',
          type: mediaType as any,
          url: mediaUrl,
          title,
          subtitle,
          ctaText,
          ctaAction,
          ctaUrl,
        },
      ]
    : mediaItems;

  // Fetch banner data
  const { data: bannerData, isLoading, error } = useMediaBannerQuery({
    bannerId,
    slot,
    fallbackItems,
  });

  const items = bannerData?.items || [];
  const containerWidth = fullWidth ? SCREEN_WIDTH : SCREEN_WIDTH - 32;
  const containerHeight = containerWidth * ASPECT_RATIOS[aspectRatio];

  // Auto-play carousel
  useEffect(() => {
    if (autoPlay && items.length > 1) {
      autoPlayTimer.current = setInterval(() => {
        setCurrentIndex((prev) => {
          const next = prev + 1;
          if (next >= items.length) {
            return loop ? 0 : prev;
          }
          return next;
        });
      }, autoPlayInterval);
    }

    return () => {
      if (autoPlayTimer.current) {
        clearInterval(autoPlayTimer.current);
      }
    };
  }, [autoPlay, items.length, loop, autoPlayInterval]);

  // Scroll to current index
  useEffect(() => {
    scrollRef.current?.scrollTo({
      x: currentIndex * containerWidth,
      animated: true,
    });
  }, [currentIndex, containerWidth]);

  // Handle scroll end
  const handleScrollEnd = useCallback(
    (event: any) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const newIndex = Math.round(offsetX / containerWidth);
      setCurrentIndex(newIndex);
    },
    [containerWidth]
  );

  // Handle CTA press
  const handleCtaPress = (item: MediaItem) => {
    trackWidgetEvent(WIDGET_ID, 'click', {
      action: 'cta_press',
      itemId: item.id,
      ctaAction: item.ctaAction,
    });
    addBreadcrumb({
      category: 'widget',
      message: `${WIDGET_ID}_cta_press`,
      level: 'info',
      data: { itemId: item.id, ctaAction: item.ctaAction },
    });

    if (item.ctaAction === 'navigate' && item.ctaUrl) {
      onNavigate?.(item.ctaUrl);
    } else if (item.ctaAction === 'link' && item.ctaUrl) {
      Linking.openURL(item.ctaUrl);
    } else if (item.ctaAction === 'video' && item.url) {
      // Open video player
      onNavigate?.('video-player', { url: item.url });
    }
  };

  // Handle media tap
  const handleMediaTap = (item: MediaItem) => {
    if (!enableTap) return;

    trackWidgetEvent(WIDGET_ID, 'click', {
      action: 'media_tap',
      itemId: item.id,
      mediaType: item.type,
    });

    if (item.type === 'video' || item.type === 'youtube') {
      onNavigate?.('video-player', { url: item.url });
    } else if (item.ctaUrl) {
      handleCtaPress(item);
    }
  };

  // Render single media item
  const renderMediaItem = (item: MediaItem, index: number) => {
    const isVideo = item.type === 'video' || item.type === 'youtube';
    const youtubeId = item.type === 'youtube' ? extractYouTubeId(item.url) : null;
    const thumbnailUrl = youtubeId ? getYouTubeThumbnail(youtubeId) : item.thumbnail || item.url;

    return (
      <TouchableOpacity
        key={item.id}
        activeOpacity={enableTap ? 0.9 : 1}
        onPress={() => handleMediaTap(item)}
        style={[
          styles.mediaContainer,
          {
            width: containerWidth,
            height: containerHeight,
            borderRadius: customBorderRadius,
          },
        ]}
        accessibilityLabel={item.title || t('widgets.mediaBanner.mediaItem', { defaultValue: 'Media item' })}
        accessibilityRole="button"
      >
        {/* Image/Thumbnail */}
        <Image
          source={{ uri: thumbnailUrl }}
          style={[styles.mediaImage, { borderRadius: customBorderRadius }]}
          resizeMode="cover"
          onLoadStart={() => setImageLoading(true)}
          onLoadEnd={() => setImageLoading(false)}
          onError={() => setImageError(true)}
        />

        {/* Loading indicator */}
        {imageLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        )}

        {/* Error state */}
        {imageError && (
          <View style={[styles.errorOverlay, { backgroundColor: colors.surfaceVariant }]}>
            <Icon name="image-broken" size={40} color={colors.outline} />
            <AppText style={[styles.errorText, { color: colors.onSurfaceVariant }]}>
              {t('widgets.mediaBanner.loadError', { defaultValue: 'Failed to load' })}
            </AppText>
          </View>
        )}

        {/* Video play button */}
        {isVideo && showPlayButton && !imageLoading && (
          <View style={styles.playButtonContainer}>
            <View style={[styles.playButton, { backgroundColor: colors.primary }]}>
              <Icon name="play" size={32} color="#fff" />
            </View>
          </View>
        )}

        {/* Overlay gradient - using View with opacity instead of LinearGradient */}
        {showOverlay && overlayGradient && (item.title || item.subtitle || item.ctaText) && (
          <View style={[styles.gradientOverlay, { borderRadius: customBorderRadius }]}>
            <View style={styles.gradientTop} />
            <View style={styles.gradientBottom} />
          </View>
        )}

        {/* Content overlay */}
        {showOverlay && (item.title || item.subtitle || item.ctaText) && (
          <View style={styles.contentOverlay}>
            {item.title && (
              <AppText style={styles.overlayTitle} numberOfLines={2}>
                {item.title}
              </AppText>
            )}
            {item.subtitle && (
              <AppText style={styles.overlaySubtitle} numberOfLines={2}>
                {item.subtitle}
              </AppText>
            )}
            {item.ctaText && (
              <TouchableOpacity
                style={[styles.ctaButton, { backgroundColor: colors.primary }]}
                onPress={() => handleCtaPress(item)}
                accessibilityLabel={item.ctaText}
                accessibilityRole="button"
              >
                <AppText style={styles.ctaText}>{item.ctaText}</AppText>
                <Icon name="arrow-right" size={16} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          {
            height: containerHeight,
            backgroundColor: colors.surfaceVariant,
            borderRadius: customBorderRadius,
          },
        ]}
      >
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  // Error/Empty state - show placeholder with configure message
  if (items.length === 0) {
    return (
      <View
        style={[
          styles.emptyContainer,
          {
            height: containerHeight,
            backgroundColor: colors.surfaceVariant,
            borderRadius: customBorderRadius,
          },
        ]}
      >
        <Icon name="image-plus" size={40} color={colors.primary} />
        <AppText style={[styles.emptyText, { color: colors.onSurfaceVariant }]}>
          {t('widgets.mediaBanner.configure', { defaultValue: 'Configure media in Platform Studio' })}
        </AppText>
      </View>
    );
  }

  // Single item
  if (items.length === 1) {
    return (
      <View style={[styles.container, fullWidth && styles.fullWidth]}>
        {renderMediaItem(items[0], 0)}
      </View>
    );
  }

  // Carousel
  return (
    <View style={[styles.container, fullWidth && styles.fullWidth]}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        scrollEventThrottle={16}
      >
        {items.map((item, index) => renderMediaItem(item, index))}
      </ScrollView>

      {/* Carousel indicators */}
      {showIndicators && items.length > 1 && (
        <View style={styles.indicatorsContainer}>
          {items.map((_, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => setCurrentIndex(index)}
              style={[
                styles.indicator,
                {
                  backgroundColor:
                    index === currentIndex ? colors.primary : 'rgba(255,255,255,0.5)',
                },
              ]}
            />
          ))}
        </View>
      )}

      {/* Navigation arrows */}
      {showControls && items.length > 1 && (
        <>
          {currentIndex > 0 && (
            <TouchableOpacity
              style={[styles.navButton, styles.navButtonLeft]}
              onPress={() => setCurrentIndex((prev) => prev - 1)}
              accessibilityLabel={t('widgets.mediaBanner.previous', { defaultValue: 'Previous' })}
            >
              <Icon name="chevron-left" size={24} color="#fff" />
            </TouchableOpacity>
          )}
          {currentIndex < items.length - 1 && (
            <TouchableOpacity
              style={[styles.navButton, styles.navButtonRight]}
              onPress={() => setCurrentIndex((prev) => prev + 1)}
              accessibilityLabel={t('widgets.mediaBanner.next', { defaultValue: 'Next' })}
            >
              <Icon name="chevron-right" size={24} color="#fff" />
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  fullWidth: {
    marginHorizontal: -16,
  },
  mediaContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 12,
    marginTop: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
  },
  playButtonContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  gradientTop: {
    flex: 1,
  },
  gradientBottom: {
    height: '60%',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  contentOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  overlayTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  overlaySubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 12,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  indicatorsContainer: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonLeft: {
    left: 8,
  },
  navButtonRight: {
    right: 8,
  },
});

export default MediaBannerWidget;
