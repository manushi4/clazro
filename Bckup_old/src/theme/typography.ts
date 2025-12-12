/**
 * Material Design 3 Typography System
 * Based on Google's Material Design 3 type scale
 */

export interface TypographyStyle {
  fontSize: number;
  lineHeight: number;
  fontWeight: '400' | '500' | '600' | '700' | '800';
  fontFamily?: string;
  letterSpacing?: number;
}

export const Typography = {
  // Display styles (large, prominent text)
  displayLarge: {
    fontSize: 57,
    lineHeight: 64,
    fontWeight: '400' as const,
    fontFamily: 'System',
    letterSpacing: -0.25,
  },
  displayMedium: {
    fontSize: 45,
    lineHeight: 52,
    fontWeight: '400' as const,
    fontFamily: 'System',
    letterSpacing: 0,
  },
  displaySmall: {
    fontSize: 36,
    lineHeight: 44,
    fontWeight: '400' as const,
    fontFamily: 'System',
    letterSpacing: 0,
  },

  // Headline styles (headings)
  headlineLarge: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '400' as const,
    fontFamily: 'System',
    letterSpacing: 0,
  },
  headlineMedium: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '400' as const,
    fontFamily: 'System',
    letterSpacing: 0,
  },
  headlineSmall: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '400' as const,
    fontFamily: 'System',
    letterSpacing: 0,
  },

  // Title styles (sections, cards)
  titleLarge: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '500' as const,
    fontFamily: 'System',
    letterSpacing: 0,
  },
  titleMedium: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500' as const,
    fontFamily: 'System',
    letterSpacing: 0.15,
  },
  titleSmall: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500' as const,
    fontFamily: 'System',
    letterSpacing: 0.1,
  },

  // Label styles (buttons, tabs)
  labelLarge: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500' as const,
    fontFamily: 'System',
    letterSpacing: 0.1,
  },
  labelMedium: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500' as const,
    fontFamily: 'System',
    letterSpacing: 0.5,
  },
  labelSmall: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500' as const,
    fontFamily: 'System',
    letterSpacing: 0.5,
  },

  // Body styles (content text)
  bodyLarge: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
    fontFamily: 'System',
    letterSpacing: 0.5,
  },
  bodyMedium: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as const,
    fontFamily: 'System',
    letterSpacing: 0.25,
  },
  bodySmall: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as const,
    fontFamily: 'System',
    letterSpacing: 0.4,
  },
};

// Font families (can be customized based on platform)
export const FontFamily = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  // For custom fonts:
  // regular: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
  // medium: Platform.OS === 'ios' ? 'SF Pro Text Medium' : 'Roboto Medium',
  // bold: Platform.OS === 'ios' ? 'SF Pro Text Bold' : 'Roboto Bold',
};

export default Typography;
