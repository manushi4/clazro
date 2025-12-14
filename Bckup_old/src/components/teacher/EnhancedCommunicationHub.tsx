import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  FlatList,
  Animated,
} from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import {LightTheme} from '../../theme/colors';
import {Typography} from '../../theme/typography';
import {Spacing, BorderRadius} from '../../theme/spacing';
import {EnhancedTouchableButton} from '../core/EnhancedTouchableButton';

export interface MessageTemplate {
  id: string;
  title: string;
  content: string;
  category: 'announcement' | 'assignment' | 'reminder' | 'emergency';
  lastUsed?: string;
}

export interface TargetAudience {
  id: string;
  name: string;
  type: 'all' | 'class' | 'students' | 'parents' | 'teachers' | 'individual';
  count?: number;
  selected: boolean;
}

interface EnhancedCommunicationHubProps {
  onSendMessage: (message: string, targets: string[], priority: 'low' | 'medium' | 'high' | 'emergency') => Promise<void>;
  onSaveTemplate: (template: Omit<MessageTemplate, 'id'>) => void;
  templates?: MessageTemplate[];
  audiences?: TargetAudience[];
  messagesSent?: number;
  onMessagesSentChange?: (newCount: number) => void;
}

const EnhancedCommunicationHub: React.FC<EnhancedCommunicationHubProps> = ({
  onSendMessage,
  onSaveTemplate,
  templates = [],
  audiences = [],
  messagesSent = 0,
  onMessagesSentChange,
}) => {
  // Message composition state
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'emergency'>('medium');
  const [selectedTargets, setSelectedTargets] = useState<Set<string>>(new Set());
  const [isSending, setIsSending] = useState(false);

  // Template management state
  const [showTemplates, setShowTemplates] = useState(false);
  const [showTargeting, setShowTargeting] = useState(false);
  const [templateTitle, setTemplateTitle] = useState('');
  const [templateCategory, setTemplateCategory] = useState<MessageTemplate['category']>('announcement');

  // Animation values
  const composeScale = useRef(new Animated.Value(1)).current;
  const templateScale = useRef(new Animated.Value(0)).current;

  // Default audiences if none provided
  const defaultAudiences: TargetAudience[] = [
    {id: 'all', name: 'All Users', type: 'all', count: 150, selected: false},
    {id: 'class-10a', name: 'Class 10A', type: 'class', count: 30, selected: false},
    {id: 'class-10b', name: 'Class 10B', type: 'class', count: 28, selected: false},
    {id: 'all-students', name: 'All Students', type: 'students', count: 120, selected: false},
    {id: 'all-parents', name: 'All Parents', type: 'parents', count: 120, selected: false},
    {id: 'all-teachers', name: 'All Teachers', type: 'teachers', count: 15, selected: false},
  ];

  const activeAudiences = audiences.length > 0 ? audiences : defaultAudiences;

  // Default templates if none provided
  const defaultTemplates: MessageTemplate[] = [
    {
      id: 'template-1',
      title: 'Class Reminder',
      content: 'Reminder: Tomorrow\'s class will start at the usual time. Please be prepared with your notebooks and textbooks.',
      category: 'reminder',
    },
    {
      id: 'template-2', 
      title: 'Assignment Due',
      content: 'This is a reminder that your assignment is due by [DATE]. Please submit on time to avoid penalty.',
      category: 'assignment',
    },
    {
      id: 'template-3',
      title: 'Important Announcement',
      content: 'We have an important update regarding upcoming events. Please check your portal for detailed information.',
      category: 'announcement',
    },
  ];

  const activeTemplates = templates.length > 0 ? templates : defaultTemplates;

  // Handle message sending with error-free implementation
  const handleSendMessage = async () => {
    if (!message.trim()) {
      Alert.alert('error', 'Please enter a message');
      return;
    }

    if (selectedTargets.size === 0) {
      Alert.alert('error', 'Please select at least one target audience');
      return;
    }

    setIsSending(true);

    try {
      await onSendMessage(message, Array.from(selectedTargets), priority);
      
      // Update message count (fix for communication hub issues)
      if (onMessagesSentChange) {
        onMessagesSentChange(messagesSent + 1);
      }

      // Clear form after successful send
      setMessage('');
      setSelectedTargets(new Set());
      setPriority('medium');

      ReactNativeHapticFeedback.trigger('impactHeavy');
      Alert.alert('success', 'Message sent successfully!');
    } catch (error) {
      Alert.alert('error', 'Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  // Handle template application
  const handleApplyTemplate = (template: MessageTemplate) => {
    setMessage(template.content);
    setShowTemplates(false);
    ReactNativeHapticFeedback.trigger('impactMedium');

    // Animate template application
    Animated.spring(templateScale, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
  };

  // Handle template saving
  const handleSaveAsTemplate = () => {
    if (!message.trim() || !templateTitle.trim()) {
      Alert.alert('error', 'Please enter both message and template title');
      return;
    }

    const newTemplate: Omit<MessageTemplate, 'id'> = {
      title: templateTitle,
      content: message,
      category: templateCategory,
      lastUsed: new Date().toISOString(),
    };

    onSaveTemplate(newTemplate);
    setTemplateTitle('');
    ReactNativeHapticFeedback.trigger('impactHeavy');
    Alert.alert('success', 'Template saved successfully!');
  };

  // Handle target selection
  const handleTargetToggle = (targetId: string) => {
    const newTargets = new Set(selectedTargets);
    if (newTargets.has(targetId)) {
      newTargets.delete(targetId);
    } else {
      newTargets.add(targetId);
    }
    setSelectedTargets(newTargets);
    ReactNativeHapticFeedback.trigger('impactLight');
  };

  // Get priority color
  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'emergency': return '#F44336';
      case 'high': return '#FF9800';
      case 'medium': return '#2196F3';
      case 'low': return '#4CAF50';
      default: return '#2196F3';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with Statistics */}
      <View style={styles.header}>
        <Text style={styles.title}>Communication Hub</Text>
        <Text style={styles.subtitle}>Advanced messaging with targeting & templates</Text>
        
        {/* Messages Sent Badge */}
        {messagesSent > 0 && (
          <View style={styles.messagesBadge}>
            <Text style={styles.badgeText}>{messagesSent} sent</Text>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <EnhancedTouchableButton
          onPress={() => {
            setShowTemplates(!showTemplates);
            Animated.spring(templateScale, {
              toValue: showTemplates ? 0 : 1,
              useNativeDriver: true,
            }).start();
          }}
          title="Templates"
          subtitle={`${activeTemplates.length} available`}
          icon="📝"
          variant="secondary"
          size="small"
          hapticType="impactLight"
          style={styles.quickActionButton}
        />
        
        <EnhancedTouchableButton
          onPress={() => setShowTargeting(!showTargeting)}
          title="Targeting"
          subtitle={`${selectedTargets.size} selected`}
          icon="🎯"
          variant="secondary"
          size="small"
          hapticType="impactLight"
          style={styles.quickActionButton}
        />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Message Composition */}
        <Animated.View style={[styles.composeSection, {transform: [{scale: composeScale}]}]}>
          <Text style={styles.sectionTitle}>Compose Message</Text>
          
          <TextInput
            style={styles.messageInput}
            placeholder="Enter your message here..."
            multiline
            numberOfLines={4}
            value={message}
            onChangeText={setMessage}
            textAlignVertical="top"
          />

          {/* Priority Selection */}
          <Text style={styles.fieldLabel}>Priority Level</Text>
          <View style={styles.priorityContainer}>
            {['low', 'medium', 'high', 'emergency'].map((p) => (
              <TouchableOpacity
                key={p}
                style={[
                  styles.priorityChip,
                  {backgroundColor: priority === p ? getPriorityColor(p) : LightTheme.SurfaceVariant},
                ]}
                onPress={() => setPriority(p as any)}
              >
                <Text style={[
                  styles.priorityText,
                  {color: priority === p ? 'white' : LightTheme.OnSurfaceVariant},
                ]}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Template Save */}
          <View style={styles.templateSaveSection}>
            <Text style={styles.fieldLabel}>Save as Template</Text>
            <TextInput
              style={styles.templateTitleInput}
              placeholder="Template title (optional)"
              value={templateTitle}
              onChangeText={setTemplateTitle}
            />
            <TouchableOpacity
              style={styles.saveTemplateButton}
              onPress={handleSaveAsTemplate}
              disabled={!message.trim() || !templateTitle.trim()}
            >
              <Text style={styles.saveTemplateText}>💾 Save Template</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Target Audience Selection */}
        {showTargeting && (
          <View style={styles.targetingSection}>
            <Text style={styles.sectionTitle}>Select Target Audience</Text>
            <Text style={styles.sectionSubtitle}>
              Choose who should receive this message
            </Text>
            
            <View style={styles.audienceGrid}>
              {activeAudiences.map((audience) => (
                <TouchableOpacity
                  key={audience.id}
                  style={[
                    styles.audienceChip,
                    selectedTargets.has(audience.id) && styles.selectedAudienceChip,
                  ]}
                  onPress={() => handleTargetToggle(audience.id)}
                >
                  <Text style={[
                    styles.audienceName,
                    selectedTargets.has(audience.id) && styles.selectedAudienceText,
                  ]}>
                    {audience.name}
                  </Text>
                  {audience.count && (
                    <Text style={[
                      styles.audienceCount,
                      selectedTargets.has(audience.id) && styles.selectedAudienceText,
                    ]}>
                      {audience.count} users
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Templates Section */}
        {showTemplates && (
          <Animated.View style={[styles.templatesSection, {transform: [{scale: templateScale}], opacity: templateScale}]}>
            <Text style={styles.sectionTitle}>Message Templates</Text>
            <Text style={styles.sectionSubtitle}>
              Tap to apply a template to your message
            </Text>
            
            <FlatList
              data={activeTemplates}
              keyExtractor={(item) => item.id}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={styles.templateItem}
                  onPress={() => handleApplyTemplate(item)}
                >
                  <View style={styles.templateHeader}>
                    <Text style={styles.templateTitle}>{item.title}</Text>
                    <View style={[styles.categoryBadge, {backgroundColor: getPriorityColor(item.category)}]}>
                      <Text style={styles.categoryText}>{item.category}</Text>
                    </View>
                  </View>
                  <Text style={styles.templatePreview} numberOfLines={2}>
                    {item.content}
                  </Text>
                  {item.lastUsed && (
                    <Text style={styles.lastUsed}>
                      Last used: {new Date(item.lastUsed).toLocaleDateString()}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
              scrollEnabled={false}
            />
          </Animated.View>
        )}
      </ScrollView>

      {/* Send Button */}
      <View style={styles.sendSection}>
        <EnhancedTouchableButton
          onPress={handleSendMessage}
          title={isSending ? "Sending..." : "Send Message"}
          subtitle={`To ${selectedTargets.size} audience${selectedTargets.size !== 1 ? 's' : ''} • ${priority} priority`}
          icon="📤"
          variant="primary"
          size="large"
          disabled={isSending || !message.trim() || selectedTargets.size === 0}
          hapticType="impactHeavy"
          style={styles.sendButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LightTheme.Background,
  },
  header: {
    padding: Spacing.LG,
    backgroundColor: LightTheme.Surface,
    borderBottomWidth: 1,
    borderBottomColor: LightTheme.OutlineVariant,
    alignItems: 'center',
    position: 'relative',
  },
  title: {
    fontSize: Typography.headlineMedium.fontSize,
    fontWeight: Typography.headlineMedium.fontWeight as any,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  subtitle: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  messagesBadge: {
    position: 'absolute',
    top: Spacing.MD,
    right: Spacing.MD,
    backgroundColor: '#4CAF50',
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
  },
  badgeText: {
    color: 'white',
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    padding: Spacing.MD,
    gap: Spacing.SM,
  },
  quickActionButton: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: Spacing.LG,
  },
  composeSection: {
    backgroundColor: LightTheme.Surface,
    borderRadius: BorderRadius.MD,
    padding: Spacing.LG,
    marginBottom: Spacing.LG,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontWeight: Typography.titleMedium.fontWeight as any,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
  },
  sectionSubtitle: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.MD,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: LightTheme.Outline,
    borderRadius: BorderRadius.SM,
    padding: Spacing.MD,
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurface,
    minHeight: 100,
    marginBottom: Spacing.LG,
  },
  fieldLabel: {
    fontSize: Typography.bodyMedium.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: Spacing.SM,
    marginBottom: Spacing.LG,
  },
  priorityChip: {
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    borderRadius: BorderRadius.SM,
    flex: 1,
    alignItems: 'center',
  },
  priorityText: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '600',
  },
  templateSaveSection: {
    borderTopWidth: 1,
    borderTopColor: LightTheme.OutlineVariant,
    paddingTop: Spacing.MD,
  },
  templateTitleInput: {
    borderWidth: 1,
    borderColor: LightTheme.Outline,
    borderRadius: BorderRadius.SM,
    padding: Spacing.MD,
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
  },
  saveTemplateButton: {
    alignItems: 'center',
    paddingVertical: Spacing.SM,
  },
  saveTemplateText: {
    fontSize: Typography.bodyMedium.fontSize,
    color: LightTheme.Primary,
    fontWeight: '600',
  },
  targetingSection: {
    backgroundColor: LightTheme.Surface,
    borderRadius: BorderRadius.MD,
    padding: Spacing.LG,
    marginBottom: Spacing.LG,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  audienceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.SM,
  },
  audienceChip: {
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: BorderRadius.SM,
    padding: Spacing.MD,
    minWidth: '30%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedAudienceChip: {
    backgroundColor: LightTheme.Primary,
    borderColor: LightTheme.Primary,
  },
  audienceName: {
    fontSize: Typography.bodySmall.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.XS / 2,
  },
  selectedAudienceText: {
    color: LightTheme.OnPrimary,
  },
  audienceCount: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
  },
  templatesSection: {
    backgroundColor: LightTheme.Surface,
    borderRadius: BorderRadius.MD,
    padding: Spacing.LG,
    marginBottom: Spacing.LG,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  templateItem: {
    backgroundColor: LightTheme.SurfaceVariant,
    borderRadius: BorderRadius.SM,
    padding: Spacing.MD,
    marginBottom: Spacing.SM,
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.SM,
  },
  templateTitle: {
    fontSize: Typography.bodyLarge.fontSize,
    fontWeight: '600',
    color: LightTheme.OnSurface,
    flex: 1,
  },
  categoryBadge: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS / 2,
    borderRadius: BorderRadius.XS,
  },
  categoryText: {
    fontSize: Typography.bodySmall.fontSize,
    color: 'white',
    fontWeight: '600',
  },
  templatePreview: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.XS,
  },
  lastUsed: {
    fontSize: Typography.bodySmall.fontSize,
    color: LightTheme.OnSurfaceVariant,
    fontStyle: 'italic',
  },
  sendSection: {
    padding: Spacing.LG,
    borderTopWidth: 1,
    borderTopColor: LightTheme.OutlineVariant,
    backgroundColor: LightTheme.Surface,
  },
  sendButton: {
    width: '100%',
  },
});

export default EnhancedCommunicationHub;