import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SIZES } from '../constants/theme';

const MyListScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My List</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>❤️</Text>
          <Text style={styles.emptyStateText}>
            Save courses to your list to access them quickly
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SIZES.paddingLarge,
    paddingBottom: SIZES.padding,
  },
  title: {
    fontSize: SIZES.h2,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  content: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SIZES.paddingLarge * 3,
    paddingHorizontal: SIZES.paddingLarge,
  },
  emptyStateIcon: {
    fontSize: 60,
    marginBottom: SIZES.padding,
  },
  emptyStateText: {
    fontSize: SIZES.body1,
    color: COLORS.textLight,
    textAlign: 'center',
  },
});

export default MyListScreen;
