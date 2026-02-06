import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon = null,
  style,
  textStyle,
}) => {
  const buttonStyles = [
    styles.button,
    styles[variant],
    styles[size],
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    disabled && styles.disabledText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? COLORS.background : COLORS.primary}
        />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.icon}>{icon}</View>}
          <Text style={textStyles}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: SIZES.radius,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: SIZES.paddingSmall,
  },
  text: {
    fontWeight: '600',
  },

  // Variants
  primary: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.small,
  },
  secondary: {
    backgroundColor: COLORS.secondary,
    ...SHADOWS.small,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  danger: {
    backgroundColor: COLORS.error,
    ...SHADOWS.small,
  },

  // Sizes
  small: {
    paddingVertical: SIZES.paddingSmall,
    paddingHorizontal: SIZES.padding,
    minHeight: 36,
  },
  medium: {
    paddingVertical: SIZES.padding,
    paddingHorizontal: SIZES.paddingLarge,
    minHeight: 48,
  },
  large: {
    paddingVertical: SIZES.paddingLarge,
    paddingHorizontal: SIZES.paddingLarge * 1.5,
    minHeight: 56,
  },

  // Text styles
  primaryText: {
    color: COLORS.background,
  },
  secondaryText: {
    color: COLORS.background,
  },
  outlineText: {
    color: COLORS.primary,
  },
  ghostText: {
    color: COLORS.primary,
  },
  dangerText: {
    color: COLORS.background,
  },
  
  smallText: {
    fontSize: SIZES.body2,
  },
  mediumText: {
    fontSize: SIZES.body1,
  },
  largeText: {
    fontSize: SIZES.large,
  },

  // States
  disabled: {
    backgroundColor: COLORS.border,
    opacity: 0.6,
  },
  disabledText: {
    color: COLORS.textLight,
  },
});

export default Button;
