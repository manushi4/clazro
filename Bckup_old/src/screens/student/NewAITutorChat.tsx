/**
 * NewAITutorChat - EXACT match to HTML reference
 * Purpose: AI tutor chat interface with comprehensive UI
 * Design: Material Design top bar, styled message bubbles, code blocks, quick actions, enhanced input
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { T } from '../../ui';
import { trackAction, trackScreenView } from '../../utils/navigationAnalytics';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabaseClient';

type Props = NativeStackScreenProps<any, 'NewAITutorChat'>;

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  hasCodeBlock?: boolean;
  codeContent?: string;
}

const QUICK_ACTIONS = [
  { id: '1', label: 'Explain this concept', icon: '💡' },
  { id: '2', label: 'Solve this problem', icon: '✏️' },
  { id: '3', label: 'Give me examples', icon: '📝' },
];

export default function NewAITutorChat({ navigation }: Props) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const flatListRef = useRef<FlatList>(null);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Fetch chat messages from Supabase
  const { data: messages = [] } = useQuery({
    queryKey: ['ai-chat-messages', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('ai_chat_messages')
        .select('*')
        .eq('student_id', user.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        return [];
      }

      return (data || []).map(m => ({
        id: m.id,
        text: m.message_text,
        isUser: m.is_user_message,
        timestamp: new Date(m.created_at),
        hasCodeBlock: m.has_code_block,
        codeContent: m.code_content || undefined,
      })) as Message[];
    },
    enabled: !!user?.id,
  });

  // Mutation for saving messages
  const saveMessageMutation = useMutation({
    mutationFn: async (message: { text: string; isUser: boolean; hasCodeBlock?: boolean; codeContent?: string }) => {
      if (!user?.id) throw new Error('No user ID');

      const { data, error } = await supabase
        .from('ai_chat_messages')
        .insert({
          student_id: user.id,
          message_text: message.text,
          is_user_message: message.isUser,
          has_code_block: message.hasCodeBlock || false,
          code_content: message.codeContent || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-chat-messages', user?.id] });
    },
  });

  // Track screen view
  useEffect(() => {
    trackScreenView('NewAITutorChat');
  }, []);

  // Handle send message
  const handleSend = useCallback(async () => {
    if (!inputText.trim() || isSending || !user?.id) return;

    const messageText = inputText.trim();
    setInputText('');
    setIsSending(true);

    trackAction('send_ai_message', 'NewAITutorChat', {
      messageLength: messageText.length,
    });

    try {
      // Save user message to database
      await saveMessageMutation.mutateAsync({
        text: messageText,
        isUser: true,
      });

      // Scroll to bottom after sending
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

      // Call AI API - REPLACE THIS WITH YOUR AI SERVICE
      // Options: OpenAI, Anthropic Claude, Supabase Edge Function, etc.
      const aiResponse = await callAIAPI(messageText);

      // Save AI response to database
      await saveMessageMutation.mutateAsync({
        text: aiResponse.text,
        isUser: false,
        hasCodeBlock: aiResponse.hasCodeBlock,
        codeContent: aiResponse.codeContent,
      });

      // Scroll to bottom after AI response
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  }, [inputText, isSending, user?.id, saveMessageMutation]);

  // AI API Integration - IMPLEMENT YOUR AI SERVICE HERE
  const callAIAPI = async (userMessage: string): Promise<{ text: string; hasCodeBlock?: boolean; codeContent?: string }> => {
    // TODO: Replace this with your actual AI API integration
    // Examples:
    // 1. OpenAI: const response = await openai.chat.completions.create({...})
    // 2. Anthropic: const response = await anthropic.messages.create({...})
    // 3. Supabase Edge Function: const response = await supabase.functions.invoke('ai-chat', {body: {message}})

    // Smart mock response system until real AI is integrated
    return new Promise((resolve) => {
      setTimeout(() => {
        const lower = userMessage.toLowerCase();
        let responseText = '';
        let hasCode = false;
        let code = '';

        // Physics responses
        if (lower.includes('physics') || lower.includes('force') || lower.includes('motion') || lower.includes('newton') || lower.includes('velocity') || lower.includes('acceleration')) {
          responseText = `Great physics question! 📚\n\nKey concepts to remember:\n\n**Newton's Laws:**\n1️⃣ Object at rest stays at rest (inertia)\n2️⃣ F = ma (force = mass × acceleration)\n3️⃣ Action-reaction pairs\n\n**Motion Equations:**\n• v = u + at\n• s = ut + ½at²\n• v² = u² + 2as\n\nWhere: v=final velocity, u=initial velocity, a=acceleration, t=time, s=displacement\n\nTip: Always list what you know and what you need to find! 🎯\n\n💡 Full AI tutor launching soon for step-by-step solutions!`;
        }
        // Math responses
        else if (lower.includes('math') || lower.includes('equation') || lower.includes('solve') || lower.includes('algebra') || lower.includes('calculus') || lower.includes('integrate') || lower.includes('derivative')) {
          responseText = `Let me help with that math problem! 🔢\n\n**Problem-Solving Steps:**\n\n1️⃣ Identify what's given and what's unknown\n2️⃣ Choose the right formula/method\n3️⃣ Substitute values carefully\n4️⃣ Solve step by step\n5️⃣ Verify your answer\n\n**Common Formulas:**\n• Quadratic: x = [-b ± √(b²-4ac)] / 2a\n• Area of circle: πr²\n• Derivative: d/dx(xⁿ) = nxⁿ⁻¹\n\nExample: Solve 2x + 5 = 15\n→ 2x = 15 - 5\n→ 2x = 10\n→ x = 5 ✓\n\n💡 Full AI math solver launching soon!`;
        }
        // Chemistry responses
        else if (lower.includes('chemistry') || lower.includes('reaction') || lower.includes('element') || lower.includes('atom') || lower.includes('molecule') || lower.includes('periodic')) {
          responseText = `Chemistry question detected! ⚗️\n\n**Key Concepts:**\n\n**Periodic Table:**\n• Groups (vertical) = similar properties\n• Periods (horizontal) = same electron shells\n• Metals on left, non-metals on right\n\n**Balancing Equations:**\n1. Count atoms on each side\n2. Add coefficients (never change subscripts!)\n3. Balance one element at a time\n4. Check all atoms balance\n\n**Mole Concept:**\n• 1 mole = 6.022 × 10²³ particles (Avogadro's number)\n• Moles = Mass / Molar mass\n\nTip: Write what you know, then work backwards! 🧪\n\n💡 Full AI chemistry tutor launching soon!`;
        }
        // Biology responses
        else if (lower.includes('biology') || lower.includes('cell') || lower.includes('photosynthesis') || lower.includes('respiration') || lower.includes('dna') || lower.includes('evolution')) {
          responseText = `Biology question! 🧬\n\n**Cell Structure:**\n• Nucleus = control center (DNA)\n• Mitochondria = powerhouse (ATP)\n• Chloroplast = photosynthesis (plants)\n• Cell membrane = selective barrier\n\n**Photosynthesis:**\n6CO₂ + 6H₂O + Light → C₆H₁₂O₆ + 6O₂\n(Plants make glucose using sunlight)\n\n**Cell Respiration:**\nC₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + ATP\n(Opposite of photosynthesis!)\n\nTip: Diagrams help! Draw and label structures. 🔬\n\n💡 Full AI biology tutor launching soon!`;
        }
        // Code/programming responses
        else if (lower.includes('code') || lower.includes('program') || lower.includes('python') || lower.includes('java') || lower.includes('javascript') || lower.includes('function')) {
          responseText = `Programming question! 💻\n\nHere's a simple example:\n\nCheck the code block below for a basic solution pattern. Remember:\n\n• Break problems into smaller steps\n• Test with simple inputs first\n• Use meaningful variable names\n• Add comments to explain logic\n\nCommon debugging tips:\n✓ Check syntax (parentheses, semicolons)\n✓ Verify variable names match\n✓ Test edge cases (0, negative, empty)\n✓ Print intermediate values\n\n💡 Full AI coding assistant launching soon!`;
          hasCode = true;
          code = `# Example Python function\ndef solve_problem(input_value):\n    # Step 1: Process input\n    result = input_value * 2\n    \n    # Step 2: Return result\n    return result\n\n# Test it\nprint(solve_problem(5))  # Output: 10`;
        }
        // General/default response
        else {
          responseText = `Thanks for your question! 📖\n\nI'm here to help with:\n\n📚 **Subjects:**\n• Physics (forces, motion, energy)\n• Mathematics (algebra, calculus, geometry)\n• Chemistry (reactions, periodic table)\n• Biology (cells, photosynthesis, genetics)\n• Programming (Python, Java, algorithms)\n\n💡 **How to ask:**\n• "Explain Newton's second law"\n• "How to solve quadratic equations?"\n• "What is photosynthesis?"\n• "Help with this Python code"\n\nTry asking about a specific topic!\n\n🚀 Full AI capabilities launching soon with:\n✓ Step-by-step solutions\n✓ Practice problems\n✓ Visual explanations\n✓ Instant doubt solving`;
        }

        resolve({
          text: responseText,
          hasCodeBlock: hasCode,
          codeContent: hasCode ? code : undefined,
        });
      }, 1200);
    });
  };

  // Handle quick action press
  const handleQuickAction = useCallback((action: typeof QUICK_ACTIONS[0]) => {
    trackAction('quick_action', 'NewAITutorChat', { action: action.label });
    setInputText(action.label);
  }, []);

  // Render message
  const renderMessage = ({ item }: { item: Message }) => (
    <View style={styles.messageWrapper}>
      <View
        style={[
          styles.messageContainer,
          item.isUser ? styles.userMessageContainer : styles.aiMessageContainer,
        ]}
      >
        {/* AI Avatar */}
        {!item.isUser && (
          <View style={styles.aiAvatar}>
            <T style={styles.aiAvatarText}>🤖</T>
          </View>
        )}

        {/* Message Bubble */}
        <View
          style={[
            styles.messageBubble,
            item.isUser ? styles.userBubble : styles.aiBubble,
          ]}
        >
          <T variant="body" style={item.isUser ? styles.userText : styles.aiText}>
            {item.text}
          </T>

          {/* Code Block */}
          {item.hasCodeBlock && item.codeContent && (
            <View style={styles.codeBlock}>
              <T style={styles.codeText}>{item.codeContent}</T>
            </View>
          )}
        </View>
      </View>

      {/* Timestamp */}
      <T
        variant="caption"
        style={item.isUser ? {...styles.timestamp, ...styles.timestampUser} : {...styles.timestamp, ...styles.timestampAI}}
      >
        {item.timestamp.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })}
      </T>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top App Bar - Material Design 56px */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => {
            trackAction('back_button', 'NewAITutorChat');
            navigation.goBack();
          }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <T variant="h2" style={styles.icon}>←</T>
        </TouchableOpacity>

        {/* AI Status Section */}
        <View style={styles.aiStatusContainer}>
          <View style={styles.aiAvatarHeader}>
            <T style={styles.aiAvatarHeaderText}>🤖</T>
            <View style={styles.onlineStatusDot} />
          </View>
          <View>
            <T variant="body" weight="bold" style={styles.topBarTitle}>
              AI Tutor
            </T>
            <T variant="caption" style={styles.onlineStatus}>
              Online
            </T>
          </View>
        </View>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => trackAction('more_options', 'NewAITutorChat')}
          accessibilityRole="button"
          accessibilityLabel="More options"
        >
          <T variant="h2" style={styles.icon}>⋮</T>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />

        {/* Quick Action Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.quickActionsContainer}
          contentContainerStyle={styles.quickActionsContent}
        >
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.quickActionChip}
              onPress={() => handleQuickAction(action)}
              accessibilityRole="button"
              accessibilityLabel={action.label}
            >
              <T variant="caption" style={styles.quickActionIcon}>
                {action.icon}
              </T>
              <T variant="caption" style={styles.quickActionText}>
                {action.label}
              </T>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TouchableOpacity
              style={styles.inputIconButton}
              onPress={() => trackAction('attach_photo', 'NewAITutorChat')}
              accessibilityRole="button"
              accessibilityLabel="Attach photo"
            >
              <T style={styles.inputIcon}>📷</T>
            </TouchableOpacity>

            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type your message..."
              placeholderTextColor="#9CA3AF"
              multiline
              maxLength={500}
              editable={!isSending}
              accessibilityLabel="Message input"
            />

            <TouchableOpacity
              style={styles.inputIconButton}
              onPress={() => trackAction('voice_input', 'NewAITutorChat')}
              accessibilityRole="button"
              accessibilityLabel="Voice input"
            >
              <T style={styles.inputIcon}>🎤</T>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || isSending) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || isSending}
            accessibilityRole="button"
            accessibilityLabel="Send message"
          >
            <T style={styles.sendButtonText}>
              {isSending ? '⏳' : '▶'}
            </T>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  // Top App Bar - Material Design 56px
  topBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  icon: {
    fontSize: 24,
    color: '#333333',
  },
  aiStatusContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',

    paddingLeft: 8,
  },
  aiAvatarHeader: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ECEFF1',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  aiAvatarHeaderText: {
    fontSize: 24,
  },
  onlineStatusDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  topBarTitle: {
    color: '#111827',
    fontSize: 16,
  },
  onlineStatus: {
    color: '#10B981',
    fontSize: 12,
    marginTop: -2,
  },
  container: {
    flex: 1,
  },
  messagesList: {
    padding: 16,

  },
  messageWrapper: {
    marginBottom: 4,
  },
  messageContainer: {
    flexDirection: 'row',

    alignItems: 'flex-end',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  aiMessageContainer: {
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ECEFF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiAvatarText: {
    fontSize: 18,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,

  },
  userBubble: {
    backgroundColor: '#4A90E2',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: '#ECEFF1',
    borderBottomLeftRadius: 4,
  },
  userText: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 20,
  },
  aiText: {
    color: '#111827',
    fontSize: 15,
    lineHeight: 20,
  },
  codeBlock: {
    backgroundColor: '#374151',
    padding: 12,
    borderRadius: 8,
    marginTop: 4,
  },
  codeText: {
    color: '#F9FAFB',
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
  },
  timestampAI: {
    marginLeft: 40,
  },
  timestampUser: {
    textAlign: 'right',
    marginRight: 4,
  },
  quickActionsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  quickActionsContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,

    alignItems: 'center',
  },
  quickActionChip: {
    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    borderRadius: 20,
    marginRight: 8,
  },
  quickActionIcon: {
    fontSize: 16,
  },
  quickActionText: {
    color: '#4A90E2',
    fontSize: 14,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',

    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'flex-end',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  inputIconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  inputIcon: {
    fontSize: 20,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    maxHeight: 100,
    paddingHorizontal: 8,
    paddingVertical: 8,
    fontFamily: 'System',
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4A90E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  sendButtonText: {
    fontSize: 20,
    color: '#FFFFFF',
  },
});
