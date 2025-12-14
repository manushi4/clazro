/**
 * LivePollCreator - Live poll creation interface
 * Phase 19: Polling & Quiz Integration
 * Allows teachers to create and launch live polls during class
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../context/ThemeContext';

export interface PollQuestion {
  id: string;
  question: string;
  options: string[];
  allowMultiple: boolean;
  timeLimit?: number;
}

interface LivePollCreatorProps {
  visible: boolean;
  onClose: () => void;
  onCreatePoll: (poll: PollQuestion) => void;
  isTeacherView?: boolean;
}

const LivePollCreator: React.FC<LivePollCreatorProps> = ({
  visible,
  onClose,
  onCreatePoll,
  isTeacherView = false,
}) => {
  const { theme } = useTheme();
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [hasTimeLimit, setHasTimeLimit] = useState(false);
  const [timeLimit, setTimeLimit] = useState(60);

  const getStyles = (theme: any) => StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },

    modalContainer: {
      backgroundColor: theme.Surface,
      borderRadius: 16,
      padding: 24,
      width: '95%',
      maxWidth: 500,
      maxHeight: '90%',
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
      marginBottom: 24,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.Outline,
    },

    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.OnSurface,
    },

    closeButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: theme.SurfaceVariant,
      alignItems: 'center',
      justifyContent: 'center',
    },

    scrollContent: {
      flexGrow: 1,
    },

    section: {
      marginBottom: 24,
    },

    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.OnSurface,
      marginBottom: 12,
    },

    questionInput: {
      backgroundColor: theme.SurfaceVariant,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      color: theme.OnSurface,
      textAlignVertical: 'top',
      minHeight: 80,
    },

    optionsContainer: {
      gap: 12,
    },

    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },

    optionNumber: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },

    optionNumberText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.OnPrimary,
    },

    optionInput: {
      flex: 1,
      backgroundColor: theme.SurfaceVariant,
      borderRadius: 8,
      padding: 12,
      fontSize: 14,
      color: theme.OnSurface,
    },

    removeOptionButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.errorContainer,
      alignItems: 'center',
      justifyContent: 'center',
    },

    addOptionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.primaryContainer,
      borderRadius: 8,
      padding: 12,
      gap: 8,
      marginTop: 8,
    },

    addOptionText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.OnPrimaryContainer,
    },

    settingsContainer: {
      gap: 16,
    },

    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 8,
    },

    settingLabel: {
      fontSize: 14,
      color: theme.OnSurface,
      flex: 1,
    },

    timeLimitContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },

    timeLimitInput: {
      backgroundColor: theme.SurfaceVariant,
      borderRadius: 6,
      padding: 8,
      width: 60,
      textAlign: 'center',
      fontSize: 14,
      color: theme.OnSurface,
    },

    timeLimitUnit: {
      fontSize: 14,
      color: theme.OnSurface,
    },

    buttonsContainer: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 24,
    },

    button: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
    },

    cancelButton: {
      backgroundColor: theme.SurfaceVariant,
    },

    createButton: {
      backgroundColor: theme.primary,
    },

    buttonText: {
      fontSize: 16,
      fontWeight: '600',
    },

    cancelButtonText: {
      color: theme.OnSurfaceVariant,
    },

    createButtonText: {
      color: theme.OnPrimary,
    },

    disabledButton: {
      opacity: 0.5,
    },

    errorText: {
      fontSize: 12,
      color: theme.error,
      marginTop: 4,
    },

    helpText: {
      fontSize: 12,
      color: theme.OnSurfaceVariant,
      fontStyle: 'italic',
      marginTop: 4,
    },
  });

  const styles = getStyles(theme);

  const addOption = useCallback(() => {
    if (options.length < 6) {
      setOptions([...options, '']);
    }
  }, [options]);

  const removeOption = useCallback((index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
    }
  }, [options]);

  const updateOption = useCallback((index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  }, [options]);

  const resetForm = useCallback(() => {
    setQuestion('');
    setOptions(['', '']);
    setAllowMultiple(false);
    setHasTimeLimit(false);
    setTimeLimit(60);
  }, []);

  const validateForm = useCallback(() => {
    if (!question.trim()) {
      Alert.alert('Validation Error', 'Please enter a poll question.');
      return false;
    }

    const validOptions = options.filter(opt => opt.trim().length > 0);
    if (validOptions.length < 2) {
      Alert.alert('Validation Error', 'Please provide at least 2 options.');
      return false;
    }

    return true;
  }, [question, options]);

  const handleCreatePoll = useCallback(() => {
    if (!validateForm()) return;

    const validOptions = options.filter(opt => opt.trim().length > 0);
    
    const poll: PollQuestion = {
      id: `poll_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      question: question.trim(),
      options: validOptions.map(opt => opt.trim()),
      allowMultiple,
      timeLimit: hasTimeLimit ? timeLimit : undefined,
    };

    onCreatePoll(poll);
    resetForm();
    onClose();
  }, [question, options, allowMultiple, hasTimeLimit, timeLimit, validateForm, onCreatePoll, resetForm, onClose]);

  const handleCancel = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  if (!isTeacherView) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>📊 Create Live Poll</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleCancel}
              accessibilityLabel="Close poll creator"
            >
              <Icon name="close" size={20} color={theme.OnSurfaceVariant} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Question Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Poll Question</Text>
              <TextInput
                style={styles.questionInput}
                value={question}
                onChangeText={setQuestion}
                placeholder="Enter your poll question..."
                placeholderTextColor={theme.OnSurfaceVariant}
                multiline
                maxLength={200}
                accessibilityLabel="Poll question input"
              />
              <Text style={styles.helpText}>
                Ask a clear, concise question that students can understand quickly.
              </Text>
            </View>

            {/* Options Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Answer Options</Text>
              <View style={styles.optionsContainer}>
                {options.map((option, index) => (
                  <View key={index} style={styles.optionRow}>
                    <View style={styles.optionNumber}>
                      <Text style={styles.optionNumberText}>{index + 1}</Text>
                    </View>
                    <TextInput
                      style={styles.optionInput}
                      value={option}
                      onChangeText={(value) => updateOption(index, value)}
                      placeholder={`Option ${index + 1}`}
                      placeholderTextColor={theme.OnSurfaceVariant}
                      maxLength={100}
                      accessibilityLabel={`Option ${index + 1} input`}
                    />
                    {options.length > 2 && (
                      <TouchableOpacity
                        style={styles.removeOptionButton}
                        onPress={() => removeOption(index)}
                        accessibilityLabel={`Remove option ${index + 1}`}
                      >
                        <Icon name="remove" size={16} color={theme.OnErrorContainer} />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
                
                {options.length < 6 && (
                  <TouchableOpacity
                    style={styles.addOptionButton}
                    onPress={addOption}
                    accessibilityLabel="Add another option"
                  >
                    <Icon name="add" size={16} color={theme.OnPrimaryContainer} />
                    <Text style={styles.addOptionText}>Add Option</Text>
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.helpText}>
                Add 2-6 answer options. Keep them short and clear.
              </Text>
            </View>

            {/* Settings Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Poll Settings</Text>
              <View style={styles.settingsContainer}>
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>Allow multiple selections</Text>
                  <Switch
                    value={allowMultiple}
                    onValueChange={setAllowMultiple}
                    trackColor={{ 
                      false: theme.Outline, 
                      true: theme.primaryContainer 
                    }}
                    thumbColor={allowMultiple ? theme.primary : theme.OnSurface}
                  />
                </View>

                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>Set time limit</Text>
                  <Switch
                    value={hasTimeLimit}
                    onValueChange={setHasTimeLimit}
                    trackColor={{ 
                      false: theme.Outline, 
                      true: theme.primaryContainer 
                    }}
                    thumbColor={hasTimeLimit ? theme.primary : theme.OnSurface}
                  />
                </View>

                {hasTimeLimit && (
                  <View style={styles.settingRow}>
                    <Text style={styles.settingLabel}>Time limit</Text>
                    <View style={styles.timeLimitContainer}>
                      <TextInput
                        style={styles.timeLimitInput}
                        value={timeLimit.toString()}
                        onChangeText={(value) => {
                          const num = parseInt(value) || 0;
                          if (num >= 10 && num <= 300) {
                            setTimeLimit(num);
                          }
                        }}
                        keyboardType="numeric"
                        maxLength={3}
                        accessibilityLabel="Time limit in seconds"
                      />
                      <Text style={styles.timeLimitUnit}>seconds</Text>
                    </View>
                  </View>
                )}
              </View>
              <Text style={styles.helpText}>
                Multiple selections allow students to choose more than one answer.
              </Text>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
              accessibilityLabel="Cancel poll creation"
            >
              <Icon name="cancel" size={20} color={theme.OnSurfaceVariant} />
              <Text style={[styles.buttonText, styles.cancelButtonText]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button, 
                styles.createButton,
                (!question.trim() || options.filter(opt => opt.trim()).length < 2) && styles.disabledButton
              ]}
              onPress={handleCreatePoll}
              disabled={!question.trim() || options.filter(opt => opt.trim()).length < 2}
              accessibilityLabel="Create and launch poll"
            >
              <Icon name="poll" size={20} color={theme.OnPrimary} />
              <Text style={[styles.buttonText, styles.createButtonText]}>Create Poll</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default LivePollCreator;