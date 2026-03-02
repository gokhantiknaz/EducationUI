import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

const TestCaseViewer = ({
  testCases = [],
  testResults = [],
  showResults = false,
}) => {
  const [expandedIndex, setExpandedIndex] = useState(null);

  // Filter to only show non-hidden test cases (sample test cases)
  const visibleTestCases = testCases.filter(tc => !tc.isHidden);

  // Match test results with test cases
  const getResultForTestCase = (index) => {
    if (!showResults || !testResults.length) return null;
    // testResults are in order, find the matching visible one
    return testResults.find(r => r.testCaseNumber === index + 1);
  };

  const toggleExpand = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  if (visibleTestCases.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="flask-outline" size={32} color={COLORS.textLight} />
        <Text style={styles.emptyText}>No sample test cases available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="flask" size={18} color={COLORS.primary} />
        <Text style={styles.headerTitle}>Sample Test Cases</Text>
        {testResults.length > 0 && (
          <View style={styles.resultsSummary}>
            <Text style={styles.resultsSummaryText}>
              {testResults.filter(r => r.passed).length}/{testResults.length} passed
            </Text>
          </View>
        )}
      </View>

      <ScrollView style={styles.testCaseList}>
        {visibleTestCases.map((testCase, index) => {
          const result = getResultForTestCase(index);
          const isExpanded = expandedIndex === index;

          return (
            <View key={testCase.id || index} style={styles.testCaseItem}>
              <TouchableOpacity
                style={styles.testCaseHeader}
                onPress={() => toggleExpand(index)}
                activeOpacity={0.7}
              >
                <View style={styles.testCaseHeaderLeft}>
                  {showResults && result ? (
                    <View
                      style={[
                        styles.statusIcon,
                        result.passed ? styles.statusPassed : styles.statusFailed,
                      ]}
                    >
                      <Ionicons
                        name={result.passed ? 'checkmark' : 'close'}
                        size={14}
                        color={COLORS.background}
                      />
                    </View>
                  ) : (
                    <View style={styles.testCaseNumber}>
                      <Text style={styles.testCaseNumberText}>{index + 1}</Text>
                    </View>
                  )}
                  <Text style={styles.testCaseTitle}>
                    Test Case {index + 1}
                  </Text>
                  {testCase.points > 0 && (
                    <Text style={styles.testCasePoints}>
                      ({testCase.points} pts)
                    </Text>
                  )}
                </View>
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={COLORS.textLight}
                />
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.testCaseBody}>
                  <View style={styles.testCaseSection}>
                    <Text style={styles.testCaseSectionLabel}>Input:</Text>
                    <View style={styles.codeBlock}>
                      <Text style={styles.codeText}>{testCase.input || '(empty)'}</Text>
                    </View>
                  </View>

                  <View style={styles.testCaseSection}>
                    <Text style={styles.testCaseSectionLabel}>Expected Output:</Text>
                    <View style={styles.codeBlock}>
                      <Text style={styles.codeText}>{testCase.expectedOutput || '(empty)'}</Text>
                    </View>
                  </View>

                  {showResults && result && !result.passed && result.actualOutput && (
                    <View style={styles.testCaseSection}>
                      <Text style={[styles.testCaseSectionLabel, styles.actualOutputLabel]}>
                        Your Output:
                      </Text>
                      <View style={[styles.codeBlock, styles.actualOutputBlock]}>
                        <Text style={styles.codeText}>{result.actualOutput}</Text>
                      </View>
                    </View>
                  )}

                  {showResults && result && (
                    <View style={styles.testCaseStats}>
                      {result.executionTimeMs !== undefined && (
                        <Text style={styles.statText}>
                          Time: {result.executionTimeMs}ms
                        </Text>
                      )}
                      {result.memoryUsedKb !== undefined && (
                        <Text style={styles.statText}>
                          Memory: {result.memoryUsedKb}KB
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {testResults.length > visibleTestCases.length && (
        <View style={styles.hiddenTestsNote}>
          <Ionicons name="lock-closed" size={14} color={COLORS.textLight} />
          <Text style={styles.hiddenTestsText}>
            + {testResults.length - visibleTestCases.length} hidden test cases
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.backgroundDark,
    borderRadius: SIZES.radiusSmall,
    overflow: 'hidden',
    marginTop: SIZES.padding,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: SIZES.padding,
    backgroundColor: COLORS.backgroundDark,
    borderRadius: SIZES.radiusSmall,
    marginTop: SIZES.padding,
  },
  emptyText: {
    fontSize: SIZES.body3,
    color: COLORS.textLight,
    marginTop: SIZES.paddingSmall,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.paddingSmall,
    backgroundColor: COLORS.primary + '15',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 8,
  },
  headerTitle: {
    fontSize: SIZES.body2,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
  },
  resultsSummary: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  resultsSummaryText: {
    fontSize: SIZES.body3,
    fontWeight: '600',
    color: COLORS.background,
  },
  testCaseList: {
    maxHeight: 300,
  },
  testCaseItem: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  testCaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SIZES.paddingSmall,
  },
  testCaseHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  testCaseNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testCaseNumberText: {
    fontSize: SIZES.body3,
    fontWeight: '600',
    color: COLORS.text,
  },
  statusIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPassed: {
    backgroundColor: COLORS.success,
  },
  statusFailed: {
    backgroundColor: COLORS.error,
  },
  testCaseTitle: {
    fontSize: SIZES.body2,
    fontWeight: '500',
    color: COLORS.text,
  },
  testCasePoints: {
    fontSize: SIZES.body3,
    color: COLORS.textLight,
  },
  testCaseBody: {
    padding: SIZES.paddingSmall,
    paddingTop: 0,
  },
  testCaseSection: {
    marginBottom: SIZES.paddingSmall,
  },
  testCaseSectionLabel: {
    fontSize: SIZES.body3,
    fontWeight: '600',
    color: COLORS.textLight,
    marginBottom: 4,
  },
  actualOutputLabel: {
    color: COLORS.error,
  },
  codeBlock: {
    backgroundColor: '#1E1E1E',
    padding: SIZES.paddingSmall,
    borderRadius: SIZES.radiusSmall,
  },
  actualOutputBlock: {
    backgroundColor: COLORS.error + '20',
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 13,
    color: '#D4D4D4',
  },
  testCaseStats: {
    flexDirection: 'row',
    gap: SIZES.padding,
    marginTop: SIZES.paddingSmall,
  },
  statText: {
    fontSize: SIZES.body3,
    color: COLORS.textLight,
  },
  hiddenTestsNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.paddingSmall,
    backgroundColor: COLORS.backgroundDark,
    gap: 4,
  },
  hiddenTestsText: {
    fontSize: SIZES.body3,
    color: COLORS.textLight,
    fontStyle: 'italic',
  },
});

export default TestCaseViewer;
