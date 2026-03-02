import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES } from '../constants/theme';
import Button from '../components/Button';
import Input from '../components/Input';
import SocialLoginButtons from '../components/SocialLoginButtons';
import useAuthStore from '../store/authStore';
import { showSuccessToast, showErrorToast } from '../utils/toast';

const RegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const { register, isLoading } = useAuthStore();

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirm password is required';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      const userData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password,
      };

      await register(userData);
      showSuccessToast('Your account has been created successfully!', 'Registration Successful');
      // Navigation will be handled automatically by AuthNavigator
    } catch (error) {
      // Show error messages from backend
      const errorMessage = error.message || 'Registration failed';

      // Custom messages for common error cases
      if (errorMessage.toLowerCase().includes('already') ||
          errorMessage.toLowerCase().includes('zaten') ||
          errorMessage.toLowerCase().includes('exists')) {
        showErrorToast('This email address is already registered. Try logging in.', 'Already Registered');
      } else if (errorMessage.toLowerCase().includes('email') &&
                 errorMessage.toLowerCase().includes('invalid')) {
        showErrorToast('Invalid email address format.', 'Invalid Email');
      } else if (errorMessage.toLowerCase().includes('password')) {
        showErrorToast('Password requirements not met.', 'Password Error');
      } else if (errorMessage.toLowerCase().includes('network') ||
                 errorMessage.toLowerCase().includes('bağlan')) {
        showErrorToast('Could not connect to server. Check your internet connection.', 'Connection Error');
      } else {
        showErrorToast(errorMessage, 'Registration Error');
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Join the education platform
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input
              label="First Name"
              value={formData.firstName}
              onChangeText={(text) => updateField('firstName', text)}
              placeholder="Your first name"
              error={errors.firstName}
            />

            <Input
              label="Last Name"
              value={formData.lastName}
              onChangeText={(text) => updateField('lastName', text)}
              placeholder="Your last name"
              error={errors.lastName}
            />

            <Input
              label="Email"
              value={formData.email}
              onChangeText={(text) => updateField('email', text)}
              placeholder="example@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />

            <Input
              label="Password"
              value={formData.password}
              onChangeText={(text) => updateField('password', text)}
              placeholder="••••••••"
              secureTextEntry={!showPassword}
              error={errors.password}
              rightIcon={
                <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
              }
              onRightIconPress={() => setShowPassword(!showPassword)}
            />

            <Input
              label="Confirm Password"
              value={formData.confirmPassword}
              onChangeText={(text) => updateField('confirmPassword', text)}
              placeholder="••••••••"
              secureTextEntry={!showConfirmPassword}
              error={errors.confirmPassword}
              rightIcon={
                <Text style={styles.eyeIcon}>
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </Text>
              }
              onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
            />

            <Button
              title="Sign Up"
              onPress={handleRegister}
              loading={isLoading}
              style={styles.registerButton}
            />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <SocialLoginButtons />

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>Log In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SIZES.paddingLarge,
  },
  header: {
    marginTop: SIZES.padding,
    marginBottom: SIZES.paddingLarge,
  },
  backButton: {
    marginBottom: SIZES.padding,
  },
  backButtonText: {
    fontSize: SIZES.body1,
    color: COLORS.primary,
    fontWeight: '600',
  },
  title: {
    fontSize: SIZES.h1,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SIZES.paddingSmall,
  },
  subtitle: {
    fontSize: SIZES.body1,
    color: COLORS.textLight,
  },
  form: {
    flex: 1,
  },
  registerButton: {
    marginTop: SIZES.padding,
    marginBottom: SIZES.paddingLarge,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.paddingLarge,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    marginHorizontal: SIZES.padding,
    fontSize: SIZES.body2,
    color: COLORS.textLight,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.paddingLarge,
  },
  loginText: {
    fontSize: SIZES.body1,
    color: COLORS.textLight,
  },
  loginLink: {
    fontSize: SIZES.body1,
    color: COLORS.primary,
    fontWeight: '600',
  },
  eyeIcon: {
    fontSize: 20,
  },
});

export default RegisterScreen;
