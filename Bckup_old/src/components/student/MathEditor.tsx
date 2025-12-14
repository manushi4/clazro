/**
 * MathEditor - Core Mathematical Input Interface
 * Phase 20: Rich Mathematical Editor
 * Provides comprehensive mathematical equation editing with LaTeX support
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Text,
  ScrollView,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../context/ThemeContext';
import {
  validateLatex,
  textToLatex,
  insertLatexAtPosition,
  ValidationResult,
  MATH_TEMPLATES,
} from '../../utils/mathUtils';

export interface MathEditorProps {
  initialValue?: string;
  placeholder?: string;
  onLatexChange?: (latex: string) => void;
  onValidationChange?: (validation: ValidationResult) => void;
  enableAutoConvert?: boolean;
  showToolbar?: boolean;
  maxLength?: number;
  editable?: boolean;
  accessibilityLabel?: string;
}

export interface CursorPosition {
  start: number;
  end: number;
}

const MathEditor: React.FC<MathEditorProps> = ({
  initialValue = '',
  placeholder = 'Enter mathematical expression...',
  onLatexChange,
  onValidationChange,
  enableAutoConvert = true,
  showToolbar = true,
  maxLength = 1000,
  editable = true,
  accessibilityLabel = 'Mathematical expression editor',
}) => {
  const { theme } = useTheme();
  const textInputRef = useRef<TextInput>(null);
  
  // State management
  const [rawText, setRawText] = useState(initialValue);
  const [latex, setLatex] = useState(initialValue);
  const [validation, setValidation] = useState<ValidationResult>({ isValid: true, errors: [], warnings: [] });
  const [cursorPosition, setCursorPosition] = useState<CursorPosition>({ start: 0, end: 0 });
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);

  // Keyboard visibility handling
  useEffect(() => {
    const keyboardWillShowSub = Keyboard.addListener('keyboardDidShow', () => {
      setIsKeyboardVisible(true);
    });
    const keyboardWillHideSub = Keyboard.addListener('keyboardDidHide', () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      keyboardWillShowSub?.remove();
      keyboardWillHideSub?.remove();
    };
  }, []);

  // Validation and conversion
  const processText = useCallback((text: string) => {
    let processedLatex = text;
    
    // Auto-convert common mathematical expressions to LaTeX if enabled
    if (enableAutoConvert) {
      processedLatex = textToLatex(text);
    }
    
    // Validate LaTeX
    const validationResult = validateLatex(processedLatex);
    setValidation(validationResult);
    onValidationChange?.(validationResult);
    
    // Update LaTeX
    setLatex(processedLatex);
    onLatexChange?.(processedLatex);
  }, [enableAutoConvert, onLatexChange, onValidationChange]);

  // Text change handler
  const handleTextChange = useCallback((text: string) => {
    if (!editable) return;
    
    // Save current state to undo stack
    if (rawText !== text) {
      setUndoStack(prev => [...prev.slice(-19), rawText]); // Keep last 20 states
      setRedoStack([]); // Clear redo stack
    }
    
    setRawText(text);
    processText(text);
  }, [editable, rawText, processText]);

  // Cursor position tracking
  const handleSelectionChange = useCallback((event: any) => {
    const { start, end } = event.nativeEvent.selection;
    setCursorPosition({ start, end });
  }, []);

  // Insert text at cursor position
  const insertAtCursor = useCallback((insertText: string) => {
    if (!editable) return;
    
    const result = insertLatexAtPosition(rawText, insertText, cursorPosition.start);
    setRawText(result.newLatex);
    processText(result.newLatex);
    
    // Set focus back to text input and update cursor position
    setTimeout(() => {
      textInputRef.current?.focus();
      textInputRef.current?.setNativeProps({
        selection: {
          start: result.newCursorPosition,
          end: result.newCursorPosition,
        },
      });
    }, 10);
  }, [editable, rawText, cursorPosition.start, processText]);

  // Template insertion
  const insertTemplate = useCallback((templateKey: keyof typeof MATH_TEMPLATES) => {
    const template = MATH_TEMPLATES[templateKey];
    if (template) {
      insertAtCursor(template.latex);
    }
  }, [insertAtCursor]);

  // Undo/Redo functionality
  const handleUndo = useCallback(() => {
    if (undoStack.length > 0) {
      const previousState = undoStack[undoStack.length - 1];
      const newUndoStack = undoStack.slice(0, -1);
      
      setRedoStack(prev => [...prev, rawText]);
      setUndoStack(newUndoStack);
      setRawText(previousState);
      processText(previousState);
    }
  }, [undoStack, rawText, processText]);

  const handleRedo = useCallback(() => {
    if (redoStack.length > 0) {
      const nextState = redoStack[redoStack.length - 1];
      const newRedoStack = redoStack.slice(0, -1);
      
      setUndoStack(prev => [...prev, rawText]);
      setRedoStack(newRedoStack);
      setRawText(nextState);
      processText(nextState);
    }
  }, [redoStack, rawText, processText]);

  // Clear content
  const handleClear = useCallback(() => {
    if (!editable) return;
    
    Alert.alert(
      'Clear Content',
      'Are you sure you want to clear all mathematical expressions?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: () => {
            setUndoStack(prev => [...prev, rawText]);
            setRawText('');
            processText('');
            textInputRef.current?.focus();
          }
        }
      ]
    );
  }, [editable, rawText, processText]);

  // Quick insert functions
  const quickInserts = [
    { label: 'Fraction', latex: '\\frac{}{} ', icon: 'architecture' },
    { label: 'Power', latex: '^{} ', icon: 'keyboard_arrow_up' },
    { label: 'Subscript', latex: '_{} ', icon: 'keyboard_arrow_down' },
    { label: 'Square Root', latex: '\\sqrt{} ', icon: 'square_foot' },
    { label: 'Integral', latex: '\\int ', icon: 'integration_instructions' },
    { label: 'Sum', latex: '\\sum ', icon: 'add' },
    { label: 'Pi', latex: '\\pi ', icon: 'pie_chart' },
    { label: 'Infinity', latex: '\\infty ', icon: 'all_inclusive' },
  ];

  const getStyles = (theme: any) => StyleSheet.create({
    container: {
      backgroundColor: theme.Surface,
      borderRadius: 12,
      padding: 16,
      marginVertical: 8,
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
      marginBottom: 12,
    },

    title: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.OnSurface,
    },

    statusContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    statusIcon: {
      marginRight: 4,
    },

    statusText: {
      fontSize: 12,
      fontWeight: '500',
    },

    validText: {
      color: theme.primary,
    },

    errorText: {
      color: theme.error,
    },

    textInputContainer: {
      borderWidth: 2,
      borderRadius: 8,
      backgroundColor: theme.background,
      minHeight: 120,
      maxHeight: 200,
    },

    textInputDefault: {
      borderColor: theme.Outline,
    },

    textInputFocused: {
      borderColor: theme.primary,
    },

    textInputError: {
      borderColor: theme.error,
    },

    textInput: {
      flex: 1,
      padding: 12,
      fontSize: 16,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      color: theme.OnBackground,
      textAlignVertical: 'top',
    },

    quickToolbar: {
      marginTop: 12,
    },

    quickToolbarTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.OnSurfaceVariant,
      marginBottom: 8,
    },

    quickInsertGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },

    quickInsertButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.SurfaceVariant,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      marginRight: 8,
      marginBottom: 8,
    },

    quickInsertIcon: {
      color: theme.OnSurfaceVariant,
      marginRight: 4,
    },

    quickInsertText: {
      fontSize: 12,
      color: theme.OnSurfaceVariant,
      fontWeight: '500',
    },

    actionBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.OutlineVariant,
    },

    actionGroup: {
      flexDirection: 'row',
      gap: 8,
    },

    actionButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: theme.SurfaceVariant,
    },

    actionButtonDisabled: {
      opacity: 0.5,
    },

    actionIcon: {
      color: theme.OnSurfaceVariant,
    },

    clearButton: {
      backgroundColor: theme.errorContainer,
    },

    clearIcon: {
      color: theme.OnErrorContainer,
    },

    validationContainer: {
      marginTop: 8,
    },

    validationItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 2,
    },

    validationIcon: {
      marginRight: 6,
    },

    validationText: {
      fontSize: 12,
      flex: 1,
    },

    errorValidation: {
      color: theme.error,
    },

    warningValidation: {
      color: theme.Outline,
    },

    infoContainer: {
      backgroundColor: theme.SurfaceVariant,
      padding: 8,
      borderRadius: 6,
      marginTop: 8,
    },

    infoText: {
      fontSize: 11,
      color: theme.OnSurfaceVariant,
      textAlign: 'center',
    },
  });

  const styles = getStyles(theme);
  const borderStyle = !validation.isValid 
    ? styles.textInputError 
    : styles.textInputDefault;

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Math Editor</Text>
        <View style={styles.statusContainer}>
          <Icon 
            name={validation.isValid ? 'check-circle' : 'error'} 
            size={16}
            style={[
              styles.statusIcon,
              validation.isValid ? { color: theme.primary } : { color: theme.error }
            ]}
          />
          <Text 
            style={[
              styles.statusText,
              validation.isValid ? styles.validText : styles.errorText
            ]}
          >
            {validation.isValid ? 'Valid' : 'Invalid'}
          </Text>
        </View>
      </View>

      {/* Main Text Input */}
      <View style={[styles.textInputContainer, borderStyle]}>
        <TextInput
          ref={textInputRef}
          style={styles.textInput}
          value={rawText}
          onChangeText={handleTextChange}
          onSelectionChange={handleSelectionChange}
          placeholder={placeholder}
          placeholderTextColor={theme.OnSurfaceVariant}
          multiline={true}
          maxLength={maxLength}
          editable={editable}
          accessibilityLabel={accessibilityLabel}
          accessibilityHint="Enter mathematical expressions using LaTeX notation"
          autoCorrect={false}
          autoCapitalize="none"
          keyboardType="ascii-capable"
          blurOnSubmit={false}
        />
      </View>

      {/* Quick Insert Toolbar */}
      {showToolbar && (
        <View style={styles.quickToolbar}>
          <Text style={styles.quickToolbarTitle}>Quick Insert</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 16 }}
          >
            <View style={styles.quickInsertGrid}>
              {quickInserts.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.quickInsertButton}
                  onPress={() => insertAtCursor(item.latex)}
                  disabled={!editable}
                  accessibilityLabel={`Insert ${item.label}`}
                  accessibilityRole="button"
                >
                  <Icon name={item.icon} size={16} style={styles.quickInsertIcon} />
                  <Text style={styles.quickInsertText}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Action Bar */}
      <View style={styles.actionBar}>
        <View style={styles.actionGroup}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              undoStack.length === 0 && styles.actionButtonDisabled
            ]}
            onPress={handleUndo}
            disabled={undoStack.length === 0 || !editable}
            accessibilityLabel="Undo last change"
            accessibilityRole="button"
          >
            <Icon name="undo" size={20} style={styles.actionIcon} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              redoStack.length === 0 && styles.actionButtonDisabled
            ]}
            onPress={handleRedo}
            disabled={redoStack.length === 0 || !editable}
            accessibilityLabel="Redo last change"
            accessibilityRole="button"
          >
            <Icon name="redo" size={20} style={styles.actionIcon} />
          </TouchableOpacity>
        </View>

        <View style={styles.actionGroup}>
          <TouchableOpacity
            style={[styles.actionButton, styles.clearButton]}
            onPress={handleClear}
            disabled={!editable || rawText.length === 0}
            accessibilityLabel="Clear all content"
            accessibilityRole="button"
          >
            <Icon name="clear" size={20} style={styles.clearIcon} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Validation Messages */}
      {(!validation.isValid || validation.warnings.length > 0) && (
        <View style={styles.validationContainer}>
          {validation.errors.map((error, index) => (
            <View key={`error-${index}`} style={styles.validationItem}>
              <Icon 
                name="error" 
                size={14} 
                style={[styles.validationIcon, { color: theme.error }]} 
              />
              <Text style={[styles.validationText, styles.errorValidation]}>
                {error}
              </Text>
            </View>
          ))}
          
          {validation.warnings.map((warning, index) => (
            <View key={`warning-${index}`} style={styles.validationItem}>
              <Icon 
                name="warning" 
                size={14} 
                style={[styles.validationIcon, { color: theme.Outline }]} 
              />
              <Text style={[styles.validationText, styles.warningValidation]}>
                {warning}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          Tip: Use LaTeX syntax for advanced math (e.g., \frac{"{1}"}{"{2}"} for fractions, ^{"{2}"} for powers)
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
};

export default MathEditor;