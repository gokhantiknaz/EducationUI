import Toast from 'react-native-toast-message';

// Toast gösterme yardımcı fonksiyonları
export const showSuccessToast = (message, title = 'Başarılı') => {
  Toast.show({
    type: 'success',
    text1: title,
    text2: message,
    position: 'top',
    visibilityTime: 3000,
    autoHide: true,
  });
};

export const showErrorToast = (message, title = 'Hata') => {
  Toast.show({
    type: 'error',
    text1: title,
    text2: message,
    position: 'top',
    visibilityTime: 4000,
    autoHide: true,
  });
};

export const showWarningToast = (message, title = 'Uyarı') => {
  Toast.show({
    type: 'info',
    text1: title,
    text2: message,
    position: 'top',
    visibilityTime: 3500,
    autoHide: true,
  });
};

export const showInfoToast = (message, title = 'Bilgi') => {
  Toast.show({
    type: 'info',
    text1: title,
    text2: message,
    position: 'top',
    visibilityTime: 3000,
    autoHide: true,
  });
};

// API response'larına göre toast göster
export const showApiResponseToast = (response, successMessage) => {
  if (response?.success) {
    showSuccessToast(successMessage || response.message || 'İşlem başarılı');
  } else {
    showErrorToast(response?.message || 'Bir hata oluştu');
  }
};

// Hata mesajlarını parse et ve göster
export const showApiErrorToast = (error) => {
  let message = 'Bir hata oluştu';

  if (typeof error === 'string') {
    message = error;
  } else if (error?.message) {
    message = error.message;
  } else if (error?.response?.data?.message) {
    message = error.response.data.message;
  }

  showErrorToast(message);
};

export default {
  showSuccessToast,
  showErrorToast,
  showWarningToast,
  showInfoToast,
  showApiResponseToast,
  showApiErrorToast,
};
