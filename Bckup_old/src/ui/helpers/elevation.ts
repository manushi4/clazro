/**
 * Elevation Helper
 * Cross-platform shadow/elevation helper
 *
 * Usage:
 * <View style={elevation(3)}>
 *   Content
 * </View>
 */

import { Platform, ViewStyle } from 'react-native';

export type ElevationLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 12 | 16 | 24;

/**
 * Get elevation style for both iOS (shadow) and Android (elevation)
 */
export const elevation = (level: ElevationLevel): ViewStyle => {
  if (level === 0) {
    return {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    };
  }

  // Calculate shadow based on elevation level
  const shadowHeight = Math.ceil(level / 2);
  const shadowRadius = level;
  const shadowOpacity = 0.1 + (level * 0.01);

  if (Platform.OS === 'ios') {
    return {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: shadowHeight },
      shadowOpacity: Math.min(shadowOpacity, 0.3),
      shadowRadius,
    };
  }

  // Android
  return {
    elevation: level,
  };
};

/**
 * Preset elevation levels matching Material Design 3
 */
export const elevationPresets = {
  none: elevation(0),
  resting: elevation(1),  // Cards, buttons resting
  hover: elevation(3),    // Hover state
  raised: elevation(6),   // FAB, dialogs
  modal: elevation(8),    // Modal overlays
  drawer: elevation(16),  // Navigation drawers
};
