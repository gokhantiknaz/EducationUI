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
      newErrors.firstName = 'Ad gereklidir';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Soyad gereklidir';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'E-posta adresi gereklidir';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Geçerli bir e-posta adresi giriniz';
    }

    if (!formData.password) {
      newErrors.password = 'Şifre gereklidir';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Şifre en az 6 karakter olmalıdır';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Şifre tekrarı gereklidir';
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
      showSuccessToast('Hesabınız başarıyla oluşturuldu!', 'Registration Successful');
      // Navigation otomatik olarak AuthNavigator tarafından yönetilecek
    } catch (error) {
      // Backend'den gelen hata mesajlarını göster
      const errorMessage = error.message || 'Kayıt olunamadı';

      // Yaygın hata durumları için özel mesajlar
      if (errorMessage.toLowerCase().includes('already') ||
          errorMessage.toLowerCase().includes('zaten') ||
          errorMessage.toLowerCase().includes('exists')) {
        showErrorToast('Bu e-posta adresi zaten kayıtlı. Giriş yapmayı deneyin.', 'Kayıtlı Kullanıcı');
      } else if (errorMessage.toLowerCase().includes('email') &&
                 errorMessage.toLowerCase().includes('invalid')) {
        showErrorToast('Geçersiz e-posta adresi formatı.', 'Geçersiz E-posta');
      } else if (errorMessage.toLowerCase().includes('password')) {
        showErrorToast('Şifre gereksinimleri karşılanmıyor.', 'Şifre Hatası');
      } else if (errorMessage.toLowerCase().includes('network') ||
                 errorMessage.toLowerCase().includes('bağlan')) {
        showErrorToast('Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.', 'Bağlantı Hatası');
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
              <Text style={styles.backButtonText}>← Geri</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Hesap Oluştur</Text>
            <Text style={styles.subtitle}>
              Eğitim platformuna katılın
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input
              label="Ad"
              value={formData.firstName}
              onChangeText={(text) => updateField('firstName', text)}
              placeholder="Adınız"
              error={errors.firstName}
            />

            <Input
              label="Soyad"
              value={formData.lastName}
              onChangeText={(text) => updateField('lastName', text)}
              placeholder="Soyadınız"
              error={errors.lastName}
            />

            <Input
              label="E-posta"
              value={formData.email}
              onChangeText={(text) => updateField('email', text)}
              placeholder="ornek@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />

            <Input
              label="Şifre"
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
