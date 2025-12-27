/**
 * WebModal - Centered modal dialog for web
 *
 * Shows as a centered modal on desktop/tablet, uses full screen on mobile.
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Modal, Pressable, Animated, Dimensions, Platform } from 'react-native';
import { useAppTheme } from '../../theme/useAppTheme';
import { useResponsiveContext } from '../../context/ResponsiveContext';
import { WebModalHeader } from './WebModalHeader';
import { WebModalBody } from './WebModalBody';
import { WebModalFooter } from './WebModalFooter';
import type { WebModalProps, ModalSize } from '../../types/modal.types';

// Modal sizes in pixels
const MODAL_SIZES: Record<ModalSize, number> = {
  sm: 400,
  md: 560,
  lg: 720,
  xl: 960,
  full: Dimensions.get('window').width,
};

interface WebModalComponent extends React.FC<WebModalProps> {
  Header: typeof WebModalHeader;
  Body: typeof WebModalBody;
  Footer: typeof WebModalFooter;
}

export const WebModal: WebModalComponent = ({
  visible,
  onClose,
  title,
  subtitle,
  size = 'md',
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  header,
  footer,
  children,
  style,
  contentStyle,
}) => {
  const { colors } = useAppTheme();
  const { isMobile } = useResponsiveContext();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  // Handle escape key
  useEffect(() => {
    if (Platform.OS !== 'web' || !visible || !closeOnEscape) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [visible, closeOnEscape, onClose]);

  // Animation
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 200,
          friction: 20,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, scaleAnim]);

  // Prevent body scroll when modal is open (web only)
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    if (visible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [visible]);

  const handleBackdropPress = () => {
    if (closeOnBackdrop) {
      onClose();
    }
  };

  const modalWidth = isMobile ? '100%' : MODAL_SIZES[size];
  const isFullscreen = size === 'full' || isMobile;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View
        style={[
          styles.backdrop,
          { opacity: fadeAnim },
        ]}
      >
        <Pressable
          style={styles.backdropPress}
          onPress={handleBackdropPress}
        />

        <Animated.View
          style={[
            styles.container,
            {
              backgroundColor: colors.surface,
              width: modalWidth,
              maxWidth: isFullscreen ? '100%' : MODAL_SIZES[size],
              transform: [{ scale: scaleAnim }],
            },
            isFullscreen && styles.containerFullscreen,
            style,
          ]}
        >
          {/* Header */}
          {(title || subtitle || header) && (
            header || (
              <WebModalHeader
                title={title}
                subtitle={subtitle}
                onClose={onClose}
                showCloseButton={showCloseButton}
              />
            )
          )}

          {/* Body */}
          <WebModalBody style={contentStyle}>
            {children}
          </WebModalBody>

          {/* Footer */}
          {footer && (
            <WebModalFooter>{footer}</WebModalFooter>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdropPress: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    borderRadius: 12,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 16,
    overflow: 'hidden',
  },
  containerFullscreen: {
    width: '100%',
    height: '100%',
    maxHeight: '100%',
    borderRadius: 0,
  },
});

// Compound component exports
WebModal.Header = WebModalHeader;
WebModal.Body = WebModalBody;
WebModal.Footer = WebModalFooter;

export default WebModal;
