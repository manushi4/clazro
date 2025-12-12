/**
 * Button Component Library - Coaching Management Platform
 * Complete Material Design 3 Button Implementation
 * 
 * Based on coaching research design specifications
 * Implements Primary, Secondary, Tertiary button variants with loading states
 */

import React from 'react';
import {
  TouchableOpacity,
  View,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useTheme} from '../../context/ThemeContext';
import {ButtonLabel} from './Typography';

const {width} = Dimensions.get('window');

// Button size definitions
export enum ButtonSize {
  Small = 'small',
  Medium = 'medium',
  Large = 'large',
}

// Button variant types
export enum ButtonVariant {
  Primary = 'primary',
  Secondary = 'secondary',
  Tertiary = 'tertiary',
  Error = 'error',
  Success = 'success',
}

// Design tokens from coaching research
const SPACING = {
  XS: 4,
  SM: 8,
  MD: 16,
  LG: 24,
};

const BORDER_RADIUS = {
  SM: 8,
  MD: 12,
  LG: 16,
};

const ELEVATION = {
  Level0: 0,
  Level1: 1,
  Level2: 3,
  Level3: 6,
};

interface ButtonProps {
  children: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
  testID?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  onPress,
  variant = ButtonVariant.primary,
  size = ButtonSize.Medium,
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
  testID,
}) => {
  const {theme} = useTheme();

  // Size configurations
  const sizeConfig = {
    [ButtonSize.Small]: {
      height: 36,
      paddingHorizontal: 16,
      fontSize: 12,
      iconSize: 16,
    },
    [ButtonSize.Medium]: {
      height: 48,
      paddingHorizontal: 20,
      fontSize: 14,
      iconSize: 18,
    },
    [ButtonSize.Large]: {
      height: 56,
      paddingHorizontal: 24,
      fontSize: 16,
      iconSize: 20,
    },
  };

  // Semantic colors from coaching research
  const semanticColors = {
    success: '#4CAF50',
    error: '#F44336',
    warning: '#FF9800',
    info: '#2196F3',
  };

  // Variant color configurations
  const getVariantStyles = () => {
    const config = sizeConfig[size];
    const baseStyle = {
      height: config.height,
      paddingHorizontal: config.paddingHorizontal,
      borderRadius: BORDER_RADIUS.sm,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      flexDirection: 'row' as const,
    };

    switch (variant) {
      case ButtonVariant.primary:
        return {
          container: {
            ...baseStyle,
            backgroundColor: disabled 
              ? theme.primary + '38' 
              : theme.primary,
            elevation: disabled ? 0 : ELEVATION.Level2,
            shadowColor: theme.primary,
            shadowOffset: {width: 0, height: 2},
            shadowOpacity: 0.15,
            shadowRadius: 4,
          },
          text: {
            color: theme.OnPrimary,
          },
          icon: {
            color: theme.OnPrimary,
          },
        };

      case ButtonVariant.secondary:
        return {
          container: {
            ...baseStyle,
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: disabled 
              ? theme.Outline + '38'
              : theme.primary,
            elevation: 0,
          },
          text: {
            color: disabled 
              ? theme.OnSurface + '38'
              : theme.primary,
          },
          icon: {
            color: disabled 
              ? theme.OnSurface + '38'
              : theme.primary,
          },
        };

      case ButtonVariant.Tertiary:
        return {
          container: {
            ...baseStyle,
            backgroundColor: 'transparent',
            elevation: 0,
          },
          text: {
            color: disabled 
              ? theme.OnSurface + '38'
              : theme.primary,
          },
          icon: {
            color: disabled 
              ? theme.OnSurface + '38'
              : theme.primary,
          },
        };

      case ButtonVariant.error:
        return {
          container: {
            ...baseStyle,
            backgroundColor: disabled 
              ? semanticColors.error + '38'
              : semanticColors.error,
            elevation: disabled ? 0 : ELEVATION.Level2,
            shadowColor: semanticColors.error,
            shadowOffset: {width: 0, height: 2},
            shadowOpacity: 0.15,
            shadowRadius: 4,
          },
          text: {
            color: '#FFFFFF',
          },
          icon: {
            color: '#FFFFFF',
          },
        };

      case ButtonVariant.success:
        return {
          container: {
            ...baseStyle,
            backgroundColor: disabled 
              ? semanticColors.success + '38'
              : semanticColors.success,
            elevation: disabled ? 0 : ELEVATION.Level2,
            shadowColor: semanticColors.success,
            shadowOffset: {width: 0, height: 2},
            shadowOpacity: 0.15,
            shadowRadius: 4,
          },
          text: {
            color: '#FFFFFF',
          },
          icon: {
            color: '#FFFFFF',
          },
        };

      default:
        return getVariantStyles();
    }
  };

  const variantStyles = getVariantStyles();
  const config = sizeConfig[size];
  const isInteractionDisabled = disabled || loading;

  const renderContent = () => {
    const iconElement = icon ? (
      <Icon 
        name={icon} 
        size={config.iconSize} 
        color={variantStyles.icon.color}
        style={[
          iconPosition === 'left' && children ? {marginRight: SPACING.sm} : {},
          iconPosition === 'right' && children ? {marginLeft: SPACING.sm} : {},
        ]}
      />
    ) : null;

    const textElement = (
      <ButtonLabel 
        color={variantStyles.text.color}
        style={{fontSize: config.fontSize}}
      >
        {children}
      </ButtonLabel>
    );

    if (loading) {
      return (
        <ActivityIndicator 
          size={config.iconSize} 
          color={variantStyles.text.color} 
        />
      );
    }

    return (
      <>
        {iconPosition === 'left' && iconElement}
        {textElement}
        {iconPosition === 'right' && iconElement}
      </>
    );
  };

  return (
    <TouchableOpacity
      style={[
        variantStyles.container,
        fullWidth && {width: '100%'},
        style,
      ]}
      onPress={onPress}
      disabled={isInteractionDisabled}
      activeOpacity={0.7}
      testID={testID}>
      {renderContent()}
    </TouchableOpacity>
  );
};

// Specialized Button Components
const PrimaryButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button variant={ButtonVariant.primary} {...props} />
);

const SecondaryButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button variant={ButtonVariant.secondary} {...props} />
);

const TertiaryButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button variant={ButtonVariant.Tertiary} {...props} />
);

const ErrorButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button variant={ButtonVariant.error} {...props} />
);

const SuccessButton: React.FC<Omit<ButtonProps, 'variant'>> = (props) => (
  <Button variant={ButtonVariant.success} {...props} />
);

// Floating Action Button
interface FABProps {
  onPress: () => void;
  icon: string;
  size?: 'standard' | 'mini';
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  style?: ViewStyle;
  testID?: string;
}

const FloatingActionButton: React.FC<FABProps> = ({
  onPress,
  icon,
  size = 'standard',
  variant = 'primary',
  disabled = false,
  style,
  testID,
}) => {
  const {theme} = useTheme();

  const fabSize = size === 'standard' ? 56 : 40;
  const iconSize = size === 'standard' ? 24 : 18;

  const backgroundColor = variant === 'primary' 
    ? theme.primary 
    : theme.secondary;
  
  const iconColor = variant === 'primary' 
    ? theme.OnPrimary 
    : theme.OnSecondary;

  return (
    <TouchableOpacity
      style={[
        {
          width: fabSize,
          height: fabSize,
          borderRadius: fabSize / 2,
          backgroundColor: disabled ? backgroundColor + '38' : backgroundColor,
          justifyContent: 'center',
          alignItems: 'center',
          elevation: disabled ? 0 : ELEVATION.Level3,
          shadowColor: backgroundColor,
          shadowOffset: {width: 0, height: 4},
          shadowOpacity: 0.3,
          shadowRadius: 8,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      testID={testID}>
      <Icon 
        name={icon} 
        size={iconSize} 
        color={disabled ? iconColor + '38' : iconColor} 
      />
    </TouchableOpacity>
  );
};

// Icon Button
interface IconButtonProps {
  icon: string;
  onPress: () => void;
  size?: number;
  color?: string;
  disabled?: boolean;
  style?: ViewStyle;
  testID?: string;
}

const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onPress,
  size = 24,
  color,
  disabled = false,
  style,
  testID,
}) => {
  const {theme} = useTheme();
  const touchTargetSize = Math.max(size + 24, 48); // Minimum 48dp touch target

  return (
    <TouchableOpacity
      style={[
        {
          width: touchTargetSize,
          height: touchTargetSize,
          borderRadius: touchTargetSize / 2,
          justifyContent: 'center',
          alignItems: 'center',
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.6}
      testID={testID}>
      <Icon
        name={icon}
        size={size}
        color={disabled 
          ? (color || theme.OnSurface) + '38'
          : (color || theme.OnSurface)
        }
      />
    </TouchableOpacity>
  );
};

export default Button;