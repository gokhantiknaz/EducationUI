import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { COLORS, SIZES } from '../constants/theme';

const Input = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  error,
  leftIcon,
  rightIcon,
  editable = true,
  multiline = false,
  numberOfLines = 1,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  onRightIconPress,
  containerStyle,
  inputStyle,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.focused,
          error && styles.error,
          !editable && styles.disabled,
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        
        <TextInput
          style={[
            styles.input,
            leftIcon && styles.inputWithLeftIcon,
            rightIcon && styles.inputWithRightIcon,
            multiline && styles.multiline,
            inputStyle,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textLight}
          secureTextEntry={secureTextEntry}
          editable={editable}
          multiline={multiline}
          numberOfLines={numberOfLines}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        
        {rightIcon && (
          <TouchableOpacity
            style={styles.rightIcon}
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SIZES.padding,
  },
  label: {
    fontSize: SIZES.body2,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SIZES.paddingSmall,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundDark,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius,
    paddingHorizontal: SIZES.padding,
  },
  focused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.background,
  },
  error: {
    borderColor: COLORS.error,
  },
  disabled: {
    backgroundColor: COLORS.border,
    opacity: 0.6,
  },
  input: {
    flex: 1,
    fontSize: SIZES.body1,
    color: COLORS.text,
    paddingVertical: SIZES.padding,
  },
  inputWithLeftIcon: {
    marginLeft: SIZES.paddingSmall,
  },
  inputWithRightIcon: {
    marginRight: SIZES.paddingSmall,
  },
  multiline: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: SIZES.padding,
  },
  leftIcon: {
    marginRight: SIZES.paddingSmall,
  },
  rightIcon: {
    marginLeft: SIZES.paddingSmall,
    padding: SIZES.paddingSmall,
  },
  errorText: {
    fontSize: SIZES.body3,
    color: COLORS.error,
    marginTop: SIZES.paddingSmall,
  },
});

export default Input;
