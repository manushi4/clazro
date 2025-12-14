/**
 * CoachingButton - Core button component for the coaching platform
 * Implements Material Design 3 button specifications
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LightTheme, SemanticColors, getRoleColors, RoleType } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius, Elevation } from '../../theme/spacing';

export type ButtonVariant = 'primary' | 'secondary' | 'text' | 'role-based';
export type ButtonSize = 'small' | 'medium' | 'large';

interface CoachingButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  role?: RoleType;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
}

const CoachingButton: React.FC<CoachingButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  role,
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
  textStyle,
  testID,
}) => {
  // Get size-specific dimensions
  const getSizeStyles = (): { height: number; paddingHorizontal: number; fontSize: number } => {
    switch (size) {
      case 'small':
        return {
          height: 36,
          paddingHorizontal: Spacing.MD,
          fontSize: Typography.labelMedium.fontSize,
        };
      case 'large':
        return {
          height: 56,
          paddingHorizontal: Spacing.LG,
          fontSize: Typography.labelLarge.fontSize,
        };
      default: // medium
        return {
          height: 48,
          paddingHorizontal: Spacing.LG,
          fontSize: Typography.labelLarge.fontSize,
        };
    }
  };

  // Get variant-specific colors
  const getVariantStyles = () => {
    const roleColors = role ? getRoleColors(role) : null;
    const primaryColor = roleColors?.primary || LightTheme.Primary;
    
    switch (variant) {
      case 'primary':
        return {
          backgroundColor: disabled ? LightTheme.OnSurfaceVariant + '38' : primaryColor,
          textColor: disabled ? LightTheme.OnSurface + '61' : LightTheme.OnPrimary,
          borderColor: 'transparent',
          borderWidth: 0,
          elevation: disabled ? 0 : Elevation.Level2,
        };
      
      case 'secondary':
        return {
          backgroundColor: 'transparent',
          textColor: disabled ? LightTheme.OnSurface + '61' : primaryColor,
          borderColor: disabled ? LightTheme.OnSurfaceVariant + '38' : primaryColor,
          borderWidth: 1,
          elevation: 0,
        };
      
      case 'text':
        return {
          backgroundColor: 'transparent',
          textColor: disabled ? LightTheme.OnSurface + '61' : primaryColor,
          borderColor: 'transparent',
          borderWidth: 0,
          elevation: 0,
        };
      
      case 'role-based':
        const roleTheme = role ? getRoleColors(role) : null;
        return {
          backgroundColor: disabled ? LightTheme.OnSurfaceVariant + '38' : roleTheme?.primary || primaryColor,
          textColor: disabled ? LightTheme.OnSurface + '61' : LightTheme.OnPrimary,
          borderColor: 'transparent',
          borderWidth: 0,
          elevation: disabled ? 0 : Elevation.Level2,
        };
      
      default:
        return {
          backgroundColor: disabled ? LightTheme.OnSurfaceVariant + '38' : primaryColor,
          textColor: disabled ? LightTheme.OnSurface + '61' : LightTheme.OnPrimary,
          borderColor: 'transparent',
          borderWidth: 0,
          elevation: disabled ? 0 : Elevation.Level2,
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const variantStyles = getVariantStyles();

  const buttonStyle: ViewStyle = {
    height: sizeStyles.height,
    paddingHorizontal: sizeStyles.paddingHorizontal,
    backgroundColor: variantStyles.backgroundColor,
    borderRadius: BorderRadius.SM,
    borderColor: variantStyles.borderColor,
    borderWidth: variantStyles.borderWidth,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    width: fullWidth ? '100%' : undefined,
    opacity: disabled && !loading ? 0.6 : 1,
    // Shadow for elevation (Android/iOS compatible)
    shadowColor: LightTheme.OnSurface,
    shadowOffset: {
      width: 0,
      height: variantStyles.elevation / 2,
    },
    shadowOpacity: variantStyles.elevation > 0 ? 0.1 : 0,
    shadowRadius: variantStyles.elevation,
    elevation: variantStyles.elevation,
  };

  const textStyles: TextStyle = {
    color: variantStyles.textColor,
    fontSize: sizeStyles.fontSize,
    fontFamily: Typography.labelLarge.fontFamily,
    fontWeight: Typography.labelLarge.fontWeight,
    letterSpacing: Typography.labelLarge.letterSpacing,
    textAlign: 'center',
  };

  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator
          size="small"
          color={variantStyles.textColor}
          testID={`${testID}-loading`}
        />
      );
    }

    const textElement = (
      <Text style={[textStyles, textStyle]}>
        {title}
      </Text>
    );

    if (!icon) {
      return textElement;
    }

    return (
      <View style={styles.contentContainer}>
        {iconPosition === 'left' && icon}
        {iconPosition === 'left' && <View style={{ width: Spacing.SM }} />}
        {textElement}
        {iconPosition === 'right' && <View style={{ width: Spacing.SM }} />}
        {iconPosition === 'right' && icon}
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={[buttonStyle, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{
        disabled: disabled || loading,
        busy: loading,
      }}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CoachingButton;