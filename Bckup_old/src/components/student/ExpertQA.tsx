import React, { useState, useEffect, useCallback, Fragment } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  Alert,
  RefreshControl,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export interface Expert {
  id: string;
  name: string;
  avatar: string;
  title: string;
  specializations: string[];
  rating: number;
  totalSessions: number;
  yearsOfExperience: number;
  isOnline: boolean;
  nextAvailable?: Date;
  hourlyRate?: number;
  languages: string[];
  bio: string;
  credentials: string[];
}

export interface ExpertSession {
  id: string;
  expertId: string;
  expertName: string;
  studentId: string;
  studentName: string;
  title: string;
  subject: string;
  topic: string;
  scheduledTime: Date;
  duration: number; // in minutes
  status: 'scheduled' | 'active' | 'completed' | 'cancelled' | 'pending_approval';
  sessionType: 'one-on-one' | 'group' | 'workshop';
  maxParticipants?: number;
  currentParticipants: number;
  questions: string[];
  materials?: {
    type: 'document' | 'video' | 'link';
    name: string;
    url: string;
  }[];
  notes?: string;
  rating?: number;
  feedback?: string;
  recordingAvailable?: boolean;
  cost?: number;
}

export interface SessionRequest {
  id: string;
  studentId: string;
  expertId: string;
  preferredTimes: Date[];
  subject: string;
  topic: string;
  questions: string[];
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  sessionType: 'one-on-one' | 'group';
  estimatedDuration: number;
  budget?: number;
  additionalNotes?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
}

interface ExpertQAProps {
  currentUserId: string;
  experts?: Expert[];
  mySessions?: ExpertSession[];
  onBookSession: (expertId: string, sessionDetails: any) => void;
  onJoinSession: (sessionId: string) => void;
  onCancelSession: (sessionId: string) => void;
  onRateSession: (sessionId: string, rating: number, feedback: string) => void;
}

const MOCK_EXPERTS: Expert[] = [
  {
    id: 'expert1',
    name: 'Dr. Sarah Chen',
    avatar: '👩‍🏫',
    title: 'Mathematics Professor',
    specializations: ['Calculus', 'Linear Algebra', 'Statistics', 'Advanced Mathematics'],
    rating: 4.9,
    totalSessions: 247,
    yearsOfExperience: 12,
    isOnline: true,
    hourlyRate: 50,
    languages: ['English', 'Chinese', 'Spanish'],
    bio: 'Passionate mathematics educator with over 12 years of experience. Specializes in making complex mathematical concepts accessible to students at all levels.',
    credentials: ['Ph.D. in Mathematics - MIT', 'Certified Online Educator', 'Published Research Author'],
  },
  {
    id: 'expert2',
    name: 'Prof. Michael Johnson',
    avatar: '👨‍🔬',
    title: 'Physics Researcher',
    specializations: ['Quantum Physics', 'Thermodynamics', 'Mechanics', 'Electromagnetism'],
    rating: 4.8,
    totalSessions: 189,
    yearsOfExperience: 15,
    isOnline: false,
    nextAvailable: new Date('2024-01-18T14:00:00'),
    hourlyRate: 60,
    languages: ['English', 'French'],
    bio: 'Research physicist and educator specializing in quantum mechanics and modern physics. Excellent at explaining complex physics concepts through real-world applications.',
    credentials: ['Ph.D. in Physics - Stanford', 'Research Physicist', 'Science Communication Award'],
  },
  {
    id: 'expert3',
    name: 'Dr. Emily Rodriguez',
    avatar: '🧑‍💻',
    title: 'Computer Science Expert',
    specializations: ['Programming', 'Data Structures', 'Algorithms', 'Machine Learning'],
    rating: 4.7,
    totalSessions: 156,
    yearsOfExperience: 8,
    isOnline: true,
    hourlyRate: 45,
    languages: ['English', 'Spanish', 'Portuguese'],
    bio: 'Software engineer turned educator with expertise in computer science fundamentals and cutting-edge AI technologies.',
    credentials: ['M.S. Computer Science - Berkeley', 'Senior Software Engineer', 'ML Certification'],
  },
];

const MOCK_SESSIONS: ExpertSession[] = [
  {
    id: 'session1',
    expertId: 'expert1',
    expertName: 'Dr. Sarah Chen',
    studentId: 'current_user',
    studentName: 'You',
    title: 'Calculus Integration Techniques',
    subject: 'Mathematics',
    topic: 'Calculus',
    scheduledTime: new Date('2024-01-20T16:00:00'),
    duration: 60,
    status: 'scheduled',
    sessionType: 'one-on-one',
    currentParticipants: 1,
    questions: [
      'How to solve integration by parts?',
      'When to use substitution vs integration by parts?',
      'Practice problems with trigonometric integrals',
    ],
    cost: 50,
  },
  {
    id: 'session2',
    expertId: 'expert2',
    expertName: 'Prof. Michael Johnson',
    studentId: 'current_user',
    studentName: 'You',
    title: 'Quantum Physics Workshop',
    subject: 'Physics',
    topic: 'Quantum Mechanics',
    scheduledTime: new Date('2024-01-18T19:00:00'),
    duration: 90,
    status: 'completed',
    sessionType: 'group',
    maxParticipants: 8,
    currentParticipants: 6,
    questions: ['Wave-particle duality', 'Quantum entanglement basics'],
    rating: 5,
    feedback: 'Excellent session! The professor explained quantum concepts very clearly.',
    recordingAvailable: true,
    cost: 30,
  },
];

export default function ExpertQA({
  currentUserId = 'current_user',
  experts = MOCK_EXPERTS,
  mySessions = MOCK_SESSIONS,
  onBookSession,
  onJoinSession,
  onCancelSession,
  onRateSession,
}: ExpertQAProps) {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<'experts' | 'my_sessions' | 'book_session'>('experts');
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
  const [expertModalVisible, setExpertModalVisible] = useState(false);
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [selectedSession, setSelectedSession] = useState<ExpertSession | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'rating' | 'experience' | 'rate'>('rating');

  // Booking form state
  const [bookingForm, setBookingForm] = useState({
    subject: '',
    topic: '',
    questions: [''],
    preferredDate: '',
    preferredTime: '',
    duration: '60',
    sessionType: 'one-on-one' as 'one-on-one' | 'group',
    urgency: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    notes: '',
  });

  // Rating form state
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return theme.primary;
      case 'active': return '#4CAF50';
      case 'completed': return '#757575';
      case 'cancelled': return theme.error;
      case 'pending_approval': return '#FF9800';
      default: return theme.OnSurface;
    }
  };

  const getFilteredAndSortedExperts = useCallback(() => {
    let filtered = experts;

    if (searchQuery) {
      filtered = filtered.filter(expert =>
        expert.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        expert.specializations.some(spec => 
          spec.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    if (filterSubject !== 'all') {
      filtered = filtered.filter(expert =>
        expert.specializations.some(spec =>
          spec.toLowerCase().includes(filterSubject.toLowerCase())
        )
      );
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'experience':
          return b.yearsOfExperience - a.yearsOfExperience;
        case 'rate':
          return (a.hourlyRate || 0) - (b.hourlyRate || 0);
        default:
          return 0;
      }
    });
  }, [experts, searchQuery, filterSubject, sortBy]);

  const handleBookSession = useCallback(() => {
    if (!selectedExpert) return;

    const sessionDetails = {
      expertId: selectedExpert.id,
      ...bookingForm,
      questions: bookingForm.questions.filter(q => q.trim()),
    };

    onBookSession(selectedExpert.id, sessionDetails);
    setBookingModalVisible(false);
    setBookingForm({
      subject: '',
      topic: '',
      questions: [''],
      preferredDate: '',
      preferredTime: '',
      duration: '60',
      sessionType: 'one-on-one',
      urgency: 'medium',
      notes: '',
    });

    Alert.alert(
      'Session Request Sent',
      'Your session request has been sent to the expert. You will receive a confirmation shortly.',
      [{ text: 'OK' }]
    );
  }, [selectedExpert, bookingForm, onBookSession]);

  const handleRateSession = useCallback(() => {
    if (!selectedSession) return;

    onRateSession(selectedSession.id, rating, feedback);
    setRatingModalVisible(false);
    setRating(5);
    setFeedback('');

    Alert.alert(
      'Thank You!',
      'Your feedback has been submitted and will help improve future sessions.',
      [{ text: 'OK' }]
    );
  }, [selectedSession, rating, feedback, onRateSession]);

  const addQuestion = () => {
    setBookingForm(prev => ({
      ...prev,
      questions: [...prev.questions, ''],
    }));
  };

  const removeQuestion = (index: number) => {
    if (bookingForm.questions.length > 1) {
      setBookingForm(prev => ({
        ...prev,
        questions: prev.questions.filter((_, i) => i !== index),
      }));
    }
  };

  const updateQuestion = (index: number, value: string) => {
    setBookingForm(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => i === index ? value : q),
    }));
  };

  const renderExpert = ({ item: expert }: { item: Expert }) => (
    <TouchableOpacity
      style={[styles.expertCard, { backgroundColor: theme.Surface }]}
      onPress={() => {
        setSelectedExpert(expert);
        setExpertModalVisible(true);
      }}
      accessibilityRole="button"
      accessibilityLabel={`View expert profile: ${expert.name}`}
    >
      <View style={styles.expertHeader}>
        <View style={styles.expertInfo}>
          <View style={styles.expertTitleRow}>
            <Text style={styles.expertAvatar}>{expert.avatar}</Text>
            <View style={styles.expertDetails}>
              <Text style={[styles.expertName, { color: theme.OnSurface }]}>
                {expert.name}
              </Text>
              <Text style={[styles.expertTitle, { color: theme.OnSurfaceVariant }]}>
                {expert.title}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.expertStatus}>
          <View
            style={[
              styles.onlineIndicator,
              { backgroundColor: expert.isOnline ? '#4CAF50' : '#757575' }
            ]}
          >
            <Text style={[styles.onlineText, { color: theme.OnPrimary }]}>
              {expert.isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingIcon}>⭐</Text>
            <Text style={[styles.ratingText, { color: theme.OnSurface }]}>
              {expert.rating} ({expert.totalSessions})
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.specializationsContainer}>
        {expert.specializations.slice(0, 3).map(spec => (
          <View
            key={spec}
            style={[styles.specializationTag, { backgroundColor: theme.primaryContainer }]}
          >
            <Text style={[styles.specializationText, { color: theme.OnPrimaryContainer }]}>
              {spec}
            </Text>
          </View>
        ))}
        {expert.specializations.length > 3 && (
          <Text style={[styles.moreSpecs, { color: theme.OnSurfaceVariant }]}>
            +{expert.specializations.length - 3} more
          </Text>
        )}
      </View>

      <View style={styles.expertFooter}>
        <Text style={[styles.experienceText, { color: theme.OnSurfaceVariant }]}>
          {expert.yearsOfExperience} years experience
        </Text>
        {expert.hourlyRate && (
          <Text style={[styles.rateText, { color: theme.primary }]}>
            ${expert.hourlyRate}/hour
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderSession = ({ item: session }: { item: ExpertSession }) => (
    <View style={[styles.sessionCard, { backgroundColor: theme.Surface }]}>
      <View style={styles.sessionHeader}>
        <View style={styles.sessionInfo}>
          <Text style={[styles.sessionTitle, { color: theme.OnSurface }]}>
            {session.title}
          </Text>
          <Text style={[styles.sessionExpert, { color: theme.OnSurfaceVariant }]}>
            with {session.expertName}
          </Text>
        </View>
        <View
          style={[
            styles.sessionStatus,
            { backgroundColor: getStatusColor(session.status) }
          ]}
        >
          <Text style={[styles.sessionStatusText, { color: theme.OnPrimary }]}>
            {session.status.charAt(0).toUpperCase() + session.status.slice(1).replace('_', ' ')}
          </Text>
        </View>
      </View>

      <View style={styles.sessionDetails}>
        <Text style={[styles.sessionTime, { color: theme.OnSurface }]}>
          📅 {session.scheduledTime.toLocaleDateString()} at {session.scheduledTime.toLocaleTimeString()}
        </Text>
        <Text style={[styles.sessionDuration, { color: theme.OnSurfaceVariant }]}>
          ⏱️ {session.duration} minutes • {session.sessionType}
        </Text>
        {session.currentParticipants > 1 && (
          <Text style={[styles.sessionParticipants, { color: theme.OnSurfaceVariant }]}>
            👥 {session.currentParticipants} participants
          </Text>
        )}
      </View>

      {session.questions.length > 0 && (
        <View style={styles.sessionQuestions}>
          <Text style={[styles.questionsLabel, { color: theme.OnSurfaceVariant }]}>
            Topics to cover:
          </Text>
          {session.questions.slice(0, 2).map((question, index) => (
            <Text key={index} style={[styles.questionItem, { color: theme.OnSurface }]}>
              • {question}
            </Text>
          ))}
          {session.questions.length > 2 && (
            <Text style={[styles.moreQuestions, { color: theme.OnSurfaceVariant }]}>
              +{session.questions.length - 2} more topics
            </Text>
          )}
        </View>
      )}

      <View style={styles.sessionActions}>
        {session.status === 'scheduled' && (
          <>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.primaryContainer }]}
              onPress={() => onJoinSession(session.id)}
              accessibilityRole="button"
              accessibilityLabel="Join session"
            >
              <Text style={[styles.actionButtonText, { color: theme.OnPrimaryContainer }]}>
                Join Session
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.errorContainer }]}
              onPress={() => {
                Alert.alert(
                  'Cancel Session',
                  'Are you sure you want to cancel this session?',
                  [
                    { text: 'No', style: 'cancel' },
                    { text: 'Yes', onPress: () => onCancelSession(session.id) },
                  ]
                );
              }}
              accessibilityRole="button"
              accessibilityLabel="Cancel session"
            >
              <Text style={[styles.actionButtonText, { color: theme.OnErrorContainer }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </>
        )}

        {session.status === 'completed' && !session.rating && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.secondaryContainer }]}
            onPress={() => {
              setSelectedSession(session);
              setRatingModalVisible(true);
            }}
            accessibilityRole="button"
            accessibilityLabel="Rate session"
          >
            <Text style={[styles.actionButtonText, { color: theme.OnSecondaryContainer }]}>
              Rate Session
            </Text>
          </TouchableOpacity>
        )}

        {session.recordingAvailable && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.TertiaryContainer }]}
            onPress={() => Alert.alert('Recording', 'Opening session recording...')}
            accessibilityRole="button"
            accessibilityLabel="View recording"
          >
            <Text style={[styles.actionButtonText, { color: theme.OnTertiaryContainer }]}>
              📹 Recording
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {session.rating && (
        <View style={styles.sessionRating}>
          <Text style={[styles.ratingLabel, { color: theme.OnSurfaceVariant }]}>
            Your rating:
          </Text>
          <Text style={styles.ratingStars}>
            {'⭐'.repeat(session.rating)}
          </Text>
        </View>
      )}
    </View>
  );

  const renderFilters = () => (
    <View style={[styles.filtersContainer, { backgroundColor: theme.Surface }]}>
      <TextInput
        style={[
          styles.searchInput,
          { backgroundColor: theme.SurfaceVariant, color: theme.OnSurface }
        ]}
        placeholder="Search experts..."
        placeholderTextColor={theme.OnSurfaceVariant}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersRow}>
        <View style={styles.filterGroup}>
          <Text style={[styles.filterLabel, { color: theme.OnSurfaceVariant }]}>
            Subject:
          </Text>
          {['all', 'mathematics', 'physics', 'chemistry', 'computer science'].map(subject => (
            <TouchableOpacity
              key={subject}
              style={[
                styles.filterButton,
                {
                  backgroundColor: filterSubject === subject ? theme.primary : theme.Surface,
                }
              ]}
              onPress={() => setFilterSubject(subject)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  {
                    color: filterSubject === subject ? theme.OnPrimary : theme.OnSurface,
                  }
                ]}
              >
                {subject.charAt(0).toUpperCase() + subject.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.filterGroup}>
          <Text style={[styles.filterLabel, { color: theme.OnSurfaceVariant }]}>
            Sort by:
          </Text>
          {['rating', 'experience', 'rate'].map(sort => (
            <TouchableOpacity
              key={sort}
              style={[
                styles.filterButton,
                {
                  backgroundColor: sortBy === sort ? theme.primary : theme.Surface,
                }
              ]}
              onPress={() => setSortBy(sort as any)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  {
                    color: sortBy === sort ? theme.OnPrimary : theme.OnSurface,
                  }
                ]}
              >
                {sort.charAt(0).toUpperCase() + sort.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const renderExpertModal = () => (
    <Modal
      visible={expertModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setExpertModalVisible(false)}
    >
      <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.expertModalContent, { backgroundColor: theme.background }]}>
          {selectedExpert && (
            <Fragment>
              <ScrollView style={styles.expertModalBody}>
              <View style={styles.expertModalHeader}>
                <Text style={styles.expertModalAvatar}>{selectedExpert.avatar}</Text>
                <Text style={[styles.expertModalName, { color: theme.OnSurface }]}>
                  {selectedExpert.name}
                </Text>
                <Text style={[styles.expertModalTitle, { color: theme.OnSurfaceVariant }]}>
                  {selectedExpert.title}
                </Text>
                <View style={styles.expertModalRating}>
                  <Text style={styles.expertModalRatingIcon}>⭐</Text>
                  <Text style={[styles.expertModalRatingText, { color: theme.OnSurface }]}>
                    {selectedExpert.rating} ({selectedExpert.totalSessions} sessions)
                  </Text>
                </View>
              </View>

              <Text style={[styles.expertModalBio, { color: theme.OnSurface }]}>
                {selectedExpert.bio}
              </Text>

              <View style={styles.expertModalSection}>
                <Text style={[styles.expertModalSectionTitle, { color: theme.OnSurface }]}>
                  Specializations
                </Text>
                <View style={styles.expertModalSpecializations}>
                  {selectedExpert.specializations.map(spec => (
                    <View
                      key={spec}
                      style={[styles.expertModalSpecTag, { backgroundColor: theme.primaryContainer }]}
                    >
                      <Text style={[styles.expertModalSpecText, { color: theme.OnPrimaryContainer }]}>
                        {spec}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.expertModalSection}>
                <Text style={[styles.expertModalSectionTitle, { color: theme.OnSurface }]}>
                  Credentials
                </Text>
                {selectedExpert.credentials.map((credential, index) => (
                  <Text key={index} style={[styles.expertModalCredential, { color: theme.OnSurfaceVariant }]}>
                    • {credential}
                  </Text>
                ))}
              </View>

              <View style={styles.expertModalSection}>
                <Text style={[styles.expertModalSectionTitle, { color: theme.OnSurface }]}>
                  Details
                </Text>
                <Text style={[styles.expertModalDetail, { color: theme.OnSurfaceVariant }]}>
                  Experience: {selectedExpert.yearsOfExperience} years
                </Text>
                <Text style={[styles.expertModalDetail, { color: theme.OnSurfaceVariant }]}>
                  Languages: {selectedExpert.languages.join(', ')}
                </Text>
                {selectedExpert.hourlyRate && (
                  <Text style={[styles.expertModalDetail, { color: theme.primary }]}>
                    Rate: ${selectedExpert.hourlyRate}/hour
                  </Text>
                )}
              </View>
            </ScrollView>

            <View style={styles.expertModalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.Surface }]}
                onPress={() => setExpertModalVisible(false)}
              >
                <Text style={[styles.modalButtonText, { color: theme.OnSurface }]}>
                  Close
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.primary }]}
                onPress={() => {
                  setExpertModalVisible(false);
                  setBookingModalVisible(true);
                }}
              >
                <Text style={[styles.modalButtonText, { color: theme.OnPrimary }]}>
                  Book Session
                </Text>
              </TouchableOpacity>
            </View>
            </Fragment>
          )}
        </View>
      </View>
    </Modal>
  );

  const renderBookingModal = () => (
    <Modal
      visible={bookingModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setBookingModalVisible(false)}
    >
      <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View style={[styles.bookingModalContent, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.Outline }]}>
            <Text style={[styles.modalTitle, { color: theme.OnSurface }]}>
              Book Session with {selectedExpert?.name}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setBookingModalVisible(false)}
            >
              <Text style={[styles.closeButtonText, { color: theme.primary }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.bookingForm}>
            <Text style={[styles.formLabel, { color: theme.OnSurfaceVariant }]}>Subject</Text>
            <TextInput
              style={[styles.formInput, { backgroundColor: theme.Surface, color: theme.OnSurface }]}
              placeholder="e.g. Mathematics"
              value={bookingForm.subject}
              onChangeText={(text) => setBookingForm(prev => ({ ...prev, subject: text }))}
            />

            <Text style={[styles.formLabel, { color: theme.OnSurfaceVariant }]}>Topic</Text>
            <TextInput
              style={[styles.formInput, { backgroundColor: theme.Surface, color: theme.OnSurface }]}
              placeholder="e.g. Integration Techniques"
              value={bookingForm.topic}
              onChangeText={(text) => setBookingForm(prev => ({ ...prev, topic: text }))}
            />

            <Text style={[styles.formLabel, { color: theme.OnSurfaceVariant }]}>Questions</Text>
            {bookingForm.questions.map((question, index) => (
              <View key={index} style={styles.questionInputRow}>
                <TextInput
                  style={[styles.questionInput, { backgroundColor: theme.Surface, color: theme.OnSurface }]}
                  placeholder={`Question ${index + 1}`}
                  value={question}
                  onChangeText={(text) => updateQuestion(index, text)}
                  multiline
                />
                {bookingForm.questions.length > 1 && (
                  <TouchableOpacity
                    style={styles.removeQuestionButton}
                    onPress={() => removeQuestion(index)}
                  >
                    <Text style={[styles.removeQuestionText, { color: theme.error }]}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
            <TouchableOpacity style={styles.addQuestionButton} onPress={addQuestion}>
              <Text style={[styles.addQuestionText, { color: theme.primary }]}>
                + Add Question
              </Text>
            </TouchableOpacity>

            <View style={styles.formRow}>
              <View style={styles.formColumn}>
                <Text style={[styles.formLabel, { color: theme.OnSurfaceVariant }]}>Duration</Text>
                <View style={styles.durationButtons}>
                  {['30', '60', '90', '120'].map(duration => (
                    <TouchableOpacity
                      key={duration}
                      style={[
                        styles.durationButton,
                        {
                          backgroundColor: bookingForm.duration === duration 
                            ? theme.primary 
                            : theme.Surface,
                        }
                      ]}
                      onPress={() => setBookingForm(prev => ({ ...prev, duration }))}
                    >
                      <Text
                        style={[
                          styles.durationButtonText,
                          {
                            color: bookingForm.duration === duration 
                              ? theme.OnPrimary 
                              : theme.OnSurface,
                          }
                        ]}
                      >
                        {duration}m
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.formColumn}>
                <Text style={[styles.formLabel, { color: theme.OnSurfaceVariant }]}>Type</Text>
                <View style={styles.typeButtons}>
                  {[
                    { key: 'one-on-one', label: '1-on-1' },
                    { key: 'group', label: 'Group' },
                  ].map(type => (
                    <TouchableOpacity
                      key={type.key}
                      style={[
                        styles.typeButton,
                        {
                          backgroundColor: bookingForm.sessionType === type.key 
                            ? theme.primary 
                            : theme.Surface,
                        }
                      ]}
                      onPress={() => setBookingForm(prev => ({ ...prev, sessionType: type.key as any }))}
                    >
                      <Text
                        style={[
                          styles.typeButtonText,
                          {
                            color: bookingForm.sessionType === type.key 
                              ? theme.OnPrimary 
                              : theme.OnSurface,
                          }
                        ]}
                      >
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <Text style={[styles.formLabel, { color: theme.OnSurfaceVariant }]}>Additional Notes</Text>
            <TextInput
              style={[
                styles.formInput,
                styles.notesInput,
                { backgroundColor: theme.Surface, color: theme.OnSurface }
              ]}
              placeholder="Any additional information..."
              value={bookingForm.notes}
              onChangeText={(text) => setBookingForm(prev => ({ ...prev, notes: text }))}
              multiline
              numberOfLines={3}
            />
          </ScrollView>

          <View style={styles.bookingModalActions}>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: theme.Surface }]}
              onPress={() => setBookingModalVisible(false)}
            >
              <Text style={[styles.modalButtonText, { color: theme.OnSurface }]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: theme.primary }]}
              onPress={handleBookSession}
            >
              <Text style={[styles.modalButtonText, { color: theme.OnPrimary }]}>
                Book Session
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderRatingModal = () => (
    <Modal
      visible={ratingModalVisible}
      animationType="fade"
      transparent={true}
      onRequestClose={() => setRatingModalVisible(false)}
    >
      <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
        <View style={[styles.ratingModalContent, { backgroundColor: theme.background }]}>
          <Text style={[styles.ratingModalTitle, { color: theme.OnSurface }]}>
            Rate Your Session
          </Text>
          <Text style={[styles.ratingModalSubtitle, { color: theme.OnSurfaceVariant }]}>
            How was your session with {selectedSession?.expertName}?
          </Text>

          <View style={styles.ratingStarsContainer}>
            {[1, 2, 3, 4, 5].map(star => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                accessibilityRole="button"
                accessibilityLabel={`Rate ${star} stars`}
              >
                <Text style={[
                  styles.ratingStar,
                  { color: star <= rating ? '#FFD700' : '#E0E0E0' }
                ]}>
                  ⭐
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={[
              styles.feedbackInput,
              { backgroundColor: theme.Surface, color: theme.OnSurface }
            ]}
            placeholder="Share your feedback (optional)..."
            placeholderTextColor={theme.OnSurfaceVariant}
            value={feedback}
            onChangeText={setFeedback}
            multiline
            numberOfLines={4}
          />

          <View style={styles.ratingModalActions}>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: theme.Surface }]}
              onPress={() => setRatingModalVisible(false)}
            >
              <Text style={[styles.modalButtonText, { color: theme.OnSurface }]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: theme.primary }]}
              onPress={handleRateSession}
            >
              <Text style={[styles.modalButtonText, { color: theme.OnPrimary }]}>
                Submit Rating
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { borderBottomColor: theme.Outline }]}>
        <Text style={[styles.headerTitle, { color: theme.OnSurface }]}>
          Expert Q&A
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.OnSurfaceVariant }]}>
          Get help from subject matter experts
        </Text>
      </View>

      <View style={[styles.tabsContainer, { backgroundColor: theme.Surface }]}>
        {[
          { key: 'experts', label: 'Find Experts' },
          { key: 'my_sessions', label: 'My Sessions' },
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && {
                borderBottomColor: theme.primary,
                borderBottomWidth: 2,
              }
            ]}
            onPress={() => setActiveTab(tab.key as any)}
            accessibilityRole="button"
            accessibilityLabel={`Switch to ${tab.label} tab`}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: activeTab === tab.key ? theme.primary : theme.OnSurfaceVariant,
                  fontWeight: activeTab === tab.key ? 'bold' : 'normal',
                }
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'experts' && (
        <>
          {renderFilters()}
          <FlatList
            data={getFilteredAndSortedExperts()}
            renderItem={renderExpert}
            keyExtractor={(item) => item.id}
            style={styles.expertsList}
            contentContainerStyle={styles.expertsContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  setTimeout(() => setRefreshing(false), 1000);
                }}
                colors={[theme.primary]}
                tintColor={theme.primary}
              />
            }
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={[styles.emptyText, { color: theme.OnSurfaceVariant }]}>
                  No experts found matching your criteria
                </Text>
              </View>
            }
          />
        </>
      )}

      {activeTab === 'my_sessions' && (
        <FlatList
          data={mySessions}
          renderItem={renderSession}
          keyExtractor={(item) => item.id}
          style={styles.sessionsList}
          contentContainerStyle={styles.sessionsContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                setTimeout(() => setRefreshing(false), 1000);
              }}
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: theme.OnSurfaceVariant }]}>
                You haven't booked any sessions yet
              </Text>
            </View>
          }
        />
      )}

      {renderExpertModal()}
      {renderBookingModal()}
      {renderRatingModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginRight: 8,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
  },
  filtersContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchInput: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 12,
  },
  filtersRow: {
    marginBottom: 8,
  },
  filterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginRight: 8,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  expertsList: {
    flex: 1,
  },
  expertsContent: {
    padding: 16,
  },
  expertCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  expertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  expertInfo: {
    flex: 1,
  },
  expertTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expertAvatar: {
    fontSize: 32,
    marginRight: 12,
  },
  expertDetails: {
    flex: 1,
  },
  expertName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  expertTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  expertStatus: {
    alignItems: 'flex-end',
  },
  onlineIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 4,
  },
  onlineText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  specializationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    alignItems: 'center',
  },
  specializationTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  specializationText: {
    fontSize: 12,
    fontWeight: '600',
  },
  moreSpecs: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  expertFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  experienceText: {
    fontSize: 14,
  },
  rateText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  sessionsList: {
    flex: 1,
  },
  sessionsContent: {
    padding: 16,
  },
  sessionCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  sessionExpert: {
    fontSize: 14,
  },
  sessionStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  sessionStatusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  sessionDetails: {
    marginBottom: 12,
  },
  sessionTime: {
    fontSize: 14,
    marginBottom: 2,
  },
  sessionDuration: {
    fontSize: 14,
    marginBottom: 2,
  },
  sessionParticipants: {
    fontSize: 14,
  },
  sessionQuestions: {
    marginBottom: 12,
  },
  questionsLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  questionItem: {
    fontSize: 14,
    marginBottom: 2,
  },
  moreQuestions: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  sessionActions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sessionRating: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  ratingLabel: {
    fontSize: 14,
    marginRight: 8,
  },
  ratingStars: {
    fontSize: 14,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expertModalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 12,
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  expertModalBody: {
    padding: 20,
    maxHeight: 500,
  },
  expertModalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  expertModalAvatar: {
    fontSize: 48,
    marginBottom: 8,
  },
  expertModalName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  expertModalTitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  expertModalRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expertModalRatingIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  expertModalRatingText: {
    fontSize: 14,
    fontWeight: '600',
  },
  expertModalBio: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 20,
  },
  expertModalSection: {
    marginBottom: 20,
  },
  expertModalSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  expertModalSpecializations: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  expertModalSpecTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  expertModalSpecText: {
    fontSize: 12,
    fontWeight: '600',
  },
  expertModalCredential: {
    fontSize: 14,
    marginBottom: 4,
    lineHeight: 20,
  },
  expertModalDetail: {
    fontSize: 14,
    marginBottom: 4,
  },
  expertModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  bookingModalContent: {
    width: '95%',
    maxHeight: '90%',
    borderRadius: 12,
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  bookingForm: {
    padding: 20,
    maxHeight: 400,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 12,
  },
  formInput: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    fontSize: 16,
  },
  questionInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  questionInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    fontSize: 16,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  removeQuestionButton: {
    marginLeft: 8,
    padding: 8,
  },
  removeQuestionText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  addQuestionButton: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  addQuestionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  formRow: {
    flexDirection: 'row',
    gap: 16,
  },
  formColumn: {
    flex: 1,
  },
  durationButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  durationButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 4,
    alignItems: 'center',
  },
  durationButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 4,
    alignItems: 'center',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  bookingModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  ratingModalContent: {
    width: '85%',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  ratingModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  ratingModalSubtitle: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  ratingStarsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  ratingStar: {
    fontSize: 32,
    marginHorizontal: 4,
  },
  feedbackInput: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 100,
    marginBottom: 24,
  },
  ratingModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
});