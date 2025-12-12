/**
 * CodeEditor - Syntax-highlighted Code Editor Component
 * Phase 21: Media Integration System
 * Provides code editing with syntax highlighting for multiple programming languages
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../context/ThemeContext';

export interface CodeEditorProps {
  initialCode?: string;
  language?: string;
  onCodeChange?: (code: string) => void;
  onLanguageChange?: (language: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  showLineNumbers?: boolean;
  fontSize?: number;
  tabSize?: number;
  maxLines?: number;
  autoCloseBrackets?: boolean;
  enableAutoComplete?: boolean;
}

const SUPPORTED_LANGUAGES = [
  { key: 'javascript', name: 'JavaScript', extension: 'js', icon: 'javascript' },
  { key: 'python', name: 'Python', extension: 'py', icon: 'python' },
  { key: 'java', name: 'Java', extension: 'java', icon: 'code' },
  { key: 'cpp', name: 'C++', extension: 'cpp', icon: 'code' },
  { key: 'c', name: 'C', extension: 'c', icon: 'code' },
  { key: 'html', name: 'HTML', extension: 'html', icon: 'web' },
  { key: 'css', name: 'CSS', extension: 'css', icon: 'palette' },
  { key: 'json', name: 'JSON', extension: 'json', icon: 'data_object' },
  { key: 'xml', name: 'XML', extension: 'xml', icon: 'code' },
  { key: 'sql', name: 'SQL', extension: 'sql', icon: 'storage' },
];

// Basic syntax highlighting patterns
const SYNTAX_PATTERNS = {
  javascript: {
    keywords: ['function', 'var', 'let', 'const', 'if', 'else', 'for', 'while', 'return', 'class', 'extends', 'import', 'export', 'default', 'async', 'await', 'try', 'catch', 'finally'],
    strings: [/"([^"\\]|\\.)*"/g, /'([^'\\]|\\.)*'/g, /`([^`\\]|\\.)*`/g],
    comments: [/\/\/.*$/gm, /\/\*[\s\S]*?\*\//g],
    numbers: /\b\d+(\.\d+)?\b/g,
    operators: /[+\-*/%=<>!&|^~?:]/g,
  },
  python: {
    keywords: ['def', 'class', 'if', 'elif', 'else', 'for', 'while', 'return', 'import', 'from', 'as', 'try', 'except', 'finally', 'with', 'yield', 'lambda', 'global', 'nonlocal', 'pass', 'break', 'continue'],
    strings: [/"([^"\\]|\\.)*"/g, /'([^'\\]|\\.)*'/g, /"""[\s\S]*?"""/g, /'''[\s\S]*?'''/g],
    comments: [/#.*$/gm],
    numbers: /\b\d+(\.\d+)?\b/g,
    operators: /[+\-*/%=<>!&|^~]/g,
  },
  java: {
    keywords: ['public', 'private', 'protected', 'static', 'final', 'abstract', 'class', 'interface', 'extends', 'implements', 'if', 'else', 'for', 'while', 'do', 'return', 'try', 'catch', 'finally', 'throw', 'throws', 'new', 'this', 'super'],
    strings: [/"([^"\\]|\\.)*"/g, /'([^'\\]|\\.)*'/g],
    comments: [/\/\/.*$/gm, /\/\*[\s\S]*?\*\//g],
    numbers: /\b\d+(\.\d+)?[fFdD]?\b/g,
    operators: /[+\-*/%=<>!&|^~?:]/g,
  },
  html: {
    tags: /<\/?[a-zA-Z][^>]*>/g,
    attributes: /\s([a-zA-Z-]+)=(["'][^"']*["'])/g,
    comments: /<!--[\s\S]*?-->/g,
  },
  css: {
    selectors: /[.#]?[a-zA-Z][a-zA-Z0-9-_]*(?=\s*{)/g,
    properties: /[a-zA-Z-]+(?=\s*:)/g,
    values: /:([^;{}]+)/g,
    comments: /\/\*[\s\S]*?\*\//g,
  },
};

// Auto-complete suggestions
const AUTO_COMPLETE_SUGGESTIONS = {
  javascript: [
    'console.log()',
    'function',
    'const',
    'let',
    'var',
    'if',
    'else',
    'for',
    'while',
    'return',
    'class',
    'extends',
    'import',
    'export',
    'async',
    'await',
    'try',
    'catch',
    'Array',
    'Object',
    'String',
    'Number',
    'Boolean',
    'Date',
    'Math',
    'JSON',
  ],
  python: [
    'def',
    'class',
    'if',
    'elif',
    'else',
    'for',
    'while',
    'return',
    'import',
    'from',
    'as',
    'try',
    'except',
    'finally',
    'with',
    'yield',
    'lambda',
    'print()',
    'len()',
    'range()',
    'str()',
    'int()',
    'float()',
    'list()',
    'dict()',
    'set()',
    'tuple()',
  ],
  java: [
    'public',
    'private',
    'protected',
    'static',
    'final',
    'abstract',
    'class',
    'interface',
    'extends',
    'implements',
    'if',
    'else',
    'for',
    'while',
    'do',
    'return',
    'try',
    'catch',
    'finally',
    'System.out.println()',
    'String',
    'int',
    'double',
    'boolean',
    'char',
    'void',
    'new',
    'this',
    'super',
  ],
};

const CodeEditor: React.FC<CodeEditorProps> = ({
  initialCode = '',
  language = 'javascript',
  onCodeChange,
  onLanguageChange,
  placeholder = 'Enter your code here...',
  readOnly = false,
  showLineNumbers = true,
  fontSize = 14,
  tabSize = 2,
  maxLines = 50,
  autoCloseBrackets = true,
  enableAutoComplete = true,
}) => {
  const { theme } = useTheme();
  const textInputRef = useRef<TextInput>(null);
  
  const [code, setCode] = useState(initialCode);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [showAutoComplete, setShowAutoComplete] = useState(false);
  const [autoCompleteSuggestions, setAutoCompleteSuggestions] = useState<string[]>([]);
  const [currentWord, setCurrentWord] = useState('');

  // Get language configuration
  const languageConfig = useMemo(() => {
    return SUPPORTED_LANGUAGES.find(lang => lang.key === language) || SUPPORTED_LANGUAGES[0];
  }, [language]);

  // Get line numbers
  const lineNumbers = useMemo(() => {
    const lines = code.split('\n');
    return lines.map((_, index) => index + 1);
  }, [code]);

  // Basic syntax highlighting (simplified for React Native)
  const highlightSyntax = useCallback((text: string): any[] => {
    // This is a simplified version - full syntax highlighting would require more complex parsing
    const patterns = SYNTAX_PATTERNS[language as keyof typeof SYNTAX_PATTERNS];
    if (!patterns) return [{ text, style: 'normal' }];

    // For now, return the text as-is since React Native doesn't support rich text in TextInput
    // In a real implementation, you'd use a WebView or custom text rendering
    return [{ text, style: 'normal' }];
  }, [language]);

  // Handle code change
  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode);
    onCodeChange?.(newCode);

    // Auto-complete logic
    if (enableAutoComplete) {
      const words = newCode.split(/\s+/);
      const lastWord = words[words.length - 1] || '';
      
      if (lastWord.length > 1) {
        const suggestions = AUTO_COMPLETE_SUGGESTIONS[language as keyof typeof AUTO_COMPLETE_SUGGESTIONS] || [];
        const filteredSuggestions = suggestions.filter(suggestion =>
          suggestion.toLowerCase().startsWith(lastWord.toLowerCase())
        ).slice(0, 5);

        if (filteredSuggestions.length > 0) {
          setCurrentWord(lastWord);
          setAutoCompleteSuggestions(filteredSuggestions);
          setShowAutoComplete(true);
        } else {
          setShowAutoComplete(false);
        }
      } else {
        setShowAutoComplete(false);
      }
    }
  }, [onCodeChange, enableAutoComplete, language]);

  // Handle language selection
  const handleLanguageSelect = useCallback((selectedLanguage: string) => {
    onLanguageChange?.(selectedLanguage);
    setShowLanguageModal(false);
  }, [onLanguageChange]);

  // Insert text at cursor position
  const insertAtCursor = useCallback((insertText: string) => {
    const beforeCursor = code.slice(0, cursorPosition);
    const afterCursor = code.slice(cursorPosition);
    const newCode = beforeCursor + insertText + afterCursor;
    
    handleCodeChange(newCode);
    
    // Move cursor to end of inserted text
    setTimeout(() => {
      const newPosition = cursorPosition + insertText.length;
      setCursorPosition(newPosition);
      textInputRef.current?.setNativeProps({
        selection: { start: newPosition, end: newPosition }
      });
    }, 10);
  }, [code, cursorPosition, handleCodeChange]);

  // Handle auto-complete selection
  const handleAutoCompleteSelect = useCallback((suggestion: string) => {
    const beforeWord = code.slice(0, cursorPosition - currentWord.length);
    const afterWord = code.slice(cursorPosition);
    const newCode = beforeWord + suggestion + afterWord;
    
    handleCodeChange(newCode);
    setShowAutoComplete(false);
    
    // Move cursor to end of suggestion
    setTimeout(() => {
      const newPosition = cursorPosition - currentWord.length + suggestion.length;
      setCursorPosition(newPosition);
      textInputRef.current?.setNativeProps({
        selection: { start: newPosition, end: newPosition }
      });
    }, 10);
  }, [code, cursorPosition, currentWord, handleCodeChange]);

  // Handle bracket auto-completion
  const handleKeyPress = useCallback((key: string) => {
    if (!autoCloseBrackets) return;

    const brackets = {
      '(': ')',
      '[': ']',
      '{': '}',
      '"': '"',
      "'": "'",
    };

    if (brackets[key as keyof typeof brackets]) {
      const closingBracket = brackets[key as keyof typeof brackets];
      insertAtCursor(key + closingBracket);
      
      // Move cursor between brackets
      setTimeout(() => {
        const newPosition = cursorPosition + 1;
        setCursorPosition(newPosition);
        textInputRef.current?.setNativeProps({
          selection: { start: newPosition, end: newPosition }
        });
      }, 10);
    }
  }, [autoCloseBrackets, insertAtCursor, cursorPosition]);

  // Format code (basic indentation)
  const formatCode = useCallback(() => {
    const lines = code.split('\n');
    let indentLevel = 0;
    const tabString = ' '.repeat(tabSize);
    
    const formattedLines = lines.map(line => {
      const trimmedLine = line.trim();
      
      // Decrease indent for closing brackets
      if (trimmedLine.startsWith('}') || trimmedLine.startsWith(']') || trimmedLine.startsWith(')')) {
        indentLevel = Math.max(0, indentLevel - 1);
      }
      
      const formattedLine = tabString.repeat(indentLevel) + trimmedLine;
      
      // Increase indent after opening brackets
      if (trimmedLine.endsWith('{') || trimmedLine.endsWith('[') || trimmedLine.endsWith('(')) {
        indentLevel++;
      }
      
      return formattedLine;
    });
    
    const formattedCode = formattedLines.join('\n');
    handleCodeChange(formattedCode);
  }, [code, tabSize, handleCodeChange]);

  const getStyles = (theme: any) => StyleSheet.create({
    container: {
      backgroundColor: theme.Surface,
      borderRadius: 12,
      overflow: 'hidden',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 12,
      backgroundColor: theme.SurfaceVariant,
      borderBottomWidth: 1,
      borderBottomColor: theme.OutlineVariant,
    },

    languageButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.background,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      gap: 6,
    },

    languageText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.OnBackground,
    },

    headerControls: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },

    controlButton: {
      padding: 6,
      borderRadius: 6,
      backgroundColor: theme.background,
    },

    controlIcon: {
      color: theme.OnBackground,
    },

    editorContainer: {
      flexDirection: 'row',
      backgroundColor: theme.background,
      maxHeight: maxLines * (fontSize + 4),
    },

    lineNumbers: {
      backgroundColor: theme.SurfaceVariant,
      paddingVertical: 12,
      paddingHorizontal: 8,
      minWidth: 40,
      borderRightWidth: 1,
      borderRightColor: theme.Outline,
    },

    lineNumber: {
      fontSize: fontSize - 2,
      color: theme.OnSurfaceVariant,
      textAlign: 'right',
      lineHeight: fontSize + 4,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },

    codeInput: {
      flex: 1,
      fontSize: fontSize,
      color: theme.OnBackground,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      textAlignVertical: 'top',
      padding: 12,
      lineHeight: fontSize + 4,
      minHeight: 120,
    },

    autoCompleteContainer: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      backgroundColor: theme.Surface,
      borderWidth: 1,
      borderColor: theme.Outline,
      borderTopWidth: 0,
      borderBottomLeftRadius: 8,
      borderBottomRightRadius: 8,
      elevation: 4,
      zIndex: 1000,
      maxHeight: 150,
    },

    suggestionItem: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.OutlineVariant,
    },

    suggestionText: {
      fontSize: 14,
      color: theme.OnSurface,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },

    // Language Modal Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },

    modalContainer: {
      backgroundColor: theme.Surface,
      borderRadius: 16,
      padding: 20,
      maxWidth: '80%',
      width: 300,
      maxHeight: '60%',
    },

    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.OnSurface,
      marginBottom: 16,
      textAlign: 'center',
    },

    languageList: {
      maxHeight: 250,
    },

    languageOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 8,
      marginBottom: 4,
      backgroundColor: theme.background,
    },

    languageOptionActive: {
      backgroundColor: theme.primaryContainer,
    },

    languageIcon: {
      marginRight: 12,
      color: theme.OnBackground,
    },

    languageIconActive: {
      color: theme.OnPrimaryContainer,
    },

    languageOptionText: {
      fontSize: 14,
      color: theme.OnBackground,
      flex: 1,
    },

    languageOptionTextActive: {
      color: theme.OnPrimaryContainer,
      fontWeight: '600',
    },

    languageExtension: {
      fontSize: 12,
      color: theme.OnSurfaceVariant,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },

    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: 16,
      gap: 12,
    },

    modalButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
    },

    cancelButton: {
      backgroundColor: theme.SurfaceVariant,
    },

    modalButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.OnSurfaceVariant,
    },

    readOnlyOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: theme.SurfaceVariant + '80',
      justifyContent: 'center',
      alignItems: 'center',
    },

    readOnlyMessage: {
      backgroundColor: theme.Surface,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      elevation: 4,
    },

    readOnlyText: {
      fontSize: 12,
      color: theme.OnSurface,
      fontWeight: '500',
    },
  });

  const styles = getStyles(theme);

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.languageButton}
            onPress={() => setShowLanguageModal(true)}
            disabled={readOnly}
            accessibilityLabel={`Current language: ${languageConfig.name}`}
          >
            <Icon name={languageConfig.icon} size={16} color={theme.OnBackground} />
            <Text style={styles.languageText}>{languageConfig.name}</Text>
            <Icon name="expand-more" size={16} color={theme.OnBackground} />
          </TouchableOpacity>

          <View style={styles.headerControls}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={formatCode}
              disabled={readOnly}
              accessibilityLabel="Format code"
            >
              <Icon name="auto-fix-high" size={18} style={styles.controlIcon} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => {
                handleCodeChange('');
                textInputRef.current?.focus();
              }}
              disabled={readOnly}
              accessibilityLabel="Clear code"
            >
              <Icon name="clear" size={18} style={styles.controlIcon} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.editorContainer}>
          {showLineNumbers && (
            <View style={styles.lineNumbers}>
              {lineNumbers.map(lineNum => (
                <Text key={lineNum} style={styles.lineNumber}>
                  {lineNum}
                </Text>
              ))}
            </View>
          )}

          <TextInput
            ref={textInputRef}
            style={styles.codeInput}
            value={code}
            onChangeText={handleCodeChange}
            onSelectionChange={(event) => {
              setCursorPosition(event.nativeEvent.selection.start);
            }}
            placeholder={placeholder}
            placeholderTextColor={theme.OnSurfaceVariant}
            multiline={true}
            editable={!readOnly}
            autoCorrect={false}
            autoCapitalize="none"
            keyboardType="ascii-capable"
            scrollEnabled={true}
            textAlignVertical="top"
            accessibilityLabel="Code editor"
          />

          {readOnly && (
            <View style={styles.readOnlyOverlay}>
              <View style={styles.readOnlyMessage}>
                <Icon name="lock" size={16} color={theme.OnSurface} />
                <Text style={styles.readOnlyText}>Read Only</Text>
              </View>
            </View>
          )}
        </View>

        {/* Auto-complete suggestions */}
        {showAutoComplete && autoCompleteSuggestions.length > 0 && (
          <View style={styles.autoCompleteContainer}>
            <ScrollView style={styles.languageList} nestedScrollEnabled>
              {autoCompleteSuggestions.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionItem}
                  onPress={() => handleAutoCompleteSelect(suggestion)}
                >
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Select Language</Text>
            
            <ScrollView style={styles.languageList}>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.key}
                  style={[
                    styles.languageOption,
                    language === lang.key && styles.languageOptionActive,
                  ]}
                  onPress={() => handleLanguageSelect(lang.key)}
                >
                  <Icon
                    name={lang.icon}
                    size={20}
                    style={[
                      styles.languageIcon,
                      language === lang.key && styles.languageIconActive,
                    ]}
                  />
                  <Text
                    style={[
                      styles.languageOptionText,
                      language === lang.key && styles.languageOptionTextActive,
                    ]}
                  >
                    {lang.name}
                  </Text>
                  <Text style={styles.languageExtension}>.{lang.extension}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowLanguageModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default CodeEditor;