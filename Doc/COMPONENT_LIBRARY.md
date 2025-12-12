# 🎨 COMPONENT_LIBRARY.md
### Complete Design System & Component Specifications
### (Tokens • Typography • Colors • Components • Patterns)

This document defines the **complete design system** for the multi-tenant, config-driven platform.

It covers:
- Design tokens (colors, typography, spacing, elevation)
- Base components and their APIs
- Material Design 3 implementation
- Theme customization system
- Accessibility requirements

This is the **single source of truth** for UI implementation.

---

# 1. 🎯 Design System Goals

1. **Material Design 3 compliance** — Follow MD3 guidelines with 75%+ compliance
2. **Config-driven theming** — Support per-customer color/branding
3. **Accessibility first** — WCAG 2.1 AA compliance minimum
4. **Performance optimized** — Efficient rendering, minimal bundle size
5. **Consistent patterns** — Reusable components across all screens

---

# 2. 🎨 Color System

## 2.1 Core Color Tokens

Based on Material Design 3 color system with dynamic color support.

```typescript
// src/theme/colors.ts

export const MD3_LIGHT_COLORS = {
  // Primary
  primary: "#6750A4",
  onPrimary: "#FFFFFF",
  primaryContainer: "#EADDFF",
  onPrimaryContainer: "#21005D",

  // Secondary
  secondary: "#625B71",
  onSecondary: "#FFFFFF",
  secondaryContainer: "#E8DEF8",
  onSecondaryContainer: "#1D192B",

  // Tertiary
  tertiary: "#7D5260",
  onTertiary: "#FFFFFF",
  tertiaryContainer: "#FFD8E4",
  onTertiaryContainer: "#31111D",

  // Error
  error: "#B3261E",
  onError: "#FFFFFF",
  errorContainer: "#F9DEDC",
  onErrorContainer: "#410E0B",

  // Background & Surface
  background: "#FFFBFE",
  onBackground: "#1C1B1F",
  surface: "#FFFBFE",
  onSurface: "#1C1B1F",
  surfaceVariant: "#E7E0EC",
  onSurfaceVariant: "#49454F",

  // Outline
  outline: "#79747E",
  outlineVariant: "#CAC4D0",

  // Inverse
  inverseSurface: "#313033",
  inverseOnSurface: "#F4EFF4",
  inversePrimary: "#D0BCFF",

  // Special
  shadow: "#000000",
  scrim: "#000000",
  surfaceTint: "#6750A4",
};

export const MD3_DARK_COLORS = {
  // Primary
  primary: "#D0BCFF",
  onPrimary: "#381E72",
  primaryContainer: "#4F378B",
  onPrimaryContainer: "#EADDFF",

  // Secondary
  secondary: "#CCC2DC",
  onSecondary: "#332D41",
  secondaryContainer: "#4A4458",
  onSecondaryContainer: "#E8DEF8",

  // Tertiary
  tertiary: "#EFB8C8",
  onTertiary: "#492532",
  tertiaryContainer: "#633B48",
  onTertiaryContainer: "#FFD8E4",

  // Error
  error: "#F2B8B5",
  onError: "#601410",
  errorContainer: "#8C1D18",
  onErrorContainer: "#F9DEDC",

  // Background & Surface
  background: "#1C1B1F",
  onBackground: "#E6E1E5",
  surface: "#1C1B1F",
  onSurface: "#E6E1E5",
  surfaceVariant: "#49454F",
  onSurfaceVariant: "#CAC4D0",

  // Outline
  outline: "#938F99",
  outlineVariant: "#49454F",

  // Inverse
  inverseSurface: "#E6E1E5",
  inverseOnSurface: "#313033",
  inversePrimary: "#6750A4",

  // Special
  shadow: "#000000",
  scrim: "#000000",
  surfaceTint: "#D0BCFF",
};
```

## 2.2 Semantic Color Tokens

```typescript
// src/theme/semanticColors.ts

export const SEMANTIC_COLORS = {
  // Status Colors
  success: "#4CAF50",
  onSuccess: "#FFFFFF",
  successContainer: "#E8F5E9",
  onSuccessContainer: "#1B5E20",

  warning: "#FF9800",
  onWarning: "#FFFFFF",
  warningContainer: "#FFF3E0",
  onWarningContainer: "#E65100",

  info: "#2196F3",
  onInfo: "#FFFFFF",
  infoContainer: "#E3F2FD",
  onInfoContainer: "#0D47A1",

  // Subject Colors (for education)
  subjectMath: "#E91E63",
  subjectScience: "#4CAF50",
  subjectEnglish: "#2196F3",
  subjectSocialStudies: "#FF9800",
  subjectPhysics: "#9C27B0",
  subjectChemistry: "#00BCD4",
  subjectBiology: "#8BC34A",
  subjectHistory: "#795548",

  // Status indicators
  live: "#F44336",
  upcoming: "#2196F3",
  completed: "#4CAF50",
  pending: "#FF9800",
  overdue: "#B71C1C",
};
```

## 2.3 Theme Type Definition

```typescript
// src/types/theme.types.ts

export type ThemeColors = {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;
  background: string;
  onBackground: string;
  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
  outline: string;
  outlineVariant: string;
  inverseSurface: string;
  inverseOnSurface: string;
  inversePrimary: string;
  shadow: string;
  scrim: string;
  surfaceTint: string;
};

export type AppTheme = {
  colors: ThemeColors;
  roundness: number;
  fonts: ThemeFonts;
  spacing: ThemeSpacing;
  elevation: ThemeElevation;
};
```

## 2.4 Dynamic Theme Generation

```typescript
// src/theme/themeGenerator.ts

import { MD3_LIGHT_COLORS } from './colors';
import type { ThemeConfig, AppTheme } from '@/types/theme.types';

export function generateThemeFromConfig(config: ThemeConfig): AppTheme {
  // Merge customer colors with defaults
  const colors = {
    ...MD3_LIGHT_COLORS,
    primary: config.primary_color || MD3_LIGHT_COLORS.primary,
    secondary: config.secondary_color || MD3_LIGHT_COLORS.secondary,
    surface: config.surface_color || MD3_LIGHT_COLORS.surface,
    background: config.background_color || MD3_LIGHT_COLORS.background,
    onSurface: config.text_color || MD3_LIGHT_COLORS.onSurface,
    onBackground: config.text_color || MD3_LIGHT_COLORS.onBackground,
  };

  // Validate contrast ratios
  validateContrastRatios(colors);

  return {
    colors,
    roundness: config.roundness ?? 8,
    fonts: DEFAULT_FONTS,
    spacing: DEFAULT_SPACING,
    elevation: DEFAULT_ELEVATION,
  };
}

function validateContrastRatios(colors: ThemeColors): void {
  const minRatio = 4.5; // WCAG AA for normal text

  const pairs = [
    ['primary', 'onPrimary'],
    ['surface', 'onSurface'],
    ['background', 'onBackground'],
    ['error', 'onError'],
  ];

  pairs.forEach(([bg, fg]) => {
    const ratio = calculateContrastRatio(colors[bg], colors[fg]);
    if (ratio < minRatio) {
      console.warn(
        `Contrast ratio ${ratio.toFixed(2)} for ${bg}/${fg} below minimum ${minRatio}`
      );
    }
  });
}
```

---

# 3. 📝 Typography System

## 3.1 Type Scale

Based on Material Design 3 type scale.

```typescript
// src/theme/typography.ts

export const MD3_TYPE_SCALE = {
  // Display
  displayLarge: {
    fontFamily: "Inter",
    fontWeight: "400" as const,
    fontSize: 57,
    lineHeight: 64,
    letterSpacing: -0.25,
  },
  displayMedium: {
    fontFamily: "Inter",
    fontWeight: "400" as const,
    fontSize: 45,
    lineHeight: 52,
    letterSpacing: 0,
  },
  displaySmall: {
    fontFamily: "Inter",
    fontWeight: "400" as const,
    fontSize: 36,
    lineHeight: 44,
    letterSpacing: 0,
  },

  // Headline
  headlineLarge: {
    fontFamily: "Inter",
    fontWeight: "400" as const,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: 0,
  },
  headlineMedium: {
    fontFamily: "Inter",
    fontWeight: "400" as const,
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: 0,
  },
  headlineSmall: {
    fontFamily: "Inter",
    fontWeight: "400" as const,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: 0,
  },

  // Title
  titleLarge: {
    fontFamily: "Inter",
    fontWeight: "500" as const,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: 0,
  },
  titleMedium: {
    fontFamily: "Inter",
    fontWeight: "500" as const,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.15,
  },
  titleSmall: {
    fontFamily: "Inter",
    fontWeight: "500" as const,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.1,
  },

  // Body
  bodyLarge: {
    fontFamily: "Inter",
    fontWeight: "400" as const,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.5,
  },
  bodyMedium: {
    fontFamily: "Inter",
    fontWeight: "400" as const,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.25,
  },
  bodySmall: {
    fontFamily: "Inter",
    fontWeight: "400" as const,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.4,
  },

  // Label
  labelLarge: {
    fontFamily: "Inter",
    fontWeight: "500" as const,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  labelMedium: {
    fontFamily: "Inter",
    fontWeight: "500" as const,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.5,
  },
  labelSmall: {
    fontFamily: "Inter",
    fontWeight: "500" as const,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.5,
  },
};

export type TypographyVariant = keyof typeof MD3_TYPE_SCALE;
```

## 3.2 Typography Component

```tsx
// src/components/base/Typography.tsx

import React from 'react';
import { Text, TextStyle, StyleSheet } from 'react-native';
import { MD3_TYPE_SCALE, TypographyVariant } from '@/theme/typography';
import { useTheme } from '@/hooks/config/useCustomerTheme';

type TypographyProps = {
  variant?: TypographyVariant;
  color?: string;
  align?: 'left' | 'center' | 'right';
  numberOfLines?: number;
  children: React.ReactNode;
  style?: TextStyle;
};

export function Typography({
  variant = 'bodyMedium',
  color,
  align = 'left',
  numberOfLines,
  children,
  style,
}: TypographyProps) {
  const theme = useTheme();
  const typeStyle = MD3_TYPE_SCALE[variant];

  const textStyle: TextStyle = {
    ...typeStyle,
    color: color || theme.colors.onSurface,
    textAlign: align,
    ...style,
  };

  return (
    <Text style={textStyle} numberOfLines={numberOfLines}>
      {children}
    </Text>
  );
}

// Convenience exports
export const DisplayLarge = (props) => <Typography variant="displayLarge" {...props} />;
export const HeadlineMedium = (props) => <Typography variant="headlineMedium" {...props} />;
export const TitleLarge = (props) => <Typography variant="titleLarge" {...props} />;
export const TitleMedium = (props) => <Typography variant="titleMedium" {...props} />;
export const BodyLarge = (props) => <Typography variant="bodyLarge" {...props} />;
export const BodyMedium = (props) => <Typography variant="bodyMedium" {...props} />;
export const LabelLarge = (props) => <Typography variant="labelLarge" {...props} />;
export const LabelMedium = (props) => <Typography variant="labelMedium" {...props} />;
```

---

# 4. 📏 Spacing System

## 4.1 Spacing Scale

```typescript
// src/theme/spacing.ts

export const SPACING = {
  // Base unit: 4px
  none: 0,
  xxs: 2,    // 2px
  xs: 4,     // 4px
  sm: 8,     // 8px
  md: 12,    // 12px
  base: 16,  // 16px (default)
  lg: 20,    // 20px
  xl: 24,    // 24px
  xxl: 32,   // 32px
  xxxl: 40,  // 40px
  xxxxl: 48, // 48px
} as const;

export type SpacingKey = keyof typeof SPACING;

// Screen padding defaults
export const SCREEN_PADDING = {
  horizontal: SPACING.base,
  vertical: SPACING.md,
  top: SPACING.md,
  bottom: SPACING.xxl, // Extra for tab bar
};

// Component spacing
export const COMPONENT_SPACING = {
  cardPadding: SPACING.base,
  cardMargin: SPACING.md,
  listItemPadding: SPACING.base,
  sectionGap: SPACING.xl,
  inputPadding: SPACING.md,
};
```

## 4.2 Spacing Utilities

```typescript
// src/theme/spacingUtils.ts

import { SPACING, SpacingKey } from './spacing';
import { ViewStyle } from 'react-native';

export function spacing(key: SpacingKey): number {
  return SPACING[key];
}

export function margin(
  top: SpacingKey,
  right?: SpacingKey,
  bottom?: SpacingKey,
  left?: SpacingKey
): ViewStyle {
  return {
    marginTop: SPACING[top],
    marginRight: SPACING[right ?? top],
    marginBottom: SPACING[bottom ?? top],
    marginLeft: SPACING[left ?? right ?? top],
  };
}

export function padding(
  top: SpacingKey,
  right?: SpacingKey,
  bottom?: SpacingKey,
  left?: SpacingKey
): ViewStyle {
  return {
    paddingTop: SPACING[top],
    paddingRight: SPACING[right ?? top],
    paddingBottom: SPACING[bottom ?? top],
    paddingLeft: SPACING[left ?? right ?? top],
  };
}

export function gap(value: SpacingKey): ViewStyle {
  return { gap: SPACING[value] };
}
```

---

# 5. 🔲 Elevation System

## 5.1 Elevation Levels

```typescript
// src/theme/elevation.ts

import { Platform, ViewStyle } from 'react-native';

export const ELEVATION = {
  level0: {
    elevation: 0,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  level1: {
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1,
  },
  level2: {
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.20,
    shadowRadius: 3,
  },
  level3: {
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
  },
  level4: {
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.24,
    shadowRadius: 8,
  },
  level5: {
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.26,
    shadowRadius: 12,
  },
} as const;

export type ElevationLevel = keyof typeof ELEVATION;

export function getElevation(level: ElevationLevel): ViewStyle {
  return ELEVATION[level];
}
```

---

# 6. 📦 Base Components

## 6.1 BaseScreen

The foundational wrapper for all screens.

```tsx
// src/components/base/BaseScreen.tsx

import React from 'react';
import {
  View,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ViewStyle,
} from 'react-native';
import { useTheme } from '@/hooks/config/useCustomerTheme';
import { SCREEN_PADDING } from '@/theme/spacing';

type BaseScreenProps = {
  children: React.ReactNode;
  
  // Layout options
  scrollable?: boolean;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  padding?: boolean;
  
  // Header
  header?: React.ReactNode;
  
  // Pull to refresh
  refreshing?: boolean;
  onRefresh?: () => void;
  
  // Status bar
  statusBarStyle?: 'light-content' | 'dark-content';
  
  // Background
  backgroundColor?: string;
  
  // Style overrides
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  
  // Testing
  testID?: string;
};

export function BaseScreen({
  children,
  scrollable = true,
  edges = ['top', 'left', 'right'],
  padding = true,
  header,
  refreshing = false,
  onRefresh,
  statusBarStyle = 'dark-content',
  backgroundColor,
  style,
  contentContainerStyle,
  testID,
}: BaseScreenProps) {
  const theme = useTheme();
  const bgColor = backgroundColor || theme.colors.background;

  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor: bgColor,
  };

  const contentStyle: ViewStyle = {
    flex: 1,
    ...(padding && {
      paddingHorizontal: SCREEN_PADDING.horizontal,
    }),
    ...contentContainerStyle,
  };

  const renderContent = () => {
    if (scrollable) {
      return (
        <ScrollView
          style={contentStyle}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[theme.colors.primary]}
                tintColor={theme.colors.primary}
              />
            ) : undefined
          }
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      );
    }

    return <View style={contentStyle}>{children}</View>;
  };

  return (
    <SafeAreaView style={[containerStyle, style]} testID={testID}>
      <StatusBar
        barStyle={statusBarStyle}
        backgroundColor={bgColor}
      />
      {header}
      {renderContent()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingBottom: SCREEN_PADDING.bottom,
  },
});
```

## 6.2 Card

```tsx
// src/components/base/Card.tsx

import React from 'react';
import { View, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/config/useCustomerTheme';
import { getElevation, ElevationLevel } from '@/theme/elevation';
import { SPACING } from '@/theme/spacing';

type CardProps = {
  children: React.ReactNode;
  elevation?: ElevationLevel;
  mode?: 'elevated' | 'filled' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  testID?: string;
};

export function Card({
  children,
  elevation = 'level1',
  mode = 'elevated',
  padding = 'md',
  onPress,
  disabled = false,
  style,
  testID,
}: CardProps) {
  const theme = useTheme();

  const paddingMap = {
    none: 0,
    sm: SPACING.sm,
    md: SPACING.base,
    lg: SPACING.xl,
  };

  const cardStyle: ViewStyle = {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    padding: paddingMap[padding],
    ...(mode === 'elevated' && getElevation(elevation)),
    ...(mode === 'outlined' && {
      borderWidth: 1,
      borderColor: theme.colors.outline,
    }),
    ...(mode === 'filled' && {
      backgroundColor: theme.colors.surfaceVariant,
    }),
  };

  if (onPress) {
    return (
      <Pressable
        style={({ pressed }) => [
          cardStyle,
          pressed && styles.pressed,
          disabled && styles.disabled,
          style,
        ]}
        onPress={onPress}
        disabled={disabled}
        testID={testID}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View style={[cardStyle, style]} testID={testID}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.5,
  },
});
```

## 6.3 Button

```tsx
// src/components/base/Button.tsx

import React from 'react';
import {
  Pressable,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Typography } from './Typography';
import { useTheme } from '@/hooks/config/useCustomerTheme';
import { SPACING } from '@/theme/spacing';
import { getElevation } from '@/theme/elevation';

type ButtonVariant = 'filled' | 'outlined' | 'text' | 'tonal';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = {
  children: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  onPress: () => void;
  style?: ViewStyle;
  testID?: string;
};

export function Button({
  children,
  variant = 'filled',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  onPress,
  style,
  testID,
}: ButtonProps) {
  const theme = useTheme();

  const sizeStyles: Record<ButtonSize, { height: number; paddingH: number; fontSize: number }> = {
    sm: { height: 32, paddingH: SPACING.md, fontSize: 12 },
    md: { height: 40, paddingH: SPACING.base, fontSize: 14 },
    lg: { height: 48, paddingH: SPACING.xl, fontSize: 16 },
  };

  const getVariantStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case 'filled':
        return {
          container: {
            backgroundColor: theme.colors.primary,
            ...getElevation('level1'),
          },
          text: { color: theme.colors.onPrimary },
        };
      case 'outlined':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: theme.colors.outline,
          },
          text: { color: theme.colors.primary },
        };
      case 'text':
        return {
          container: { backgroundColor: 'transparent' },
          text: { color: theme.colors.primary },
        };
      case 'tonal':
        return {
          container: { backgroundColor: theme.colors.secondaryContainer },
          text: { color: theme.colors.onSecondaryContainer },
        };
    }
  };

  const variantStyles = getVariantStyles();
  const { height, paddingH, fontSize } = sizeStyles[size];

  const containerStyle: ViewStyle = {
    height,
    paddingHorizontal: paddingH,
    borderRadius: height / 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    ...variantStyles.container,
    ...(fullWidth && { width: '100%' }),
    ...(disabled && { opacity: 0.5 }),
  };

  return (
    <Pressable
      style={({ pressed }) => [
        containerStyle,
        pressed && styles.pressed,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variantStyles.text.color}
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          <Typography
            variant={size === 'sm' ? 'labelMedium' : 'labelLarge'}
            style={variantStyles.text}
          >
            {children}
          </Typography>
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.8,
  },
});
```

## 6.4 Input

```tsx
// src/components/base/Input.tsx

import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Typography } from './Typography';
import { useTheme } from '@/hooks/config/useCustomerTheme';
import { SPACING } from '@/theme/spacing';

type InputProps = {
  value: string;
  onChangeText: (text: string) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
  testID?: string;
};

export function Input({
  value,
  onChangeText,
  label,
  placeholder,
  error,
  helperText,
  disabled = false,
  multiline = false,
  numberOfLines = 1,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  leftIcon,
  rightIcon,
  style,
  testID,
}: InputProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  const hasError = !!error;

  const containerStyle: ViewStyle = {
    borderWidth: focused ? 2 : 1,
    borderColor: hasError
      ? theme.colors.error
      : focused
      ? theme.colors.primary
      : theme.colors.outline,
    borderRadius: theme.roundness,
    backgroundColor: disabled
      ? theme.colors.surfaceVariant
      : theme.colors.surface,
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    alignItems: multiline ? 'flex-start' : 'center',
    gap: SPACING.sm,
  };

  const inputStyle: TextStyle = {
    flex: 1,
    fontSize: 16,
    color: theme.colors.onSurface,
    textAlignVertical: multiline ? 'top' : 'center',
    minHeight: multiline ? numberOfLines * 24 : undefined,
  };

  return (
    <View style={style}>
      {label && (
        <Typography
          variant="labelMedium"
          color={hasError ? theme.colors.error : theme.colors.onSurfaceVariant}
          style={styles.label}
        >
          {label}
        </Typography>
      )}
      
      <View style={containerStyle}>
        {leftIcon}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.onSurfaceVariant}
          editable={!disabled}
          multiline={multiline}
          numberOfLines={numberOfLines}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={inputStyle}
          testID={testID}
        />
        {rightIcon}
      </View>

      {(error || helperText) && (
        <Typography
          variant="bodySmall"
          color={hasError ? theme.colors.error : theme.colors.onSurfaceVariant}
          style={styles.helper}
        >
          {error || helperText}
        </Typography>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    marginBottom: SPACING.xs,
  },
  helper: {
    marginTop: SPACING.xs,
    marginLeft: SPACING.xs,
  },
});
```

## 6.5 IconButton

```tsx
// src/components/base/IconButton.tsx

import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/config/useCustomerTheme';

type IconButtonVariant = 'standard' | 'filled' | 'tonal' | 'outlined';
type IconButtonSize = 'sm' | 'md' | 'lg';

type IconButtonProps = {
  icon: React.ReactNode;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  disabled?: boolean;
  selected?: boolean;
  onPress: () => void;
  style?: ViewStyle;
  testID?: string;
};

export function IconButton({
  icon,
  variant = 'standard',
  size = 'md',
  disabled = false,
  selected = false,
  onPress,
  style,
  testID,
}: IconButtonProps) {
  const theme = useTheme();

  const sizeMap: Record<IconButtonSize, number> = {
    sm: 32,
    md: 40,
    lg: 48,
  };

  const dimension = sizeMap[size];

  const getVariantStyle = (): ViewStyle => {
    const baseSelected = selected
      ? { backgroundColor: theme.colors.primaryContainer }
      : {};

    switch (variant) {
      case 'filled':
        return {
          backgroundColor: selected
            ? theme.colors.primary
            : theme.colors.surfaceVariant,
        };
      case 'tonal':
        return {
          backgroundColor: selected
            ? theme.colors.secondaryContainer
            : theme.colors.surfaceVariant,
        };
      case 'outlined':
        return {
          borderWidth: 1,
          borderColor: theme.colors.outline,
          ...baseSelected,
        };
      default:
        return baseSelected;
    }
  };

  const containerStyle: ViewStyle = {
    width: dimension,
    height: dimension,
    borderRadius: dimension / 2,
    alignItems: 'center',
    justifyContent: 'center',
    ...getVariantStyle(),
    ...(disabled && { opacity: 0.5 }),
  };

  return (
    <Pressable
      style={({ pressed }) => [
        containerStyle,
        pressed && styles.pressed,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      testID={testID}
    >
      {icon}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.7,
  },
});
```

## 6.6 Chip

```tsx
// src/components/base/Chip.tsx

import React from 'react';
import { Pressable, View, StyleSheet, ViewStyle } from 'react-native';
import { Typography } from './Typography';
import { useTheme } from '@/hooks/config/useCustomerTheme';
import { SPACING } from '@/theme/spacing';

type ChipVariant = 'assist' | 'filter' | 'input' | 'suggestion';

type ChipProps = {
  label: string;
  variant?: ChipVariant;
  selected?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  onPress?: () => void;
  onClose?: () => void;
  style?: ViewStyle;
  testID?: string;
};

export function Chip({
  label,
  variant = 'assist',
  selected = false,
  disabled = false,
  icon,
  trailingIcon,
  onPress,
  onClose,
  style,
  testID,
}: ChipProps) {
  const theme = useTheme();

  const getChipStyle = (): ViewStyle => {
    const base: ViewStyle = {
      borderRadius: 8,
      paddingVertical: SPACING.xs,
      paddingHorizontal: SPACING.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.xs,
    };

    if (selected) {
      return {
        ...base,
        backgroundColor: theme.colors.secondaryContainer,
      };
    }

    return {
      ...base,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.outline,
    };
  };

  const content = (
    <>
      {icon}
      <Typography
        variant="labelLarge"
        color={
          selected
            ? theme.colors.onSecondaryContainer
            : theme.colors.onSurfaceVariant
        }
      >
        {label}
      </Typography>
      {trailingIcon}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        style={({ pressed }) => [
          getChipStyle(),
          pressed && styles.pressed,
          disabled && styles.disabled,
          style,
        ]}
        onPress={onPress}
        disabled={disabled}
        testID={testID}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View style={[getChipStyle(), style]} testID={testID}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.5,
  },
});
```

---

# 7. 🧩 Composite Components

## 7.1 ListItem

```tsx
// src/components/base/ListItem.tsx

import React from 'react';
import { Pressable, View, StyleSheet, ViewStyle } from 'react-native';
import { Typography } from './Typography';
import { useTheme } from '@/hooks/config/useCustomerTheme';
import { SPACING } from '@/theme/spacing';

type ListItemProps = {
  title: string;
  description?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  divider?: boolean;
  style?: ViewStyle;
  testID?: string;
};

export function ListItem({
  title,
  description,
  leading,
  trailing,
  onPress,
  disabled = false,
  divider = false,
  style,
  testID,
}: ListItemProps) {
  const theme = useTheme();

  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.base,
    gap: SPACING.base,
    ...(divider && {
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
    }),
  };

  const content = (
    <>
      {leading && <View style={styles.leading}>{leading}</View>}
      <View style={styles.content}>
        <Typography variant="bodyLarge">{title}</Typography>
        {description && (
          <Typography
            variant="bodyMedium"
            color={theme.colors.onSurfaceVariant}
          >
            {description}
          </Typography>
        )}
      </View>
      {trailing && <View style={styles.trailing}>{trailing}</View>}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        style={({ pressed }) => [
          containerStyle,
          pressed && { backgroundColor: theme.colors.surfaceVariant },
          disabled && styles.disabled,
          style,
        ]}
        onPress={onPress}
        disabled={disabled}
        testID={testID}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View style={[containerStyle, style]} testID={testID}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  leading: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 2,
  },
  trailing: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
});
```

## 7.2 Avatar

```tsx
// src/components/base/Avatar.tsx

import React from 'react';
import { View, Image, StyleSheet, ViewStyle } from 'react-native';
import { Typography } from './Typography';
import { useTheme } from '@/hooks/config/useCustomerTheme';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

type AvatarProps = {
  source?: { uri: string } | number;
  name?: string;
  size?: AvatarSize;
  style?: ViewStyle;
  testID?: string;
};

export function Avatar({
  source,
  name,
  size = 'md',
  style,
  testID,
}: AvatarProps) {
  const theme = useTheme();

  const sizeMap: Record<AvatarSize, number> = {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 56,
    xl: 72,
  };

  const dimension = sizeMap[size];

  const containerStyle: ViewStyle = {
    width: dimension,
    height: dimension,
    borderRadius: dimension / 2,
    backgroundColor: theme.colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  };

  const getInitials = (name: string): string => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  if (source) {
    return (
      <View style={[containerStyle, style]} testID={testID}>
        <Image
          source={source}
          style={{ width: dimension, height: dimension }}
          resizeMode="cover"
        />
      </View>
    );
  }

  return (
    <View style={[containerStyle, style]} testID={testID}>
      <Typography
        variant={size === 'xs' || size === 'sm' ? 'labelSmall' : 'titleMedium'}
        color={theme.colors.onPrimaryContainer}
      >
        {name ? getInitials(name) : '?'}
      </Typography>
    </View>
  );
}
```

## 7.3 Badge

```tsx
// src/components/base/Badge.tsx

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Typography } from './Typography';
import { useTheme } from '@/hooks/config/useCustomerTheme';

type BadgeProps = {
  count?: number;
  max?: number;
  visible?: boolean;
  dot?: boolean;
  children?: React.ReactNode;
  style?: ViewStyle;
  testID?: string;
};

export function Badge({
  count,
  max = 99,
  visible = true,
  dot = false,
  children,
  style,
  testID,
}: BadgeProps) {
  const theme = useTheme();

  if (!visible || (count !== undefined && count <= 0 && !dot)) {
    return <>{children}</>;
  }

  const displayCount = count && count > max ? `${max}+` : count?.toString();

  const badgeStyle: ViewStyle = {
    backgroundColor: theme.colors.error,
    position: 'absolute',
    top: -4,
    right: -4,
    ...(dot
      ? {
          width: 8,
          height: 8,
          borderRadius: 4,
        }
      : {
          minWidth: 16,
          height: 16,
          borderRadius: 8,
          paddingHorizontal: 4,
          alignItems: 'center',
          justifyContent: 'center',
        }),
  };

  return (
    <View style={[styles.container, style]} testID={testID}>
      {children}
      <View style={badgeStyle}>
        {!dot && displayCount && (
          <Typography variant="labelSmall" color={theme.colors.onError}>
            {displayCount}
          </Typography>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
});
```

---

# 8. 📱 Screen-Level Components

## 8.1 EmptyState

```tsx
// src/components/screens/EmptyState.tsx

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Typography } from '@/components/base/Typography';
import { Button } from '@/components/base/Button';
import { useTheme } from '@/hooks/config/useCustomerTheme';
import { SPACING } from '@/theme/spacing';

type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: ViewStyle;
  testID?: string;
};

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  style,
  testID,
}: EmptyStateProps) {
  const theme = useTheme();

  return (
    <View style={[styles.container, style]} testID={testID}>
      {icon && <View style={styles.icon}>{icon}</View>}
      <Typography
        variant="titleMedium"
        align="center"
        style={styles.title}
      >
        {title}
      </Typography>
      {description && (
        <Typography
          variant="bodyMedium"
          color={theme.colors.onSurfaceVariant}
          align="center"
          style={styles.description}
        >
          {description}
        </Typography>
      )}
      {actionLabel && onAction && (
        <Button variant="filled" onPress={onAction} style={styles.action}>
          {actionLabel}
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
  },
  icon: {
    marginBottom: SPACING.base,
  },
  title: {
    marginBottom: SPACING.sm,
  },
  description: {
    marginBottom: SPACING.xl,
  },
  action: {
    minWidth: 120,
  },
});
```

## 8.2 LoadingScreen

```tsx
// src/components/screens/LoadingScreen.tsx

import React from 'react';
import { View, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { Typography } from '@/components/base/Typography';
import { useTheme } from '@/hooks/config/useCustomerTheme';
import { SPACING } from '@/theme/spacing';

type LoadingScreenProps = {
  message?: string;
  fullScreen?: boolean;
  style?: ViewStyle;
  testID?: string;
};

export function LoadingScreen({
  message,
  fullScreen = true,
  style,
  testID,
}: LoadingScreenProps) {
  const theme = useTheme();

  const containerStyle: ViewStyle = {
    ...(fullScreen && StyleSheet.absoluteFillObject),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
    padding: SPACING.xxl,
  };

  return (
    <View style={[containerStyle, style]} testID={testID}>
      <ActivityIndicator
        size="large"
        color={theme.colors.primary}
      />
      {message && (
        <Typography
          variant="bodyMedium"
          color={theme.colors.onSurfaceVariant}
          style={styles.message}
        >
          {message}
        </Typography>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  message: {
    marginTop: SPACING.base,
  },
});
```

## 8.3 ErrorScreen

```tsx
// src/components/screens/ErrorScreen.tsx

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Typography } from '@/components/base/Typography';
import { Button } from '@/components/base/Button';
import { useTheme } from '@/hooks/config/useCustomerTheme';
import { SPACING } from '@/theme/spacing';

type ErrorScreenProps = {
  title?: string;
  message?: string;
  onRetry?: () => void;
  onGoBack?: () => void;
  style?: ViewStyle;
  testID?: string;
};

export function ErrorScreen({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  onRetry,
  onGoBack,
  style,
  testID,
}: ErrorScreenProps) {
  const theme = useTheme();

  return (
    <View style={[styles.container, style]} testID={testID}>
      <Typography
        variant="headlineSmall"
        color={theme.colors.error}
        align="center"
        style={styles.title}
      >
        {title}
      </Typography>
      <Typography
        variant="bodyMedium"
        color={theme.colors.onSurfaceVariant}
        align="center"
        style={styles.message}
      >
        {message}
      </Typography>
      <View style={styles.actions}>
        {onRetry && (
          <Button variant="filled" onPress={onRetry}>
            Try Again
          </Button>
        )}
        {onGoBack && (
          <Button variant="outlined" onPress={onGoBack}>
            Go Back
          </Button>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
  },
  title: {
    marginBottom: SPACING.md,
  },
  message: {
    marginBottom: SPACING.xl,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
});
```

---

# 9. 🎨 Component Export Index

```typescript
// src/components/index.ts

// Base Components
export { Typography } from './base/Typography';
export { Card } from './base/Card';
export { Button } from './base/Button';
export { Input } from './base/Input';
export { IconButton } from './base/IconButton';
export { Chip } from './base/Chip';
export { ListItem } from './base/ListItem';
export { Avatar } from './base/Avatar';
export { Badge } from './base/Badge';
export { BaseScreen } from './base/BaseScreen';

// Screen Components
export { EmptyState } from './screens/EmptyState';
export { LoadingScreen } from './screens/LoadingScreen';
export { ErrorScreen } from './screens/ErrorScreen';

// Widget Components
export { WidgetContainer } from './widgets/base/WidgetContainer';
export { WidgetErrorBoundary } from './widgets/base/WidgetErrorBoundary';
export { WidgetSkeleton } from './widgets/base/WidgetSkeleton';

// Gate Components
export { FeatureGate } from './gates/FeatureGate';
export { PermissionGate } from './gates/PermissionGate';
```

---

# 10. ♿ Accessibility Guidelines

## 10.1 Requirements

- All interactive elements must have `accessibilityLabel`
- Minimum touch target: 44x44 points
- Color contrast ratio: 4.5:1 for text, 3:1 for UI
- Support for screen readers (VoiceOver, TalkBack)
- Support for reduced motion preferences

## 10.2 Testing Checklist

- [ ] Screen reader navigation works
- [ ] All buttons/links have labels
- [ ] Color contrast meets WCAG AA
- [ ] Focus order is logical
- [ ] Touch targets are adequate

---

# 11. 📌 Summary

This component library provides:

✅ **Material Design 3 tokens** — Colors, typography, spacing, elevation  
✅ **Theme customization** — Per-customer color overrides  
✅ **Base components** — Button, Card, Input, Typography, etc.  
✅ **Screen components** — BaseScreen, EmptyState, LoadingScreen, ErrorScreen  
✅ **Consistent patterns** — Shared APIs, styling conventions  
✅ **Accessibility support** — WCAG compliance, screen reader support  
✅ **Type safety** — Full TypeScript coverage  

This is the **complete design system specification** for the Manushi Coaching App.
