/**
 * MathNotationInput - Mathematical notation input component
 * Phase 16: Annotation Tools
 * Provides LaTeX input for mathematical expressions
 */

import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { WebView } from 'react-native-webview';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../context/ThemeContext';

const { width, height } = Dimensions.get('window');

interface MathNotationProps {
  visible: boolean;
  onClose: () => void;
  onInsertMath: (latex: string) => void;
  position: { x: number; y: number };
  initialValue?: string;
}

const COMMON_EXPRESSIONS = [
  { label: 'Fraction', latex: '\\frac{a}{b}' },
  { label: 'Square Root', latex: '\\sqrt{x}' },
  { label: 'Power', latex: 'x^{n}' },
  { label: 'Subscript', latex: 'x_{n}' },
  { label: 'Summation', latex: '\\sum_{i=1}^{n}' },
  { label: 'Integral', latex: '\\int_{a}^{b}' },
  { label: 'Limit', latex: '\\lim_{x \\to \\infty}' },
  { label: 'Greek Alpha', latex: '\\alpha' },
  { label: 'Greek Beta', latex: '\\beta' },
  { label: 'Greek Gamma', latex: '\\gamma' },
  { label: 'Pi', latex: '\\pi' },
  { label: 'Theta', latex: '\\theta' },
  { label: 'Delta', latex: '\\Delta' },
  { label: 'Sigma', latex: '\\Sigma' },
  { label: 'Infinity', latex: '\\infty' },
  { label: 'Plus/Minus', latex: '\\pm' },
  { label: 'Less Equal', latex: '\\leq' },
  { label: 'Greater Equal', latex: '\\geq' },
  { label: 'Not Equal', latex: '\\neq' },
  { label: 'Approximately', latex: '\\approx' },
];

const MathNotationInput: React.FC<MathNotationProps> = ({
  visible,
  onClose,
  onInsertMath,
  position,
  initialValue = '',
}) => {
  const { theme } = useTheme();
  const [latexInput, setLatexInput] = useState(initialValue);
  const [previewVisible, setPreviewVisible] = useState(false);
  const webViewRef = useRef<WebView>(null);

  const getStyles = (theme: any) => StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    
    container: {
      backgroundColor: theme.Surface,
      borderRadius: 12,
      padding: 20,
      width: width * 0.9,
      maxHeight: height * 0.8,
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
    },
    
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.Outline,
    },
    
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.OnSurface,
    },
    
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.SurfaceVariant,
      alignItems: 'center',
      justifyContent: 'center',
    },
    
    inputSection: {
      marginBottom: 16,
    },
    
    inputLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.OnSurface,
      marginBottom: 8,
    },
    
    textInput: {
      borderWidth: 1,
      borderColor: theme.Outline,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: theme.OnSurface,
      backgroundColor: theme.Surface,
      fontFamily: 'monospace',
      minHeight: 60,
      textAlignVertical: 'top',
    },
    
    buttonsRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 8,
    },
    
    previewButton: {
      backgroundColor: theme.Tertiary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 6,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    
    clearButton: {
      backgroundColor: theme.SurfaceVariant,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 6,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    
    buttonText: {
      fontSize: 12,
      fontWeight: '500',
      color: theme.OnTertiary,
    },
    
    clearButtonText: {
      fontSize: 12,
      fontWeight: '500',
      color: theme.OnSurfaceVariant,
    },
    
    previewSection: {
      marginBottom: 16,
      minHeight: 60,
    },
    
    previewLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.OnSurface,
      marginBottom: 8,
    },
    
    previewContainer: {
      borderWidth: 1,
      borderColor: theme.Outline,
      borderRadius: 8,
      padding: 12,
      backgroundColor: theme.SurfaceVariant,
      minHeight: 60,
      alignItems: 'center',
      justifyContent: 'center',
    },
    
    webView: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    
    expressionsSection: {
      marginBottom: 16,
    },
    
    expressionsLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.OnSurface,
      marginBottom: 8,
    },
    
    expressionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    
    expressionButton: {
      backgroundColor: theme.primaryContainer,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      marginRight: 8,
      marginBottom: 8,
    },
    
    expressionText: {
      fontSize: 12,
      color: theme.OnPrimaryContainer,
      fontWeight: '500',
    },
    
    actionButtons: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 16,
    },
    
    actionButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 8,
      alignItems: 'center',
    },
    
    insertButton: {
      backgroundColor: theme.primary,
    },
    
    cancelButton: {
      backgroundColor: theme.SurfaceVariant,
    },
    
    actionButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.OnPrimary,
    },
    
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.OnSurfaceVariant,
    },
    
    helpText: {
      fontSize: 12,
      color: theme.OnSurfaceVariant,
      textAlign: 'center',
      marginTop: 8,
      fontStyle: 'italic',
    },
  });

  const styles = getStyles(theme);

  const handlePreview = () => {
    setPreviewVisible(true);
    if (webViewRef.current && latexInput.trim()) {
      const mathJaxHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script>
          <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
          <script>
            window.MathJax = {
              tex: {
                inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
                displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']]
              },
              options: {
                skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre']
              }
            };
          </script>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 10px;
              margin: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 40px;
              background-color: transparent;
            }
            .math-container {
              text-align: center;
              font-size: 18px;
            }
          </style>
        </head>
        <body>
          <div class="math-container">$$${latexInput}$$</div>
        </body>
        </html>
      `;
      
      webViewRef.current.postMessage(mathJaxHtml);
    }
  };

  const handleInsertExpression = (latex: string) => {
    const cursorPos = latexInput.length;
    const newValue = latexInput + latex;
    setLatexInput(newValue);
  };

  const handleInsert = () => {
    if (latexInput.trim()) {
      onInsertMath(latexInput.trim());
      setLatexInput('');
      onClose();
    }
  };

  const handleClear = () => {
    setLatexInput('');
    setPreviewVisible(false);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>📐 Math Notation</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              accessibilityLabel="Close math notation input"
            >
              <Icon name="close" size={20} color={theme.OnSurfaceVariant} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Input Section */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>LaTeX Expression:</Text>
              <TextInput
                style={styles.textInput}
                value={latexInput}
                onChangeText={setLatexInput}
                placeholder="Enter LaTeX notation (e.g., \frac{a}{b})"
                placeholderTextColor={theme.OnSurfaceVariant}
                multiline
                numberOfLines={3}
              />
              <View style={styles.buttonsRow}>
                <TouchableOpacity
                  style={styles.previewButton}
                  onPress={handlePreview}
                >
                  <Icon name="visibility" size={16} color={theme.OnTertiary} />
                  <Text style={styles.buttonText}>Preview</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={handleClear}
                >
                  <Icon name="clear" size={16} color={theme.OnSurfaceVariant} />
                  <Text style={styles.clearButtonText}>Clear</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Preview Section */}
            {previewVisible && (
              <View style={styles.previewSection}>
                <Text style={styles.previewLabel}>Preview:</Text>
                <View style={styles.previewContainer}>
                  <WebView
                    ref={webViewRef}
                    style={styles.webView}
                    source={{
                      html: `
                        <!DOCTYPE html>
                        <html>
                        <head>
                          <meta charset="utf-8">
                          <meta name="viewport" content="width=device-width, initial-scale=1.0">
                          <script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script>
                          <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
                          <script>
                            window.MathJax = {
                              tex: {
                                inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
                                displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']]
                              },
                              options: {
                                skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre']
                              }
                            };
                          </script>
                          <style>
                            body {
                              font-family: Arial, sans-serif;
                              padding: 10px;
                              margin: 0;
                              display: flex;
                              align-items: center;
                              justify-content: center;
                              min-height: 40px;
                              background-color: transparent;
                            }
                            .math-container {
                              text-align: center;
                              font-size: 18px;
                            }
                          </style>
                        </head>
                        <body>
                          <div class="math-container">$$${latexInput || 'Enter LaTeX above'}$$</div>
                        </body>
                        </html>
                      `
                    }}
                    javaScriptEnabled
                    domStorageEnabled
                    startInLoadingState
                    scalesPageToFit={false}
                  />
                </View>
              </View>
            )}

            {/* Common Expressions */}
            <View style={styles.expressionsSection}>
              <Text style={styles.expressionsLabel}>Common Expressions:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.expressionsGrid}>
                  {COMMON_EXPRESSIONS.map((expr, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.expressionButton}
                      onPress={() => handleInsertExpression(expr.latex)}
                    >
                      <Text style={styles.expressionText}>{expr.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.insertButton]}
              onPress={handleInsert}
            >
              <Text style={styles.actionButtonText}>Insert</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.helpText}>
            Tip: Use LaTeX syntax like \frac{'{a}'}{'{b}'} for fractions
          </Text>
        </View>
      </View>
    </Modal>
  );
};

export default MathNotationInput;