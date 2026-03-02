import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

const STATUS_CONFIG = {
  Pending: {
    icon: 'hourglass',
    color: COLORS.warning,
    label: 'Pending...',
    description: 'Your code is queued for execution',
  },
  Running: {
    icon: 'play-circle',
    color: COLORS.info,
    label: 'Running...',
    description: 'Executing your code against test cases',
  },
  Accepted: {
    icon: 'checkmark-circle',
    color: COLORS.success,
    label: 'Accepted',
    description: 'All test cases passed!',
  },
  WrongAnswer: {
    icon: 'close-circle',
    color: COLORS.error,
    label: 'Wrong Answer',
    description: 'Some test cases failed',
  },
  CompileError: {
    icon: 'warning',
    color: COLORS.error,
    label: 'Compilation Error',
    description: 'Your code failed to compile',
  },
  RuntimeError: {
    icon: 'bug',
    color: COLORS.error,
    label: 'Runtime Error',
    description: 'Your code crashed during execution',
  },
  TimeLimitExceeded: {
    icon: 'time',
    color: COLORS.warning,
    label: 'Time Limit Exceeded',
    description: 'Your code took too long to execute',
  },
  MemoryLimitExceeded: {
    icon: 'hardware-chip',
    color: COLORS.warning,
    label: 'Memory Limit Exceeded',
    description: 'Your code used too much memory',
  },
};

const CodeSubmissionStatus = ({
  submission,
  compact = false,
}) => {
  if (!submission) return null;

  const config = STATUS_CONFIG[submission.status] || {
    icon: 'help-circle',
    color: COLORS.textLight,
    label: submission.status || 'Unknown',
    description: '',
  };

  const isProcessing = submission.status === 'Pending' || submission.status === 'Running';
  const isPassed = submission.status === 'Accepted';
  const isFailed = ['WrongAnswer', 'CompileError', 'RuntimeError', 'TimeLimitExceeded', 'MemoryLimitExceeded'].includes(submission.status);

  // Compact view for inline display
  if (compact) {
    return (
      <View style={[styles.compactContainer, { backgroundColor: config.color + '15' }]}>
        {isProcessing ? (
          <ActivityIndicator size="small" color={config.color} />
        ) : (
          <Ionicons name={config.icon} size={16} color={config.color} />
        )}
        <Text style={[styles.compactLabel, { color: config.color }]}>
          {config.label}
        </Text>
        {submission.testCasesPassed !== undefined && (
          <Text style={styles.compactScore}>
            ({submission.testCasesPassed}/{submission.totalTestCases})
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, { borderColor: config.color }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: config.color + '15' }]}>
        {isProcessing ? (
          <ActivityIndicator size="small" color={config.color} />
        ) : (
          <Ionicons name={config.icon} size={24} color={config.color} />
        )}
        <View style={styles.headerText}>
          <Text style={[styles.statusLabel, { color: config.color }]}>
            {config.label}
          </Text>
          <Text style={styles.statusDescription}>{config.description}</Text>
        </View>
      </View>

      {/* Test Results */}
      {submission.testCasesPassed !== undefined && (
        <View style={styles.testResults}>
          <View style={styles.testResultBar}>
            <View
              style={[
                styles.testResultFill,
                {
                  width: `${(submission.testCasesPassed / submission.totalTestCases) * 100}%`,
                  backgroundColor: isPassed ? COLORS.success : isFailed ? COLORS.error : COLORS.warning,
                },
              ]}
            />
          </View>
          <Text style={styles.testResultText}>
            {submission.testCasesPassed} / {submission.totalTestCases} test cases passed
          </Text>
        </View>
      )}

      {/* Execution Stats */}
      {(submission.executionTimeMs !== undefined || submission.memoryUsedKb !== undefined) && (
        <View style={styles.stats}>
          {submission.executionTimeMs !== undefined && (
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={14} color={COLORS.textLight} />
              <Text style={styles.statLabel}>Time:</Text>
              <Text style={styles.statValue}>{submission.executionTimeMs}ms</Text>
            </View>
          )}
          {submission.memoryUsedKb !== undefined && (
            <View style={styles.statItem}>
              <Ionicons name="hardware-chip-outline" size={14} color={COLORS.textLight} />
              <Text style={styles.statLabel}>Memory:</Text>
              <Text style={styles.statValue}>{submission.memoryUsedKb}KB</Text>
            </View>
          )}
        </View>
      )}

      {/* Error Output */}
      {submission.compileOutput && (
        <View style={styles.errorSection}>
          <Text style={styles.errorTitle}>Compilation Output:</Text>
          <View style={styles.errorBlock}>
            <Text style={styles.errorText}>{submission.compileOutput}</Text>
          </View>
        </View>
      )}

      {submission.errorMessage && (
        <View style={styles.errorSection}>
          <Text style={styles.errorTitle}>Error:</Text>
          <View style={styles.errorBlock}>
            <Text style={styles.errorText}>{submission.errorMessage}</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: SIZES.radiusSmall,
    borderWidth: 2,
    overflow: 'hidden',
    marginTop: SIZES.padding,
    backgroundColor: COLORS.card,
    ...SHADOWS.small,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.padding,
    gap: SIZES.paddingSmall,
  },
  headerText: {
    flex: 1,
  },
  statusLabel: {
    fontSize: SIZES.body1,
    fontWeight: '700',
  },
  statusDescription: {
    fontSize: SIZES.body3,
    color: COLORS.textLight,
    marginTop: 2,
  },
  testResults: {
    paddingHorizontal: SIZES.padding,
    paddingBottom: SIZES.paddingSmall,
  },
  testResultBar: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  testResultFill: {
    height: '100%',
    borderRadius: 4,
  },
  testResultText: {
    fontSize: SIZES.body3,
    color: COLORS.textLight,
    marginTop: 4,
    textAlign: 'center',
  },
  stats: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.padding,
    paddingBottom: SIZES.paddingSmall,
    gap: SIZES.padding,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: SIZES.body3,
    color: COLORS.textLight,
  },
  statValue: {
    fontSize: SIZES.body3,
    fontWeight: '600',
    color: COLORS.text,
  },
  errorSection: {
    padding: SIZES.padding,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  errorTitle: {
    fontSize: SIZES.body3,
    fontWeight: '600',
    color: COLORS.error,
    marginBottom: SIZES.paddingSmall,
  },
  errorBlock: {
    backgroundColor: COLORS.error + '10',
    padding: SIZES.paddingSmall,
    borderRadius: SIZES.radiusSmall,
    borderWidth: 1,
    borderColor: COLORS.error + '30',
  },
  errorText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: COLORS.error,
  },
  // Compact styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  compactLabel: {
    fontSize: SIZES.body3,
    fontWeight: '600',
  },
  compactScore: {
    fontSize: SIZES.body3,
    color: COLORS.textLight,
  },
});

export default CodeSubmissionStatus;
