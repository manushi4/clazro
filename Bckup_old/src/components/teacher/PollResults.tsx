/**
 * PollResults - Live poll results display
 * Phase 19: Polling & Quiz Integration
 * Shows real-time poll results with charts and statistics
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Animated,
  Modal,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../context/ThemeContext';

export interface PollResultsProps {
  question: string;
  results: { option: string; count: number; percentage: number }[];
  totalResponses: number;
  isActive?: boolean;
  timeRemaining?: number;
  allowMultiple?: boolean;
  visible?: boolean;
  onClose?: () => void;
  onEndPoll?: () => void;
  onShareResults?: () => void;
}

const PollResults: React.FC<PollResultsProps> = ({
  question,
  results,
  totalResponses,
  isActive = false,
  timeRemaining,
  allowMultiple = false,
  visible = false,
  onClose,
  onEndPoll,
  onShareResults,
}) => {
  const { theme } = useTheme();
  const [animatedValues] = useState(
    results.map(() => new Animated.Value(0))
  );

  // Animate result bars
  useEffect(() => {
    const animations = results.map((result, index) => 
      Animated.timing(animatedValues[index], {
        toValue: result.percentage,
        duration: 1000 + (index * 200), // Staggered animation
        useNativeDriver: false,
      })
    );

    Animated.parallel(animations).start();
  }, [results, animatedValues]);

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
      maxWidth: 600,
      maxHeight: '90%',
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
    },

    // Inline results styles (when not in modal)
    container: {
      backgroundColor: theme.Surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },

    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 20,
    },

    headerLeft: {
      flex: 1,
      marginRight: 16,
    },

    pollTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.OnSurface,
      marginBottom: 8,
    },

    pollQuestion: {
      fontSize: 16,
      color: theme.OnSurface,
      lineHeight: 22,
      marginBottom: 8,
    },

    pollInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      flexWrap: 'wrap',
    },

    infoItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },

    infoText: {
      fontSize: 12,
      color: theme.OnSurfaceVariant,
      fontWeight: '500',
    },

    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: isActive ? theme.primaryContainer : theme.SurfaceVariant,
    },

    statusText: {
      fontSize: 11,
      fontWeight: '600',
      color: isActive ? theme.OnPrimaryContainer : theme.OnSurfaceVariant,
    },

    timerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.errorContainer,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },

    timerText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.OnErrorContainer,
      marginLeft: 4,
    },

    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.SurfaceVariant,
      alignItems: 'center',
      justifyContent: 'center',
    },

    resultsContainer: {
      marginBottom: 20,
    },

    resultItem: {
      marginBottom: 16,
    },

    resultHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },

    optionText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.OnSurface,
      flex: 1,
    },

    resultStats: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },

    countText: {
      fontSize: 12,
      color: theme.OnSurfaceVariant,
      fontWeight: '600',
    },

    percentageText: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.primary,
      minWidth: 40,
      textAlign: 'right',
    },

    progressBarContainer: {
      height: 8,
      backgroundColor: theme.SurfaceVariant,
      borderRadius: 4,
      overflow: 'hidden',
    },

    progressBar: {
      height: '100%',
      backgroundColor: theme.primary,
      borderRadius: 4,
    },

    summaryContainer: {
      backgroundColor: theme.SurfaceVariant,
      borderRadius: 8,
      padding: 16,
      marginBottom: 20,
    },

    summaryTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.OnSurface,
      marginBottom: 8,
    },

    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },

    summaryLabel: {
      fontSize: 13,
      color: theme.OnSurfaceVariant,
    },

    summaryValue: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.OnSurface,
    },

    actionsContainer: {
      flexDirection: 'row',
      gap: 12,
    },

    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      gap: 6,
    },

    primaryButton: {
      backgroundColor: theme.primary,
    },

    secondaryButton: {
      backgroundColor: theme.SurfaceVariant,
    },

    dangerButton: {
      backgroundColor: theme.errorContainer,
    },

    buttonText: {
      fontSize: 14,
      fontWeight: '600',
    },

    primaryButtonText: {
      color: theme.OnPrimary,
    },

    secondaryButtonText: {
      color: theme.OnSurfaceVariant,
    },

    dangerButtonText: {
      color: theme.OnErrorContainer,
    },

    emptyResults: {
      alignItems: 'center',
      paddingVertical: 32,
    },

    emptyIcon: {
      color: theme.OnSurfaceVariant,
      marginBottom: 8,
    },

    emptyText: {
      fontSize: 14,
      color: theme.OnSurfaceVariant,
      textAlign: 'center',
    },
  });

  const styles = getStyles(theme);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getTopResult = () => {
    if (results.length === 0) return null;
    return results.reduce((max, current) => 
      current.count > max.count ? current : max
    );
  };

  const renderResultItem = (result: { option: string; count: number; percentage: number }, index: number) => (
    <View key={index} style={styles.resultItem}>
      <View style={styles.resultHeader}>
        <Text style={styles.optionText}>{result.option}</Text>
        <View style={styles.resultStats}>
          <Text style={styles.countText}>{result.count}</Text>
          <Text style={styles.percentageText}>{result.percentage.toFixed(1)}%</Text>
        </View>
      </View>
      <View style={styles.progressBarContainer}>
        <Animated.View
          style={[
            styles.progressBar,
            {
              width: animatedValues[index]?.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
                extrapolate: 'clamp',
              }) || '0%',
            },
          ]}
        />
      </View>
    </View>
  );

  const renderContent = () => (
    <>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.pollTitle}>📊 Poll Results</Text>
          <Text style={styles.pollQuestion}>{question}</Text>
          <View style={styles.pollInfo}>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>
                {isActive ? 'LIVE' : 'ENDED'}
              </Text>
            </View>
            
            <View style={styles.infoItem}>
              <Icon name="group" size={14} color={theme.OnSurfaceVariant} />
              <Text style={styles.infoText}>{totalResponses} responses</Text>
            </View>
            
            {allowMultiple && (
              <View style={styles.infoItem}>
                <Icon name="check-box" size={14} color={theme.OnSurfaceVariant} />
                <Text style={styles.infoText}>Multiple choice</Text>
              </View>
            )}
            
            {isActive && timeRemaining && timeRemaining > 0 && (
              <View style={styles.timerContainer}>
                <Icon name="timer" size={12} color={theme.OnErrorContainer} />
                <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
              </View>
            )}
          </View>
        </View>
        
        {visible && onClose && (
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            accessibilityLabel="Close results"
          >
            <Icon name="close" size={16} color={theme.OnSurfaceVariant} />
          </TouchableOpacity>
        )}
      </View>

      {/* Results */}
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.resultsContainer}>
          {results.length > 0 ? (
            results.map((result, index) => renderResultItem(result, index))
          ) : (
            <View style={styles.emptyResults}>
              <Icon name="poll" size={48} style={styles.emptyIcon} />
              <Text style={styles.emptyText}>
                No responses yet.{'\n'}Results will appear as students vote.
              </Text>
            </View>
          )}
        </View>

        {/* Summary */}
        {totalResponses > 0 && (
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Responses:</Text>
              <Text style={styles.summaryValue}>{totalResponses}</Text>
            </View>
            {getTopResult() && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Most Popular:</Text>
                <Text style={styles.summaryValue}>
                  {getTopResult()?.option} ({getTopResult()?.count} votes)
                </Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Response Type:</Text>
              <Text style={styles.summaryValue}>
                {allowMultiple ? 'Multiple Choice' : 'Single Choice'}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        {onShareResults && (
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={onShareResults}
            accessibilityLabel="Share poll results"
          >
            <Icon name="share" size={16} color={theme.OnSurfaceVariant} />
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>Share</Text>
          </TouchableOpacity>
        )}
        
        {isActive && onEndPoll && (
          <TouchableOpacity
            style={[styles.actionButton, styles.dangerButton]}
            onPress={onEndPoll}
            accessibilityLabel="End poll"
          >
            <Icon name="stop" size={16} color={theme.OnErrorContainer} />
            <Text style={[styles.buttonText, styles.dangerButtonText]}>End Poll</Text>
          </TouchableOpacity>
        )}
        
        {!isActive && (
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={onClose}
            accessibilityLabel="Close results"
          >
            <Icon name="check" size={16} color={theme.OnPrimary} />
            <Text style={[styles.buttonText, styles.primaryButtonText]}>Done</Text>
          </TouchableOpacity>
        )}
      </View>
    </>
  );

  if (visible) {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {renderContent()}
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <View style={styles.container}>
      {renderContent()}
    </View>
  );
};

export default PollResults;