import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ToastAndroid,
  Dimensions,
} from 'react-native';
import {
  Button,
  Card,
  IconButton,
  Portal,
  Modal,
  Chip,
  ProgressBar,
  Divider,
  Surface,
  FAB,
} from 'react-native-paper';
import { useTheme } from '../../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import all Phase 20-23 components for integration
import { MathEditor } from './MathEditor';
import { MediaUploader } from './MediaUploader';
import DrawingCanvas from './DrawingCanvas';
import CodeEditor from './CodeEditor';
import CategorySelection from './CategorySelector';
import AutoTagger from './AutoTagger';
import SimilarQuestions from './SimilarQuestions';

const { width, height } = Dimensions.get('window');

// Comprehensive doubt submission interfaces
export interface DoubtSubmission {
  id: string;
  title: string;
  description: string;
  category: {
    subject: string;
    chapter: string;
    topic: string;
    difficulty: 'Basic' | 'Intermediate' | 'Advanced';
  };
  tags: string[];
  attachments: {
    images: string[];
    videos: string[];
    documents: string[];
    drawings: string[];
    codeSnippets: { language: string; code: string; }[];
    mathEquations: string[];
  };
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  isAnonymous: boolean;
  createdAt: string;
  updatedAt: string;
  status: 'Draft' | 'Submitted' | 'Under Review' | 'Answered' | 'Closed';
  metadata: {
    deviceInfo: string;
    appVersion: string;
    submissionSource: 'mobile' | 'web';
    estimatedTime: number; // seconds taken to compose
  };
}

export interface SubmissionStep {
  id: number;
  title: string;
  description: string;
  component: string;
  isCompleted: boolean;
  isOptional: boolean;
  validationMessage?: string;
}

export interface DoubtSubmissionFormProps {
  initialData?: Partial<DoubtSubmission>;
  onSubmit: (submission: DoubtSubmission) => Promise<void>;
  onSaveDraft: (submission: Partial<DoubtSubmission>) => Promise<void>;
  onCancel: () => void;
  showSimilarQuestions?: boolean;
  autoSaveInterval?: number; // milliseconds
}

const DoubtSubmissionForm: React.FC<DoubtSubmissionFormProps> = ({
  initialData,
  onSubmit,
  onSaveDraft,
  onCancel,
  showSimilarQuestions = true,
  autoSaveInterval = 30000, // 30 seconds
}) => {
  const { theme } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  const autoSaveTimer = useRef<NodeJS.Timeout>();
  const startTime = useRef(Date.now());

  // Comprehensive form state management
  const [currentStep, setCurrentStep] = useState(1);
  const [submission, setSubmission] = useState<Partial<DoubtSubmission>>({
    title: '',
    description: '',
    category: undefined,
    tags: [],
    attachments: {
      images: [],
      videos: [],
      documents: [],
      drawings: [],
      codeSnippets: [],
      mathEquations: [],
    },
    priority: 'Medium',
    isAnonymous: false,
    status: 'Draft',
    ...initialData,
  });

  // UI state management
  const [activeEditor, setActiveEditor] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showSimilarModal, setShowSimilarModal] = useState(false);
  const [similarQuestions, setSimilarQuestions] = useState<any[]>([]);

  // Step configuration for guided submission
  const submissionSteps: SubmissionStep[] = [
    {
      id: 1,
      title: 'Basic Information',
      description: 'Add title, description, and set priority',
      component: 'basic',
      isCompleted: !!(submission.title && submission.description),
      isOptional: false,
    },
    {
      id: 2,
      title: 'Categorization',
      description: 'Select subject, chapter, and topic',
      component: 'category',
      isCompleted: !!(submission.category?.subject && submission.category?.chapter && submission.category?.topic),
      isOptional: false,
    },
    {
      id: 3,
      title: 'Content Creation',
      description: 'Add math, drawings, code, or media',
      component: 'content',
      isCompleted: !!(
        submission.attachments?.mathEquations?.length ||
        submission.attachments?.drawings?.length ||
        submission.attachments?.codeSnippets?.length ||
        submission.attachments?.images?.length ||
        submission.attachments?.videos?.length ||
        submission.attachments?.documents?.length
      ),
      isOptional: true,
    },
    {
      id: 4,
      title: 'Smart Tagging',
      description: 'AI-powered tags and similar question check',
      component: 'tagging',
      isCompleted: submission.tags && submission.tags.length > 0,
      isOptional: true,
    },
    {
      id: 5,
      title: 'Review & Submit',
      description: 'Final review before submission',
      component: 'review',
      isCompleted: false,
      isOptional: false,
    },
  ];

  // Auto-save functionality
  const saveToAsyncStorage = useCallback(async () => {
    try {
      const draftKey = `doubt_draft_${Date.now()}`;
      await AsyncStorage.setItem(draftKey, JSON.stringify(submission));
      if (Platform.OS === 'android') {
        ToastAndroid.show('Draft saved automatically', ToastAndroid.SHORT);
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }, [submission]);

  useEffect(() => {
    if (autoSaveInterval > 0) {
      autoSaveTimer.current = setInterval(() => {
        if (submission.title || submission.description) {
          saveToAsyncStorage();
        }
      }, autoSaveInterval);

      return () => {
        if (autoSaveTimer.current) {
          clearInterval(autoSaveTimer.current);
        }
      };
    }
  }, [submission, autoSaveInterval, saveToAsyncStorage]);

  // Form validation
  const validateSubmission = useCallback((): string[] => {
    const errors: string[] = [];
    
    if (!submission.title?.trim()) {
      errors.push('Title is required');
    }
    if (!submission.description?.trim()) {
      errors.push('Description is required');
    }
    if (!submission.category?.subject) {
      errors.push('Subject selection is required');
    }
    if (!submission.category?.chapter) {
      errors.push('Chapter selection is required');
    }
    if (!submission.category?.topic) {
      errors.push('Topic selection is required');
    }
    
    return errors;
  }, [submission]);

  // Update submission data
  const updateSubmission = useCallback((updates: Partial<DoubtSubmission>) => {
    setSubmission(prev => ({
      ...prev,
      ...updates,
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  // Handle media attachments
  const handleMediaUpload = useCallback((type: string, files: any[]) => {
    const attachmentKey = type as keyof typeof submission.attachments;
    if (submission.attachments && attachmentKey in submission.attachments) {
      updateSubmission({
        attachments: {
          ...submission.attachments,
          [attachmentKey]: [...(submission.attachments[attachmentKey] as any[]), ...files],
        },
      });
    }
  }, [submission.attachments, updateSubmission]);

  // Handle drawing save
  const handleDrawingSave = useCallback((drawingData: string) => {
    handleMediaUpload('drawings', [drawingData]);
    setActiveEditor(null);
  }, [handleMediaUpload]);

  // Handle math equation save
  const handleMathSave = useCallback((equation: string) => {
    handleMediaUpload('mathEquations', [equation]);
    setActiveEditor(null);
  }, [handleMediaUpload]);

  // Handle code snippet save
  const handleCodeSave = useCallback((language: string, code: string) => {
    handleMediaUpload('codeSnippets', [{ language, code }]);
    setActiveEditor(null);
  }, [handleMediaUpload]);

  // Handle category selection
  const handleCategoryChange = useCallback((category: any) => {
    updateSubmission({ category });
  }, [updateSubmission]);

  // Handle tag updates
  const handleTagsChange = useCallback((tags: string[]) => {
    updateSubmission({ tags });
  }, [updateSubmission]);

  // Handle similar questions check
  const checkSimilarQuestions = useCallback(async () => {
    if (!submission.title || !submission.description) return;
    
    setShowSimilarModal(true);
    // Simulate similar question analysis
    setTimeout(() => {
      setSimilarQuestions([
        { id: '1', title: 'Similar question found', similarity: 85 },
        { id: '2', title: 'Related topic question', similarity: 72 },
      ]);
    }, 1500);
  }, [submission.title, submission.description]);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    const errors = validateSubmission();
    setValidationErrors(errors);

    if (errors.length > 0) {
      Alert.alert(
        'Validation Error',
        `Please fix the following issues:\n\n${errors.join('\n')}`,
        [{ text: 'OK' }]
      );
      return;
    }

    setIsSubmitting(true);
    
    try {
      const completedSubmission: DoubtSubmission = {
        id: `doubt_${Date.now()}`,
        title: submission.title!,
        description: submission.description!,
        category: submission.category!,
        tags: submission.tags || [],
        attachments: submission.attachments!,
        priority: submission.priority || 'Medium',
        isAnonymous: submission.isAnonymous || false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'Submitted',
        metadata: {
          deviceInfo: Platform.OS + ' ' + Platform.Version,
          appVersion: '1.0.0',
          submissionSource: 'mobile',
          estimatedTime: Math.floor((Date.now() - startTime.current) / 1000),
        },
      };

      await onSubmit(completedSubmission);
      
      // Clear auto-save timer
      if (autoSaveTimer.current) {
        clearInterval(autoSaveTimer.current);
      }
      
      Alert.alert(
        'success',
        'Your doubt has been submitted successfully!',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert(
        'Submission Error',
        'Failed to submit your doubt. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [submission, validateSubmission, onSubmit]);

  // Handle draft save
  const handleSaveDraft = useCallback(async () => {
    setIsSavingDraft(true);
    
    try {
      await onSaveDraft({
        ...submission,
        updatedAt: new Date().toISOString(),
        status: 'Draft',
      });
      
      if (Platform.OS === 'android') {
        ToastAndroid.show('Draft saved successfully', ToastAndroid.SHORT);
      }
    } catch (error) {
      Alert.alert('error', 'Failed to save draft');
    } finally {
      setIsSavingDraft(false);
    }
  }, [submission, onSaveDraft]);

  // Calculate overall progress
  const completedSteps = submissionSteps.filter(step => step.isCompleted).length;
  const totalRequiredSteps = submissionSteps.filter(step => !step.isOptional).length;
  const progress = completedSteps / submissionSteps.length;

  // Render step indicator
  const renderStepIndicator = () => (
    <Surface style={{
      padding: 16,
      margin: 16,
      borderRadius: 12,
      backgroundColor: theme.SurfaceVariant,
    }}>
      <Text style={{
        fontSize: 16,
        fontWeight: '600',
        color: theme.OnSurfaceVariant,
        marginBottom: 12,
      }}>
        Submission Progress
      </Text>
      
      <ProgressBar 
        progress={progress} 
        color={theme.primary}
        style={{ marginBottom: 16, height: 6, borderRadius: 3 }}
      />
      
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {submissionSteps.map((step) => (
          <Chip
            key={step.id}
            mode={currentStep === step.id ? 'flat' : 'outlined'}
            selected={step.isCompleted}
            onPress={() => setCurrentStep(step.id)}
            icon={step.isCompleted ? 'check' : undefined}
            style={{
              backgroundColor: step.isCompleted 
                ? theme.primaryContainer 
                : currentStep === step.id 
                  ? theme.secondaryContainer 
                  : 'transparent',
            }}
          >
            {step.title}
          </Chip>
        ))}
      </View>
    </Surface>
  );

  // Render basic information step
  const renderBasicStep = () => (
    <Card style={{ margin: 16 }}>
      <Card.Content>
        <Text style={{
          fontSize: 18,
          fontWeight: '600',
          color: theme.OnSurface,
          marginBottom: 16,
        }}>
          Basic Information
        </Text>
        
        <TextInput
          // mode="outlined" - removed (not supported)
          label="Doubt Title *"
          value={submission.title}
          onChangeText={(text) => updateSubmission({ title: text })}
          style={{ marginBottom: 16 }}
          maxLength={100}
          placeholder="Briefly describe your doubt..."
        />
        
        <TextInput
          // mode="outlined" - removed (not supported)
          label="Detailed Description *"
          value={submission.description}
          onChangeText={(text) => updateSubmission({ description: text })}
          multiline
          numberOfLines={4}
          style={{ marginBottom: 16 }}
          maxLength={1000}
          placeholder="Provide detailed context about your doubt..."
        />
        
        <Text style={{
          fontSize: 14,
          color: theme.OnSurfaceVariant,
          marginBottom: 8,
        }}>
          Priority Level
        </Text>
        
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {['Low', 'Medium', 'High', 'Urgent'].map((priority) => (
            <Chip
              key={priority}
              mode={submission.priority === priority ? 'flat' : 'outlined'}
              selected={submission.priority === priority}
              onPress={() => updateSubmission({ priority: priority as any })}
              style={{
                backgroundColor: submission.priority === priority 
                  ? theme.primaryContainer 
                  : 'transparent',
              }}
            >
              {priority}
            </Chip>
          ))}
        </View>
      </Card.Content>
    </Card>
  );

  // Render category selection step
  const renderCategoryStep = () => (
    <Card style={{ margin: 16 }}>
      <Card.Content>
        <CategorySelector
          onSelectionChange={handleCategoryChange}
          initialSelection={submission.category}
        />
      </Card.Content>
    </Card>
  );

  // Render content creation step
  const renderContentStep = () => (
    <Card style={{ margin: 16 }}>
      <Card.Content>
        <Text style={{
          fontSize: 18,
          fontWeight: '600',
          color: theme.OnSurface,
          marginBottom: 16,
        }}>
          Enhance Your Doubt
        </Text>
        
        <Text style={{
          fontSize: 14,
          color: theme.OnSurfaceVariant,
          marginBottom: 16,
        }}>
          Add mathematical equations, drawings, code, or media files to better explain your doubt
        </Text>
        
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          <Button
            // mode="outlined" - removed (not supported)
            onPress={() => setActiveEditor('math')}
            icon="function-variant"
            style={{ flex: 1, minWidth: 120 }}
          >
            Math Editor
          </Button>
          
          <Button
            // mode="outlined" - removed (not supported)
            onPress={() => setActiveEditor('drawing')}
            icon="draw"
            style={{ flex: 1, minWidth: 120 }}
          >
            Drawing
          </Button>
          
          <Button
            // mode="outlined" - removed (not supported)
            onPress={() => setActiveEditor('code')}
            icon="code-tags"
            style={{ flex: 1, minWidth: 120 }}
          >
            Code Editor
          </Button>
          
          <Button
            // mode="outlined" - removed (not supported)
            onPress={() => setActiveEditor('media')}
            icon="attachment"
            style={{ flex: 1, minWidth: 120 }}
          >
            Media Upload
          </Button>
        </View>
        
        {/* Display current attachments summary */}
        {submission.attachments && (
          <View style={{ gap: 8 }}>
            {submission.attachments.mathEquations?.length > 0 && (
              <Chip icon="function-variant">
                {submission.attachments.mathEquations.length} Math Equation{submission.attachments.mathEquations.length > 1 ? 's' : ''}
              </Chip>
            )}
            {submission.attachments.drawings?.length > 0 && (
              <Chip icon="draw">
                {submission.attachments.drawings.length} Drawing{submission.attachments.drawings.length > 1 ? 's' : ''}
              </Chip>
            )}
            {submission.attachments.codeSnippets?.length > 0 && (
              <Chip icon="code-tags">
                {submission.attachments.codeSnippets.length} Code Snippet{submission.attachments.codeSnippets.length > 1 ? 's' : ''}
              </Chip>
            )}
            {(submission.attachments.images?.length || 0) + (submission.attachments.videos?.length || 0) + (submission.attachments.documents?.length || 0) > 0 && (
              <Chip icon="attachment">
                {(submission.attachments.images?.length || 0) + (submission.attachments.videos?.length || 0) + (submission.attachments.documents?.length || 0)} Media File{((submission.attachments.images?.length || 0) + (submission.attachments.videos?.length || 0) + (submission.attachments.documents?.length || 0)) > 1 ? 's' : ''}
              </Chip>
            )}
          </View>
        )}
      </Card.Content>
    </Card>
  );

  // Render tagging and similar questions step
  const renderTaggingStep = () => (
    <Card style={{ margin: 16 }}>
      <Card.Content>
        <AutoTagger
          questionText={`${submission.title}\n\n${submission.description}`}
          onTagsChange={handleTagsChange}
          initialTags={submission.tags}
          subjectContext={submission.category?.subject}
        />
        
        <Divider style={{ marginVertical: 16 }} />
        
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: theme.OnSurface,
          }}>
            Check Similar Questions
          </Text>
          
          <Button
            // mode="outlined" - removed (not supported)
            onPress={checkSimilarQuestions}
            icon="magnify"
            disabled={!submission.title || !submission.description}
          >
            Find Similar
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  // Render review step
  const renderReviewStep = () => (
    <Card style={{ margin: 16 }}>
      <Card.Content>
        <Text style={{
          fontSize: 18,
          fontWeight: '600',
          color: theme.OnSurface,
          marginBottom: 16,
        }}>
          Review Your Submission
        </Text>
        
        <View style={{ gap: 12 }}>
          <View>
            <Text style={{ fontWeight: '600', color: theme.OnSurface }}>Title:</Text>
            <Text style={{ color: theme.OnSurfaceVariant }}>{submission.title}</Text>
          </View>
          
          <View>
            <Text style={{ fontWeight: '600', color: theme.OnSurface }}>Category:</Text>
            <Text style={{ color: theme.OnSurfaceVariant }}>
              {submission.category?.subject} → {submission.category?.chapter} → {submission.category?.topic}
            </Text>
          </View>
          
          <View>
            <Text style={{ fontWeight: '600', color: theme.OnSurface }}>Priority:</Text>
            <Text style={{ color: theme.OnSurfaceVariant }}>{submission.priority}</Text>
          </View>
          
          {submission.tags && submission.tags.length > 0 && (
            <View>
              <Text style={{ fontWeight: '600', color: theme.OnSurface, marginBottom: 4 }}>Tags:</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                {submission.tags.map((tag, index) => (
                  <Chip key={index} compact>{tag}</Chip>
                ))}
              </View>
            </View>
          )}
        </View>
        
        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={isSubmitting || validationErrors.length > 0}
          style={{ marginTop: 20 }}
        >
          Submit Doubt
        </Button>
      </Card.Content>
    </Card>
  );

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        ref={scrollViewRef}
        style={{ flex: 1, backgroundColor: theme.background }}
        showsVerticalScrollIndicator={false}
      >
        {renderStepIndicator()}
        
        {currentStep === 1 && renderBasicStep()}
        {currentStep === 2 && renderCategoryStep()}
        {currentStep === 3 && renderContentStep()}
        {currentStep === 4 && renderTaggingStep()}
        {currentStep === 5 && renderReviewStep()}
      </ScrollView>
      
      {/* Navigation FABs */}
      <View style={{
        position: 'absolute',
        bottom: 16,
        right: 16,
        flexDirection: 'column',
        gap: 12,
      }}>
        {currentStep > 1 && (
          <FAB
            icon="chevron-left"
            size="small"
            onPress={() => setCurrentStep(Math.max(1, currentStep - 1))}
          />
        )}
        
        {currentStep < 5 && (
          <FAB
            icon="chevron-right"
            onPress={() => setCurrentStep(Math.min(5, currentStep + 1))}
          />
        )}
        
        <FAB
          icon="content-save"
          onPress={handleSaveDraft}
          loading={isSavingDraft}
          style={{ backgroundColor: theme.secondary }}
        />
      </View>
      
      {/* Editor Modals */}
      <Portal>
        <Modal
          visible={activeEditor === 'math'}
          onDismiss={() => setActiveEditor(null)}
          contentContainerStyle={{
            backgroundColor: theme.Surface,
            margin: 20,
            borderRadius: 12,
            maxHeight: height * 0.8,
          }}
        >
          <MathEditor onSave={handleMathSave} onCancel={() => setActiveEditor(null)} />
        </Modal>
        
        <Modal
          visible={activeEditor === 'drawing'}
          onDismiss={() => setActiveEditor(null)}
          contentContainerStyle={{
            backgroundColor: theme.Surface,
            margin: 20,
            borderRadius: 12,
            maxHeight: height * 0.8,
          }}
        >
          <DrawingCanvas onSave={handleDrawingSave} onCancel={() => setActiveEditor(null)} />
        </Modal>
        
        <Modal
          visible={activeEditor === 'code'}
          onDismiss={() => setActiveEditor(null)}
          contentContainerStyle={{
            backgroundColor: theme.Surface,
            margin: 20,
            borderRadius: 12,
            maxHeight: height * 0.8,
          }}
        >
          <CodeEditor onSave={handleCodeSave} onCancel={() => setActiveEditor(null)} />
        </Modal>
        
        <Modal
          visible={activeEditor === 'media'}
          onDismiss={() => setActiveEditor(null)}
          contentContainerStyle={{
            backgroundColor: theme.Surface,
            margin: 20,
            borderRadius: 12,
            maxHeight: height * 0.8,
          }}
        >
          <MediaUploader 
            onUpload={(files) => {
              handleMediaUpload('images', files.filter(f => f.type.startsWith('image')));
              handleMediaUpload('videos', files.filter(f => f.type.startsWith('video')));
              handleMediaUpload('documents', files.filter(f => f.type.startsWith('application')));
              setActiveEditor(null);
            }} 
            onCancel={() => setActiveEditor(null)} 
          />
        </Modal>
        
        <Modal
          visible={showSimilarModal}
          onDismiss={() => setShowSimilarModal(false)}
          contentContainerStyle={{
            backgroundColor: theme.Surface,
            margin: 20,
            borderRadius: 12,
            maxHeight: height * 0.7,
          }}
        >
          <SimilarQuestions 
            questionText={`${submission.title}\n\n${submission.description}`}
            onClose={() => setShowSimilarModal(false)}
          />
        </Modal>
      </Portal>
    </KeyboardAvoidingView>
  );
};

export default DoubtSubmissionForm;