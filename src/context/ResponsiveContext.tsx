/**
 * ResponsiveContext
 * Provides responsive layout state throughout the app
 */

import React, { createContext, useContext, useState, useCallback, PropsWithChildren } from 'react';
import { Platform } from 'react-native';
import { useResponsive } from '../hooks/useResponsive';
import { ResponsiveContextValue } from '../types/responsive.types';
import { SIDEBAR_WIDTH } from '../constants/breakpoints';

const defaultValue: ResponsiveContextValue = {
  layoutMode: 'mobile',
  width: 375,
  height: 812,
  isDesktop: false,
  isTablet: false,
  isMobile: true,
  isWeb: false,
  isSidebarExpanded: true,
  toggleSidebar: () => {},
  setSidebarExpanded: () => {},
};

const ResponsiveContext = createContext<ResponsiveContextValue>(defaultValue);

/**
 * Hook to access responsive context
 */
export const useResponsiveContext = (): ResponsiveContextValue => {
  const context = useContext(ResponsiveContext);
  if (!context) {
    throw new Error('useResponsiveContext must be used within ResponsiveProvider');
  }
  return context;
};

/**
 * ResponsiveProvider component
 * Wrap your app with this to enable responsive features
 */
export const ResponsiveProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const responsive = useResponsive();
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  const toggleSidebar = useCallback(() => {
    setIsSidebarExpanded(prev => !prev);
  }, []);

  const setSidebarExpanded = useCallback((expanded: boolean) => {
    setIsSidebarExpanded(expanded);
  }, []);

  // Auto-collapse sidebar on tablet
  React.useEffect(() => {
    if (responsive.isTablet) {
      setIsSidebarExpanded(false);
    } else if (responsive.isDesktop) {
      setIsSidebarExpanded(true);
    }
  }, [responsive.isTablet, responsive.isDesktop]);

  const value: ResponsiveContextValue = {
    ...responsive,
    isSidebarExpanded,
    toggleSidebar,
    setSidebarExpanded,
  };

  return (
    <ResponsiveContext.Provider value={value}>
      {children}
    </ResponsiveContext.Provider>
  );
};

/**
 * HOC to wrap a component with ResponsiveProvider
 * Only wraps on web platform
 */
export function withResponsiveProvider<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> {
  return function WrappedComponent(props: P) {
    if (Platform.OS === 'web') {
      return (
        <ResponsiveProvider>
          <Component {...props} />
        </ResponsiveProvider>
      );
    }
    return <Component {...props} />;
  };
}

export default ResponsiveContext;
