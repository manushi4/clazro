/**
 * useResponsive Hook
 * Provides responsive breakpoint detection
 */

import { useState, useEffect, useCallback } from 'react';
import { useWindowDimensions, Platform } from 'react-native';
import {
  BREAKPOINTS,
  LayoutMode,
  getLayoutMode,
  BreakpointKey
} from '../constants/breakpoints';

interface ResponsiveState {
  width: number;
  height: number;
  layoutMode: LayoutMode;
  isDesktop: boolean;
  isTablet: boolean;
  isMobile: boolean;
  isWeb: boolean;
}

/**
 * Hook for responsive breakpoint detection
 * Works on all platforms but most useful on web
 */
export const useResponsive = (): ResponsiveState => {
  const { width, height } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';

  const layoutMode = getLayoutMode(width);

  return {
    width,
    height,
    layoutMode,
    isDesktop: layoutMode === 'desktop',
    isTablet: layoutMode === 'tablet',
    isMobile: layoutMode === 'mobile',
    isWeb,
  };
};

/**
 * Check if current width is above a breakpoint
 */
export const useBreakpoint = (breakpoint: BreakpointKey): boolean => {
  const { width } = useWindowDimensions();
  return width >= BREAKPOINTS[breakpoint];
};

/**
 * Get value based on current breakpoint
 */
export function useResponsiveValue<T>(values: {
  mobile: T;
  tablet?: T;
  desktop?: T;
}): T {
  const { layoutMode } = useResponsive();

  if (layoutMode === 'desktop' && values.desktop !== undefined) {
    return values.desktop;
  }
  if (layoutMode === 'tablet' && values.tablet !== undefined) {
    return values.tablet;
  }
  return values.mobile;
}

/**
 * Get responsive styles based on current breakpoint
 */
export function useResponsiveStyles<T extends object>(styles: {
  base: T;
  mobile?: Partial<T>;
  tablet?: Partial<T>;
  desktop?: Partial<T>;
}): T {
  const { layoutMode } = useResponsive();

  let result = { ...styles.base };

  if (styles.mobile) {
    result = { ...result, ...styles.mobile };
  }

  if (layoutMode === 'tablet' && styles.tablet) {
    result = { ...result, ...styles.tablet };
  }

  if (layoutMode === 'desktop' && styles.desktop) {
    result = { ...result, ...styles.desktop };
  }

  return result;
}

export default useResponsive;
