/**
 * Complete Framer Design System Tokens
 * Single source of truth for all design values
 *
 * Usage:
 * import { FramerColors, FramerTypography, FramerSpacing, ... } from '../../theme/framerTheme';
 */

// ==========================================
// COLORS
// ==========================================
export const FramerColors = {
  // Primary
  primary: '#2D5BFF',
  primaryLight: 'rgba(45, 91, 255, 0.15)',
  secondary: '#7C3AED',
  secondaryLight: 'rgba(124, 58, 237, 0.15)',

  // Backgrounds
  background: '#F7F7F7',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',

  // Text
  text: {
    primary: '#1A1A1A',
    secondary: '#6B7280',
    tertiary: '#9CA3AF',
    inverse: '#FFFFFF',
  },

  // Status
  success: '#10B981',
  successLight: 'rgba(16, 185, 129, 0.15)',
  warning: '#F59E0B',
  warningLight: 'rgba(245, 158, 11, 0.15)',
  error: '#EF4444',
  errorLight: 'rgba(239, 68, 68, 0.15)',
  info: '#3B82F6',
  infoLight: 'rgba(59, 130, 246, 0.15)',

  // Quick Actions
  action: {
    blue: '#3B82F6',
    blueLight: 'rgba(59, 130, 246, 0.15)',
    green: '#22C55E',
    greenLight: 'rgba(34, 197, 94, 0.15)',
    orange: '#F97316',
    orangeLight: 'rgba(249, 115, 22, 0.15)',
    pink: '#EC4899',
    pinkLight: 'rgba(236, 72, 153, 0.15)',
    purple: '#8B5CF6',
    purpleLight: 'rgba(139, 92, 246, 0.15)',
  },

  // Borders
  border: '#DADCE0',
  borderLight: '#E5E7EB',
  borderFocus: '#2D5BFF',

  // Status Badges
  live: '#10B981',
  scheduled: '#3B82F6',
};

// ==========================================
// TYPOGRAPHY
// ==========================================
export const FramerTypography = {
  sizes: {
    // Display - 28px/800 - Analytics percentages, large numbers
    display: {
      fontSize: 28,
      fontWeight: '800' as '800',
      lineHeight: 36,
      letterSpacing: -0.5,
    },

    // H1 - 24px/700 - Screen titles, greetings
    h1: {
      fontSize: 24,
      fontWeight: '700' as '700',
      lineHeight: 32,
      letterSpacing: -0.3,
    },

    // H2 - 20px/700 - Section headers
    h2: {
      fontSize: 20,
      fontWeight: '700' as '700',
      lineHeight: 28,
      letterSpacing: -0.2,
    },

    // H3 - 16px/600 - Card titles
    h3: {
      fontSize: 16,
      fontWeight: '600' as '600',
      lineHeight: 24,
      letterSpacing: 0,
    },

    // Body - 16px/400 - Input text, content
    body: {
      fontSize: 16,
      fontWeight: '400' as '400',
      lineHeight: 24,
      letterSpacing: 0,
    },

    // Body Medium - 16px/500
    bodyMedium: {
      fontSize: 16,
      fontWeight: '500' as '500',
      lineHeight: 24,
      letterSpacing: 0,
    },

    // Caption - 13px/500 - Activity feed, meta
    caption: {
      fontSize: 13,
      fontWeight: '500' as '500',
      lineHeight: 20,
      letterSpacing: 0,
    },

    // Label - 12px/600 - Button labels
    label: {
      fontSize: 12,
      fontWeight: '600' as '600',
      lineHeight: 16,
      letterSpacing: 0.5,
    },

    // Tiny - 10px/500 - Timestamps, badges
    tiny: {
      fontSize: 10,
      fontWeight: '500' as '500',
      lineHeight: 14,
      letterSpacing: 0.3,
    },
  },
};

// ==========================================
// SPACING (8dp grid system)
// ==========================================
export const FramerSpacing = {
  // Base units
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,

  // Screen
  screen: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },

  // Cards
  card: {
    standard: 16,      // Standard cards
    hero: 20,          // Hero/header cards
    gap: 12,           // Between cards in grid
  },

  // Sections
  section: {
    gap: 24,           // Between sections
    titleMargin: 14,   // Below section titles
  },

  // Items
  item: {
    gap: 8,            // Between small items
    padding: 12,       // Item internal padding
  },
};

// ==========================================
// BORDER RADIUS
// ==========================================
export const FramerBorderRadius = {
  // Inputs & Buttons
  input: 12,
  button: 12,
  buttonLarge: 14,

  // Cards
  card: {
    standard: 18,
    hero: 20,
    compact: 12,
  },

  // Modals
  modal: 24,
  bottomSheet: 24,

  // Quick Actions
  quickAction: 28,   // Circular quick action buttons

  // Avatar
  avatar: 9999,      // Full circle

  // OTP
  otp: 10,

  // Chips & Tags
  chip: 16,
  tag: 12,

  // Icon Containers
  icon: 8,
};

// ==========================================
// SHADOWS
// ==========================================
export const FramerShadows = {
  // Card shadow
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },

  // Soft shadow (sub-cards, list items)
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },

  // Elevated (modals, bottom sheets)
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 6,
  },

  // Button shadow
  button: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
};

// Quick action glow helper
export const getQuickActionShadow = (color: string) => ({
  shadowColor: color,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.4,
  shadowRadius: 16,
  elevation: 6,
});

// ==========================================
// DIMENSIONS
// ==========================================
export const FramerDimensions = {
  // Inputs
  input: {
    height: 48,
  },

  // Buttons
  button: {
    height: 52,
    heightSecondary: 48,
    heightCompact: 40,
  },

  // Quick Actions
  quickAction: {
    size: 56,
    icon: 24,
  },

  // Icon Containers
  iconContainer: {
    small: 32,
    medium: 40,
    large: 48,
  },

  // Icons
  icon: {
    size: 20,
    sizeLarge: 24,
    sizeXLarge: 28,
  },

  // OTP
  otp: {
    cellWidth: 48,
    cellHeight: 56,
    gap: 12,
  },

  // Avatar
  avatar: {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 48,
    xl: 60,
    xxl: 80,
    profile: 120,
  },

  // Progress
  progressBar: {
    height: 6,
    heightLarge: 8,
  },

  // Badge
  badge: {
    size: 20,
    sizeLarge: 24,
  },

  // Bottom Sheet
  bottomSheet: {
    handleWidth: 40,
    handleHeight: 4,
  },
};

// ==========================================
// ANIMATIONS
// ==========================================
export const FramerAnimations = {
  // Durations
  duration: {
    instant: 100,
    fast: 200,
    normal: 300,
    slow: 500,
  },

  // Spring configs
  spring: { stiffness: 120, damping: 15 },
  springSnappy: { stiffness: 300, damping: 30 },
  springBouncy: { stiffness: 200, damping: 10 },

  // Stagger
  stagger: {
    delay: 80,         // 80ms between items
    start: 100,        // First item delay
  },

  // Entry delays (for screen sections)
  delays: {
    header: 0,
    hero: 100,
    section1: 200,
    section2: 300,
    section3: 350,
    section4: 400,
    listStart: 650,
  },

  // Transform presets
  transform: {
    buttonPress: { scale: 0.98 },
    buttonHover: { scale: 1.02 },
    quickActionPress: { scale: 0.92 },
    quickActionHover: { scale: 1.15, translateY: -4 },
    cardHover: { translateY: -6 },
    otpFocus: { scale: 1.05 },
  },
};

// ==========================================
// PRE-BUILT COMPONENT STYLES
// ==========================================
export const FramerComponentStyles = {
  // Icon Container
  iconContainer: (backgroundColor: string, size: number = 32) => ({
    width: size,
    height: size,
    borderRadius: size / 4,
    backgroundColor,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  }),

  // Card
  card: {
    backgroundColor: FramerColors.surface,
    borderRadius: FramerBorderRadius.card.standard,
    padding: FramerSpacing.card.standard,
    ...FramerShadows.card,
  },

  // Hero Card
  heroCard: {
    backgroundColor: FramerColors.surface,
    borderRadius: FramerBorderRadius.card.hero,
    padding: FramerSpacing.card.hero,
    ...FramerShadows.card,
  },

  // Section Title
  sectionTitle: {
    ...FramerTypography.sizes.h2,
    color: FramerColors.text.primary,
    marginBottom: FramerSpacing.section.titleMargin,
  },

  // Button Primary
  buttonPrimary: {
    height: FramerDimensions.button.height,
    backgroundColor: FramerColors.primary,
    borderRadius: FramerBorderRadius.button,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...FramerShadows.button,
  },

  // Button Text
  buttonText: {
    ...FramerTypography.sizes.h3,
    color: FramerColors.text.inverse,
  },
};
