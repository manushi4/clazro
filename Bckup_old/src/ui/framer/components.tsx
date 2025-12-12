import React, { useMemo, useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { FRAMER_COLORS, FRAMER_RADII, FRAMER_SHADOWS, FRAMER_SIZES } from './theme';

type ButtonVariant = 'primary' | 'outline' | 'ghost';

export const FramerCard: React.FC<{ style?: StyleProp<ViewStyle>; children: React.ReactNode }> = ({
  style,
  children,
}) => (
  <View style={StyleSheet.flatten([styles.card, style])}>{children}</View>
);

interface FramerInputProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric';
  leftIcon?: string;
  rightIcon?: string;
  onRightPress?: () => void;
  style?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
}

export const FramerInput: React.FC<FramerInputProps> = ({
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType = 'default',
  leftIcon,
  rightIcon,
  onRightPress,
  style,
  inputStyle,
}) => {
  const [focused, setFocused] = useState(false);

  return (
    <View style={StyleSheet.flatten([styles.inputWrapper, style, focused && { borderColor: FRAMER_COLORS.primary }])}>
      {leftIcon ? (
        <View style={styles.iconHolder}>
          <Icon name={leftIcon} size={18} color={FRAMER_COLORS.textTertiary} />
        </View>
      ) : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={FRAMER_COLORS.textTertiary}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={StyleSheet.flatten([
          styles.input,
          leftIcon && { paddingLeft: 0 },
          rightIcon && { paddingRight: 8 },
          inputStyle,
        ])}
      />
      {rightIcon ? (
        <TouchableOpacity onPress={onRightPress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Icon name={rightIcon} size={18} color={FRAMER_COLORS.textTertiary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

interface FramerButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const FramerButton: React.FC<FramerButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  style,
}) => {
  const isPrimary = variant === 'primary';
  const isOutline = variant === 'outline';
  const baseStyle = useMemo(() => {
    const bg = isPrimary ? FRAMER_COLORS.primary : '#FFFFFF';
    const border = isOutline ? FRAMER_COLORS.stroke : 'transparent';
    return {
      backgroundColor: disabled && isPrimary ? FRAMER_COLORS.stroke : bg,
      borderColor: border,
      borderWidth: isOutline ? 1 : 0,
    };
  }, [disabled, isPrimary, isOutline]);

  const textColor = isPrimary ? '#FFFFFF' : FRAMER_COLORS.textPrimary;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={StyleSheet.flatten([
        styles.button,
        baseStyle,
        isOutline && styles.buttonOutline,
        variant === 'ghost' && styles.buttonGhost,
        disabled && styles.buttonDisabled,
        style,
      ])}
      accessibilityRole="button"
    >
      {loading ? (
        <>
          <ActivityIndicator color={isPrimary ? '#FFFFFF' : FRAMER_COLORS.primary} size="small" />
          <Text style={[styles.buttonText, { color: textColor }]}>Loading...</Text>
        </>
      ) : (
        <Text style={[styles.buttonText, { color: textColor }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

interface FramerCheckboxProps {
  label: string;
  checked: boolean;
  onToggle: () => void;
  style?: StyleProp<ViewStyle>;
}

export const FramerCheckbox: React.FC<FramerCheckboxProps> = ({ label, checked, onToggle, style }) => (
  <TouchableOpacity
    onPress={onToggle}
    style={StyleSheet.flatten([styles.checkboxRow, style])}
    accessibilityRole="checkbox"
    accessibilityState={{ checked }}
  >
    <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
      {checked ? <Icon name="check" size={14} color="#fff" /> : null}
    </View>
    <Text style={styles.checkboxLabel}>{label}</Text>
  </TouchableOpacity>
);

export const FramerDivider: React.FC<{ label?: string; style?: StyleProp<ViewStyle> }> = ({ label, style }) => (
  <View style={StyleSheet.flatten([styles.dividerRow, style])}>
    <View style={styles.dividerLine} />
    {label ? <Text style={styles.dividerText}>{label}</Text> : null}
    <View style={styles.dividerLine} />
  </View>
);

type SocialKind = 'google' | 'apple';

export const FramerSocialButton: React.FC<{ kind: SocialKind; onPress: () => void }> = ({ kind, onPress }) => {
  const label = kind === 'google' ? 'Google' : 'Apple';
  const iconName = kind === 'google' ? 'google' : 'apple';
  return (
    <TouchableOpacity onPress={onPress} style={styles.socialButton} accessibilityRole="button">
      <Icon name={iconName} size={18} color={FRAMER_COLORS.textPrimary} />
      <Text style={styles.socialText}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: FRAMER_COLORS.card,
    borderRadius: FRAMER_RADII.card,
    padding: 18,
    ...FRAMER_SHADOWS.soft,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: FRAMER_COLORS.stroke,
    borderRadius: FRAMER_RADII.input,
    backgroundColor: '#F9FAFB',
    height: FRAMER_SIZES.inputHeight,
    paddingHorizontal: 12,
  },
  iconHolder: {
    width: FRAMER_SIZES.iconContainer,
    height: FRAMER_SIZES.iconContainer,
    borderRadius: FRAMER_RADII.chip,
    backgroundColor: FRAMER_COLORS.iconBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: FRAMER_COLORS.textPrimary,
    paddingVertical: 0,
  },
  button: {
    height: FRAMER_SIZES.buttonHeight,
    borderRadius: FRAMER_RADII.button,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  buttonOutline: {
    backgroundColor: '#FFFFFF',
  },
  buttonGhost: {
    backgroundColor: 'transparent',
  },
  buttonDisabled: {
    backgroundColor: FRAMER_COLORS.stroke,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: FRAMER_COLORS.primary,
    borderColor: FRAMER_COLORS.primary,
  },
  checkboxLabel: {
    fontSize: 13,
    color: FRAMER_COLORS.textSecondary,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: FRAMER_COLORS.stroke,
  },
  dividerText: {
    fontSize: 12,
    color: FRAMER_COLORS.textSecondary,
    fontWeight: '600',
  },
  socialButton: {
    flex: 1,
    height: 48,
    borderRadius: FRAMER_RADII.button,
    borderWidth: 1,
    borderColor: FRAMER_COLORS.stroke,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  socialText: {
    fontSize: 14,
    fontWeight: '600',
    color: FRAMER_COLORS.textPrimary,
  },
});
