/**
 * Material Design 3 Design System - ASKIE SPEC PACK
 * Following Material Design 3 specifications
 * Updated with MD3 tokens for consistent mobile UI
 */

export const Colors = {
  // Background & Surfaces (MD3)
  background: '#F8FAFC',     // Soft gray-blue
  surface: '#FFFFFF',        // Pure white
  surfaceAlt: '#F8FAFC',     // ✅ MD3 alternate surface
  surfaceVariant: '#F1F5F9',

  // Primary Colors (Calm Blue - MD3)
  primary: '#2563EB',        // MD3 Blue
  primaryLight: '#60A5FA',
  primaryDark: '#1E40AF',
  primaryContainer: '#DBEAFE',

  // Alternative: Teal (uncomment to use)
  // primary: '#14B8A6',
  // primaryLight: '#5EEAD4',
  // primaryDark: '#0F766E',
  // primaryContainer: '#CCFBF1',

  // Accent Colors
  accent: '#2563EB',         // Same as primary for consistency
  accentLight: '#60A5FA',

  // Functional Colors (MD3 Standard)
  success: '#10B981',        // Green
  successLight: '#D1FAE5',
  successContainer: '#ECFDF5',

  warning: '#F59E0B',        // Orange
  warningLight: '#FEF3C7',
  warningContainer: '#FEF9E7',

  error: '#EF4444',          // Red
  errorLight: '#FEE2E2',
  errorContainer: '#FEF2F2',

  info: '#3B82F6',           // Blue (for info alerts)
  infoLight: '#DBEAFE',
  infoContainer: '#EFF6FF',

  // Text Colors (MD3 - High contrast)
  textPrimary: '#0F172A',    // Near black
  textSecondary: '#475569',  // Medium gray
  textTertiary: '#94A3B8',   // Light gray
  onPrimary: '#FFFFFF',      // Text on primary color

  // Borders & Dividers
  border: '#E2E8F0',
  divider: '#F1F5F9',
  outline: '#CBD5E1',

  // Functional
  disabled: '#CBD5E1',
  disabledText: '#94A3B8',
  overlay: 'rgba(15, 23, 42, 0.5)',
  scrim: 'rgba(0, 0, 0, 0.32)',
};

export const Typography = {
  // Font Family (MD3 Recommendation)
  fontFamily: {
    default: 'Roboto',      // System default, keeps APK lean
    // alternative: 'Inter', // More modern, but increases APK size
  },

  // Font Sizes (sp - Scale-independent Pixels)
  fontSize: {
    // Tiny labels/badges
    tiny: 12,              // 12sp - Badges, tiny labels
    caption: 13,           // 13sp - Captions, tiny metadata

    // Body text
    small: 14,             // 14sp - Secondary/metadata
    body: 16,              // 16sp - Body default (MD3 standard)

    // Headers
    subtitle: 16,          // 16-18sp - Card titles, section headers
    title: 18,             // 18sp - Section headers
    headline: 20,          // 20sp - App title (top bar)
    display: 22,           // 22sp+ - Large displays

    // Backward compatibility aliases
    xs: 12,                // = tiny
    sm: 14,                // = small
    base: 16,              // = body
    md: 16,                // = body
    lg: 18,                // = title
    xl: 20,                // = headline
    '2xl': 22,             // = display
    '3xl': 24,
    '4xl': 28,
  },

  // Font Weights (MD3)
  fontWeight: {
    regular: '400',        // Regular text
    medium: '500',         // Medium emphasis (buttons, labels)
    semiBold: '600',       // Semi-bold (section headers)
    bold: '700',           // Bold (important text)

    // Backward compatibility aliases
    normal: '400',         // = regular
    semibold: '600',       // = semiBold (lowercase alias)
    extrabold: '800',
  },

  // Line Heights
  lineHeight: {
    tight: 1.2,            // Compact lists
    normal: 1.5,           // Default body text
    relaxed: 1.75,         // Spacious paragraphs
  },

  // Letter Spacing (MD3)
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.25,
    wider: 0.5,
  },
};

export const Spacing = {
  // 8dp Grid System (MD3)
  // All spacing should be multiples of 4 or 8
  none: 0,
  xs: 4,                // 4dp
  sm: 8,                // 8dp - base grid unit
  md: 12,               // 12dp
  base: 16,             // 16dp - standard spacing
  lg: 24,               // 24dp - larger spacing
  xl: 32,               // 32dp
  '2xl': 40,            // 40dp
  '3xl': 48,            // 48dp
  '4xl': 56,            // 56dp
  '5xl': 64,            // 64dp
};

export const BorderRadius = {
  // MD3 Border Radius
  none: 0,
  sm: 8,                // 8dp - Inputs
  md: 12,               // 12dp - Cards (MD3 standard)
  lg: 16,               // 16dp - FAB
  xl: 20,               // 20dp - Large components
  '2xl': 28,            // 28dp - Extra large
  full: 9999,           // Pill shape
};

export const Shadows = {
  // MD3 Elevation Levels: 1/3/6
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  resting: {
    // Elevation 1 - Resting state (cards, buttons)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  hover: {
    // Elevation 3 - Hover state
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  raised: {
    // Elevation 6 - Raised state (FAB, dialogs)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },

  // Legacy aliases (for backward compatibility)
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },

  // Special shadows
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  }),
};

export const Layout = {
  // Touch Targets (MD3 Minimum)
  touchTarget: {
    min: 48,              // 48dp minimum touch target
    comfortable: 56,      // 56dp comfortable target
  },

  // Navigation Components (MD3 - UPDATED)
  topAppBar: {
    height: 64,           // ✅ 64dp - SmallTopAppBar (MD3 spec bump)
    medium: 112,          // 112dp - MediumTopAppBar
    large: 152,           // 152dp - LargeTopAppBar
  },

  bottomNavigation: {
    heightDefault: 80,    // ✅ 80dp - MD3 default (no labels)
    heightWithLabels: 72, // ✅ 72dp - compact with labels (recommended)
    height: 72,           // Alias for backward compatibility
  },

  fab: {
    default: 56,          // 56dp - Standard FAB
    large: 64,            // 64dp - Prominent FAB
    small: 40,            // 40dp - Small FAB
  },

  // List & Card Components
  listRow: {
    min: 56,              // 56dp minimum
    comfortable: 64,      // 64dp comfortable
    spacious: 72,         // 72dp spacious
  },

  inputField: {
    height: 48,           // 48dp minimum
    comfortable: 56,      // 56dp comfortable
  },

  // Banner & Alert
  banner: {
    min: 56,              // 56dp minimum
    max: 72,              // 72dp with actions
  },

  // Quick Actions
  quickAction: {
    button: 64,           // 64x64dp button
    card: 96,             // 96-112dp card height
  },

  // Common sizes
  avatarSize: {
    tiny: 24,             // 24dp - In chips
    small: 32,            // 32dp - Profile in top bar
    medium: 40,           // 40dp - List items
    large: 48,            // 48dp - Cards
    xlarge: 60,           // 60dp - Headers
    xxlarge: 80,          // 80dp - Profile pages
  },

  iconSize: {
    small: 16,            // 16dp - Small icons
    medium: 20,           // 20dp - Trailing actions
    default: 24,          // 24dp - Standard (MD3)
    large: 32,            // 32dp - Prominent actions
    xlarge: 40,           // 40dp - Feature icons
  },

  // Spacing presets
  containerPadding: 16,   // 16dp
  sectionSpacing: 16,     // 16dp
  cardSpacing: 12,        // 12dp
  screenPaddingHorizontal: 16,  // 16dp
  screenPaddingVertical: 12,    // 12dp

  // Child Switcher
  childSwitcher: {
    height: 40,           // 40dp pill height
    avatar: 24,           // 24dp avatar in switcher
  },

  // Date badge (Calendar)
  dateBadge: {
    size: 40,             // 40x40dp
  },
};

// ===================================================================
// MD3 INTERACTION & MOTION TOKENS
// ===================================================================

/**
 * State Layers (MD3)
 * Overlay alpha values for interactive states
 * Apply on content color (e.g., onSurface, onPrimary)
 */
export const StateLayers = {
  hover: 0.08,           // Hover state
  focus: 0.12,           // Focus state (keyboard nav)
  pressed: 0.12,         // Pressed/active state
  dragged: 0.16,         // Dragged state
};

/**
 * Motion (MD3)
 * Standard animation durations for mobile
 */
export const Motion = {
  small: 200,            // 200ms - Small UI changes (toggles, chips)
  medium: 250,           // 250ms - Medium transitions (lists, cards)
  large: 300,            // 300ms - Large transitions (screens, routes)
  easing: 'standard',    // MD3 standard easing curve
};

/**
 * Snackbar / Toast (MD3)
 * Auto-dismiss durations following a11y guidelines
 */
export const Snackbar = {
  autoNoActionMs: 4000,      // 4 seconds - no action button
  autoWithActionMs: 10000,   // 10 seconds - with action button (a11y)
};

/**
 * List Performance (FlatList)
 * Optimized defaults for smooth scrolling
 */
export const ListPerf = {
  rowHeight: 64,                    // Default row height
  initialNumToRender: 10,           // Initial render count
  maxToRenderPerBatch: 10,          // Batch render size
  updateCellsBatchingPeriodMs: 50,  // Batch update period
  windowSize: 7,                    // Render window multiplier
  removeClippedSubviews: true,      // Android optimization
};

/**
 * Divider (MD3)
 * Standard divider styling
 */
export const Divider = {
  thickness: 1,          // 1dp
  color: '#E2E8F0',      // border color
  opacity: 0.8,          // 80% opacity
};

/**
 * HitSlop (MD3 Touch Targets)
 * Padding to ensure 48dp minimum touch target
 */
export const HitSlop = {
  all8: { top: 8, right: 8, bottom: 8, left: 8 },    // 8dp all sides
  all12: { top: 12, right: 12, bottom: 12, left: 12 }, // 12dp all sides (for tiny icons)
  vertical12: { top: 12, bottom: 12 },                  // Vertical only
  horizontal12: { left: 12, right: 12 },                // Horizontal only
};

/**
 * Formatters (India-specific)
 * Localization settings
 */
export const Formatters = {
  currency: 'INR',       // Indian Rupees
  locale: 'en-IN',       // English (India)
  timeFormat: 'h:mm a',  // 12-hour format with AM/PM
};
