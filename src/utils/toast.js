import Toast from 'react-native-toast-message';

// Toast helper functions
export const showSuccessToast = (message, title = 'Success') => {
  Toast.show({
    type: 'success',
    text1: title,
    text2: message,
    position: 'top',
    visibilityTime: 3000,
    autoHide: true,
  });
};

export const showErrorToast = (message, title = 'Error') => {
  Toast.show({
    type: 'error',
    text1: title,
    text2: message,
    position: 'top',
    visibilityTime: 4000,
    autoHide: true,
  });
};

export const showWarningToast = (message, title = 'Warning') => {
  Toast.show({
    type: 'info',
    text1: title,
    text2: message,
    position: 'top',
    visibilityTime: 3500,
    autoHide: true,
  });
};

export const showInfoToast = (message, title = 'Info') => {
  Toast.show({
    type: 'info',
    text1: title,
    text2: message,
    position: 'top',
    visibilityTime: 3000,
    autoHide: true,
  });
};

// Show toast based on API response
export const showApiResponseToast = (response, successMessage) => {
  if (response?.success) {
    showSuccessToast(successMessage || response.message || 'Operation successful');
  } else {
    showErrorToast(response?.message || 'An error occurred');
  }
};

// Parse and show error messages
export const showApiErrorToast = (error) => {
  let message = 'An error occurred';

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
