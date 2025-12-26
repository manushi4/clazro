/**
 * DynamicDrawerNavigator
 * Custom drawer implementation using React Native Animated API
 * No external drawer package required
 */

import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useAppTheme } from '../theme/useAppTheme';
import {
  useDrawerConfigQuery,
  useDrawerEnabled,
  useDrawerPosition,
} from '../hooks/queries/useDrawerConfigQuery';
import { DrawerContent } from '../components/drawer';
import { DynamicTabNavigator } from './DynamicTabNavigator';
import { useDrawerStore } from '../stores/drawerStore';
import type { Role } from '../types/permission.types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Props = {
  role: Role;
};

/**
 * Main component that combines custom drawer and tab navigation
 */
export const DynamicDrawerNavigator: React.FC<Props> = ({ role }) => {
  const { colors } = useAppTheme();
  const { data, isLoading } = useDrawerConfigQuery();
  const enabled = useDrawerEnabled();
  const position = useDrawerPosition();
  const { isOpen, closeDrawer } = useDrawerStore();

  const config = data?.config;

  // Calculate drawer width
  const drawerWidth = config
    ? Math.min(
        (SCREEN_WIDTH * config.width_percentage) / 100,
        config.width_max_px
      )
    : 280;

  // Animation values
  const translateX = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  // Get settings
  const animationDuration = config?.animation_duration || 300;
  const overlayOpacityValue = (config?.overlay_opacity || 50) / 100;
  const overlayColor = config?.overlay_color || '#000000';

  // Calculate positions based on drawer position
  const closedPosition = position === 'left' ? -drawerWidth : SCREEN_WIDTH;
  const openPosition = position === 'left' ? 0 : SCREEN_WIDTH - drawerWidth;

  // Store values in refs to avoid re-creating callbacks
  const positionsRef = useRef({ closedPosition, openPosition, overlayOpacityValue, animationDuration });
  positionsRef.current = { closedPosition, openPosition, overlayOpacityValue, animationDuration };

  // Sync animation with store state
  useEffect(() => {
    const { closedPosition: closed, openPosition: open, overlayOpacityValue: opacity, animationDuration: duration } = positionsRef.current;
    const toValue = isOpen ? open : closed;
    const toOpacity = isOpen ? opacity : 0;

    Animated.parallel([
      Animated.timing(translateX, {
        toValue,
        duration,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: toOpacity,
        duration,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isOpen, translateX, overlayOpacity]);

  // Initialize position on mount
  useEffect(() => {
    translateX.setValue(positionsRef.current.closedPosition);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If drawer is explicitly disabled (not just loading), skip drawer wrapper
  // Note: We always render the drawer Modal structure so it's ready when opened
  const drawerDisabled = !isLoading && enabled === false;

  return (
    <View style={styles.container}>
      {/* Main Content - Tab Navigator */}
      <View style={styles.content}>
        <DynamicTabNavigator role={role} />
      </View>

      {/* Drawer Modal - only show if drawer is not disabled */}
      {!drawerDisabled && (
        <Modal
          visible={isOpen}
          transparent
          animationType="none"
          onRequestClose={closeDrawer}
        >
        <View style={styles.modalContainer}>
          {/* Overlay */}
          <TouchableWithoutFeedback onPress={closeDrawer}>
            <Animated.View
              style={[
                styles.overlay,
                {
                  backgroundColor: overlayColor,
                  opacity: overlayOpacity,
                },
              ]}
            />
          </TouchableWithoutFeedback>

          {/* Drawer */}
          <View
            style={[
              styles.drawer,
              {
                left: 0,
                width: drawerWidth,
                backgroundColor: colors.surface,
                ...(config?.shadow_enabled && {
                  shadowColor: '#000',
                  shadowOffset: { width: position === 'left' ? 2 : -2, height: 0 },
                  shadowOpacity: (config?.shadow_opacity || 30) / 100,
                  shadowRadius: 8,
                  elevation: 16,
                }),
                ...(config?.border_radius && config.border_radius > 0 && {
                  borderTopRightRadius: position === 'left' ? config.border_radius : 0,
                  borderBottomRightRadius: position === 'left' ? config.border_radius : 0,
                  borderTopLeftRadius: position === 'right' ? config.border_radius : 0,
                  borderBottomLeftRadius: position === 'right' ? config.border_radius : 0,
                }),
              },
            ]}
          >
            <DrawerContent />
          </View>
        </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
  },
});
