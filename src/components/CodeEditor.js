import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../constants/theme';

const LANGUAGE_OPTIONS = [
  { key: 'csharp', label: 'C#', icon: 'logo-microsoft' },
  { key: 'c', label: 'C', icon: 'code-slash' },
  { key: 'javascript', label: 'JavaScript', icon: 'logo-javascript' },
  { key: 'python', label: 'Python', icon: 'logo-python' },
];

const CodeEditor = ({
  code,
  language,
  starterCode,
  allowedLanguages = [],
  onCodeChange,
  onLanguageChange,
  editable = true,
  showLineNumbers = true,
}) => {
  const [lineCount, setLineCount] = useState(1);

  // Filter languages to only show allowed ones
  const availableLanguages = LANGUAGE_OPTIONS.filter(
    lang => allowedLanguages.length === 0 || allowedLanguages.includes(lang.key)
  );

  // Calculate line numbers when code changes
  const handleCodeChange = (text) => {
    const lines = text.split('\n').length;
    setLineCount(Math.max(lines, 1));
    onCodeChange(text);
  };

  // Reset to starter code
  const handleReset = () => {
    onCodeChange(starterCode || '');
    const lines = (starterCode || '').split('\n').length;
    setLineCount(Math.max(lines, 1));
  };

  // Initialize line count
  React.useEffect(() => {
    const text = code || starterCode || '';
    const lines = text.split('\n').length;
    setLineCount(Math.max(lines, 1));
  }, []);

  return (
    <View style={styles.container}>
      {/* Language Selector */}
      <View style={styles.languageBar}>
        <Text style={styles.languageLabel}>Language:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.languageOptions}>
            {availableLanguages.map((lang) => (
              <TouchableOpacity
                key={lang.key}
                style={[
                  styles.languageChip,
                  language === lang.key && styles.languageChipSelected,
                ]}
                onPress={() => onLanguageChange(lang.key)}
                disabled={!editable}
              >
                <Ionicons
                  name={lang.icon}
                  size={16}
                  color={language === lang.key ? COLORS.background : COLORS.text}
                />
                <Text
                  style={[
                    styles.languageChipText,
                    language === lang.key && styles.languageChipTextSelected,
                  ]}
                >
                  {lang.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {editable && starterCode && (
          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Ionicons name="refresh" size={16} color={COLORS.textLight} />
          </TouchableOpacity>
        )}
      </View>

      {/* Code Editor Area */}
      <View style={styles.editorContainer}>
        {showLineNumbers && (
          <View style={styles.lineNumbers}>
            {Array.from({ length: lineCount }, (_, i) => (
              <Text key={i} style={styles.lineNumber}>
                {i + 1}
              </Text>
            ))}
          </View>
        )}

        <ScrollView
          style={styles.codeScroll}
          horizontal={false}
          showsVerticalScrollIndicator={true}
        >
          <TextInput
            style={styles.codeInput}
            value={code || starterCode || ''}
            onChangeText={handleCodeChange}
            placeholder="Write your code here..."
            placeholderTextColor={COLORS.textLight}
            multiline
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            textAlignVertical="top"
            editable={editable}
          />
        </ScrollView>
      </View>

      {/* Editor Footer */}
      <View style={styles.editorFooter}>
        <Text style={styles.footerText}>
          Lines: {lineCount} | {language ? language.toUpperCase() : 'No language selected'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: SIZES.radiusSmall,
    overflow: 'hidden',
    backgroundColor: '#1E1E1E',
    ...SHADOWS.small,
  },
  languageBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SIZES.paddingSmall,
    paddingVertical: SIZES.paddingSmall,
    backgroundColor: '#2D2D2D',
    borderBottomWidth: 1,
    borderBottomColor: '#404040',
  },
  languageLabel: {
    fontSize: SIZES.body3,
    color: '#CCCCCC',
    marginRight: SIZES.paddingSmall,
  },
  languageOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  languageChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#3D3D3D',
    gap: 4,
  },
  languageChipSelected: {
    backgroundColor: COLORS.primary,
  },
  languageChipText: {
    fontSize: SIZES.body3,
    color: '#CCCCCC',
    fontWeight: '500',
  },
  languageChipTextSelected: {
    color: COLORS.background,
  },
  resetButton: {
    padding: 8,
    marginLeft: SIZES.paddingSmall,
  },
  editorContainer: {
    flexDirection: 'row',
    minHeight: 200,
    maxHeight: 400,
  },
  lineNumbers: {
    paddingVertical: SIZES.paddingSmall,
    paddingHorizontal: SIZES.paddingSmall,
    backgroundColor: '#252526',
    borderRightWidth: 1,
    borderRightColor: '#404040',
  },
  lineNumber: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#858585',
    lineHeight: 20,
    textAlign: 'right',
    minWidth: 24,
  },
  codeScroll: {
    flex: 1,
  },
  codeInput: {
    flex: 1,
    padding: SIZES.paddingSmall,
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#D4D4D4',
    lineHeight: 20,
    minHeight: 200,
  },
  editorFooter: {
    paddingHorizontal: SIZES.paddingSmall,
    paddingVertical: 6,
    backgroundColor: '#007ACC',
  },
  footerText: {
    fontSize: SIZES.body3,
    color: COLORS.background,
    fontWeight: '500',
  },
});

export default CodeEditor;
