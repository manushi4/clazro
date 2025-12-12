/**
 * AI Study Assistant Service
 * Handles AI-powered personalized learning recommendations, study plans, and adaptive learning
 *
 * NOTE: Currently using mock data with sophisticated AI logic simulation.
 * Will integrate with real AI backend (OpenAI, Claude, or custom LLM) once API keys are configured.
 *
 * Features:
 * - Personalized study recommendations based on learning patterns
 * - Adaptive study plans with progress tracking
 * - AI-generated practice questions
 * - Learning analytics and performance prediction
 * - Smart reminders and scheduling
 * - Study library integration and cross-referencing
 * - Conversational AI tutor (Khanmigo-style)
 */

export interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

// ==================== INTERFACES ====================

export interface StudyPlan {
  id: string;
  subject: string;
  title: string;
  description: string;
  estimatedTime: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  topics: string[];
  progress: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  studentId: string;
}

export interface AIRecommendation {
  id: string;
  type: 'study' | 'practice' | 'review' | 'concept';
  title: string;
  description: string;
  confidence: number;
  reasoning: string;
  estimatedTime: string;
  priority: 'high' | 'medium' | 'low';
  subject: string;
  createdAt: string;
}

export interface PracticeQuestion {
  id: string;
  subject: string;
  topic: string;
  question: string;
  difficulty: 'easy' | 'medium' | 'hard';
  hints: string[];
  explanation: string;
  isAnswered: boolean;
  createdAt: string;
}

export interface LearningStyle {
  type: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  confidence: number;
  characteristics: string[];
  detectedAt: string;
}

export interface LearningAnalytics {
  studyStreak: number;
  averageSessionLength: number;
  preferredStudyTimes: string[];
  mostProductiveDay: string;
  completionRate: number;
  improvementTrend: 'improving' | 'stable' | 'declining';
  attentionSpan: number; // in minutes
  retentionRate: number;
  lastUpdated: string;
}

export interface PerformancePrediction {
  subjectConfidence: { [subject: string]: number };
  upcomingChallenges: string[];
  recommendedInterventions: string[];
  successProbability: number;
  nextWeekForecast: 'excellent' | 'good' | 'needs_attention' | 'at_risk';
  predictedAt: string;
}

export interface SmartReminder {
  id: string;
  type: 'study_session' | 'review' | 'practice' | 'break';
  title: string;
  message: string;
  scheduledTime: string;
  priority: 'high' | 'medium' | 'low';
  isActive: boolean;
  adaptiveReason: string;
  studentId: string;
}

export interface StudyLibraryIntegration {
  recentlyAccessed: string[];
  recommendedFromLibrary: string[];
  crossReferenceTopics: { [topic: string]: string[] };
  syncedBookmarks: string[];
  lastSynced: string;
}

export interface ConversationContext {
  topics: string[];
  sentiment: 'positive' | 'neutral' | 'frustrated' | 'confused';
  complexityLevel: number;
  learningGoals: string[];
  sessionProgress: number;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  message: string;
  timestamp: string;
  context?: ConversationContext;
}

export interface AIStudyProfile {
  learningStyle: LearningStyle;
  analytics: LearningAnalytics;
  prediction: PerformancePrediction;
  studyPlans: StudyPlan[];
  recommendations: AIRecommendation[];
}

// ==================== MOCK DATA ====================

const mockLearningStyle: LearningStyle = {
  type: 'visual',
  confidence: 85,
  characteristics: [
    'Prefers diagrams and visual representations',
    'Benefits from color-coded notes',
    'Learns well with mind maps and flowcharts',
    'Responds to visual mnemonics'
  ],
  detectedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
};

const mockLearningAnalytics: LearningAnalytics = {
  studyStreak: 12,
  averageSessionLength: 45,
  preferredStudyTimes: ['18:00-20:00', '09:00-11:00'],
  mostProductiveDay: 'Tuesday',
  completionRate: 85,
  improvementTrend: 'improving',
  attentionSpan: 25,
  retentionRate: 78,
  lastUpdated: new Date().toISOString(),
};

const mockPerformancePrediction: PerformancePrediction = {
  subjectConfidence: {
    Mathematics: 88,
    Physics: 72,
    Chemistry: 65,
    Biology: 91,
  },
  upcomingChallenges: [
    'Organic Chemistry exam next week',
    'Physics lab report due in 3 days',
    'Calculus integration concepts need review'
  ],
  recommendedInterventions: [
    'Schedule extra practice sessions for organic chemistry',
    'Review electromagnetic wave fundamentals',
    'Practice more integration by parts problems'
  ],
  successProbability: 82,
  nextWeekForecast: 'good',
  predictedAt: new Date().toISOString(),
};

const mockStudyPlans: StudyPlan[] = [
  {
    id: '1',
    subject: 'Mathematics',
    title: 'Calculus Mastery Path',
    description: 'Comprehensive calculus learning optimized for your learning style',
    estimatedTime: '4 weeks',
    difficulty: 'intermediate',
    topics: ['Limits', 'Derivatives', 'Integrals', 'Applications'],
    progress: 65,
    isActive: true,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    studentId: 'mock-student',
  },
  {
    id: '2',
    subject: 'Physics',
    title: 'Mechanics Foundation',
    description: 'Build strong foundation in classical mechanics concepts',
    estimatedTime: '3 weeks',
    difficulty: 'beginner',
    topics: ['Kinematics', 'Forces', 'Energy', 'Momentum'],
    progress: 45,
    isActive: false,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    studentId: 'mock-student',
  },
  {
    id: '3',
    subject: 'Chemistry',
    title: 'Organic Chemistry Boost',
    description: 'Targeted improvement plan for organic chemistry concepts',
    estimatedTime: '5 weeks',
    difficulty: 'advanced',
    topics: ['Reactions', 'Mechanisms', 'Synthesis', 'Spectroscopy'],
    progress: 20,
    isActive: false,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    studentId: 'mock-student',
  },
];

const mockAIRecommendations: AIRecommendation[] = [
  {
    id: '1',
    type: 'study',
    title: 'Focus on Trigonometry Review',
    description: 'Based on your recent calculus performance, reviewing trigonometric identities will help',
    confidence: 92,
    reasoning: 'Analysis of your integration problems shows difficulty with trig substitution',
    estimatedTime: '30 minutes',
    priority: 'high',
    subject: 'Mathematics',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    type: 'practice',
    title: 'Additional Physics Problems',
    description: 'Practice 5 more electromagnetic wave problems to reinforce concepts',
    confidence: 88,
    reasoning: 'Your lab report showed good understanding but needs more practice application',
    estimatedTime: '45 minutes',
    priority: 'medium',
    subject: 'Physics',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    type: 'concept',
    title: 'Chemical Bonding Refresher',
    description: 'Quick review of ionic and covalent bonding before tomorrow\'s organic chemistry class',
    confidence: 85,
    reasoning: 'Organic chemistry builds heavily on bonding fundamentals',
    estimatedTime: '20 minutes',
    priority: 'high',
    subject: 'Chemistry',
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    type: 'review',
    title: 'Biology Flashcards Session',
    description: 'Review cellular respiration vocabulary using spaced repetition',
    confidence: 78,
    reasoning: 'Previous quiz showed strong conceptual understanding but weak terminology recall',
    estimatedTime: '15 minutes',
    priority: 'low',
    subject: 'Biology',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
];

const mockPracticeQuestions: PracticeQuestion[] = [
  {
    id: '1',
    subject: 'Mathematics',
    topic: 'Calculus - Integration',
    question: 'Find the integral of ∫x²sin(x)dx using integration by parts',
    difficulty: 'medium',
    hints: [
      'Use integration by parts: ∫udv = uv - ∫vdu',
      'Let u = x² and dv = sin(x)dx',
      'You\'ll need to apply integration by parts twice'
    ],
    explanation: 'This problem requires applying integration by parts twice. First with u=x² and dv=sin(x)dx, then again with the resulting integral.',
    isAnswered: false,
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    subject: 'Physics',
    topic: 'Electromagnetic Waves',
    question: 'Calculate the energy density of an electromagnetic wave with electric field amplitude E₀ = 100 V/m',
    difficulty: 'hard',
    hints: [
      'Use the energy density formula: u = ½ε₀E² + ½B²/μ₀',
      'For EM waves, electric and magnetic energy densities are equal',
      'Remember the relationship between E and B in EM waves'
    ],
    explanation: 'The total energy density is twice the electric energy density since electric and magnetic contributions are equal in electromagnetic waves.',
    isAnswered: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    subject: 'Chemistry',
    topic: 'Organic Chemistry - Reactions',
    question: 'Predict the major product of the reaction between benzene and ethyl chloride in the presence of AlCl₃',
    difficulty: 'medium',
    hints: [
      'This is a Friedel-Crafts alkylation reaction',
      'AlCl₃ acts as a Lewis acid catalyst',
      'Consider carbocation rearrangement possibilities'
    ],
    explanation: 'Friedel-Crafts alkylation adds an alkyl group to benzene. The ethyl group attaches to the benzene ring forming ethylbenzene.',
    isAnswered: false,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
];

const mockSmartReminders: SmartReminder[] = [
  {
    id: '1',
    type: 'study_session',
    title: 'Focused Chemistry Study',
    message: 'Perfect time for your chemistry session! You\'re most productive now.',
    scheduledTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    priority: 'high',
    isActive: true,
    adaptiveReason: 'Based on your best performance times and upcoming exam',
    studentId: 'mock-student',
  },
  {
    id: '2',
    type: 'break',
    title: 'Take a Break',
    message: 'You\'ve been studying for 45 minutes. Time for a refreshing break!',
    scheduledTime: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
    priority: 'medium',
    isActive: true,
    adaptiveReason: 'Optimal attention span reached - break will improve retention',
    studentId: 'mock-student',
  },
  {
    id: '3',
    type: 'review',
    title: 'Quick Review Session',
    message: 'Review yesterday\'s calculus concepts to strengthen retention.',
    scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    priority: 'medium',
    isActive: true,
    adaptiveReason: 'Spaced repetition schedule for optimal memory consolidation',
    studentId: 'mock-student',
  },
];

const mockStudyLibraryIntegration: StudyLibraryIntegration = {
  recentlyAccessed: ['1', '3', '5'],
  recommendedFromLibrary: ['2', '4', '7'],
  crossReferenceTopics: {
    'calculus': ['integration', 'derivatives', 'limits'],
    'electromagnetism': ['waves', 'fields', 'maxwell equations'],
    'organic chemistry': ['reactions', 'mechanisms', 'synthesis'],
  },
  syncedBookmarks: ['1', '3'],
  lastSynced: new Date().toISOString(),
};

// ==================== SERVICE FUNCTIONS ====================

/**
 * Get comprehensive AI study profile for a student
 */
export const getAIStudyProfile = async (
  studentId: string
): Promise<ServiceResponse<AIStudyProfile>> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 500));

    const profile: AIStudyProfile = {
      learningStyle: mockLearningStyle,
      analytics: mockLearningAnalytics,
      prediction: mockPerformancePrediction,
      studyPlans: mockStudyPlans,
      recommendations: mockAIRecommendations,
    };

    return { data: profile, error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};

/**
 * Get learning style analysis for a student
 */
export const getLearningStyle = async (
  studentId: string
): Promise<ServiceResponse<LearningStyle>> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 200));
    return { data: mockLearningStyle, error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};

/**
 * Get learning analytics for a student
 */
export const getLearningAnalytics = async (
  studentId: string
): Promise<ServiceResponse<LearningAnalytics>> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 300));
    return { data: mockLearningAnalytics, error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};

/**
 * Get performance predictions for a student
 */
export const getPerformancePrediction = async (
  studentId: string
): Promise<ServiceResponse<PerformancePrediction>> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 400));
    return { data: mockPerformancePrediction, error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};

/**
 * Get AI-generated study recommendations
 */
export const getAIRecommendations = async (
  studentId: string,
  filters?: {
    subject?: string;
    priority?: 'high' | 'medium' | 'low';
    type?: AIRecommendation['type'];
  }
): Promise<ServiceResponse<AIRecommendation[]>> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 300));

    let recommendations = [...mockAIRecommendations];

    if (filters) {
      if (filters.subject) {
        recommendations = recommendations.filter(r => r.subject === filters.subject);
      }
      if (filters.priority) {
        recommendations = recommendations.filter(r => r.priority === filters.priority);
      }
      if (filters.type) {
        recommendations = recommendations.filter(r => r.type === filters.type);
      }
    }

    return { data: recommendations, error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};

/**
 * Get study plans for a student
 */
export const getStudyPlans = async (
  studentId: string,
  activeOnly: boolean = false
): Promise<ServiceResponse<StudyPlan[]>> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 300));

    let plans = [...mockStudyPlans];

    if (activeOnly) {
      plans = plans.filter(p => p.isActive);
    }

    return { data: plans, error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};

/**
 * Create a new study plan
 */
export const createStudyPlan = async (
  studentId: string,
  planData: Omit<StudyPlan, 'id' | 'createdAt' | 'updatedAt' | 'studentId'>
): Promise<ServiceResponse<StudyPlan>> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 400));

    const newPlan: StudyPlan = {
      ...planData,
      id: `plan-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      studentId,
    };

    return { data: newPlan, error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};

/**
 * Update study plan progress
 */
export const updateStudyPlanProgress = async (
  planId: string,
  progress: number
): Promise<ServiceResponse<boolean>> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 200));

    if (progress < 0 || progress > 100) {
      return { data: null, error: 'Progress must be between 0 and 100', success: false };
    }

    return { data: true, error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};

/**
 * Get AI-generated practice questions
 */
export const getPracticeQuestions = async (
  studentId: string,
  filters?: {
    subject?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    topic?: string;
  }
): Promise<ServiceResponse<PracticeQuestion[]>> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 300));

    let questions = [...mockPracticeQuestions];

    if (filters) {
      if (filters.subject) {
        questions = questions.filter(q => q.subject === filters.subject);
      }
      if (filters.difficulty) {
        questions = questions.filter(q => q.difficulty === filters.difficulty);
      }
      if (filters.topic) {
        questions = questions.filter(q => q.topic.toLowerCase().includes(filters.topic!.toLowerCase()));
      }
    }

    return { data: questions, error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};

/**
 * Generate new practice questions based on learning gaps
 */
export const generatePracticeQuestions = async (
  studentId: string,
  subject: string,
  topic: string,
  count: number = 5
): Promise<ServiceResponse<PracticeQuestion[]>> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simulate AI generation
    const newQuestions: PracticeQuestion[] = [];
    for (let i = 0; i < count; i++) {
      newQuestions.push({
        id: `gen-${Date.now()}-${i}`,
        subject,
        topic,
        question: `AI-generated question ${i + 1} for ${topic}`,
        difficulty: ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)] as any,
        hints: ['Hint 1', 'Hint 2', 'Hint 3'],
        explanation: 'AI-generated explanation',
        isAnswered: false,
        createdAt: new Date().toISOString(),
      });
    }

    return { data: newQuestions, error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};

/**
 * Get smart reminders for a student
 */
export const getSmartReminders = async (
  studentId: string
): Promise<ServiceResponse<SmartReminder[]>> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 200));
    return { data: mockSmartReminders, error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};

/**
 * Get study library integration data
 */
export const getStudyLibraryIntegration = async (
  studentId: string
): Promise<ServiceResponse<StudyLibraryIntegration>> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 200));
    return { data: mockStudyLibraryIntegration, error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};

/**
 * Send a chat message to AI tutor and get response
 */
export const sendChatMessage = async (
  studentId: string,
  message: string,
  context: ConversationContext
): Promise<ServiceResponse<ChatMessage>> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Simulate AI response generation
    const aiResponse = generateAIResponse(message, context);

    const responseMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      type: 'ai',
      message: aiResponse,
      timestamp: new Date().toISOString(),
      context,
    };

    return { data: responseMessage, error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};

/**
 * Generate AI response based on user message and context
 */
const generateAIResponse = (userMessage: string, context: ConversationContext): string => {
  const message = userMessage.toLowerCase();

  // Math/Calculus responses
  if (message.includes('math') || message.includes('calculus')) {
    return `Based on your 88% confidence in Mathematics and your visual learning style, I recommend:

📈 Your integration skills are progressing well (up 12% this week!)
🎯 Focus on trigonometric substitution - it aligns with your recent study patterns
📚 I've found 3 related materials in your Study Library
⏰ Best study time for you: ${mockLearningAnalytics.preferredStudyTimes[0]}

Would you like me to generate personalized practice problems?`;
  }

  // Physics responses
  if (message.includes('physics')) {
    return `I notice you're working on physics! Your current confidence level is 72%, but I predict improvement to 78% by next week. 📈

🔍 Recent Study Library activity shows electromagnetic waves
⚠️ Upcoming challenge: Physics lab report due in 3 days
💡 Recommended: Review wave fundamentals (30 min session)

Ready to start with some targeted practice?`;
  }

  // Study planning
  if (message.includes('study') || message.includes('plan') || message.includes('schedule')) {
    return `Perfect timing! I've analyzed your study patterns:

🔥 Current streak: ${mockLearningAnalytics.studyStreak} days
📈 Completion rate: ${mockLearningAnalytics.completionRate}% (${mockLearningAnalytics.improvementTrend})
⏰ Peak performance: ${mockLearningAnalytics.mostProductiveDay}s, ${mockLearningAnalytics.preferredStudyTimes[0]}
📚 ${mockLearningAnalytics.averageSessionLength}-min sessions work best

Check the Study Plans tab for your adaptive weekly schedule!`;
  }

  // Analytics and performance
  if (message.includes('progress') || message.includes('performance') || message.includes('analytics')) {
    return `Great question! Here are your performance insights:

🎯 Overall success probability: ${mockPerformancePrediction.successProbability}%
📈 Retention rate: ${mockLearningAnalytics.retentionRate}%
🧠 Attention span: ${mockLearningAnalytics.attentionSpan} minutes

Strongest subjects: Biology (91%), Mathematics (88%)
Growth opportunity: Chemistry (65%)

Would you like detailed recommendations?`;
  }

  // Help/stuck responses
  if (message.includes('help') || message.includes('stuck') || message.includes('difficult')) {
    return `I'm here to help! 🤗

Based on your patterns, when you feel stuck:
• Take a 5-minute break
• Switch to visual learning methods (your strength!)
• Try the concept in a different context
• Connect it to topics you've mastered

Your resilience score is high - you've overcome 89% of previous challenges! 💪

What specific concept is giving you trouble?`;
  }

  // Motivation
  if (message.includes('motivat') || message.includes('tired')) {
    return `Hey, I believe in you! 🌟

🔥 ${mockLearningAnalytics.studyStreak}-day streak shows incredible dedication
📈 ${mockLearningAnalytics.improvementTrend.toUpperCase()} trend
🎯 ${mockLearningAnalytics.completionRate}% completion rate
🏆 Top 15% of consistent learners

Remember: Every expert was once a beginner!`;
  }

  // Default response
  return `That's a thoughtful question! Based on your ${mockLearningStyle.type} learning style and strength in Mathematics, I can help you with personalized resources and learning paths. What would you like to focus on? 🚀`;
};

/**
 * Update conversation context based on user interaction
 */
export const updateConversationContext = async (
  context: ConversationContext
): Promise<ServiceResponse<ConversationContext>> => {
  try {
    await new Promise(resolve => setTimeout(resolve, 100));
    return { data: context, error: null, success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { data: null, error: errorMessage, success: false };
  }
};
