/**
 * Typography System - Coaching Management Platform
 * Enhanced Material Design 3 Typography with Responsive Scaling
 * 
 * Based on coaching research design specifications
 * Implements complete typography hierarchy with semantic usage
 */

import React from 'react';
import {Text, TextStyle, StyleSheet, Dimensions} from 'react-native';
import {useTheme} from '../../context/ThemeContext';

const {width} = Dimensions.get('window');

// Responsive scaling based on screen width
const getScaleFactor = (): number => {
  if (width < 360) return 0.9;  // Small phones
  if (width < 400) return 0.95; // Medium phones  
  if (width < 480) return 1.0;  // Large phones
  if (width < 768) return 1.1;  // Small tablets
  return 1.2; // Large tablets and above
};

// Typography scale based on Material Design 3 + Coaching Research specs
export const createTypographyScale = (scaleFactor: number = 1) => ({
  displayLarge: {
    fontSize: Math.round(57 * scaleFactor),
    lineHeight: Math.round(64 * scaleFactor),
    letterSpacing: -0.25,
    fontWeight: '400' as const,
  } as TextStyle,

  displayMedium: {
    fontSize: Math.round(45 * scaleFactor),
    lineHeight: Math.round(52 * scaleFactor),
    letterSpacing: 0,
    fontWeight: '400' as const,
  } as TextStyle,

  displaySmall: {
    fontSize: Math.round(36 * scaleFactor),
    lineHeight: Math.round(44 * scaleFactor),
    letterSpacing: 0,
    fontWeight: '400' as const,
  } as TextStyle,

  headlineLarge: {
    fontSize: Math.round(32 * scaleFactor),
    lineHeight: Math.round(40 * scaleFactor),
    letterSpacing: 0,
    fontWeight: '400' as const,
  } as TextStyle,

  headlineMedium: {
    fontSize: Math.round(28 * scaleFactor),
    lineHeight: Math.round(36 * scaleFactor),
    letterSpacing: 0,
    fontWeight: '400' as const,
  } as TextStyle,

  headlineSmall: {
    fontSize: Math.round(24 * scaleFactor),
    lineHeight: Math.round(32 * scaleFactor),
    letterSpacing: 0,
    fontWeight: '400' as const,
  } as TextStyle,

  titleLarge: {
    fontSize: Math.round(22 * scaleFactor),
    lineHeight: Math.round(28 * scaleFactor),
    letterSpacing: 0,
    fontWeight: '500' as const,
  } as TextStyle,

  titleMedium: {
    fontSize: Math.round(16 * scaleFactor),
    lineHeight: Math.round(24 * scaleFactor),
    letterSpacing: 0.15,
    fontWeight: '500' as const,
  } as TextStyle,

  titleSmall: {
    fontSize: Math.round(14 * scaleFactor),
    lineHeight: Math.round(20 * scaleFactor),
    letterSpacing: 0.1,
    fontWeight: '500' as const,
  } as TextStyle,

  bodyLarge: {
    fontSize: Math.round(16 * scaleFactor),
    lineHeight: Math.round(24 * scaleFactor),
    letterSpacing: 0.15,
    fontWeight: '400' as const,
  } as TextStyle,

  bodyMedium: {
    fontSize: Math.round(14 * scaleFactor),
    lineHeight: Math.round(20 * scaleFactor),
    letterSpacing: 0.25,
    fontWeight: '400' as const,
  } as TextStyle,

  bodySmall: {
    fontSize: Math.round(12 * scaleFactor),
    lineHeight: Math.round(16 * scaleFactor),
    letterSpacing: 0.4,
    fontWeight: '400' as const,
  } as TextStyle,

  labelLarge: {
    fontSize: Math.round(14 * scaleFactor),
    lineHeight: Math.round(20 * scaleFactor),
    letterSpacing: 0.1,
    fontWeight: '500' as const,
  } as TextStyle,

  labelMedium: {
    fontSize: Math.round(12 * scaleFactor),
    lineHeight: Math.round(16 * scaleFactor),
    letterSpacing: 0.5,
    fontWeight: '500' as const,
  } as TextStyle,

  labelSmall: {
    fontSize: Math.round(11 * scaleFactor),
    lineHeight: Math.round(16 * scaleFactor),
    letterSpacing: 0.5,
    fontWeight: '500' as const,
  } as TextStyle,
});

// Typography component props
export interface TypographyProps {
  variant?: keyof ReturnType<typeof createTypographyScale>;
  children: React.ReactNode;
  color?: string;
  style?: TextStyle;
  numberOfLines?: number;
  testID?: string;
}

// Main Typography Component
const Typography: React.FC<TypographyProps> = ({
  variant = 'bodyMedium',
  children,
  color,
  style,
  numberOfLines,
  testID,
}) => {
  const {theme} = useTheme();
  const scaleFactor = getScaleFactor();
  const typographyScale = createTypographyScale(scaleFactor);

  const textStyle = [
    typographyScale[variant],
    {color: color || theme.OnBackground},
    style,
  ];

  return (
    <Text
      style={textStyle}
      numberOfLines={numberOfLines}
      testID={testID}>
      {children}
    </Text>
  );
};

// Specialized Typography Components
const DisplayText: React.FC<Omit<TypographyProps, 'variant'> & {size?: 'large' | 'medium' | 'small'}> = ({
  size = 'medium',
  ...props
}) => (
  <Typography
    variant={`display${size.charAt(0).toUpperCase() + size.slice(1)}` as any}
    {...props}
  />
);

const HeadlineText: React.FC<Omit<TypographyProps, 'variant'> & {size?: 'large' | 'medium' | 'small'}> = ({
  size = 'medium',
  ...props
}) => (
  <Typography
    variant={`headline${size.charAt(0).toUpperCase() + size.slice(1)}` as any}
    {...props}
  />
);

const TitleText: React.FC<Omit<TypographyProps, 'variant'> & {size?: 'large' | 'medium' | 'small'}> = ({
  size = 'medium',
  ...props
}) => (
  <Typography
    variant={`title${size.charAt(0).toUpperCase() + size.slice(1)}` as any}
    {...props}
  />
);

const BodyText: React.FC<Omit<TypographyProps, 'variant'> & {size?: 'large' | 'medium' | 'small'}> = ({
  size = 'medium',
  ...props
}) => (
  <Typography
    variant={`body${size.charAt(0).toUpperCase() + size.slice(1)}` as any}
    {...props}
  />
);

const LabelText: React.FC<Omit<TypographyProps, 'variant'> & {size?: 'large' | 'medium' | 'small'}> = ({
  size = 'medium',
  ...props
}) => (
  <Typography
    variant={`label${size.charAt(0).toUpperCase() + size.slice(1)}` as any}
    {...props}
  />
);

// Semantic Typography Components
const PageTitle: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <HeadlineText size="large" {...props} />
);

const SectionTitle: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <TitleText size="large" {...props} />
);

const CardTitle: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <TitleText size="medium" {...props} />
);

const ButtonLabel: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <LabelText size="large" {...props} />
);

const Caption: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <BodyText size="small" {...props} />
);

const Overline: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <LabelText size="small" {...props} />
);

// Hook for accessing typography scale
export const useTypography = () => {
  const scaleFactor = getScaleFactor();
  return createTypographyScale(scaleFactor);
};

// Export typography scale for direct style usage
export const typographyStyles = StyleSheet.create({
  displayLarge: createTypographyScale().displayLarge,
  displayMedium: createTypographyScale().displayMedium,
  displaySmall: createTypographyScale().displaySmall,
  headlineLarge: createTypographyScale().headlineLarge,
  headlineMedium: createTypographyScale().headlineMedium,
  headlineSmall: createTypographyScale().headlineSmall,
  titleLarge: createTypographyScale().titleLarge,
  titleMedium: createTypographyScale().titleMedium,
  titleSmall: createTypographyScale().titleSmall,
  bodyLarge: createTypographyScale().bodyLarge,
  bodyMedium: createTypographyScale().bodyMedium,
  bodySmall: createTypographyScale().bodySmall,
  labelLarge: createTypographyScale().labelLarge,
  labelMedium: createTypographyScale().labelMedium,
  labelSmall: createTypographyScale().labelSmall,
});

export default Typography;