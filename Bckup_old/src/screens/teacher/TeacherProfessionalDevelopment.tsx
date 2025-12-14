import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  FlatList,
  Modal,
  Alert,
  Switch,
  ProgressBarAndroid,
  BackHandler,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Appbar, Portal, Snackbar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LightTheme } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing } from '../../theme/spacing';

interface MicroCredential {
  id: string;
  title: string;
  description: string;
  category: 'teaching' | 'technology' | 'assessment' | 'management' | 'special-needs';
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  estimatedHours: number;
  progress: number;
  isCompleted: boolean;
  expiryDate?: Date;
  blockchainHash?: string;
  prerequisites: string[];
  skills: string[];
  issuer: string;
  credentialValue: number;
}

interface LearningPath {
  id: string;
  title: string;
  description: string;
  totalCredentials: number;
  completedCredentials: number;
  estimatedWeeks: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  focusAreas: string[];
  aiRecommendationScore: number;
  enrolledDate: Date;
  targetCompletionDate: Date;
}

interface AICoachingInsight {
  id: string;
  type: 'strength' | 'improvement' | 'recommendation' | 'milestone';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  relatedSkills: string[];
  suggestedActions: string[];
  confidenceScore: number;
  createdAt: Date;
  isRead: boolean;
}

interface PeerMentor {
  id: string;
  name: string;
  avatar: string;
  expertise: string[];
  experience: number;
  rating: number;
  availableSlots: string[];
  bio: string;
  credentials: string[];
  menteeCount: number;
  successRate: number;
  languages: string[];
}

interface TeachingAnalytics {
  overallEffectiveness: number;
  studentEngagement: number;
  contentDelivery: number;
  classroomManagement: number;
  assessmentQuality: number;
  technologyIntegration: number;
  improvementAreas: string[];
  strengthAreas: string[];
  monthlyTrend: number[];
  peerComparison: number;
}

const TeacherProfessionalDevelopment: React.FC<{
  teacherId: string;
  onNavigate: (screen: string) => void;
}> = ({ teacherId, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'credentials' | 'paths' | 'coaching' | 'mentors'>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showDetails, setShowDetails] = useState(false);
  const [selectedCredential, setSelectedCredential] = useState<MicroCredential | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Mock data
  const [teachingAnalytics] = useState<TeachingAnalytics>({
    overallEffectiveness: 87,
    studentEngagement: 92,
    contentDelivery: 85,
    classroomManagement: 89,
    assessmentQuality: 83,
    technologyIntegration: 78,
    improvementAreas: ['Technology Integration', 'Differentiated Instruction', 'Data-Driven Assessment'],
    strengthAreas: ['Student Engagement', 'Classroom Management', 'Subject Knowledge'],
    monthlyTrend: [82, 84, 86, 85, 87, 89, 87],
    peerComparison: 15, // Top 15% of peers
  });

  const [microCredentials] = useState<MicroCredential[]>([
    {
      id: '1',
      title: 'AI-Enhanced Teaching Strategies',
      description: 'Master the integration of artificial intelligence tools in classroom instruction',
      category: 'technology',
      level: 'intermediate',
      estimatedHours: 12,
      progress: 75,
      isCompleted: false,
      prerequisites: ['Basic Technology Integration'],
      skills: ['AI Tools', 'Adaptive Learning', 'Data Analysis'],
      issuer: 'EdTech Certification Board',
      credentialValue: 150,
    },
    {
      id: '2',
      title: 'Inclusive Classroom Management',
      description: 'Create and maintain inclusive learning environments for diverse student populations',
      category: 'management',
      level: 'advanced',
      estimatedHours: 16,
      progress: 100,
      isCompleted: true,
      expiryDate: new Date('2026-06-15'),
      blockchainHash: '0x8f7e6d5c4b3a291847563829',
      prerequisites: ['Classroom Management Basics', 'Diversity & Inclusion'],
      skills: ['Inclusive Practices', 'Conflict Resolution', 'Cultural Competency'],
      issuer: 'National Education Council',
      credentialValue: 200,
    },
    {
      id: '3',
      title: 'Voice AI Assessment Mastery',
      description: 'Design and implement voice-enabled assessment systems for enhanced student evaluation',
      category: 'assessment',
      level: 'expert',
      estimatedHours: 20,
      progress: 35,
      isCompleted: false,
      prerequisites: ['Digital Assessment', 'AI-Enhanced Teaching'],
      skills: ['Voice Recognition', 'Conversational AI', 'Assessment Design'],
      issuer: 'Advanced Education Technology Institute',
      credentialValue: 300,
    },
  ]);

  const [learningPaths] = useState<LearningPath[]>([
    {
      id: '1',
      title: 'AI-Powered Educator Certification',
      description: 'Comprehensive pathway to master AI integration in education',
      totalCredentials: 8,
      completedCredentials: 3,
      estimatedWeeks: 16,
      difficulty: 'advanced',
      focusAreas: ['Artificial Intelligence', 'Personalized Learning', 'Data Analytics'],
      aiRecommendationScore: 95,
      enrolledDate: new Date('2024-09-01'),
      targetCompletionDate: new Date('2024-12-31'),
    },
    {
      id: '2',
      title: 'Special Education Excellence',
      description: 'Specialized training for inclusive and adaptive education practices',
      totalCredentials: 6,
      completedCredentials: 2,
      estimatedWeeks: 12,
      difficulty: 'intermediate',
      focusAreas: ['Special Needs', 'Adaptive Technology', 'Individualized Plans'],
      aiRecommendationScore: 88,
      enrolledDate: new Date('2024-10-15'),
      targetCompletionDate: new Date('2025-01-15'),
    },
  ]);

  const [coachingInsights] = useState<AICoachingInsight[]>([
    {
      id: '1',
      type: 'recommendation',
      title: 'Enhance Student Participation',
      description: 'AI analysis suggests implementing interactive polling techniques to increase student engagement by 25%',
      priority: 'high',
      relatedSkills: ['Interactive Teaching', 'Technology Integration'],
      suggestedActions: [
        'Implement real-time polling during lessons',
        'Use breakout rooms for small group discussions',
        'Incorporate gamification elements'
      ],
      confidenceScore: 92,
      createdAt: new Date('2024-12-05'),
      isRead: false,
    },
    {
      id: '2',
      type: 'strength',
      title: 'Excellent Content Organization',
      description: 'Your lesson structure and content organization ranks in the top 10% of peer educators',
      priority: 'medium',
      relatedSkills: ['Lesson Planning', 'Curriculum Design'],
      suggestedActions: [
        'Share your organization strategies with colleagues',
        'Consider mentoring newer teachers',
        'Document your best practices'
      ],
      confidenceScore: 97,
      createdAt: new Date('2024-12-04'),
      isRead: true,
    },
    {
      id: '3',
      type: 'improvement',
      title: 'Technology Integration Opportunity',
      description: 'Students respond positively to technology-enhanced lessons. Consider expanding digital tool usage',
      priority: 'medium',
      relatedSkills: ['Technology Integration', 'Digital Literacy'],
      suggestedActions: [
        'Explore AR/VR learning applications',
        'Integrate collaborative online platforms',
        'Use AI-powered assessment tools'
      ],
      confidenceScore: 85,
      createdAt: new Date('2024-12-03'),
      isRead: false,
    },
  ]);

  const [peerMentors] = useState<PeerMentor[]>([
    {
      id: '1',
      name: 'डॉ. प्रिया शर्मा',
      avatar: '👩‍🏫',
      expertise: ['AI Integration', 'STEM Education', 'Research Methods'],
      experience: 15,
      rating: 4.9,
      availableSlots: ['Monday 4-6 PM', 'Wednesday 2-4 PM', 'Friday 10-12 PM'],
      bio: 'Senior educator with expertise in AI integration and STEM pedagogy. Published researcher with 50+ papers.',
      credentials: ['PhD Education Technology', 'AI Teaching Certification', 'Research Excellence Award'],
      menteeCount: 24,
      successRate: 96,
      languages: ['Hindi', 'English', 'Marathi'],
    },
    {
      id: '2',
      name: 'प्रो. राजेश कुमार',
      avatar: '👨‍💼',
      expertise: ['Leadership', 'Curriculum Design', 'Teacher Training'],
      experience: 22,
      rating: 4.8,
      availableSlots: ['Tuesday 3-5 PM', 'Thursday 1-3 PM', 'Saturday 9-11 AM'],
      bio: 'Educational leader with extensive experience in curriculum development and teacher professional growth.',
      credentials: ['Master Teacher Certification', 'Educational Leadership Diploma', 'Curriculum Design Expert'],
      menteeCount: 18,
      successRate: 94,
      languages: ['Hindi', 'English'],
    },
  ]);

  // Lifecycle functions
  const showSnackbar = useCallback((message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  }, []);

  const setupBackHandler = useCallback(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showDetails) {
        setShowDetails(false);
        setSelectedCredential(null);
        return true;
      }
      return false;
    });
    return backHandler;
  }, [showDetails]);

  const initializeScreen = useCallback(async () => {
    try {
      setIsLoading(true);
      // Simulate loading professional development data
      await new Promise(resolve => setTimeout(resolve, 800));
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load professional development data:', error);
      showSnackbar('Failed to load professional development data');
      setIsLoading(false);
    }
  }, [showSnackbar]);

  // Effects
  useEffect(() => {
    const backHandler = setupBackHandler();
    return () => backHandler.remove();
  }, [setupBackHandler]);

  useEffect(() => {
    initializeScreen();
  }, []);

  const renderDashboard = () => (
    <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
      {/* Teaching Effectiveness Overview */}
      <View style={{
        backgroundColor: LightTheme.Surface,
        borderRadius: 16,
        padding: Spacing.LG,
        margin: Spacing.MD,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      }}>
        <Text style={[Typography.titleLarge, { fontWeight: '700', marginBottom: Spacing.MD }]}>
          Teaching Effectiveness Analytics
        </Text>
        
        <View style={{ marginBottom: Spacing.LG }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.SM }}>
            <Text style={[Typography.headlineMedium, { fontWeight: '700', color: LightTheme.Primary }]}>
              {teachingAnalytics.overallEffectiveness}%
            </Text>
            <View style={{
              backgroundColor: teachingAnalytics.peerComparison <= 20 ? '#E8F5E8' : '#FFF3E0',
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 12,
            }}>
              <Text style={[Typography.bodySmall, {
                color: teachingAnalytics.peerComparison <= 20 ? '#2E7D32' : '#F57C00',
                fontWeight: '600'
              }]}>
                Top {teachingAnalytics.peerComparison}% of Peers
              </Text>
            </View>
          </View>
          <Text style={[Typography.bodyMedium, { color: LightTheme.OnSurfaceVariant }]}>
            Overall Teaching Effectiveness Score
          </Text>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          {[
            { label: 'Student Engagement', value: teachingAnalytics.studentEngagement, color: '#4CAF50' },
            { label: 'Content Delivery', value: teachingAnalytics.contentDelivery, color: '#2196F3' },
            { label: 'Classroom Mgmt', value: teachingAnalytics.classroomManagement, color: '#FF9800' },
            { label: 'Assessment Quality', value: teachingAnalytics.assessmentQuality, color: '#9C27B0' },
          ].map((metric, index) => (
            <View key={index} style={{ width: '48%', marginBottom: Spacing.MD }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={[Typography.bodySmall, { fontWeight: '500' }]}>{metric.label}</Text>
                <Text style={[Typography.bodySmall, { fontWeight: '600', color: metric.color }]}>
                  {metric.value}%
                </Text>
              </View>
              <View style={{
                height: 6,
                backgroundColor: LightTheme.SurfaceVariant,
                borderRadius: 3,
              }}>
                <View style={{
                  height: '100%',
                  width: `${metric.value}%`,
                  backgroundColor: metric.color,
                  borderRadius: 3,
                }} />
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* AI Coaching Insights */}
      <View style={{
        backgroundColor: LightTheme.Surface,
        borderRadius: 16,
        padding: Spacing.LG,
        margin: Spacing.MD,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.MD }}>
          <Text style={[Typography.titleMedium, { fontWeight: '600' }]}>
            AI Coaching Insights
          </Text>
          <View style={{
            backgroundColor: LightTheme.PrimaryContainer,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 12,
            flexDirection: 'row',
            alignItems: 'center',
          }}>
            <View style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: LightTheme.Primary,
              marginRight: 4,
            }} />
            <Text style={[Typography.bodySmall, { color: LightTheme.OnPrimaryContainer, fontSize: 10 }]}>
              {coachingInsights.filter(i => !i.isRead).length} New
            </Text>
          </View>
        </View>

        {coachingInsights.slice(0, 3).map((insight) => (
          <View key={insight.id} style={{
            backgroundColor: insight.isRead ? LightTheme.SurfaceVariant : LightTheme.PrimaryContainer + '30',
            borderRadius: 12,
            padding: Spacing.MD,
            marginBottom: Spacing.SM,
            borderLeftWidth: 4,
            borderLeftColor: insight.type === 'recommendation' ? '#2196F3' : 
                            insight.type === 'strength' ? '#4CAF50' : 
                            insight.type === 'improvement' ? '#FF9800' : '#9C27B0',
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.SM }}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Icon 
                    name={insight.type === 'recommendation' ? 'lightbulb' : 
                          insight.type === 'strength' ? 'star' : 
                          insight.type === 'improvement' ? 'trending-up' : 'flag'} 
                    size={16} 
                    color={insight.type === 'recommendation' ? '#2196F3' : 
                           insight.type === 'strength' ? '#4CAF50' : 
                           insight.type === 'improvement' ? '#FF9800' : '#9C27B0'} 
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[Typography.bodyMedium, { fontWeight: '600' }]}>
                    {insight.title}
                  </Text>
                </View>
                <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant }]}>
                  {insight.description}
                </Text>
              </View>
              <View style={{
                backgroundColor: insight.priority === 'high' ? '#FFEBEE' : 
                                insight.priority === 'medium' ? '#FFF3E0' : '#E8F5E8',
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 8,
              }}>
                <Text style={[Typography.bodySmall, {
                  color: insight.priority === 'high' ? '#D32F2F' : 
                         insight.priority === 'medium' ? '#F57C00' : '#2E7D32',
                  fontSize: 9,
                  textTransform: 'uppercase',
                  fontWeight: '600',
                }]}>
                  {insight.priority}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant, marginRight: Spacing.SM }]}>
                Confidence: {insight.confidenceScore}%
              </Text>
              <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant }]}>
                {insight.createdAt.toLocaleDateString()}
              </Text>
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={{
            backgroundColor: LightTheme.Primary,
            paddingVertical: 10,
            borderRadius: 12,
            alignItems: 'center',
            marginTop: Spacing.SM,
          }}
          onPress={() => setActiveTab('coaching')}
        >
          <Text style={[Typography.bodyMedium, { color: LightTheme.OnPrimary, fontWeight: '600' }]}>
            View All Insights
          </Text>
        </TouchableOpacity>
      </View>

      {/* Current Learning Paths */}
      <View style={{
        backgroundColor: LightTheme.Surface,
        borderRadius: 16,
        padding: Spacing.LG,
        margin: Spacing.MD,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      }}>
        <Text style={[Typography.titleMedium, { fontWeight: '600', marginBottom: Spacing.MD }]}>
          Active Learning Paths
        </Text>

        {learningPaths.map((path) => (
          <View key={path.id} style={{
            backgroundColor: LightTheme.SurfaceVariant,
            borderRadius: 12,
            padding: Spacing.MD,
            marginBottom: Spacing.SM,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.SM }}>
              <View style={{ flex: 1 }}>
                <Text style={[Typography.bodyLarge, { fontWeight: '600' }]}>
                  {path.title}
                </Text>
                <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant, marginTop: 2 }]}>
                  {path.description}
                </Text>
              </View>
              <View style={{
                backgroundColor: LightTheme.Primary + '20',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 12,
              }}>
                <Text style={[Typography.bodySmall, { color: LightTheme.Primary, fontSize: 10, fontWeight: '600' }]}>
                  AI Score: {path.aiRecommendationScore}%
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.SM }}>
              <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant }]}>
                {path.completedCredentials}/{path.totalCredentials} credentials completed
              </Text>
              <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant }]}>
                {path.estimatedWeeks} weeks
              </Text>
            </View>

            <View style={{
              height: 8,
              backgroundColor: LightTheme.Outline + '30',
              borderRadius: 4,
              marginBottom: Spacing.SM,
            }}>
              <View style={{
                height: '100%',
                width: `${(path.completedCredentials / path.totalCredentials) * 100}%`,
                backgroundColor: LightTheme.Primary,
                borderRadius: 4,
              }} />
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {path.focusAreas.slice(0, 3).map((area, index) => (
                <View key={index} style={{
                  backgroundColor: LightTheme.SecondaryContainer,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 12,
                  marginRight: 6,
                  marginBottom: 4,
                }}>
                  <Text style={[Typography.bodySmall, { color: LightTheme.OnSecondaryContainer, fontSize: 10 }]}>
                    {area}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={{
            backgroundColor: LightTheme.Secondary,
            paddingVertical: 10,
            borderRadius: 12,
            alignItems: 'center',
            marginTop: Spacing.SM,
          }}
          onPress={() => setActiveTab('paths')}
        >
          <Text style={[Typography.bodyMedium, { color: LightTheme.OnSecondary, fontWeight: '600' }]}>
            Explore Learning Paths
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderCredentials = () => (
    <View style={{ flex: 1 }}>
      {/* Search and Filter */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.MD,
        paddingVertical: Spacing.SM,
      }}>
        <View style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: LightTheme.Surface,
          borderRadius: 25,
          paddingHorizontal: Spacing.MD,
          elevation: 1,
        }}>
          <Icon name="search" size={20} color={LightTheme.OnSurfaceVariant} />
          <TextInput
            placeholder="Search credentials..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[Typography.bodyMedium, { flex: 1, paddingHorizontal: Spacing.SM, paddingVertical: Spacing.SM }]}
          />
        </View>
      </View>

      {/* Category Filter */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={{ paddingHorizontal: Spacing.MD, marginBottom: Spacing.SM }}
      >
        {['all', 'teaching', 'technology', 'assessment', 'management', 'special-needs'].map((category) => (
          <TouchableOpacity
            key={category}
            onPress={() => setSelectedCategory(category)}
            style={{
              backgroundColor: selectedCategory === category ? LightTheme.Primary : LightTheme.SurfaceVariant,
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              marginRight: 8,
            }}
          >
            <Text style={[Typography.bodySmall, {
              color: selectedCategory === category ? LightTheme.OnPrimary : LightTheme.OnSurfaceVariant,
              fontWeight: selectedCategory === category ? '600' : '400',
              textTransform: 'capitalize',
            }]}>
              {category === 'special-needs' ? 'Special Needs' : category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Credentials List */}
      <FlatList
        data={microCredentials.filter(cred => 
          selectedCategory === 'all' || cred.category === selectedCategory
        )}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => {
              setSelectedCredential(item);
              setShowDetails(true);
            }}
            style={{
              backgroundColor: LightTheme.Surface,
              borderRadius: 12,
              padding: Spacing.MD,
              marginHorizontal: Spacing.MD,
              marginBottom: Spacing.SM,
              elevation: 2,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.SM }}>
              <View style={{ flex: 1 }}>
                <Text style={[Typography.titleSmall, { fontWeight: '600' }]}>
                  {item.title}
                </Text>
                <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant, marginTop: 2 }]}>
                  {item.description}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                {item.isCompleted ? (
                  <View style={{
                    backgroundColor: '#E8F5E8',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}>
                    <Icon name="verified" size={14} color="#2E7D32" />
                    <Text style={[Typography.bodySmall, { color: '#2E7D32', marginLeft: 4, fontSize: 10 }]}>
                      Certified
                    </Text>
                  </View>
                ) : (
                  <View style={{
                    backgroundColor: LightTheme.PrimaryContainer,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 12,
                  }}>
                    <Text style={[Typography.bodySmall, { color: LightTheme.OnPrimaryContainer, fontSize: 10 }]}>
                      {item.progress}% Complete
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.SM }}>
              <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant }]}>
                Level: {item.level} • {item.estimatedHours}h • {item.credentialValue} points
              </Text>
              <Text style={[Typography.bodySmall, { color: LightTheme.Primary, fontWeight: '500' }]}>
                {item.issuer}
              </Text>
            </View>

            {!item.isCompleted && (
              <View style={{
                height: 4,
                backgroundColor: LightTheme.SurfaceVariant,
                borderRadius: 2,
                marginBottom: Spacing.SM,
              }}>
                <View style={{
                  height: '100%',
                  width: `${item.progress}%`,
                  backgroundColor: LightTheme.Primary,
                  borderRadius: 2,
                }} />
              </View>
            )}

            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {item.skills.slice(0, 3).map((skill, index) => (
                <View key={index} style={{
                  backgroundColor: LightTheme.TertiaryContainer,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 8,
                  marginRight: 4,
                  marginBottom: 2,
                }}>
                  <Text style={[Typography.bodySmall, { color: LightTheme.OnTertiaryContainer, fontSize: 9 }]}>
                    {skill}
                  </Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        )}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );

  // Learning Paths Component
  const renderLearningPaths = () => {
    const [selectedPath, setSelectedPath] = useState(null);
    const [pathFilter, setPathFilter] = useState('recommended');

    const learningPaths = [
      {
        id: '1',
        title: 'Digital Literacy for Modern Teaching',
        description: 'Master essential digital tools and platforms for effective online and blended learning.',
        totalCredentials: 8,
        completedCredentials: 3,
        estimatedWeeks: 12,
        difficulty: 'intermediate',
        focusAreas: ['Technology Integration', 'Online Teaching', 'Digital Assessment'],
        aiRecommendationScore: 95,
        enrolledDate: new Date(),
        targetCompletionDate: new Date(Date.now() + 12 * 7 * 24 * 60 * 60 * 1000),
        status: 'in_progress',
      },
      {
        id: '2',
        title: 'Inclusive Education Specialist',
        description: 'Develop skills to create inclusive learning environments for all students.',
        totalCredentials: 6,
        completedCredentials: 0,
        estimatedWeeks: 10,
        difficulty: 'advanced',
        focusAreas: ['Special Needs', 'Differentiated Instruction', 'Accessibility'],
        aiRecommendationScore: 88,
        enrolledDate: null,
        targetCompletionDate: null,
        status: 'recommended',
      },
      {
        id: '3',
        title: 'Data-Driven Instruction',
        description: 'Learn to use student data effectively to improve teaching outcomes.',
        totalCredentials: 5,
        completedCredentials: 5,
        estimatedWeeks: 8,
        difficulty: 'intermediate',
        focusAreas: ['Analytics', 'Assessment', 'Student Progress'],
        aiRecommendationScore: 82,
        enrolledDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        targetCompletionDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        status: 'completed',
      },
    ];

    return (
      <ScrollView style={{ flex: 1 }}>
        {/* Filter Tabs */}
        <View style={{
          flexDirection: 'row',
          backgroundColor: LightTheme.Surface,
          padding: Spacing.MD,
          marginBottom: Spacing.MD,
        }}>
          {[
            { key: 'recommended', label: 'Recommended', count: 1 },
            { key: 'enrolled', label: 'In Progress', count: 1 },
            { key: 'completed', label: 'Completed', count: 1 },
            { key: 'all', label: 'All Paths', count: learningPaths.length },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setPathFilter(tab.key)}
              style={{
                backgroundColor: pathFilter === tab.key ? LightTheme.Primary : 'transparent',
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 20,
                marginRight: 8,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Text style={{
                color: pathFilter === tab.key ? LightTheme.OnPrimary : LightTheme.OnSurface,
                fontSize: 12,
                fontWeight: '500',
              }}>
                {tab.label}
              </Text>
              <View style={{
                backgroundColor: pathFilter === tab.key ? LightTheme.OnPrimary : LightTheme.Primary,
                borderRadius: 10,
                paddingHorizontal: 6,
                paddingVertical: 2,
                marginLeft: 4,
              }}>
                <Text style={{
                  color: pathFilter === tab.key ? LightTheme.Primary : LightTheme.OnPrimary,
                  fontSize: 10,
                  fontWeight: '600',
                }}>
                  {tab.count}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Learning Paths List */}
        <View style={{ paddingHorizontal: Spacing.MD }}>
          {learningPaths.map((path) => (
            <TouchableOpacity
              key={path.id}
              onPress={() => setSelectedPath(selectedPath === path.id ? null : path.id)}
              style={{
                backgroundColor: LightTheme.Surface,
                borderRadius: 12,
                padding: Spacing.MD,
                marginBottom: Spacing.MD,
                elevation: 2,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.SM }}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={[Typography.titleMedium, { fontWeight: '600', flex: 1 }]}>{path.title}</Text>
                    {path.aiRecommendationScore >= 90 && (
                      <View style={{
                        backgroundColor: '#4CAF50',
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 8,
                      }}>
                        <Text style={{ color: '#FFF', fontSize: 8, fontWeight: '600' }}>AI MATCH</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[Typography.bodyMedium, { color: LightTheme.OnSurfaceVariant, marginBottom: 8 }]}>
                    {path.description}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant }]}>
                      {path.completedCredentials}/{path.totalCredentials} credentials • {path.estimatedWeeks} weeks
                    </Text>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <View style={{
                    backgroundColor: 
                      path.status === 'completed' ? '#E8F5E8' :
                      path.status === 'in_progress' ? '#E3F2FD' : '#FFF3E0',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 12,
                  }}>
                    <Text style={{
                      color: 
                        path.status === 'completed' ? '#2E7D32' :
                        path.status === 'in_progress' ? '#1976D2' : '#F57C00',
                      fontSize: 10,
                      fontWeight: '600',
                    }}>
                      {path.status.toUpperCase().replace('_', ' ')}
                    </Text>
                  </View>
                  {path.status !== 'recommended' && (
                    <Text style={[Typography.titleSmall, { fontWeight: '600', marginTop: 4 }]}>
                      {Math.round((path.completedCredentials / path.totalCredentials) * 100)}%
                    </Text>
                  )}
                </View>
              </View>

              {/* Progress Bar */}
              {path.status !== 'recommended' && (
                <View style={{ marginBottom: Spacing.SM }}>
                  <View style={{
                    height: 6,
                    backgroundColor: LightTheme.SurfaceVariant,
                    borderRadius: 3,
                  }}>
                    <View style={{
                      height: '100%',
                      width: `${(path.completedCredentials / path.totalCredentials) * 100}%`,
                      backgroundColor: path.status === 'completed' ? '#4CAF50' : LightTheme.Primary,
                      borderRadius: 3,
                    }} />
                  </View>
                </View>
              )}

              {/* Focus Areas */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: Spacing.SM }}>
                {path.focusAreas.map((area, index) => (
                  <View key={index} style={{
                    backgroundColor: LightTheme.PrimaryContainer,
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 12,
                    marginRight: 6,
                    marginBottom: 4,
                  }}>
                    <Text style={{
                      color: LightTheme.OnPrimaryContainer,
                      fontSize: 10,
                      fontWeight: '500',
                    }}>
                      {area}
                    </Text>
                  </View>
                ))}
              </View>

              {selectedPath === path.id && (
                <View style={{ marginTop: Spacing.MD, paddingTop: Spacing.MD, borderTopWidth: 1, borderTopColor: LightTheme.Outline }}>
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: Spacing.MD }}>
                    <TouchableOpacity style={{
                      backgroundColor: LightTheme.Primary,
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 8,
                      flex: 1,
                    }}>
                      <Text style={[Typography.bodySmall, { color: LightTheme.OnPrimary, textAlign: 'center' }]}>
                        {path.status === 'recommended' ? 'Enroll Now' : 'Continue Learning'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{
                      backgroundColor: LightTheme.SecondaryContainer,
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 8,
                      flex: 1,
                    }}>
                      <Text style={[Typography.bodySmall, { color: LightTheme.OnSecondaryContainer, textAlign: 'center' }]}>
                        View Details
                      </Text>
                    </TouchableOpacity>
                  </View>
                  
                  {path.status === 'in_progress' && (
                    <View>
                      <Text style={[Typography.bodySmall, { fontWeight: '600', marginBottom: 8 }]}>
                        Next Milestone:
                      </Text>
                      <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant }]}>
                        Complete "Advanced Digital Assessment Tools" by {path.targetCompletionDate?.toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    );
  };

  // AI Coaching Component
  const renderAICoaching = () => {
    const [selectedInsight, setSelectedInsight] = useState(null);
    const [coachingMode, setCoachingMode] = useState('insights');

    const coachingInsights = [
      {
        id: '1',
        type: 'performance',
        title: 'Student Engagement Opportunity',
        summary: 'Your Math class shows 15% lower engagement during afternoon sessions.',
        recommendation: 'Try incorporating more interactive activities between 2-4 PM.',
        priority: 'high',
        impact: '85% confidence',
        aiConfidence: 92,
        evidence: [
          'Average attention span: 12 minutes (afternoon) vs 18 minutes (morning)',
          'Question participation down 23% after lunch',
          'Assignment completion rates: 78% afternoon vs 91% morning'
        ],
        suggestedActions: [
          'Add 5-minute energizer activities every 15 minutes',
          'Use gamified elements for afternoon lessons',
          'Consider flipped classroom approach for complex topics'
        ]
      },
      {
        id: '2',
        type: 'curriculum',
        title: 'Lesson Pacing Optimization',
        summary: 'Students need 20% more time on fractions unit based on assessment data.',
        recommendation: 'Extend fractions coverage by 2 additional days with practice focus.',
        priority: 'medium',
        impact: '78% confidence',
        aiConfidence: 87,
        evidence: [
          'Average score on fractions quiz: 68% (target: 80%)',
          '45% of students requested additional help',
          'Time-on-task analysis shows rushing in final 25%'
        ],
        suggestedActions: [
          'Add manipulative-based activities',
          'Create peer tutoring pairs',
          'Implement spiral review approach'
        ]
      },
    ];

    const performanceMetrics = {
      teachingEffectiveness: 87,
      studentOutcomes: 91,
      engagementLevel: 83,
      contentMastery: 89,
      classroomManagement: 85,
    };

    return (
      <ScrollView style={{ flex: 1 }}>
        {/* AI Coach Header */}
        <View style={{
          backgroundColor: LightTheme.PrimaryContainer,
          padding: Spacing.LG,
          marginBottom: Spacing.MD,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.SM }}>
            <Icon name="psychology" size={24} color={LightTheme.OnPrimaryContainer} />
            <Text style={[Typography.titleLarge, { 
              fontWeight: '600', 
              color: LightTheme.OnPrimaryContainer,
              marginLeft: 8 
            }]}>
              AI Teaching Coach
            </Text>
          </View>
          <Text style={[Typography.bodyMedium, { color: LightTheme.OnPrimaryContainer }]}>
            Personalized insights and recommendations based on your teaching data
          </Text>
        </View>

        {/* Mode Selector */}
        <View style={{
          flexDirection: 'row',
          backgroundColor: LightTheme.Surface,
          padding: Spacing.MD,
          marginBottom: Spacing.MD,
        }}>
          {[
            { key: 'insights', label: 'Smart Insights', icon: 'lightbulb' },
            { key: 'metrics', label: 'Performance', icon: 'trending-up' },
            { key: 'goals', label: 'Goals', icon: 'flag' },
          ].map((mode) => (
            <TouchableOpacity
              key={mode.key}
              onPress={() => setCoachingMode(mode.key)}
              style={{
                backgroundColor: coachingMode === mode.key ? LightTheme.Primary : 'transparent',
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                marginRight: 8,
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon 
                name={mode.icon} 
                size={16} 
                color={coachingMode === mode.key ? LightTheme.OnPrimary : LightTheme.OnSurface}
                style={{ marginRight: 6 }}
              />
              <Text style={{
                color: coachingMode === mode.key ? LightTheme.OnPrimary : LightTheme.OnSurface,
                fontSize: 12,
                fontWeight: '500',
              }}>
                {mode.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content Based on Mode */}
        <View style={{ paddingHorizontal: Spacing.MD }}>
          {coachingMode === 'insights' && (
            <View>
              <Text style={[Typography.titleMedium, { fontWeight: '600', marginBottom: Spacing.MD }]}>
                Today's AI Insights
              </Text>
              {coachingInsights.map((insight) => (
                <TouchableOpacity
                  key={insight.id}
                  onPress={() => setSelectedInsight(selectedInsight === insight.id ? null : insight.id)}
                  style={{
                    backgroundColor: LightTheme.Surface,
                    borderRadius: 12,
                    padding: Spacing.MD,
                    marginBottom: Spacing.MD,
                    elevation: 2,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 2,
                    borderLeftWidth: 4,
                    borderLeftColor: insight.priority === 'high' ? '#FF5722' : '#FF9800',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.SM }}>
                    <View style={{ flex: 1 }}>
                      <Text style={[Typography.titleMedium, { fontWeight: '600' }]}>{insight.title}</Text>
                      <Text style={[Typography.bodyMedium, { color: LightTheme.OnSurfaceVariant, marginTop: 4 }]}>
                        {insight.summary}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <View style={{
                        backgroundColor: insight.priority === 'high' ? '#FFEBEE' : '#FFF3E0',
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 12,
                      }}>
                        <Text style={{
                          color: insight.priority === 'high' ? '#C62828' : '#F57C00',
                          fontSize: 10,
                          fontWeight: '600',
                        }}>
                          {insight.priority.toUpperCase()}
                        </Text>
                      </View>
                      <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant, marginTop: 4 }]}>
                        {insight.aiConfidence}% confident
                      </Text>
                    </View>
                  </View>

                  <View style={{
                    backgroundColor: LightTheme.PrimaryContainer,
                    padding: Spacing.SM,
                    borderRadius: 8,
                    marginBottom: Spacing.SM,
                  }}>
                    <Text style={[Typography.bodySmall, { color: LightTheme.OnPrimaryContainer, fontWeight: '600' }]}>
                      💡 Recommendation: {insight.recommendation}
                    </Text>
                  </View>

                  {selectedInsight === insight.id && (
                    <View style={{ marginTop: Spacing.MD, paddingTop: Spacing.MD, borderTopWidth: 1, borderTopColor: LightTheme.Outline }}>
                      <Text style={[Typography.bodyMedium, { fontWeight: '600', marginBottom: Spacing.SM }]}>
                        Supporting Evidence:
                      </Text>
                      {insight.evidence.map((evidence, index) => (
                        <Text key={index} style={[Typography.bodySmall, { 
                          color: LightTheme.OnSurfaceVariant, 
                          marginBottom: 4,
                          marginLeft: 8 
                        }]}>
                          • {evidence}
                        </Text>
                      ))}

                      <Text style={[Typography.bodyMedium, { fontWeight: '600', marginTop: Spacing.MD, marginBottom: Spacing.SM }]}>
                        Suggested Actions:
                      </Text>
                      {insight.suggestedActions.map((action, index) => (
                        <TouchableOpacity key={index} style={{
                          backgroundColor: LightTheme.Surface,
                          padding: Spacing.SM,
                          borderRadius: 8,
                          marginBottom: 4,
                          borderLeftWidth: 2,
                          borderLeftColor: LightTheme.Primary,
                        }}>
                          <Text style={[Typography.bodySmall, { color: LightTheme.OnSurface }]}>
                            {action}
                          </Text>
                        </TouchableOpacity>
                      ))}

                      <View style={{ flexDirection: 'row', marginTop: Spacing.MD, gap: 8 }}>
                        <TouchableOpacity style={{
                          backgroundColor: LightTheme.Primary,
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 6,
                          flex: 1,
                        }}>
                          <Text style={[Typography.bodySmall, { color: LightTheme.OnPrimary, textAlign: 'center' }]}>
                            Apply Suggestion
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={{
                          backgroundColor: LightTheme.Outline,
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 6,
                          flex: 1,
                        }}>
                          <Text style={[Typography.bodySmall, { color: LightTheme.OnSurface, textAlign: 'center' }]}>
                            Dismiss
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {coachingMode === 'metrics' && (
            <View>
              <Text style={[Typography.titleMedium, { fontWeight: '600', marginBottom: Spacing.MD }]}>
                Performance Analytics
              </Text>
              
              <View style={{
                backgroundColor: LightTheme.Surface,
                borderRadius: 12,
                padding: Spacing.MD,
                marginBottom: Spacing.MD,
              }}>
                {Object.entries(performanceMetrics).map(([key, value]) => (
                  <View key={key} style={{ marginBottom: Spacing.MD }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <Text style={[Typography.bodyMedium, { textTransform: 'capitalize' }]}>
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </Text>
                      <Text style={[Typography.titleSmall, { fontWeight: '600' }]}>{value}%</Text>
                    </View>
                    <View style={{
                      height: 8,
                      backgroundColor: LightTheme.SurfaceVariant,
                      borderRadius: 4,
                    }}>
                      <View style={{
                        height: '100%',
                        width: `${value}%`,
                        backgroundColor: 
                          value >= 90 ? '#4CAF50' :
                          value >= 80 ? '#FF9800' :
                          value >= 70 ? '#FF5722' : '#F44336',
                        borderRadius: 4,
                      }} />
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    );
  };

  // Peer Mentors Component  
  const renderPeerMentors = () => {
    const [mentorMode, setMentorMode] = useState('find');
    const [selectedMentor, setSelectedMentor] = useState(null);

    const availableMentors = [
      {
        id: '1',
        name: 'Dr. Sarah Chen',
        specialization: 'STEM Education',
        experience: '15 years',
        rating: 4.9,
        location: 'California, USA',
        languages: ['English', 'Mandarin'],
        expertise: ['Physics', 'Mathematics', 'Educational Technology'],
        mentorshipStyle: 'Collaborative Problem-Solving',
        availability: 'Weekends, Evenings IST',
        menteesCount: 12,
        completedSessions: 156,
        responseTime: '< 4 hours',
        pricePerSession: '$50',
        bio: 'Passionate about making STEM accessible to all students. 15 years of experience in innovative teaching methods.',
      },
      {
        id: '2',
        name: 'Prof. Rajesh Gupta',
        specialization: 'Classroom Management',
        experience: '20 years',
        rating: 4.8,
        location: 'Mumbai, India',
        languages: ['Hindi', 'English', 'Marathi'],
        expertise: ['Behavior Management', 'Parent Communication', 'Student Motivation'],
        mentorshipStyle: 'Practical Guidance',
        availability: 'Flexible IST',
        menteesCount: 28,
        completedSessions: 342,
        responseTime: '< 2 hours',
        pricePerSession: '₹2000',
        bio: 'Helping teachers create positive learning environments. Expert in Indian education system challenges.',
      },
    ];

    const myMentorships = [
      {
        id: '1',
        mentorName: 'Dr. Sarah Chen',
        role: 'mentee',
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        totalSessions: 8,
        upcomingSession: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        focusAreas: ['STEM Pedagogy', 'Student Engagement'],
        progress: 75,
      },
    ];

    return (
      <ScrollView style={{ flex: 1 }}>
        {/* Header */}
        <View style={{
          backgroundColor: LightTheme.Surface,
          padding: Spacing.LG,
          marginBottom: Spacing.MD,
        }}>
          <Text style={[Typography.titleLarge, { fontWeight: '600', marginBottom: Spacing.SM }]}>
            Peer Mentorship Network
          </Text>
          <Text style={[Typography.bodyMedium, { color: LightTheme.OnSurfaceVariant }]}>
            Connect with experienced educators for guidance and growth
          </Text>
        </View>

        {/* Mode Selector */}
        <View style={{
          flexDirection: 'row',
          backgroundColor: LightTheme.Surface,
          padding: Spacing.MD,
          marginBottom: Spacing.MD,
        }}>
          {[
            { key: 'find', label: 'Find Mentors', count: availableMentors.length },
            { key: 'my', label: 'My Mentorships', count: myMentorships.length },
            { key: 'sessions', label: 'Sessions', count: 3 },
          ].map((mode) => (
            <TouchableOpacity
              key={mode.key}
              onPress={() => setMentorMode(mode.key)}
              style={{
                backgroundColor: mentorMode === mode.key ? LightTheme.Primary : 'transparent',
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                marginRight: 8,
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{
                color: mentorMode === mode.key ? LightTheme.OnPrimary : LightTheme.OnSurface,
                fontSize: 12,
                fontWeight: '500',
                marginRight: 4,
              }}>
                {mode.label}
              </Text>
              <View style={{
                backgroundColor: mentorMode === mode.key ? LightTheme.OnPrimary : LightTheme.Primary,
                borderRadius: 8,
                paddingHorizontal: 4,
                paddingVertical: 2,
              }}>
                <Text style={{
                  color: mentorMode === mode.key ? LightTheme.Primary : LightTheme.OnPrimary,
                  fontSize: 8,
                  fontWeight: '600',
                }}>
                  {mode.count}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content */}
        <View style={{ paddingHorizontal: Spacing.MD }}>
          {mentorMode === 'find' && (
            <View>
              <Text style={[Typography.titleMedium, { fontWeight: '600', marginBottom: Spacing.MD }]}>
                Available Mentors
              </Text>
              
              {availableMentors.map((mentor) => (
                <TouchableOpacity
                  key={mentor.id}
                  onPress={() => setSelectedMentor(selectedMentor === mentor.id ? null : mentor.id)}
                  style={{
                    backgroundColor: LightTheme.Surface,
                    borderRadius: 12,
                    padding: Spacing.MD,
                    marginBottom: Spacing.MD,
                    elevation: 2,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 2,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.SM }}>
                    <View style={{
                      width: 50,
                      height: 50,
                      borderRadius: 25,
                      backgroundColor: LightTheme.PrimaryContainer,
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 12,
                    }}>
                      <Text style={[Typography.titleMedium, { color: LightTheme.OnPrimaryContainer }]}>
                        {mentor.name?.split(' ').map(n => n?.[0] || '').join('') || 'U'}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[Typography.titleMedium, { fontWeight: '600' }]}>{mentor.name}</Text>
                      <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant }]}>
                        {mentor.specialization} • {mentor.experience}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                        <Icon name="star" size={14} color="#FFD700" />
                        <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant, marginLeft: 4 }]}>
                          {mentor.rating} • {mentor.completedSessions} sessions
                        </Text>
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[Typography.titleSmall, { fontWeight: '600', color: LightTheme.Primary }]}>
                        {mentor.pricePerSession}
                      </Text>
                      <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant }]}>
                        per session
                      </Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: Spacing.SM }}>
                    {mentor.expertise.slice(0, 3).map((skill, index) => (
                      <View key={index} style={{
                        backgroundColor: LightTheme.SurfaceVariant,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 12,
                        marginRight: 6,
                        marginBottom: 4,
                      }}>
                        <Text style={{
                          color: LightTheme.OnSurfaceVariant,
                          fontSize: 10,
                          fontWeight: '500',
                        }}>
                          {skill}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {selectedMentor === mentor.id && (
                    <View style={{ marginTop: Spacing.MD, paddingTop: Spacing.MD, borderTopWidth: 1, borderTopColor: LightTheme.Outline }}>
                      <Text style={[Typography.bodyMedium, { marginBottom: Spacing.SM }]}>{mentor.bio}</Text>
                      
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.SM }}>
                        <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant }]}>
                          📍 {mentor.location}
                        </Text>
                        <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant }]}>
                          ⏰ {mentor.availability}
                        </Text>
                      </View>

                      <View style={{ flexDirection: 'row', marginTop: Spacing.MD, gap: 8 }}>
                        <TouchableOpacity style={{
                          backgroundColor: LightTheme.Primary,
                          paddingHorizontal: 16,
                          paddingVertical: 8,
                          borderRadius: 8,
                          flex: 1,
                        }}>
                          <Text style={[Typography.bodySmall, { color: LightTheme.OnPrimary, textAlign: 'center' }]}>
                            Request Mentorship
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={{
                          backgroundColor: LightTheme.SecondaryContainer,
                          paddingHorizontal: 16,
                          paddingVertical: 8,
                          borderRadius: 8,
                          flex: 1,
                        }}>
                          <Text style={[Typography.bodySmall, { color: LightTheme.OnSecondaryContainer, textAlign: 'center' }]}>
                            Send Message
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {mentorMode === 'my' && (
            <View>
              <Text style={[Typography.titleMedium, { fontWeight: '600', marginBottom: Spacing.MD }]}>
                Active Mentorships
              </Text>
              
              {myMentorships.map((mentorship) => (
                <View key={mentorship.id} style={{
                  backgroundColor: LightTheme.Surface,
                  borderRadius: 12,
                  padding: Spacing.MD,
                  marginBottom: Spacing.MD,
                  elevation: 2,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                }}>
                  <Text style={[Typography.titleMedium, { fontWeight: '600', marginBottom: 4 }]}>
                    Mentorship with {mentorship.mentorName}
                  </Text>
                  <Text style={[Typography.bodySmall, { color: LightTheme.OnSurfaceVariant, marginBottom: Spacing.SM }]}>
                    Started {mentorship.startDate.toLocaleDateString()} • {mentorship.totalSessions} sessions completed
                  </Text>

                  <View style={{ marginBottom: Spacing.SM }}>
                    <Text style={[Typography.bodySmall, { fontWeight: '600', marginBottom: 4 }]}>Progress: {mentorship.progress}%</Text>
                    <View style={{
                      height: 6,
                      backgroundColor: LightTheme.SurfaceVariant,
                      borderRadius: 3,
                    }}>
                      <View style={{
                        height: '100%',
                        width: `${mentorship.progress}%`,
                        backgroundColor: LightTheme.Primary,
                        borderRadius: 3,
                      }} />
                    </View>
                  </View>

                  <View style={{
                    backgroundColor: LightTheme.PrimaryContainer,
                    padding: Spacing.SM,
                    borderRadius: 8,
                    marginBottom: Spacing.SM,
                  }}>
                    <Text style={[Typography.bodySmall, { color: LightTheme.OnPrimaryContainer, fontWeight: '600' }]}>
                      Next Session: {mentorship.upcomingSession.toLocaleDateString()} at 7:00 PM IST
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity style={{
                      backgroundColor: LightTheme.Primary,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 6,
                      flex: 1,
                    }}>
                      <Text style={[Typography.bodySmall, { color: LightTheme.OnPrimary, textAlign: 'center' }]}>
                        Join Session
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{
                      backgroundColor: LightTheme.Outline,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 6,
                      flex: 1,
                    }}>
                      <Text style={[Typography.bodySmall, { color: LightTheme.OnSurface, textAlign: 'center' }]}>
                        View Notes
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return renderDashboard();
      case 'credentials':
        return renderCredentials();
      case 'paths':
        return renderLearningPaths();
      case 'coaching':
        return renderAICoaching();
      case 'mentors':
        return renderPeerMentors();
      default:
        return renderDashboard();
    }
  };

  const renderAppBar = () => (
    <Appbar.Header elevated style={{ backgroundColor: '#059669' }}>
      <Appbar.BackAction onPress={() => onNavigate('back')} />
      <Appbar.Content title="Professional Development" subtitle="AI-powered teacher growth" />
      <Appbar.Action icon="school" onPress={() => setActiveTab('credentials')} />
      <Appbar.Action icon="account-supervisor" onPress={() => setActiveTab('mentors')} />
    </Appbar.Header>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: LightTheme.Background }}>
        <StatusBar barStyle="light-content" backgroundColor="#059669" />
        {renderAppBar()}
        <View style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: LightTheme.Background,
          gap: Spacing.MD,
        }}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={{
            fontSize: Typography.bodyMedium.fontSize,
            color: LightTheme.OnSurfaceVariant,
            marginTop: Spacing.MD,
          }}>Loading professional development...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: LightTheme.Background }}>
      <StatusBar barStyle="light-content" backgroundColor="#059669" />
      {renderAppBar()}

      {/* Tab Navigation */}
      <View style={{
        flexDirection: 'row',
        backgroundColor: LightTheme.Surface,
        paddingHorizontal: Spacing.MD,
        paddingVertical: Spacing.SM,
      }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { key: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
            { key: 'credentials', label: 'Credentials', icon: 'badge' },
            { key: 'paths', label: 'Learning Paths', icon: 'route' },
            { key: 'coaching', label: 'AI Coaching', icon: 'psychology' },
            { key: 'mentors', label: 'Mentors', icon: 'supervisor-account' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key as any)}
              style={{
                alignItems: 'center',
                paddingVertical: 8,
                paddingHorizontal: 12,
                marginRight: 8,
                borderRadius: 20,
                backgroundColor: activeTab === tab.key ? LightTheme.Primary : 'transparent',
                minWidth: 80,
              }}
            >
              <Icon
                name={tab.icon}
                size={18}
                color={activeTab === tab.key ? LightTheme.OnPrimary : LightTheme.OnSurfaceVariant}
              />
              <Text style={[
                Typography.bodySmall,
                {
                  marginTop: 2,
                  color: activeTab === tab.key ? LightTheme.OnPrimary : LightTheme.OnSurfaceVariant,
                  fontWeight: activeTab === tab.key ? '600' : '400',
                  fontSize: 10,
                },
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        {renderTabContent()}
      </View>

      {/* Credential Details Modal */}
      <Modal visible={showDetails} transparent animationType="slide">
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'flex-end',
        }}>
          <View style={{
            backgroundColor: LightTheme.Surface,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: Spacing.LG,
            maxHeight: '80%',
          }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: Spacing.LG,
            }}>
              <Text style={[Typography.titleMedium, { fontWeight: '600' }]}>
                Credential Details
              </Text>
              <TouchableOpacity onPress={() => setShowDetails(false)}>
                <Icon name="close" size={24} color={LightTheme.OnSurface} />
              </TouchableOpacity>
            </View>

            {selectedCredential && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={[Typography.titleMedium, { fontWeight: '600', marginBottom: Spacing.SM }]}>
                  {selectedCredential.title}
                </Text>
                <Text style={[Typography.bodyMedium, { color: LightTheme.OnSurfaceVariant, marginBottom: Spacing.LG }]}>
                  {selectedCredential.description}
                </Text>

                <View style={{
                  backgroundColor: LightTheme.SurfaceVariant,
                  padding: Spacing.MD,
                  borderRadius: 12,
                  marginBottom: Spacing.MD,
                }}>
                  <Text style={[Typography.bodySmall, { fontWeight: '600', marginBottom: Spacing.SM }]}>
                    Credential Information
                  </Text>
                  <Text style={[Typography.bodySmall, { marginBottom: 4 }]}>
                    Level: <Text style={{ fontWeight: '600' }}>{selectedCredential.level}</Text>
                  </Text>
                  <Text style={[Typography.bodySmall, { marginBottom: 4 }]}>
                    Duration: <Text style={{ fontWeight: '600' }}>{selectedCredential.estimatedHours} hours</Text>
                  </Text>
                  <Text style={[Typography.bodySmall, { marginBottom: 4 }]}>
                    Value: <Text style={{ fontWeight: '600' }}>{selectedCredential.credentialValue} points</Text>
                  </Text>
                  <Text style={[Typography.bodySmall]}>
                    Issuer: <Text style={{ fontWeight: '600' }}>{selectedCredential.issuer}</Text>
                  </Text>
                </View>

                {selectedCredential.blockchainHash && (
                  <View style={{
                    backgroundColor: '#E8F5E8',
                    padding: Spacing.MD,
                    borderRadius: 12,
                    marginBottom: Spacing.MD,
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.SM }}>
                      <Icon name="verified-user" size={20} color="#2E7D32" />
                      <Text style={[Typography.bodyMedium, { fontWeight: '600', marginLeft: 8, color: '#2E7D32' }]}>
                        Blockchain Verified
                      </Text>
                    </View>
                    <Text style={[Typography.bodySmall, { color: '#2E7D32' }]}>
                      Hash: {selectedCredential.blockchainHash}
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={{
                    backgroundColor: selectedCredential.isCompleted ? LightTheme.Secondary : LightTheme.Primary,
                    paddingVertical: 12,
                    borderRadius: 25,
                    alignItems: 'center',
                    marginTop: Spacing.MD,
                  }}
                  onPress={() => setShowDetails(false)}
                >
                  <Text style={[Typography.bodyMedium, {
                    color: selectedCredential.isCompleted ? LightTheme.OnSecondary : LightTheme.OnPrimary,
                    fontWeight: '600'
                  }]}>
                    {selectedCredential.isCompleted ? 'View Certificate' : 'Continue Learning'}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <Portal>
        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={3000}
          action={{
            label: 'Dismiss',
            onPress: () => setSnackbarVisible(false),
          }}
        >
          {snackbarMessage}
        </Snackbar>
      </Portal>
    </SafeAreaView>
  );
};

export default TeacherProfessionalDevelopment;