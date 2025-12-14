import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  Alert,
  Dimensions,
  Linking,
  Platform,
} from 'react-native';
import {
  Card,
  Button,
  IconButton,
  Chip,
  Divider,
  Surface,
  Portal,
  Modal,
  ProgressBar,
  List,
  Badge,
} from 'react-native-paper';
import { useTheme } from '../../context/ThemeContext';
import { DoubtSubmission } from './DoubtSubmissionForm';

// Import preview components for different content types
import FilePreview from './FilePreview';

const { width, height } = Dimensions.get('window');

export interface PreviewValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  score: number; // 0-100 quality score
}

export interface DoubtPreviewProps {
  submission: Partial<DoubtSubmission>;
  onEdit: () => void;
  onSubmit: () => void;
  onCancel: () => void;
  showEditActions?: boolean;
  validationEnabled?: boolean;
  readOnly?: boolean;
}

const DoubtPreview: React.FC<DoubtPreviewProps> = ({
  submission,
  onEdit,
  onSubmit,
  onCancel,
  showEditActions = true,
  validationEnabled = true,
  readOnly = false,
}) => {
  const { theme } = useTheme();
  
  const [selectedAttachment, setSelectedAttachment] = useState<{
    type: string;
    data: any;
    index: number;
  } | null>(null);
  const [showValidationDetails, setShowValidationDetails] = useState(false);

  // Comprehensive validation logic
  const validationResult = useMemo((): PreviewValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // Required field validation
    if (!submission.title?.trim()) {
      errors.push('Title is required');
      score -= 25;
    } else if (submission.title.length < 10) {
      warnings.push('Title is quite short. Consider adding more details.');
      score -= 5;
    }

    if (!submission.description?.trim()) {
      errors.push('Description is required');
      score -= 25;
    } else if (submission.description.length < 20) {
      warnings.push('Description is very brief. More details would help others understand your doubt better.');
      score -= 10;
    }

    if (!submission.category?.subject) {
      errors.push('Subject selection is required');
      score -= 15;
    }
    if (!submission.category?.chapter) {
      errors.push('Chapter selection is required');
      score -= 15;
    }
    if (!submission.category?.topic) {
      errors.push('Topic selection is required');
      score -= 15;
    }

    // Quality assessment
    const hasAttachments = !!(
      submission.attachments?.mathEquations?.length ||
      submission.attachments?.drawings?.length ||
      submission.attachments?.codeSnippets?.length ||
      submission.attachments?.images?.length ||
      submission.attachments?.videos?.length ||
      submission.attachments?.documents?.length
    );

    if (!hasAttachments) {
      suggestions.push('Consider adding visual aids (drawings, equations, or images) to make your doubt clearer');
    }

    if (!submission.tags || submission.tags.length === 0) {
      suggestions.push('Adding relevant tags will help categorize your doubt better');
    } else if (submission.tags.length > 10) {
      warnings.push('Too many tags might make your doubt harder to categorize');
      score -= 5;
    }

    // Priority validation
    if (submission.priority === 'Urgent' && !submission.description?.toLowerCase().includes('urgent')) {
      warnings.push('Consider explaining why this doubt is urgent in the description');
    }

    // Content quality checks
    if (submission.title?.toLowerCase() === submission.description?.toLowerCase()) {
      warnings.push('Title and description are identical. Consider making the description more detailed.');
      score -= 10;
    }

    // Ensure score is within bounds
    score = Math.max(0, Math.min(100, score));

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
      score,
    };
  }, [submission]);

  // Get quality score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return theme.primary;
    if (score >= 60) return theme.Tertiary;
    if (score >= 40) return '#FF9800'; // Orange
    return theme.error;
  };

  // Get quality score text
  const getScoreText = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  // Handle attachment preview
  const handleAttachmentPress = useCallback((type: string, data: any, index: number) => {
    setSelectedAttachment({ type, data, index });
  }, []);

  // Render attachment preview
  const renderAttachment = (type: string, data: any, index: number) => {
    const iconMap: Record<string, string> = {
      mathEquations: 'function-variant',
      drawings: 'draw',
      codeSnippets: 'code-tags',
      images: 'image',
      videos: 'video',
      documents: 'file-document',
    };

    const icon = iconMap[type] || 'attachment';
    
    return (
      <Surface
        key={`${type}-${index}`}
        style={{
          padding: 8,
          margin: 4,
          borderRadius: 8,
          backgroundColor: theme.SurfaceVariant,
        }}
      >
        <Button
          mode="text"
          icon={icon}
          onPress={() => handleAttachmentPress(type, data, index)}
          compact
        >
          {type === 'codeSnippets' 
            ? `${data.language} Code`
            : type === 'mathEquations'
            ? 'Math Equation'
            : `${type.slice(0, -1)} ${index + 1}`
          }
        </Button>
      </Surface>
    );
  };

  // Render validation summary
  const renderValidationSummary = () => {
    if (!validationEnabled) return null;

    const { isValid, errors, warnings, suggestions, score } = validationResult;
    
    return (
      <Card style={{ margin: 16, backgroundColor: theme.Surface }}>
        <Card.Content>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{
              fontSize: 16,
              fontWeight: '600',
              color: theme.OnSurface,
            }}>
              Submission Quality
            </Text>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Badge 
                style={{ backgroundColor: getScoreColor(score) }}
                size={24}
              >
                {score}
              </Badge>
              <Text style={{
                fontSize: 14,
                fontWeight: '500',
                color: getScoreColor(score),
              }}>
                {getScoreText(score)}
              </Text>
            </View>
          </View>
          
          <ProgressBar 
            progress={score / 100} 
            color={getScoreColor(score)}
            style={{ marginBottom: 16, height: 6, borderRadius: 3 }}
          />
          
          {/* Status indicators */}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
            {errors.length === 0 && (
              <Chip icon="check-circle" style={{ backgroundColor: theme.primaryContainer }}>
                Ready to Submit
              </Chip>
            )}
            {errors.length > 0 && (
              <Chip icon="alert-circle" style={{ backgroundColor: theme.errorContainer }}>
                {errors.length} Error{errors.length > 1 ? 's' : ''}
              </Chip>
            )}
            {warnings.length > 0 && (
              <Chip icon="alert" style={{ backgroundColor: '#FFF3E0' }}>
                {warnings.length} Warning{warnings.length > 1 ? 's' : ''}
              </Chip>
            )}
          </View>
          
          <Button
            mode="text"
            onPress={() => setShowValidationDetails(true)}
            icon="information"
            compact
          >
            View Details
          </Button>
        </Card.Content>
      </Card>
    );
  };

  // Render submission details
  const renderSubmissionDetails = () => (
    <Card style={{ margin: 16 }}>
      <Card.Content>
        <Text style={{
          fontSize: 20,
          fontWeight: '700',
          color: theme.OnSurface,
          marginBottom: 8,
        }}>
          {submission.title || 'Untitled Doubt'}
        </Text>
        
        {submission.priority && (
          <Chip 
            mode="flat"
            icon={submission.priority === 'Urgent' ? 'fire' : submission.priority === 'High' ? 'alert-circle' : 'information'}
            style={{ 
              alignSelf: 'flex-start',
              marginBottom: 12,
              backgroundColor: submission.priority === 'Urgent' 
                ? theme.errorContainer
                : submission.priority === 'High'
                ? '#FFF3E0'
                : theme.primaryContainer,
            }}
          >
            {submission.priority} Priority
          </Chip>
        )}
        
        <Divider style={{ marginVertical: 12 }} />
        
        <Text style={{
          fontSize: 16,
          lineHeight: 24,
          color: theme.OnSurface,
          marginBottom: 16,
        }}>
          {submission.description || 'No description provided'}
        </Text>
        
        {/* Category Information */}
        {submission.category && (
          <View style={{ marginBottom: 16 }}>
            <Text style={{
              fontSize: 14,
              fontWeight: '600',
              color: theme.OnSurfaceVariant,
              marginBottom: 4,
            }}>
              Category
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Chip mode="outlined" compact>{submission.category.subject}</Chip>
              <Text style={{ color: theme.OnSurfaceVariant }}>→</Text>
              <Chip mode="outlined" compact>{submission.category.chapter}</Chip>
              <Text style={{ color: theme.OnSurfaceVariant }}>→</Text>
              <Chip mode="outlined" compact>{submission.category.topic}</Chip>
            </View>
            {submission.category.difficulty && (
              <Chip 
                mode="flat" 
                compact
                style={{ 
                  alignSelf: 'flex-start',
                  marginTop: 8,
                  backgroundColor: submission.category.difficulty === 'Advanced'
                    ? theme.errorContainer
                    : submission.category.difficulty === 'Intermediate'
                    ? '#FFF3E0'
                    : theme.primaryContainer,
                }}
              >
                {submission.category.difficulty} Level
              </Chip>
            )}
          </View>
        )}
        
        {/* Tags */}
        {submission.tags && submission.tags.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            <Text style={{
              fontSize: 14,
              fontWeight: '600',
              color: theme.OnSurfaceVariant,
              marginBottom: 8,
            }}>
              Tags
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
              {submission.tags.map((tag, index) => (
                <Chip key={index} mode="outlined" compact>
                  {tag}
                </Chip>
              ))}
            </View>
          </View>
        )}
        
        {/* Attachments */}
        {submission.attachments && (
          <View>
            <Text style={{
              fontSize: 14,
              fontWeight: '600',
              color: theme.OnSurfaceVariant,
              marginBottom: 8,
            }}>
              Attachments
            </Text>
            
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
              {submission.attachments.mathEquations?.map((equation, index) => 
                renderAttachment('mathEquations', equation, index)
              )}
              {submission.attachments.drawings?.map((drawing, index) => 
                renderAttachment('drawings', drawing, index)
              )}
              {submission.attachments.codeSnippets?.map((code, index) => 
                renderAttachment('codeSnippets', code, index)
              )}
              {submission.attachments.images?.map((image, index) => 
                renderAttachment('images', image, index)
              )}
              {submission.attachments.videos?.map((video, index) => 
                renderAttachment('videos', video, index)
              )}
              {submission.attachments.documents?.map((doc, index) => 
                renderAttachment('documents', doc, index)
              )}
            </View>
            
            {/* Show message if no attachments */}
            {!submission.attachments.mathEquations?.length &&
             !submission.attachments.drawings?.length &&
             !submission.attachments.codeSnippets?.length &&
             !submission.attachments.images?.length &&
             !submission.attachments.videos?.length &&
             !submission.attachments.documents?.length && (
              <Text style={{
                fontSize: 14,
                color: theme.OnSurfaceVariant,
                fontStyle: 'italic',
              }}>
                No attachments added
              </Text>
            )}
          </View>
        )}
      </Card.Content>
    </Card>
  );

  // Render action buttons
  const renderActionButtons = () => {
    if (readOnly) return null;
    
    return (
      <Card style={{ margin: 16 }}>
        <Card.Content>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Button
              mode="outlined"
              onPress={onCancel}
              style={{ flex: 1 }}
              icon="close"
            >
              Cancel
            </Button>
            
            {showEditActions && (
              <Button
                mode="outlined"
                onPress={onEdit}
                style={{ flex: 1 }}
                icon="pencil"
              >
                Edit
              </Button>
            )}
            
            <Button
              mode="contained"
              onPress={onSubmit}
              style={{ flex: 1 }}
              icon="send"
              disabled={!validationResult.isValid}
            >
              Submit
            </Button>
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {renderValidationSummary()}
        {renderSubmissionDetails()}
        {renderActionButtons()}
        
        {/* Metadata for debugging/info */}
        {submission.metadata && __DEV__ && (
          <Card style={{ margin: 16, opacity: 0.7 }}>
            <Card.Content>
              <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 8 }}>
                Submission Metadata (Debug)
              </Text>
              <Text style={{ fontSize: 12, color: theme.OnSurfaceVariant }}>
                Device: {submission.metadata.deviceInfo}
              </Text>
              <Text style={{ fontSize: 12, color: theme.OnSurfaceVariant }}>
                Composition Time: {submission.metadata.estimatedTime}s
              </Text>
              <Text style={{ fontSize: 12, color: theme.OnSurfaceVariant }}>
                Source: {submission.metadata.submissionSource}
              </Text>
            </Card.Content>
          </Card>
        )}
      </ScrollView>
      
      {/* Attachment Preview Modal */}
      <Portal>
        <Modal
          visible={!!selectedAttachment}
          onDismiss={() => setSelectedAttachment(null)}
          contentContainerStyle={{
            backgroundColor: theme.Surface,
            margin: 20,
            borderRadius: 12,
            maxHeight: height * 0.8,
          }}
        >
          {selectedAttachment && (
            <View style={{ padding: 20 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Text style={{
                  fontSize: 18,
                  fontWeight: '600',
                  color: theme.OnSurface,
                }}>
                  {selectedAttachment.type === 'codeSnippets' 
                    ? `${selectedAttachment.data.language} Code`
                    : selectedAttachment.type === 'mathEquations'
                    ? 'Math Equation'
                    : `${selectedAttachment.type.slice(0, -1)} Preview`
                  }
                </Text>
                
                <IconButton
                  icon="close"
                  onPress={() => setSelectedAttachment(null)}
                />
              </View>
              
              <ScrollView style={{ maxHeight: height * 0.6 }}>
                {selectedAttachment.type === 'codeSnippets' && (
                  <View>
                    <Surface style={{ padding: 12, borderRadius: 8, backgroundColor: '#f5f5f5' }}>
                      <Text style={{ fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' }}>
                        {selectedAttachment.data.code}
                      </Text>
                    </Surface>
                  </View>
                )}
                
                {selectedAttachment.type === 'mathEquations' && (
                  <Surface style={{ padding: 12, borderRadius: 8, backgroundColor: theme.SurfaceVariant }}>
                    <Text style={{ fontSize: 16, textAlign: 'center' }}>
                      {selectedAttachment.data}
                    </Text>
                  </Surface>
                )}
                
                {selectedAttachment.type === 'images' && (
                  <Image
                    source={{ uri: selectedAttachment.data }}
                    style={{ width: '100%', height: 300, borderRadius: 8 }}
                    resizeMode="contain"
                  />
                )}
                
                {(selectedAttachment.type === 'drawings' || selectedAttachment.type === 'videos' || selectedAttachment.type === 'documents') && (
                  <Surface style={{ padding: 20, borderRadius: 8, backgroundColor: theme.SurfaceVariant, alignItems: 'center' }}>
                    <Text style={{ color: theme.OnSurfaceVariant }}>
                      Preview not available for this content type
                    </Text>
                  </Surface>
                )}
              </ScrollView>
            </View>
          )}
        </Modal>
        
        {/* Validation Details Modal */}
        <Modal
          visible={showValidationDetails}
          onDismiss={() => setShowValidationDetails(false)}
          contentContainerStyle={{
            backgroundColor: theme.Surface,
            margin: 20,
            borderRadius: 12,
            maxHeight: height * 0.7,
          }}
        >
          <View style={{ padding: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{
                fontSize: 18,
                fontWeight: '600',
                color: theme.OnSurface,
              }}>
                Validation Details
              </Text>
              
              <IconButton
                icon="close"
                onPress={() => setShowValidationDetails(false)}
              />
            </View>
            
            <ScrollView>
              {validationResult.errors.length > 0 && (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: theme.error,
                    marginBottom: 8,
                  }}>
                    Errors ({validationResult.errors.length})
                  </Text>
                  {validationResult.errors.map((error, index) => (
                    <List.Item
                      key={index}
                      title={error}
                      left={(props) => <List.Icon {...props} icon="alert-circle" color={theme.error} />}
                      titleStyle={{ color: theme.error }}
                    />
                  ))}
                </View>
              )}
              
              {validationResult.warnings.length > 0 && (
                <View style={{ marginBottom: 16 }}>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: '#FF9800',
                    marginBottom: 8,
                  }}>
                    Warnings ({validationResult.warnings.length})
                  </Text>
                  {validationResult.warnings.map((warning, index) => (
                    <List.Item
                      key={index}
                      title={warning}
                      left={(props) => <List.Icon {...props} icon="alert" color="#FF9800" />}
                      titleStyle={{ color: '#FF9800' }}
                    />
                  ))}
                </View>
              )}
              
              {validationResult.suggestions.length > 0 && (
                <View>
                  <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: theme.primary,
                    marginBottom: 8,
                  }}>
                    Suggestions ({validationResult.suggestions.length})
                  </Text>
                  {validationResult.suggestions.map((suggestion, index) => (
                    <List.Item
                      key={index}
                      title={suggestion}
                      left={(props) => <List.Icon {...props} icon="lightbulb-on" color={theme.primary} />}
                      titleStyle={{ color: theme.primary }}
                    />
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        </Modal>
      </Portal>
    </View>
  );
};

export default DoubtPreview;