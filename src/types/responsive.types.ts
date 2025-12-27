/**
 * Responsive System Types
 */

import { LayoutMode, BreakpointKey } from '../constants/breakpoints';

export interface ResponsiveContextValue {
  /** Current layout mode: mobile | tablet | desktop */
  layoutMode: LayoutMode;
  /** Current window width */
  width: number;
  /** Current window height */
  height: number;
  /** Is current layout desktop (>= 1024px) */
  isDesktop: boolean;
  /** Is current layout tablet (>= 768px && < 1024px) */
  isTablet: boolean;
  /** Is current layout mobile (< 768px) */
  isMobile: boolean;
  /** Is running on web platform */
  isWeb: boolean;
  /** Sidebar expanded state (web only) */
  isSidebarExpanded: boolean;
  /** Toggle sidebar expanded state */
  toggleSidebar: () => void;
  /** Set sidebar expanded state */
  setSidebarExpanded: (expanded: boolean) => void;
}

export interface ResponsiveStyleProps {
  /** Styles for mobile layout */
  mobile?: object;
  /** Styles for tablet layout */
  tablet?: object;
  /** Styles for desktop layout */
  desktop?: object;
}

export interface GridProps {
  /** Number of columns (1-4) */
  columns?: 1 | 2 | 3 | 4;
  /** Gap between items */
  gap?: number;
  /** Children */
  children: React.ReactNode;
}

export interface ContainerProps {
  /** Max width variant */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** Center content */
  centered?: boolean;
  /** Padding */
  padding?: number;
  /** Children */
  children: React.ReactNode;
}

export interface ColumnProps {
  /** Column span (1-4) */
  span?: 1 | 2 | 3 | 4;
  /** Span on mobile */
  mobileSpan?: 1 | 2 | 3 | 4;
  /** Span on tablet */
  tabletSpan?: 1 | 2 | 3 | 4;
  /** Span on desktop */
  desktopSpan?: 1 | 2 | 3 | 4;
  /** Children */
  children: React.ReactNode;
}
