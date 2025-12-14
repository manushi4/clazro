/**
 * CoachingTextField - Core text input component for the coaching platform
 * Implements Material Design 3 text field specifications
 */

import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
  Animated,
} from 'react-native';
import { LightTheme, SemanticColors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';

interface CoachingTextFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  error?: string;
  helperText?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  onTrailingIconPress?: () => void;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  variant?: 'outlined' | 'filled';
  required?: boolean;
  testID?: string;
}

const CoachingTextField: React.FC<CoachingTextFieldProps> = ({
  label,
  error,
  helperText,
  leadingIcon,
  trailingIcon,
  onTrailingIconPress,
  containerStyle,
  inputStyle,
  variant = 'outlined',
  required = false,
  testID,
  value,
  editable = true,
  onFocus,
  onBlur,
  ...textInputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(!!value);
  const animatedLabelPosition = useRef(new Animated.Value(hasValue || isFocused ? 1 : 0)).current;

  const handleFocus = (e: any) => {
    setIsFocused(true);
    animateLabelUp();
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    if (!hasValue) {
      animateLabelDown();
    }
    onBlur?.(e);
  };

  const handleChangeText = (text: string) => {
    setHasValue(text.length > 0);
    if (text.length > 0 && !isFocused) {
      animateLabelUp();
    } else if (text.length === 0 && !isFocused) {
      animateLabelDown();
    }
    textInputProps.onChangeText?.(text);
  };

  const animateLabelUp = () => {
    Animated.timing(animatedLabelPosition, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const animateLabelDown = () => {
    Animated.timing(animatedLabelPosition, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const getContainerStyles = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: BorderRadius.SM,
      borderWidth: 1,
      position: 'relative',
    };

    if (variant === 'filled') {
      return {
        ...baseStyle,
        backgroundColor: LightTheme.SurfaceVariant,
        borderColor: 'transparent',
        borderBottomColor: isFocused 
          ? LightTheme.Primary 
          : error 
            ? SemanticColors.Error 
            : LightTheme.Outline,
        borderBottomWidth: isFocused ? 2 : 1,
        borderRadius: 0,
        borderTopLeftRadius: BorderRadius.SM,
        borderTopRightRadius: BorderRadius.SM,
      };
    }

    // Outlined variant
    return {
      ...baseStyle,
      backgroundColor: 'transparent',
      borderColor: isFocused 
        ? LightTheme.Primary 
        : error 
          ? SemanticColors.Error 
          : LightTheme.Outline,
      borderWidth: isFocused ? 2 : 1,
    };
  };

  const getLabelStyles = () => {
    const labelTop = animatedLabelPosition.interpolate({
      inputRange: [0, 1],
      outputRange: [20, -8],
    });

    const labelFontSize = animatedLabelPosition.interpolate({
      inputRange: [0, 1],
      outputRange: [Typography.bodyLarge.fontSize, Typography.bodySmall.fontSize],
    });

    const labelColor = isFocused 
      ? LightTheme.Primary 
      : error 
        ? SemanticColors.Error 
        : LightTheme.OnSurfaceVariant;

    return {
      position: 'absolute' as const,
      left: leadingIcon ? 48 : Spacing.MD,
      top: labelTop,
      fontSize: labelFontSize,
      color: labelColor,
      backgroundColor: variant === 'outlined' ? LightTheme.Surface : 'transparent',
      paddingHorizontal: variant === 'outlined' ? 4 : 0,
      fontFamily: Typography.bodyMedium.fontFamily,
      zIndex: 1,
    };
  };

  const getInputStyles = (): TextStyle => {
    return {
      flex: 1,
      fontSize: Typography.bodyLarge.fontSize,
      fontFamily: Typography.bodyLarge.fontFamily,
      color: LightTheme.OnSurface,
      paddingTop: Spacing.LG,
      paddingBottom: Spacing.MD,
      paddingLeft: leadingIcon ? 48 : Spacing.MD,
      paddingRight: trailingIcon ? 48 : Spacing.MD,
      textAlignVertical: 'top',
    };
  };

  return (
    <View style={[containerStyle]}>
      <View style={getContainerStyles()}>
        {/* Leading Icon */}
        {leadingIcon && (
          <View style={styles.leadingIcon}>
            {leadingIcon}
          </View>
        )}

        {/* Animated Label */}
        <Animated.Text style={getLabelStyles()}>
          {label}{required && ' *'}
        </Animated.Text>

        {/* Text Input */}
        <TextInput
          {...textInputProps}
          value={value}
          style={[getInputStyles(), inputStyle]}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChangeText={handleChangeText}
          placeholderTextColor={LightTheme.OnSurfaceVariant}
          selectionColor={LightTheme.Primary}
          testID={testID}
          accessibilityLabel={label}
          accessibilityHint={helperText || error}
          accessibilityState={{
            disabled: !editable,
          }}
        />

        {/* Trailing Icon */}
        {trailingIcon && (
          <TouchableOpacity
            style={styles.trailingIcon}
            onPress={onTrailingIconPress}
            disabled={!onTrailingIconPress}
            testID={`${testID}-trailing-icon`}
          >
            {trailingIcon}
          </TouchableOpacity>
        )}
      </View>

      {/* Helper Text or Error */}
      {(error || helperText) && (
        <Text
          style={[
            styles.helperText,
            { color: error ? SemanticColors.Error : LightTheme.OnSurfaceVariant }
          ]}
        >
          {error || helperText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  leadingIcon: {
    position: 'absolute',
    left: Spacing.MD,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 24,
    zIndex: 2,
  },
  trailingIcon: {
    position: 'absolute',
    right: Spacing.MD,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 24,
    zIndex: 2,
  },
  helperText: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    marginTop: Spacing.XS,
    marginLeft: Spacing.MD,
    lineHeight: Typography.bodySmall.lineHeight,
  },
});

export default CoachingTextField;