import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';
import { OAUTH_CONFIG } from '../constants/config';
import useAuthStore from '../store/authStore';
import { showSuccessToast, showErrorToast } from '../utils/toast';

// WebBrowser warming for better UX
WebBrowser.maybeCompleteAuthSession();

// Google OAuth endpoints
const googleDiscovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

// LinkedIn OAuth endpoints
const linkedInDiscovery = {
  authorizationEndpoint: 'https://www.linkedin.com/oauth/v2/authorization',
  tokenEndpoint: 'https://www.linkedin.com/oauth/v2/accessToken',
};

const SocialLoginButtons = ({ onSuccess, onError }) => {
  const { socialLogin, isLoading } = useAuthStore();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [linkedInLoading, setLinkedInLoading] = useState(false);

  // Get appropriate Google Client ID based on platform
  const getGoogleClientId = () => {
    if (Platform.OS === 'ios') {
      return OAUTH_CONFIG.GOOGLE_IOS_CLIENT_ID || OAUTH_CONFIG.GOOGLE_CLIENT_ID;
    } else if (Platform.OS === 'android') {
      return OAUTH_CONFIG.GOOGLE_ANDROID_CLIENT_ID || OAUTH_CONFIG.GOOGLE_CLIENT_ID;
    }
    return OAUTH_CONFIG.GOOGLE_CLIENT_ID;
  };

  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'com.education.app',
    path: 'auth',
  });

  // Google Auth Request
  const [googleRequest, googleResponse, googlePromptAsync] = AuthSession.useAuthRequest(
    {
      clientId: getGoogleClientId(),
      scopes: ['openid', 'profile', 'email'],
      redirectUri,
      responseType: AuthSession.ResponseType.Token,
    },
    googleDiscovery
  );

  // LinkedIn Auth Request
  const [linkedInRequest, linkedInResponse, linkedInPromptAsync] = AuthSession.useAuthRequest(
    {
      clientId: OAUTH_CONFIG.LINKEDIN_CLIENT_ID,
      scopes: ['openid', 'profile', 'email'],
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
    },
    linkedInDiscovery
  );

  // Handle Google Response
  useEffect(() => {
    if (googleResponse?.type === 'success') {
      handleGoogleSuccess(googleResponse.authentication);
    } else if (googleResponse?.type === 'error') {
      setGoogleLoading(false);
      showErrorToast('Google ile giriş yapılamadı', 'Hata');
      onError?.('Google login failed');
    } else if (googleResponse?.type === 'dismiss') {
      setGoogleLoading(false);
    }
  }, [googleResponse]);

  // Handle LinkedIn Response
  useEffect(() => {
    if (linkedInResponse?.type === 'success') {
      handleLinkedInSuccess(linkedInResponse.params);
    } else if (linkedInResponse?.type === 'error') {
      setLinkedInLoading(false);
      showErrorToast('LinkedIn ile giriş yapılamadı', 'Hata');
      onError?.('LinkedIn login failed');
    } else if (linkedInResponse?.type === 'dismiss') {
      setLinkedInLoading(false);
    }
  }, [linkedInResponse]);

  const handleGoogleSuccess = async (authentication) => {
    try {
      // Get user info from Google
      const userInfoResponse = await fetch(
        'https://www.googleapis.com/oauth2/v3/userinfo',
        {
          headers: { Authorization: `Bearer ${authentication.accessToken}` },
        }
      );
      const userInfo = await userInfoResponse.json();

      // Call backend with user info
      await socialLogin('Google', {
        idToken: authentication.idToken,
        accessToken: authentication.accessToken,
        email: userInfo.email,
        givenName: userInfo.given_name,
        familyName: userInfo.family_name,
        picture: userInfo.picture,
        sub: userInfo.sub,
      });

      showSuccessToast('Google ile giriş başarılı!', 'Başarılı');
      onSuccess?.();
    } catch (error) {
      console.error('Google login error:', error);
      showErrorToast(error.message || 'Google ile giriş yapılamadı', 'Hata');
      onError?.(error);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLinkedInSuccess = async (params) => {
    try {
      // Exchange code for access token
      const tokenResponse = await fetch(linkedInDiscovery.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: params.code,
          redirect_uri: redirectUri,
          client_id: OAUTH_CONFIG.LINKEDIN_CLIENT_ID,
          client_secret: OAUTH_CONFIG.LINKEDIN_CLIENT_SECRET,
        }).toString(),
      });
      const tokenData = await tokenResponse.json();

      if (!tokenData.access_token) {
        throw new Error('LinkedIn token alınamadı');
      }

      // Get user info from LinkedIn
      const userInfoResponse = await fetch(
        'https://api.linkedin.com/v2/userinfo',
        {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        }
      );
      const userInfo = await userInfoResponse.json();

      // Call backend with user info
      await socialLogin('LinkedIn', {
        idToken: tokenData.id_token || '',
        accessToken: tokenData.access_token,
        email: userInfo.email,
        givenName: userInfo.given_name,
        familyName: userInfo.family_name,
        picture: userInfo.picture,
        sub: userInfo.sub,
      });

      showSuccessToast('LinkedIn ile giriş başarılı!', 'Başarılı');
      onSuccess?.();
    } catch (error) {
      console.error('LinkedIn login error:', error);
      showErrorToast(error.message || 'LinkedIn ile giriş yapılamadı', 'Hata');
      onError?.(error);
    } finally {
      setLinkedInLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!getGoogleClientId()) {
      showErrorToast('Google Client ID yapılandırılmamış', 'Yapılandırma Hatası');
      return;
    }
    setGoogleLoading(true);
    await googlePromptAsync();
  };

  const handleLinkedInLogin = async () => {
    if (!OAUTH_CONFIG.LINKEDIN_CLIENT_ID) {
      showErrorToast('LinkedIn Client ID yapılandırılmamış', 'Yapılandırma Hatası');
      return;
    }
    setLinkedInLoading(true);
    await linkedInPromptAsync();
  };

  const isAnyLoading = isLoading || googleLoading || linkedInLoading;

  return (
    <View style={styles.container}>
      {/* Google Button */}
      <TouchableOpacity
        style={[styles.socialButton, styles.googleButton]}
        onPress={handleGoogleLogin}
        disabled={isAnyLoading || !googleRequest}
      >
        {googleLoading ? (
          <ActivityIndicator size="small" color="#DB4437" />
        ) : (
          <>
            <View style={styles.iconContainer}>
              <Text style={styles.googleIcon}>G</Text>
            </View>
            <Text style={styles.googleButtonText}>Google ile devam et</Text>
          </>
        )}
      </TouchableOpacity>

      {/* LinkedIn Button */}
      <TouchableOpacity
        style={[styles.socialButton, styles.linkedInButton]}
        onPress={handleLinkedInLogin}
        disabled={isAnyLoading || !linkedInRequest}
      >
        {linkedInLoading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            <View style={styles.iconContainer}>
              <Text style={styles.linkedInIcon}>in</Text>
            </View>
            <Text style={styles.linkedInButtonText}>LinkedIn ile devam et</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: SIZES.paddingSmall,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SIZES.padding,
    paddingHorizontal: SIZES.paddingLarge,
    borderRadius: SIZES.radius,
    ...SHADOWS.small,
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  linkedInButton: {
    backgroundColor: '#0A66C2',
  },
  iconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SIZES.paddingSmall,
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#DB4437',
  },
  linkedInIcon: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  googleButtonText: {
    fontSize: SIZES.body1,
    fontWeight: '600',
    color: COLORS.text,
  },
  linkedInButtonText: {
    fontSize: SIZES.body1,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default SocialLoginButtons;
