/**
 * Button Component
 * MD3-compliant button with variants and sizes
 *
 * Usage:
 * <Button variant="primary" size="md" onPress={handlePress}>
 *   Click Me
 * </Button>
 */

import React from 'react';
import { TouchableOpacity, TouchableOpacityProps, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { T } from '../typography/T';
import { Row } from '../layout/Row';
import { Colors, Spacing, BorderRadius, Typography } from '../../theme/designSystem';
import { elevation } from '../helpers/elevation';

type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'secondary';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  iconLeft,
  iconRight,
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  children,
  ...props
}) => {
  const buttonStyle: ViewStyle = {
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const textStyle: TextStyle = {
    fontWeight: Typography.fontWeight.medium,
  };

  // Size styles
  switch (size) {
    case 'sm':
      buttonStyle.paddingHorizontal = Spacing.md;
      buttonStyle.paddingVertical = Spacing.sm;
      buttonStyle.minHeight = 36;
      textStyle.fontSize = Typography.fontSize.small;
      break;
    case 'md':
      buttonStyle.paddingHorizontal = Spacing.base;
      buttonStyle.paddingVertical = Spacing.md;
      buttonStyle.minHeight = 48;
      textStyle.fontSize = Typography.fontSize.body;
      break;
    case 'lg':
      buttonStyle.paddingHorizontal = Spacing.lg;
      buttonStyle.paddingVertical = Spacing.base;
      buttonStyle.minHeight = 56;
      textStyle.fontSize = Typography.fontSize.title;
      break;
  }

  // Variant styles
  switch (variant) {
    case 'primary':
      buttonStyle.backgroundColor = Colors.primary;
      textStyle.color = Colors.onPrimary;
      Object.assign(buttonStyle, elevation(2));
      break;
    case 'secondary':
      buttonStyle.backgroundColor = Colors.primaryContainer;
      textStyle.color = Colors.primary;
      break;
    case 'outline':
      buttonStyle.backgroundColor = 'transparent';
      buttonStyle.borderWidth = 1;
      buttonStyle.borderColor = Colors.primary;
      textStyle.color = Colors.primary;
      break;
    case 'ghost':
      buttonStyle.backgroundColor = 'transparent';
      textStyle.color = Colors.primary;
      break;
  }

  if (fullWidth) {
    buttonStyle.width = '100%';
  }

  if (disabled || loading) {
    buttonStyle.opacity = 0.5;
  }

  return (
    <TouchableOpacity
      style={[buttonStyle, style]}
      disabled={disabled || loading}
      activeOpacity={0.7}
      {...props}
    >
      <Row gap={Spacing.sm} center>
        {loading ? (
          <ActivityIndicator size="small" color={textStyle.color} />
        ) : (
          <>
            {iconLeft}
            <T style={textStyle}>{children}</T>
            {iconRight}
          </>
        )}
      </Row>
    </TouchableOpacity>
  );
};
