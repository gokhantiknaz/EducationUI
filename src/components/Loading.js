import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { COLORS, SIZES } from '../constants/theme';

const Loading = ({ text = 'Yükleniyor...', size = 'large', color = COLORS.primary }) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color} />
      {text && <Text style={styles.text}>{text}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  text: {
    marginTop: SIZES.padding,
    fontSize: SIZES.body1,
    color: COLORS.textLight,
  },
});

export default Loading;
