export const COLORS = {
  primary: '#6C5CE7',
  secondary: '#A29BFE',
  accent: '#FD79A8',
  
  // Background
  background: '#FFFFFF',
  backgroundDark: '#F8F9FA',
  
  // Text
  text: '#2D3436',
  textLight: '#636E72',
  textDark: '#000000',
  
  // Status
  success: '#00B894',
  error: '#D63031',
  warning: '#FDCB6E',
  info: '#74B9FF',
  
  // UI Elements
  border: '#DFE6E9',
  card: '#FFFFFF',
  shadow: '#000000',
  
  // Video Progress
  progressBackground: '#DFE6E9',
  progressFill: '#6C5CE7',
};

export const SIZES = {
  // App dimensions
  base: 8,
  small: 12,
  font: 14,
  medium: 16,
  large: 18,
  extraLarge: 24,
  
  // Font sizes
  h1: 32,
  h2: 28,
  h3: 24,
  h4: 20,
  body1: 16,
  body2: 14,
  body3: 12,
  
  // Padding
  padding: 16,
  paddingSmall: 8,
  paddingLarge: 24,
  
  // Border Radius
  radius: 12,
  radiusSmall: 8,
  radiusLarge: 16,
};

export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  semiBold: 'System',
};

export const SHADOWS = {
  small: {
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 2,
  },
  medium: {
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 5.46,
    elevation: 4,
  },
  large: {
    shadowColor: COLORS.shadow,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.2,
    shadowRadius: 7.49,
    elevation: 6,
  },
};
