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

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('Test123!');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const { login, isLoading } = useAuthStore();

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
      // Navigation otomatik olarak AuthNavigator tarafından yönetilecek
    } catch (error) {
      // Backend'den gelen hata mesajlarını göster
      const errorMessage = error.message || 'Login failed';

      // Yaygın hata durumları için özel mesajlar
      if (errorMessage.toLowerCase().includes('not found') ||
          errorMessage.toLowerCase().includes('bulunamadı') ||
          errorMessage.toLowerCase().includes('kullanıcı yok')) {
        showErrorToast('Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı.', 'Kullanıcı Bulunamadı');
      } else if (errorMessage.toLowerCase().includes('password') ||
                 errorMessage.toLowerCase().includes('şifre') ||
                 errorMessage.toLowerCase().includes('invalid credentials') ||
                 errorMessage.toLowerCase().includes('unauthorized')) {
        showErrorToast('Email or password is incorrect.', 'Login Error');
      } else if (errorMessage.toLowerCase().includes('locked') ||
                 errorMessage.toLowerCase().includes('kilitli')) {
        showErrorToast('Hesabınız kilitlendi. Lütfen destek ile iletişime geçin.', 'Hesap Kilitli');
      } else if (errorMessage.toLowerCase().includes('verify') ||
                 errorMessage.toLowerCase().includes('doğrula')) {
        showErrorToast('Please verify your email address.', 'Email Not Verified');
      } else if (errorMessage.toLowerCase().includes('network') ||
                 errorMessage.toLowerCase().includes('bağlan')) {
        showErrorToast('Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.', 'Bağlantı Hatası');
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
            <Text style={styles.title}>Hoş Geldiniz</Text>
            <Text style={styles.subtitle}>
              Eğitim platformuna giriş yapın
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
              placeholder="ornek@email.com"
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
              <Text style={styles.forgotPasswordText}>Passwordmi Unuttum?</Text>
            </TouchableOpacity>

            <Button
              title="Log In"
              onPress={handleLogin}
              loading={isLoading}
              style={styles.loginButton}
            />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>veya</Text>
              <View style={styles.dividerLine} />
            </View>

            <SocialLoginButtons />

            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.registerLink}>Sign Up</Text>
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
});

export default LoginScreen;
