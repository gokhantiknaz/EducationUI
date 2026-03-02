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
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import Button from '../components/Button';
import Input from '../components/Input';
import SocialLoginButtons from '../components/SocialLoginButtons';
import useAuthStore from '../store/authStore';
import { showSuccessToast, showErrorToast } from '../utils/toast';

// Test users (only visible in development mode)
const TEST_USERS = [
  {
    id: 'testuser1',
    label: 'Test User 1',
    description: 'Free user',
    email: 'testuser1@test.com',
    password: 'Test123!',
    color: '#3B82F6',
  },
  {
    id: 'testuser2',
    label: 'Test User 2',
    description: 'Premium user (purchased course)',
    email: 'testuser2@test.com',
    password: 'Test123!',
    color: '#10B981',
  },
];

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const { login, isLoading } = useAuthStore();

  // Quick login with test user
  const handleTestUserLogin = async (testUser) => {
    try {
      await login(testUser.email, testUser.password);
      showSuccessToast(`Logged in as ${testUser.label}!`, 'Login Successful');
    } catch (error) {
      showErrorToast(error.message || 'Login failed', 'Error');
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    try {
      await login(email.trim(), password);
      showSuccessToast('Login successful! Welcome.', 'Login Successful');
      // Navigation will be handled automatically by AuthNavigator
    } catch (error) {
      // Show error messages from backend
      const errorMessage = error.message || 'Login failed';

      // Custom messages for common error cases
      if (errorMessage.toLowerCase().includes('not found') ||
          errorMessage.toLowerCase().includes('bulunamadı') ||
          errorMessage.toLowerCase().includes('kullanıcı yok')) {
        showErrorToast('No user found with this email address.', 'User Not Found');
      } else if (errorMessage.toLowerCase().includes('password') ||
                 errorMessage.toLowerCase().includes('şifre') ||
                 errorMessage.toLowerCase().includes('invalid credentials') ||
                 errorMessage.toLowerCase().includes('unauthorized')) {
        showErrorToast('Email or password is incorrect.', 'Login Error');
      } else if (errorMessage.toLowerCase().includes('locked') ||
                 errorMessage.toLowerCase().includes('kilitli')) {
        showErrorToast('Your account has been locked. Please contact support.', 'Account Locked');
      } else if (errorMessage.toLowerCase().includes('verify') ||
                 errorMessage.toLowerCase().includes('doğrula')) {
        showErrorToast('Please verify your email address.', 'Email Not Verified');
      } else if (errorMessage.toLowerCase().includes('network') ||
                 errorMessage.toLowerCase().includes('bağlan')) {
        showErrorToast('Could not connect to server. Check your internet connection.', 'Connection Error');
      } else {
        showErrorToast(errorMessage, 'Login Error');
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
            <View style={styles.iconContainer}>
              <Text style={styles.iconText}>📚</Text>
            </View>
            <Text style={styles.title}>Welcome</Text>
            <Text style={styles.subtitle}>
              Sign in to the education platform
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input
              label="Email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) {
                  setErrors({ ...errors, email: null });
                }
              }}
              placeholder="example@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />

            <Input
              label="Password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password) {
                  setErrors({ ...errors, password: null });
                }
              }}
              placeholder="••••••••"
              secureTextEntry={!showPassword}
              error={errors.password}
              rightIcon={
                <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
              }
              onRightIconPress={() => setShowPassword(!showPassword)}
            />

            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <Button
              title="Log In"
              onPress={handleLogin}
              loading={isLoading}
              style={styles.loginButton}
            />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <SocialLoginButtons />

            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.registerLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            {/* Test Users - Only in Development Mode */}
            {__DEV__ && (
              <View style={styles.testUsersContainer}>
                <View style={styles.testUsersDivider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.testUsersTitle}>🧪 Test Users</Text>
                  <View style={styles.dividerLine} />
                </View>
                {TEST_USERS.map((testUser) => (
                  <TouchableOpacity
                    key={testUser.id}
                    style={[styles.testUserButton, { borderColor: testUser.color }]}
                    onPress={() => handleTestUserLogin(testUser)}
                    disabled={isLoading}
                  >
                    <View style={[styles.testUserIcon, { backgroundColor: testUser.color }]}>
                      <Text style={styles.testUserIconText}>
                        {testUser.id === 'testuser1' ? '👤' : '⭐'}
                      </Text>
                    </View>
                    <View style={styles.testUserInfo}>
                      <Text style={[styles.testUserLabel, { color: testUser.color }]}>
                        {testUser.label}
                      </Text>
                      <Text style={styles.testUserDesc}>{testUser.description}</Text>
                    </View>
                    <Text style={styles.testUserArrow}>→</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
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
    alignItems: 'center',
    marginTop: SIZES.paddingLarge * 2,
    marginBottom: SIZES.paddingLarge * 2,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SIZES.padding,
  },
  iconText: {
    fontSize: 40,
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: SIZES.paddingLarge,
  },
  forgotPasswordText: {
    fontSize: SIZES.body2,
    color: COLORS.primary,
    fontWeight: '600',
  },
  loginButton: {
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
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.paddingLarge,
  },
  registerText: {
    fontSize: SIZES.body1,
    color: COLORS.textLight,
  },
  registerLink: {
    fontSize: SIZES.body1,
    color: COLORS.primary,
    fontWeight: '600',
  },
  eyeIcon: {
    fontSize: 20,
  },
  // Test Users Styles
  testUsersContainer: {
    marginTop: SIZES.padding,
    marginBottom: SIZES.paddingLarge,
    padding: SIZES.padding,
    backgroundColor: '#FEF3C7',
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderStyle: 'dashed',
  },
  testUsersDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  testUsersTitle: {
    marginHorizontal: SIZES.paddingSmall,
    fontSize: SIZES.body2,
    fontWeight: '600',
    color: '#92400E',
  },
  testUserButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.padding,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    borderWidth: 2,
    marginBottom: SIZES.paddingSmall,
    ...SHADOWS.small,
  },
  testUserIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.padding,
  },
  testUserIconText: {
    fontSize: 18,
  },
  testUserInfo: {
    flex: 1,
  },
  testUserLabel: {
    fontSize: SIZES.body1,
    fontWeight: '700',
  },
  testUserDesc: {
    fontSize: SIZES.body3,
    color: COLORS.textLight,
    marginTop: 2,
  },
  testUserArrow: {
    fontSize: 20,
    color: COLORS.textLight,
  },
});

export default LoginScreen;
