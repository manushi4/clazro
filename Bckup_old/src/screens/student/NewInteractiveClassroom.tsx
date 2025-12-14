/**
 * NewInteractiveClassroom - Premium Minimal Design
 * Purpose: Interactive classroom with polls and quizzes
 * Used in: StudentNavigator (ClassesStack)
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useQuery, useMutation } from '@tanstack/react-query';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BaseScreen } from '../../shared/components/BaseScreen';
import { Card } from '../../ui';
import { Badge } from '../../ui';
import { Button } from '../../ui';
import { Chip } from '../../ui';
import { Row } from '../../ui';
import { T } from '../../ui';
import { trackScreenView, trackAction } from '../../utils/navigationAnalytics';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabaseClient';

type Props = NativeStackScreenProps<any, 'NewInteractiveClassroom'>;

interface Poll {
  id: string;
  question: string;
  options: string[];
  class_id: string;
  created_at: string;
}

interface Question {
  id: string;
  studentName: string;
  studentAvatar: string;
  question: string;
  timestamp: string;
  answered: boolean;
  answer?: string;
  likes: number;
}

interface WhiteboardSlide {
  id: string;
  imageUrl?: string; // Optional - using emoji placeholder instead of external URLs
  title: string;
  pageNumber: number;
  timestamp: string;
}

interface BreakoutRoom {
  id: string;
  name: string;
  topic: string;
  members: number;
  maxMembers: number;
  isJoined: boolean;
}

export default function NewInteractiveClassroom({ route, navigation }: Props) {
  const { user } = useAuth();
  const classId = route.params?.classId || '1';
  const pollId = route.params?.pollId;

  // State for tabs and features
  const [activeTab, setActiveTab] = useState<'poll' | 'qa' | 'whiteboard' | 'breakout'>('poll');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [questionInput, setQuestionInput] = useState('');
  const [handRaised, setHandRaised] = useState(false);

  // State for data (with mock data as fallback)
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: '1',
      studentName: 'Sarah J.',
      studentAvatar: '👩‍🎓',
      question: 'Can you explain the difference between TCP and UDP protocols?',
      timestamp: '5 min ago',
      answered: true,
      answer: 'TCP is connection-oriented and guarantees delivery, while UDP is connectionless and faster but less reliable.',
      likes: 12,
    },
    {
      id: '2',
      studentName: 'Mike C.',
      studentAvatar: '👨‍🎓',
      question: 'What are the main use cases for UDP?',
      timestamp: '2 min ago',
      answered: false,
      likes: 5,
    },
  ]);

  const [whiteboardSlides, setWhiteboardSlides] = useState<WhiteboardSlide[]>([
    {
      id: '1',
      title: 'Introduction to Computer Networks',
      pageNumber: 1,
      timestamp: '10:30 AM',
    },
    {
      id: '2',
      title: 'OSI Model Layers',
      pageNumber: 2,
      timestamp: '10:35 AM',
    },
    {
      id: '3',
      title: 'TCP vs UDP Comparison',
      pageNumber: 3,
      timestamp: '10:42 AM',
    },
  ]);

  const [breakoutRooms, setBreakoutRooms] = useState<BreakoutRoom[]>([
    { id: '1', name: 'Room 1', topic: 'TCP Protocol Discussion', members: 4, maxMembers: 5, isJoined: false },
    { id: '2', name: 'Room 2', topic: 'UDP Protocol Discussion', members: 3, maxMembers: 5, isJoined: false },
    { id: '3', name: 'Room 3', topic: 'Network Security', members: 5, maxMembers: 5, isJoined: false },
    { id: '4', name: 'Room 4', topic: 'Routing Algorithms', members: 2, maxMembers: 5, isJoined: false },
  ]);

  React.useEffect(() => {
    trackScreenView('NewInteractiveClassroom', { pollId });
  }, [pollId]);

  // Fetch poll details
  const { data: poll, isLoading, error, refetch } = useQuery({
    queryKey: ['poll-detail', pollId],
    queryFn: async () => {
      if (!pollId) throw new Error('No poll ID provided');

      const { data, error } = await supabase
        .from('class_polls')
        .select('*')
        .eq('id', pollId)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        question: data.question,
        options: data.options || [],
        class_id: data.class_id,
        created_at: data.created_at,
      } as Poll;
    },
    enabled: !!pollId,
  });

  // Submit poll response
  const submitResponse = useMutation({
    mutationFn: async (optionIndex: number) => {
      if (!pollId || !user?.id) throw new Error('Missing required data');

      const { error } = await supabase.from('poll_responses').insert({
        poll_id: pollId,
        student_id: user.id,
        option_index: optionIndex,
        created_at: new Date().toISOString(),
      });

      if (error) throw error;
    },
    onSuccess: () => {
      Alert.alert('Success', 'Your response has been recorded!');
      refetch();
    },
    onError: () => {
      Alert.alert('Error', 'Failed to submit response. Please try again.');
    },
  });

  const handleOptionPress = (index: number) => {
    setSelectedOption(index);
    trackAction('select_poll_option', 'NewInteractiveClassroom', { pollId, optionIndex: index });
    submitResponse.mutate(index);
  };

  // 5. Raise Hand Feature
  const handleRaiseHand = () => {
    const newHandRaised = !handRaised;
    setHandRaised(newHandRaised);
    trackAction('raise_hand', 'NewInteractiveClassroom', { classId, raised: newHandRaised });
    Alert.alert(
      newHandRaised ? 'Hand Raised' : 'Hand Lowered',
      newHandRaised ? 'Your hand is raised. The teacher will acknowledge you.' : 'Your hand has been lowered.'
    );
  };

  // 2. Q&A During Class
  const handleAskQuestion = () => {
    if (!questionInput.trim()) return;

    const newQuestion: Question = {
      id: Date.now().toString(),
      studentName: user?.name || 'You',
      studentAvatar: '👤',
      question: questionInput.trim(),
      timestamp: 'Just now',
      answered: false,
      likes: 0,
    };

    setQuestions(prev => [newQuestion, ...prev]);
    setQuestionInput('');
    trackAction('ask_question', 'NewInteractiveClassroom', { classId, questionLength: questionInput.length });
    Alert.alert('Question Asked', 'Your question has been submitted to the teacher.');
  };

  const handleLikeQuestion = (questionId: string) => {
    setQuestions(prev =>
      prev.map(q => (q.id === questionId ? { ...q, likes: q.likes + 1 } : q))
    );
    trackAction('like_question', 'NewInteractiveClassroom', { questionId });
  };

  // 4. Breakout Rooms
  const handleJoinRoom = (roomId: string) => {
    setBreakoutRooms(prev =>
      prev.map(room => {
        if (room.id === roomId && room.members < room.maxMembers) {
          const newIsJoined = !room.isJoined;
          return {
            ...room,
            isJoined: newIsJoined,
            members: newIsJoined ? room.members + 1 : room.members - 1,
          };
        }
        return room;
      })
    );
    trackAction('toggle_breakout_room', 'NewInteractiveClassroom', { roomId });
  };

  return (
    <BaseScreen scrollable={false} loading={isLoading}>
      <View style={styles.container}>
        {/* Tab Navigation */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
          <Row gap="xs" style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
            <Chip
              variant="filter"
              label="📊 Poll"
              selected={activeTab === 'poll'}
              onPress={() => setActiveTab('poll')}
            />
            <Chip
              variant="filter"
              label="💬 Q&A"
              selected={activeTab === 'qa'}
              onPress={() => setActiveTab('qa')}
            />
            <Chip
              variant="filter"
              label="📋 Whiteboard"
              selected={activeTab === 'whiteboard'}
              onPress={() => setActiveTab('whiteboard')}
            />
            <Chip
              variant="filter"
              label="👥 Breakout"
              selected={activeTab === 'breakout'}
              onPress={() => setActiveTab('breakout')}
            />
          </Row>
        </ScrollView>

        {/* Content Area */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 1. Live Poll Participation */}
          {activeTab === 'poll' && (
            <View style={styles.tabContent}>
              {poll ? (
                <Card style={styles.pollCard}>
                  <T variant="title" weight="semiBold">
                    📊 Live Poll
                  </T>
                  <T variant="body" style={styles.pollQuestion}>
                    {poll.question}
                  </T>
                  {poll.options.map((option, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.optionButton,
                        selectedOption === index && styles.optionButtonSelected,
                      ]}
                      onPress={() => handleOptionPress(index)}
                      disabled={submitResponse.isPending || selectedOption !== null}
                      accessibilityRole="button"
                      accessibilityLabel={`Option ${String.fromCharCode(65 + index)}: ${option}`}
                    >
                      <T
                        variant="body"
                        weight={selectedOption === index ? 'semiBold' : 'regular'}
                        style={selectedOption === index && styles.optionTextSelected}
                      >
                        {String.fromCharCode(65 + index)}. {option}
                      </T>
                    </TouchableOpacity>
                  ))}
                  {submitResponse.isPending && (
                    <T variant="caption" style={styles.submittingText}>
                      Submitting your response...
                    </T>
                  )}
                </Card>
              ) : (
                <Card style={styles.emptyCard}>
                  <T variant="body" style={styles.emptyText}>
                    No active poll at the moment. Stay tuned!
                  </T>
                </Card>
              )}
            </View>
          )}

          {/* 2. Q&A During Class */}
          {activeTab === 'qa' && (
            <View style={styles.tabContent}>
              <Card style={styles.qaCard}>
                <T variant="title" weight="semiBold" style={{ marginBottom: 12 }}>
                  💬 Ask a Question
                </T>
                <TextInput
                  style={styles.questionInput}
                  value={questionInput}
                  onChangeText={setQuestionInput}
                  placeholder="Type your question here..."
                  multiline
                  maxLength={500}
                  accessibilityLabel="Question input"
                />
                <Button
                  variant="primary"
                  onPress={handleAskQuestion}
                  disabled={!questionInput.trim()}
                >
                  Submit Question
                </Button>
              </Card>

              {questions.map((q) => (
                <Card key={q.id} style={styles.questionCard}>
                  <View style={styles.questionHeader}>
                    <View style={styles.studentInfo}>
                      <T variant="h3">{q.studentAvatar}</T>
                      <View style={{ marginLeft: 8 }}>
                        <T variant="body" weight="semiBold">
                          {q.studentName}
                        </T>
                        <T variant="caption" style={styles.timestamp}>
                          {q.timestamp}
                        </T>
                      </View>
                    </View>
                    {q.answered && <Badge variant="success" label="Answered" />}
                  </View>
                  <T variant="body" style={styles.questionText}>
                    {q.question}
                  </T>
                  {q.answer && (
                    <View style={styles.answerBox}>
                      <T variant="caption" weight="semiBold" style={styles.answerLabel}>
                        Teacher's Answer:
                      </T>
                      <T variant="body" style={styles.answerText}>
                        {q.answer}
                      </T>
                    </View>
                  )}
                  <Row gap="sm" style={{ marginTop: 8 }}>
                    <TouchableOpacity
                      style={styles.likeButton}
                      onPress={() => handleLikeQuestion(q.id)}
                      accessibilityRole="button"
                      accessibilityLabel="Like question"
                    >
                      <T variant="caption">👍 {q.likes}</T>
                    </TouchableOpacity>
                  </Row>
                </Card>
              ))}
            </View>
          )}

          {/* 3. Whiteboard Viewing */}
          {activeTab === 'whiteboard' && (
            <View style={styles.tabContent}>
              <Card style={styles.whiteboardHeader}>
                <T variant="title" weight="semiBold">
                  📋 Whiteboard Slides
                </T>
                <T variant="caption" style={styles.slideCount}>
                  {whiteboardSlides.length} slides available
                </T>
              </Card>

              {whiteboardSlides.map((slide) => (
                <Card key={slide.id} style={styles.slideCard}>
                  <View style={styles.slideHeader}>
                    <Badge variant="info" label={`Slide ${slide.pageNumber}`} />
                    <T variant="caption" style={styles.timestamp}>
                      {slide.timestamp}
                    </T>
                  </View>
                  <T variant="body" weight="semiBold" style={{ marginVertical: 8 }}>
                    {slide.title}
                  </T>
                  <View style={styles.slidePlaceholder}>
                    <T variant="caption" style={{ color: '#6B7280' }}>
                      📄 Slide Content
                    </T>
                  </View>
                </Card>
              ))}
            </View>
          )}

          {/* 4. Breakout Rooms */}
          {activeTab === 'breakout' && (
            <View style={styles.tabContent}>
              <Card style={styles.breakoutHeader}>
                <T variant="title" weight="semiBold">
                  👥 Breakout Rooms
                </T>
                <T variant="caption" style={styles.breakoutInfo}>
                  Join a room to collaborate with peers
                </T>
              </Card>

              {breakoutRooms.map((room) => (
                <Card key={room.id} style={styles.roomCard}>
                  <View style={styles.roomHeader}>
                    <View style={{ flex: 1 }}>
                      <T variant="body" weight="semiBold">
                        {room.name}
                      </T>
                      <T variant="caption" style={styles.roomTopic}>
                        {room.topic}
                      </T>
                      <T variant="caption" style={styles.roomMembers}>
                        👥 {room.members}/{room.maxMembers} members
                      </T>
                    </View>
                    <Button
                      variant={room.isJoined ? 'outline' : 'primary'}
                      onPress={() => handleJoinRoom(room.id)}
                      disabled={!room.isJoined && room.members >= room.maxMembers}
                    >
                      {room.isJoined ? 'Leave' : room.members >= room.maxMembers ? 'Full' : 'Join'}
                    </Button>
                  </View>
                </Card>
              ))}
            </View>
          )}
        </ScrollView>

        {/* 5. Floating Raise Hand Button */}
        <TouchableOpacity
          style={[styles.raiseHandButton, handRaised && styles.raiseHandButtonActive]}
          onPress={handleRaiseHand}
          accessibilityRole="button"
          accessibilityLabel={handRaised ? 'Lower hand' : 'Raise hand'}
        >
          <T variant="h2">{handRaised ? '✋' : '🙋'}</T>
        </TouchableOpacity>
      </View>
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabScroll: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,

  },
  // Poll Styles
  pollCard: {
    padding: 20,

  },
  emptyCard: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  pollQuestion: {
    color: '#4B5563',
    fontSize: 18,
  },
  optionButton: {
    padding: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  optionButtonSelected: {
    backgroundColor: '#DBEAFE',
    borderColor: '#3B82F6',
  },
  optionTextSelected: {
    color: '#1E40AF',
  },
  submittingText: {
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Q&A Styles
  qaCard: {
    padding: 16,

  },
  questionInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    fontFamily: 'System',
  },
  questionCard: {
    padding: 16,

  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timestamp: {
    color: '#9CA3AF',
  },
  questionText: {
    color: '#1F2937',
    lineHeight: 22,
  },
  answerBox: {
    backgroundColor: '#F0FDF4',
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
    padding: 12,
    borderRadius: 8,

  },
  answerLabel: {
    color: '#059669',
  },
  answerText: {
    color: '#1F2937',
  },
  likeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
  },
  // Whiteboard Styles
  whiteboardHeader: {
    padding: 16,

  },
  slideCount: {
    color: '#6B7280',
  },
  slideCard: {
    padding: 16,

  },
  slideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slidePlaceholder: {
    height: 200,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Breakout Room Styles
  breakoutHeader: {
    padding: 16,

  },
  breakoutInfo: {
    color: '#6B7280',
  },
  roomCard: {
    padding: 16,
  },
  roomHeader: {
    flexDirection: 'row',
    alignItems: 'center',

  },
  roomTopic: {
    color: '#6B7280',
    marginTop: 4,
  },
  roomMembers: {
    color: '#9CA3AF',
    marginTop: 4,
  },
  // Raise Hand Button (Floating)
  raiseHandButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  raiseHandButtonActive: {
    backgroundColor: '#10B981',
  },
});
