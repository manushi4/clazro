import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Animated,
  ProgressBarAndroid,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { Poll, PollOption, PollResults, pollService } from '../../services/realtime/PollService';
import { format } from 'date-fns';
import { SemanticColors } from '../../theme/colors';

interface LivePollProps {
  poll: Poll;
  onClose?: () => void;
  onSubmit?: (response: any) => void;
  showResults?: boolean;
}

const LivePoll: React.FC<LivePollProps> = ({
  poll,
  onClose,
  onSubmit,
  showResults = false,
}) => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [textResponse, setTextResponse] = useState('');
  const [ratingValue, setRatingValue] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [results, setResults] = useState<PollResults | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);

  const slideAnim = useState(new Animated.Value(0))[0];
  const progressAnim = useState(new Animated.Value(0))[0];

  // Calculate time remaining
  useEffect(() => {
    if (!poll.duration_seconds || poll.status !== 'active') return;

    const startTime = new Date(poll.starts_at).getTime();
    const endTime = startTime + (poll.duration_seconds * 1000);
    
    const updateTimeRemaining = () => {
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);
      setTimeRemaining(remaining);
      
      if (remaining === 0) {
        setIsExpired(true);
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);
    
    return () => clearInterval(interval);
  }, [poll]);

  // Animate entry
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, []);

  // Check if user has already responded
  useEffect(() => {
    setHasSubmitted(!!poll.my_response);
    if (poll.my_response) {
      setSelectedOptions(poll.my_response.selected_options || []);
      setTextResponse(poll.my_response.text_response || '');
      setRatingValue(poll.my_response.rating_value || 0);
    }
  }, [poll.my_response]);

  // Load results if available
  useEffect(() => {
    if (showResults || poll.show_results_immediately || hasSubmitted) {
      setResults(poll.results || null);
    }
  }, [poll.results, showResults, hasSubmitted]);

  const canSubmit = useMemo(() => {
    if (hasSubmitted && !poll.allow_multiple_responses) return false;
    if (isExpired || poll.status !== 'active') return false;
    
    switch (poll.poll_type) {
      case 'single_choice':
      case 'yes_no':
        return selectedOptions.length === 1;
      case 'multiple_choice':
        return selectedOptions.length > 0;
      case 'open_text':
        return textResponse.trim().length > 0;
      case 'rating':
        return ratingValue > 0;
      default:
        return false;
    }
  }, [hasSubmitted, isExpired, poll, selectedOptions, textResponse, ratingValue]);

  const handleOptionSelect = (optionId: string) => {
    if (poll.poll_type === 'single_choice' || poll.poll_type === 'yes_no') {
      setSelectedOptions([optionId]);
    } else if (poll.poll_type === 'multiple_choice') {
      setSelectedOptions(prev =>
        prev.includes(optionId)
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      );
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;

    try {
      setIsSubmitting(true);

      const response = await pollService.submitResponse(poll.id, {
        selected_options: selectedOptions,
        text_response: textResponse || undefined,
        rating_value: ratingValue || undefined,
        is_anonymous: poll.is_anonymous,
      });

      setHasSubmitted(true);
      onSubmit?.(response);

      // Load results if they should be shown
      if (poll.show_results_immediately) {
        const pollResults = await pollService.getPollResults(poll.id);
        setResults(pollResults);
      }

    } catch (error) {
      Alert.alert('error', 'Failed to submit response. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimeRemaining = (milliseconds: number): string => {
    if (milliseconds <= 0) return '0:00';
    
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: theme.Surface }]}>
      <View style={styles.headerContent}>
        <View style={styles.headerLeft}>
          <Icon
            name="poll"
            size={24}
            color={poll.status === 'active' ? theme.primary : theme.OnSurfaceVariant}
          />
          <View style={styles.headerText}>
            <Text style={[styles.pollTitle, { color: theme.OnSurface }]}>
              {poll.title}
            </Text>
            <View style={styles.pollMeta}>
              <Text style={[styles.pollType, { color: theme.OnSurfaceVariant }]}>
                {poll.poll_type.replace('_', ' ').toUpperCase()}
              </Text>
              {poll.duration_seconds && (
                <>
                  <Text style={[styles.separator, { color: theme.OnSurfaceVariant }]}>•</Text>
                  <Text style={[
                    styles.timeRemaining,
                    {
                      color: timeRemaining < 60000 ? theme.error : theme.OnSurfaceVariant
                    }
                  ]}>
                    {formatTimeRemaining(timeRemaining)}
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Icon name="close" size={24} color={theme.OnSurface} />
          </TouchableOpacity>
        )}
      </View>
      
      {poll.description && (
        <Text style={[styles.pollDescription, { color: theme.OnSurfaceVariant }]}>
          {poll.description}
        </Text>
      )}

      {poll.duration_seconds && (
        <View style={[styles.progressContainer, { backgroundColor: theme.background }]}>
          <View
            style={[
              styles.progressBar,
              {
                backgroundColor: timeRemaining < 60000 ? theme.error : theme.primary,
                width: `${Math.max(0, (timeRemaining / (poll.duration_seconds * 1000)) * 100)}%`,
              }
            ]}
          />
        </View>
      )}
    </View>
  );

  const renderOptions = () => {
    if (poll.poll_type === 'open_text') {
      return (
        <View style={styles.textInputContainer}>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: theme.background,
                color: theme.OnSurface,
                borderColor: theme.Outline,
              }
            ]}
            value={textResponse}
            onChangeText={setTextResponse}
            placeholder="Type your response..."
            placeholderTextColor={theme.OnSurfaceVariant}
            multiline
            maxLength={500}
            editable={!hasSubmitted || poll.allow_multiple_responses}
          />
          <Text style={[styles.characterCount, { color: theme.OnSurfaceVariant }]}>
            {textResponse.length}/500
          </Text>
        </View>
      );
    }

    if (poll.poll_type === 'rating') {
      return (
        <View style={styles.ratingContainer}>
          <View style={styles.ratingScale}>
            {[1, 2, 3, 4, 5].map((rating) => (
              <TouchableOpacity
                key={rating}
                style={[
                  styles.ratingButton,
                  {
                    backgroundColor: ratingValue >= rating ? theme.primary : theme.background,
                    borderColor: theme.Outline,
                  }
                ]}
                onPress={() => setRatingValue(rating)}
                disabled={hasSubmitted && !poll.allow_multiple_responses}
              >
                <Text style={[
                  styles.ratingText,
                  { color: ratingValue >= rating ? theme.OnPrimary : theme.OnSurface }
                ]}>
                  {rating}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.ratingLabels}>
            <Text style={[styles.ratingLabel, { color: theme.OnSurfaceVariant }]}>
              Poor
            </Text>
            <Text style={[styles.ratingLabel, { color: theme.OnSurfaceVariant }]}>
              Excellent
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.optionsContainer}>
        {poll.options.map((option, index) => {
          const isSelected = selectedOptions.includes(option.id);
          const showResult = results && (showResults || poll.show_results_immediately || hasSubmitted);
          const optionResult = results?.option_results.find(r => r.option_id === option.id);
          
          return (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionButton,
                {
                  backgroundColor: isSelected ? theme.primary + '20' : theme.Surface,
                  borderColor: isSelected ? theme.primary : theme.Outline,
                }
              ]}
              onPress={() => handleOptionSelect(option.id)}
              disabled={hasSubmitted && !poll.allow_multiple_responses}
            >
              <View style={styles.optionContent}>
                <View style={styles.optionLeft}>
                  <View style={[
                    styles.optionIndicator,
                    poll.poll_type === 'multiple_choice' ? styles.checkbox : styles.radio,
                    {
                      borderColor: isSelected ? theme.primary : theme.Outline,
                      backgroundColor: isSelected ? theme.primary : 'transparent',
                    }
                  ]}>
                    {isSelected && (
                      <Icon
                        name={poll.poll_type === 'multiple_choice' ? 'check' : 'circle'}
                        size={poll.poll_type === 'multiple_choice' ? 16 : 8}
                        color={theme.OnPrimary}
                      />
                    )}
                  </View>
                  <Text style={[
                    styles.optionText,
                    { color: isSelected ? theme.primary : theme.OnSurface }
                  ]}>
                    {option.text}
                  </Text>
                </View>
                
                {showResult && (
                  <View style={styles.optionResult}>
                    <Text style={[styles.resultPercentage, { color: theme.OnSurfaceVariant }]}>
                      {optionResult?.percentage.toFixed(0) || 0}%
                    </Text>
                    <Text style={[styles.resultCount, { color: theme.OnSurfaceVariant }]}>
                      ({optionResult?.response_count || 0})
                    </Text>
                  </View>
                )}
              </View>
              
              {showResult && (
                <View style={[styles.resultBar, { backgroundColor: theme.background }]}>
                  <View
                    style={[
                      styles.resultProgress,
                      {
                        backgroundColor: theme.primary + '40',
                        width: `${optionResult?.percentage || 0}%`,
                      }
                    ]}
                  />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderFooter = () => (
    <View style={[styles.footer, { backgroundColor: theme.Surface }]}>
      {results && (
        <View style={styles.resultsInfo}>
          <Text style={[styles.responseCount, { color: theme.OnSurfaceVariant }]}>
            {results.total_responses} response{results.total_responses !== 1 ? 's' : ''}
          </Text>
          {poll.is_anonymous && (
            <Text style={[styles.anonymousLabel, { color: theme.OnSurfaceVariant }]}>
              • Anonymous
            </Text>
          )}
        </View>
      )}
      
      {!hasSubmitted && poll.status === 'active' && !isExpired && (
        <TouchableOpacity
          style={[
            styles.submitButton,
            {
              backgroundColor: canSubmit ? theme.primary : theme.SurfaceVariant,
            }
          ]}
          onPress={handleSubmit}
          disabled={!canSubmit || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={theme.OnPrimary} />
          ) : (
            <Text style={[styles.submitButtonText, { color: theme.OnPrimary }]}>
              Submit Response
            </Text>
          )}
        </TouchableOpacity>
      )}
      
      {hasSubmitted && (
        <View style={[styles.submittedIndicator, { backgroundColor: SemanticColors.Success + '20' }]}>
          <Icon name="check-circle" size={20} color={SemanticColors.Success} />
          <Text style={[styles.submittedText, { color: SemanticColors.Success }]}>
            Response submitted
          </Text>
        </View>
      )}
      
      {isExpired && (
        <View style={[styles.expiredIndicator, { backgroundColor: theme.error + '20' }]}>
          <Icon name="access-time" size={20} color={theme.error} />
          <Text style={[styles.expiredText, { color: theme.error }]}>
            Poll has ended
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: theme.background,
          transform: [
            {
              translateY: slideAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [300, 0],
              }),
            },
          ],
        },
      ]}
    >
      {renderHeader()}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderOptions()}
      </ScrollView>
      {renderFooter()}
    </Animated.View>
  );
};

const styles = {
  container: {
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  header: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  headerContent: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    justifyContent: 'space-between' as const,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  pollTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    marginBottom: 4,
  },
  pollMeta: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  pollType: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  separator: {
    marginHorizontal: 8,
  },
  timeRemaining: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  closeButton: {
    padding: 4,
  },
  pollDescription: {
    fontSize: 14,
    marginTop: 8,
    lineHeight: 20,
  },
  progressContainer: {
    height: 4,
    borderRadius: 2,
    marginTop: 12,
    overflow: 'hidden' as const,
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  content: {
    maxHeight: 400,
  },
  optionsContainer: {
    padding: 16,
  },
  optionButton: {
    borderWidth: 2,
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden' as const,
  },
  optionContent: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  optionLeft: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  optionIndicator: {
    width: 20,
    height: 20,
    borderWidth: 2,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 12,
  },
  checkbox: {
    borderRadius: 4,
  },
  radio: {
    borderRadius: 10,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 20,
  },
  optionResult: {
    alignItems: 'flex-end' as const,
  },
  resultPercentage: {
    fontSize: 16,
    fontWeight: 'bold' as const,
  },
  resultCount: {
    fontSize: 12,
  },
  resultBar: {
    height: 4,
    borderRadius: 2,
  },
  resultProgress: {
    height: '100%',
    borderRadius: 2,
  },
  textInputContainer: {
    padding: 16,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top' as const,
  },
  characterCount: {
    fontSize: 12,
    textAlign: 'right' as const,
    marginTop: 4,
  },
  ratingContainer: {
    padding: 16,
    alignItems: 'center' as const,
  },
  ratingScale: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    width: '100%',
    maxWidth: 300,
  },
  ratingButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  ratingText: {
    fontSize: 18,
    fontWeight: 'bold' as const,
  },
  ratingLabels: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    width: '100%',
    maxWidth: 300,
    marginTop: 8,
  },
  ratingLabel: {
    fontSize: 12,
  },
  footer: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  resultsInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  responseCount: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  anonymousLabel: {
    fontSize: 12,
  },
  submitButton: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold' as const,
  },
  submittedIndicator: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 8,
    borderRadius: 8,
  },
  submittedText: {
    fontSize: 14,
    fontWeight: '500' as const,
    marginLeft: 8,
  },
  expiredIndicator: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 8,
    borderRadius: 8,
  },
  expiredText: {
    fontSize: 14,
    fontWeight: '500' as const,
    marginLeft: 8,
  },
};

export default LivePoll;