/**
 * ResponsiveUtils - Phase 8: Responsive Design System
 * Device detection and adaptive layout utilities
 * Material Design 3 breakpoint system implementation
 * Manushi Coaching Platform
 */

import { Dimensions, PixelRatio, Platform } from 'react-native';
import { useState, useEffect } from 'react';

const { width, height } = Dimensions.get('window');

// Material Design 3 Breakpoint System
export enum WindowSizeClass {
  COMPACT = 'COMPACT',    // Phones (< 600dp)
  MEDIUM = 'MEDIUM',      // Foldables, Tablets (600dp - 840dp)
  EXPANDED = 'EXPANDED'   // Large Tablets, Desktops (> 840dp)
}

export enum DeviceType {
  PHONE = 'PHONE',
  TABLET = 'TABLET',
  FOLDABLE = 'FOLDABLE',
  DESKTOP = 'DESKTOP'
}

export enum Orientation {
  PORTRAIT = 'PORTRAIT',
  LANDSCAPE = 'LANDSCAPE'
}

export interface ScreenDimensions {
  width: number;
  height: number;
  pixelRatio: number;
  fontScale: number;
}

export interface DeviceInfo {
  windowSizeClass: WindowSizeClass;
  deviceType: DeviceType;
  orientation: Orientation;
  dimensions: ScreenDimensions;
  isTablet: boolean;
  isPhone: boolean;
  isLandscape: boolean;
  isPortrait: boolean;
  safeAreaMultiplier: number;
}

// Convert pixels to dp (density-independent pixels)
const pixelsToDp = (pixels: number): number => {
  return pixels / PixelRatio.get();
};

// Determine window size class based on Material Design 3 breakpoints
export const getWindowSizeClass = (screenWidth: number): WindowSizeClass => {
  const widthDp = pixelsToDp(screenWidth);
  
  if (widthDp < 600) {
    return WindowSizeClass.COMPACT;
  } else if (widthDp >= 600 && widthDp < 840) {
    return WindowSizeClass.MEDIUM;
  } else {
    return WindowSizeClass.EXPANDED;
  }
};

// Determine device type based on screen dimensions and platform
export const getDeviceType = (screenWidth: number, screenHeight: number): DeviceType => {
  const widthDp = pixelsToDp(screenWidth);
  const heightDp = pixelsToDp(screenHeight);
  const minDimension = Math.min(widthDp, heightDp);
  
  // Foldable detection (simplified)
  const aspectRatio = Math.max(widthDp, heightDp) / minDimension;
  if (aspectRatio > 2.1) {
    return DeviceType.FOLDABLE;
  }
  
  // Tablet vs Phone detection
  if (minDimension >= 600 || (Platform.OS === 'android' && minDimension >= 480)) {
    return DeviceType.TABLET;
  }
  
  return DeviceType.PHONE;
};

// Get orientation
export const getOrientation = (screenWidth: number, screenHeight: number): Orientation => {
  return screenWidth > screenHeight ? Orientation.LANDSCAPE : Orientation.PORTRAIT;
};

// Calculate safe area multiplier for different device types
export const getSafeAreaMultiplier = (deviceType: DeviceType, orientation: Orientation): number => {
  if (deviceType === DeviceType.PHONE) {
    return orientation === Orientation.LANDSCAPE ? 1.2 : 1.0;
  } else if (deviceType === DeviceType.TABLET) {
    return 1.1;
  }
  return 1.0;
};

// Main function to get complete device information
export const getDeviceInfo = (
  screenWidth: number = width,
  screenHeight: number = height
): DeviceInfo => {
  const windowSizeClass = getWindowSizeClass(screenWidth);
  const deviceType = getDeviceType(screenWidth, screenHeight);
  const orientation = getOrientation(screenWidth, screenHeight);
  const safeAreaMultiplier = getSafeAreaMultiplier(deviceType, orientation);
  
  return {
    windowSizeClass,
    deviceType,
    orientation,
    dimensions: {
      width: screenWidth,
      height: screenHeight,
      pixelRatio: PixelRatio.get(),
      fontScale: PixelRatio.getFontScale(),
    },
    isTablet: deviceType === DeviceType.TABLET || deviceType === DeviceType.FOLDABLE,
    isPhone: deviceType === DeviceType.PHONE,
    isLandscape: orientation === Orientation.LANDSCAPE,
    isPortrait: orientation === Orientation.PORTRAIT,
    safeAreaMultiplier,
  };
};

// React Hook for responsive design
export const useResponsiveDesign = () => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => getDeviceInfo());

  useEffect(() => {
    const updateDeviceInfo = ({ window }: { window: { width: number; height: number } }) => {
      setDeviceInfo(getDeviceInfo(window.width, window.height));
    };

    const subscription = Dimensions.addEventListener('change', updateDeviceInfo);
    
    return () => subscription?.remove();
  }, []);

  return deviceInfo;
};

// Responsive spacing system
export const ResponsiveSpacing = {
  // Base spacing values (in dp)
  XS: 4,
  SM: 8,
  MD: 16,
  LG: 24,
  XL: 32,
  XXL: 48,

  // Adaptive spacing based on device type
  adaptive: (deviceInfo: DeviceInfo, baseSize: number): number => {
    const multiplier = deviceInfo.safeAreaMultiplier;
    
    switch (deviceInfo.windowSizeClass) {
      case WindowSizeClass.COMPACT:
        return baseSize * multiplier;
      case WindowSizeClass.MEDIUM:
        return baseSize * multiplier * 1.25;
      case WindowSizeClass.EXPANDED:
        return baseSize * multiplier * 1.5;
      default:
        return baseSize;
    }
  },

  // Get spacing for specific device contexts
  getSpacing: (deviceInfo: DeviceInfo) => ({
    xs: ResponsiveSpacing.adaptive(deviceInfo, ResponsiveSpacing.xs),
    sm: ResponsiveSpacing.adaptive(deviceInfo, ResponsiveSpacing.sm),
    md: ResponsiveSpacing.adaptive(deviceInfo, ResponsiveSpacing.md),
    lg: ResponsiveSpacing.adaptive(deviceInfo, ResponsiveSpacing.lg),
    xl: ResponsiveSpacing.adaptive(deviceInfo, ResponsiveSpacing.xl),
    xxl: ResponsiveSpacing.adaptive(deviceInfo, ResponsiveSpacing.XXL),
  }),
};

// Responsive typography system
export const ResponsiveTypography = {
  // Scale factors for different device classes
  scaleFactors: {
    [WindowSizeClass.COMPACT]: 1.0,
    [WindowSizeClass.MEDIUM]: 1.1,
    [WindowSizeClass.EXPANDED]: 1.2,
  },

  // Get scaled font size
  getScaledSize: (baseSize: number, deviceInfo: DeviceInfo): number => {
    const scaleFactor = ResponsiveTypography.scaleFactors[deviceInfo.windowSizeClass];
    const fontScaleAdjustment = Math.min(deviceInfo.dimensions.fontScale, 1.3); // Cap at 1.3x
    
    return Math.round(baseSize * scaleFactor * fontScaleAdjustment);
  },
};

// Grid system for responsive layouts
export const ResponsiveGrid = {
  // Column counts for different screen sizes
  getColumnCount: (deviceInfo: DeviceInfo, baseColumns: number = 1): number => {
    switch (deviceInfo.windowSizeClass) {
      case WindowSizeClass.COMPACT:
        return baseColumns;
      case WindowSizeClass.MEDIUM:
        return Math.min(baseColumns * 2, 3);
      case WindowSizeClass.EXPANDED:
        return Math.min(baseColumns * 3, 4);
      default:
        return baseColumns;
    }
  },

  // Get grid spacing
  getGridSpacing: (deviceInfo: DeviceInfo): number => {
    return ResponsiveSpacing.adaptive(deviceInfo, ResponsiveSpacing.md);
  },

  // Calculate item width for grid layouts
  getItemWidth: (deviceInfo: DeviceInfo, columns: number, spacing: number): number => {
    const totalSpacing = spacing * (columns - 1);
    const availableWidth = deviceInfo.dimensions.width - (ResponsiveSpacing.adaptive(deviceInfo, ResponsiveSpacing.lg) * 2);
    return (availableWidth - totalSpacing) / columns;
  },
};

// Navigation layout utilities
export const ResponsiveNavigation = {
  // Should use bottom navigation vs navigation rail/drawer
  shouldUseBottomNavigation: (deviceInfo: DeviceInfo): boolean => {
    return deviceInfo.windowSizeClass === WindowSizeClass.COMPACT && deviceInfo.isPortrait;
  },

  // Should use navigation rail
  shouldUseNavigationRail: (deviceInfo: DeviceInfo): boolean => {
    return deviceInfo.windowSizeClass === WindowSizeClass.MEDIUM || 
           (deviceInfo.windowSizeClass === WindowSizeClass.COMPACT && deviceInfo.isLandscape);
  },

  // Should use navigation drawer
  shouldUseNavigationDrawer: (deviceInfo: DeviceInfo): boolean => {
    return deviceInfo.windowSizeClass === WindowSizeClass.EXPANDED;
  },

  // Get navigation layout type
  getNavigationLayout: (deviceInfo: DeviceInfo): 'bottom' | 'rail' | 'drawer' => {
    if (ResponsiveNavigation.shouldUseNavigationDrawer(deviceInfo)) {
      return 'drawer';
    } else if (ResponsiveNavigation.shouldUseNavigationRail(deviceInfo)) {
      return 'rail';
    } else {
      return 'bottom';
    }
  },
};

// Adaptive content layout utilities
export const ResponsiveLayout = {
  // Should use master-detail layout
  shouldUseMasterDetail: (deviceInfo: DeviceInfo): boolean => {
    return deviceInfo.windowSizeClass !== WindowSizeClass.COMPACT;
  },

  // Get content padding
  getContentPadding: (deviceInfo: DeviceInfo) => {
    const spacing = ResponsiveSpacing.getSpacing(deviceInfo);
    
    switch (deviceInfo.windowSizeClass) {
      case WindowSizeClass.COMPACT:
        return {
          horizontal: spacing.md,
          vertical: spacing.sm,
        };
      case WindowSizeClass.MEDIUM:
        return {
          horizontal: spacing.lg,
          vertical: spacing.md,
        };
      case WindowSizeClass.EXPANDED:
        return {
          horizontal: spacing.xl,
          vertical: spacing.lg,
        };
      default:
        return {
          horizontal: spacing.md,
          vertical: spacing.sm,
        };
    }
  },

  // Get max content width for readability
  getMaxContentWidth: (deviceInfo: DeviceInfo): number | undefined => {
    if (deviceInfo.windowSizeClass === WindowSizeClass.EXPANDED) {
      return 1200; // Max width for large screens
    }
    return undefined; // No max width constraint for smaller screens
  },
};

// Utility for conditional rendering based on device type
export const ResponsiveRender = {
  forPhone: (deviceInfo: DeviceInfo, component: React.ReactNode): React.ReactNode | null => {
    return deviceInfo.isPhone ? component : null;
  },

  forTablet: (deviceInfo: DeviceInfo, component: React.ReactNode): React.ReactNode | null => {
    return deviceInfo.isTablet ? component : null;
  },

  forCompact: (deviceInfo: DeviceInfo, component: React.ReactNode): React.ReactNode | null => {
    return deviceInfo.windowSizeClass === WindowSizeClass.COMPACT ? component : null;
  },

  forMedium: (deviceInfo: DeviceInfo, component: React.ReactNode): React.ReactNode | null => {
    return deviceInfo.windowSizeClass === WindowSizeClass.MEDIUM ? component : null;
  },

  forExpanded: (deviceInfo: DeviceInfo, component: React.ReactNode): React.ReactNode | null => {
    return deviceInfo.windowSizeClass === WindowSizeClass.EXPANDED ? component : null;
  },

  forOrientation: (
    deviceInfo: DeviceInfo, 
    orientation: Orientation, 
    component: React.ReactNode
  ): React.ReactNode | null => {
    return deviceInfo.orientation === orientation ? component : null;
  },
};

export default {
  WindowSizeClass,
  DeviceType,
  Orientation,
  getDeviceInfo,
  useResponsiveDesign,
  ResponsiveSpacing,
  ResponsiveTypography,
  ResponsiveGrid,
  ResponsiveNavigation,
  ResponsiveLayout,
  ResponsiveRender,
};