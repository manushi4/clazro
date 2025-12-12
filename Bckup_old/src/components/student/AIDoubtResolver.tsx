/**
 * AIDoubtResolver - Phase 27.2: Enhanced Doubt Resolution System
 * AI-powered doubt resolution with similar question suggestions, categorization, and expert matching
 * Features: Similar questions, AI categorization, expert matching, community upvoting
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
} from 'react-native';

import { LightTheme } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';

interface AIDoubtResolverProps {
  currentDoubt?: string;
  subject?: string;
  onSuggestionSelected?: (suggestion: SimilarQuestion) => void;
  onExpertMatch?: (expert: Expert) => void;
}

interface SimilarQuestion {
  id: string;
  question: string;
  subject: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  matchScore: number;
  answer: string;
  expertName: string;
  upvotes: number;
  tags: string[];
  isVerified: boolean;
}

interface Expert {
  id: string;
  name: string;
  expertise: string[];
  rating: number;
  totalAnswers: number;
  averageResponseTime: string;
  isOnline: boolean;
  specialization: string;
  badges: string[];
}

interface AICategory {
  category: string;
  confidence: number;
  subcategory: string;
  suggestedTags: string[];
  estimatedDifficulty: 'easy' | 'medium' | 'hard';
}

const AIDoubtResolver: React.FC<AIDoubtResolverProps> = ({
  currentDoubt = '',
  subject = 'Mathematics',
  onSuggestionSelected,
  onExpertMatch,
}) => {
  const [analysisResults, setAnalysisResults] = useState<{
    similarQuestions: SimilarQuestion[];
    suggestedExperts: Expert[];
    aiCategory: AICategory | null;
    confidence: number;
  } | null>(null);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'similar' | 'experts' | 'ai-help'>('similar');

  // Mock AI analysis results
  const mockSimilarQuestions: SimilarQuestion[] = [
    {
      id: '1',
      question: 'How do I solve integration by parts with x²sin(x)?',
      subject: 'Mathematics',
      topic: 'Calculus - Integration',
      difficulty: 'medium',
      matchScore: 95,
      answer: 'Use integration by parts formula ∫udv = uv - ∫vdu. Set u = x² and dv = sin(x)dx. You\'ll need to apply the formula twice...',
      expertName: 'Dr. Sarah Wilson',
      upvotes: 47,
      tags: ['integration', 'by-parts', 'trigonometry'],
      isVerified: true,
    },
    {
      id: '2',
      question: 'What\'s the best approach for solving ∫x²cos(x)dx?',
      subject: 'Mathematics',
      topic: 'Calculus - Integration',
      difficulty: 'medium',
      matchScore: 88,
      answer: 'Similar to integration by parts with sine, but notice the pattern. Let u = x² and dv = cos(x)dx...',
      expertName: 'Prof. Michael Chen',
      upvotes: 32,
      tags: ['integration', 'by-parts', 'cosine'],
      isVerified: true,
    },
    {
      id: '3',
      question: 'Integration by parts: when to use it and when not to?',
      subject: 'Mathematics',
      topic: 'Calculus - Integration',
      difficulty: 'easy',
      matchScore: 75,
      answer: 'Use LIATE rule: Logarithmic, Inverse trig, Algebraic, Trigonometric, Exponential. Choose u in this order...',
      expertName: 'Dr. Emily Johnson',
      upvotes: 89,
      tags: ['integration', 'strategy', 'LIATE'],
      isVerified: true,
    },
  ];

  const mockExperts: Expert[] = [
    {
      id: '1',
      name: 'Dr. Sarah Wilson',
      expertise: ['Calculus', 'Linear Algebra', 'Differential Equations'],
      rating: 4.9,
      totalAnswers: 1247,
      averageResponseTime: '15 minutes',
      isOnline: true,
      specialization: 'Advanced Mathematics',
      badges: ['Top Contributor', 'Fast Response', 'Student Favorite'],
    },
    {
      id: '2',
      name: 'Prof. Michael Chen',
      expertise: ['Physics', 'Engineering Mathematics', 'Calculus'],
      rating: 4.8,
      totalAnswers: 892,
      averageResponseTime: '23 minutes',
      isOnline: true,
      specialization: 'Applied Mathematics',
      badges: ['Expert Verified', 'Research Active'],
    },
    {
      id: '3',
      name: 'Dr. Emily Johnson',
      expertise: ['Pure Mathematics', 'Abstract Algebra', 'Number Theory'],
      rating: 4.7,
      totalAnswers: 634,
      averageResponseTime: '35 minutes',
      isOnline: false,
      specialization: 'Pure Mathematics',
      badges: ['PhD Verified', 'Academic Excellence'],
    },
  ];

  const mockAICategory: AICategory = {
    category: 'Calculus',
    confidence: 92,
    subcategory: 'Integration Techniques',
    suggestedTags: ['integration', 'by-parts', 'trigonometric', 'calculus'],
    estimatedDifficulty: 'medium',
  };

  useEffect(() => {
    if (currentDoubt) {
      analyzeDoubt();
    }
  }, [currentDoubt]);

  const analyzeDoubt = async () => {
    setIsAnalyzing(true);
    
    // Simulate AI analysis
    setTimeout(() => {
      setAnalysisResults({
        similarQuestions: mockSimilarQuestions,
        suggestedExperts: mockExperts,
        aiCategory: mockAICategory,
        confidence: 92,
      });
      setIsAnalyzing(false);
    }, 2000);
  };

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <Text style={styles.loadingText}>🤖 AI is analyzing your doubt...</Text>
      <Text style={styles.loadingSubtext}>
        Finding similar questions and matching experts
      </Text>
    </View>
  );

  const renderSimilarQuestions = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Similar Questions Found</Text>
        <Text style={styles.sectionSubtitle}>
          {analysisResults?.similarQuestions.length} questions with {analysisResults?.confidence}% confidence
        </Text>
      </View>

      {analysisResults?.similarQuestions.map((question) => (
        <TouchableOpacity
          key={question.id}
          style={styles.questionCard}
          onPress={() => onSuggestionSelected?.(question)}
        >
          <View style={styles.questionHeader}>
            <View style={styles.questionTitleRow}>
              <Text style={styles.questionTitle} numberOfLines={2}>
                {question.question}
              </Text>
              <View style={styles.matchScore}>
                <Text style={styles.matchScoreText}>{question.matchScore}%</Text>
              </View>
            </View>
            
            <View style={styles.questionMeta}>
              <Text style={styles.questionTopic}>{question.topic}</Text>
              <View style={[
                styles.difficultyBadge,
                { backgroundColor: 
                  question.difficulty === 'easy' ? '#4CAF50' :
                  question.difficulty === 'medium' ? '#FF9800' : '#F44336'
                }
              ]}>
                <Text style={styles.difficultyText}>
                  {question.difficulty.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.questionAnswer} numberOfLines={3}>
            {question.answer}
          </Text>

          <View style={styles.questionFooter}>
            <View style={styles.questionTags}>
              {question.tags.slice(0, 3).map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>

            <View style={styles.questionStats}>
              {question.isVerified && (
                <Text style={styles.verifiedBadge}>✓ Verified</Text>
              )}
              <Text style={styles.expertName}>by {question.expertName}</Text>
              <Text style={styles.upvotes}>👍 {question.upvotes}</Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderExperts = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recommended Experts</Text>
        <Text style={styles.sectionSubtitle}>
          Based on your question topic and complexity
        </Text>
      </View>

      {analysisResults?.suggestedExperts.map((expert) => (
        <TouchableOpacity
          key={expert.id}
          style={styles.expertCard}
          onPress={() => onExpertMatch?.(expert)}
        >
          <View style={styles.expertHeader}>
            <View style={styles.expertInfo}>
              <View style={styles.expertNameRow}>
                <Text style={styles.expertName}>{expert.name}</Text>
                <View style={styles.expertStatus}>
                  <View style={[
                    styles.statusIndicator,
                    { backgroundColor: expert.isOnline ? '#4CAF50' : '#9E9E9E' }
                  ]} />
                  <Text style={styles.statusText}>
                    {expert.isOnline ? 'Online' : 'Offline'}
                  </Text>
                </View>
              </View>
              
              <Text style={styles.expertSpecialization}>{expert.specialization}</Text>
              
              <View style={styles.expertStats}>
                <Text style={styles.expertRating}>⭐ {expert.rating}</Text>
                <Text style={styles.expertAnswers}>{expert.totalAnswers} answers</Text>
                <Text style={styles.responseTime}>~{expert.averageResponseTime}</Text>
              </View>
            </View>
          </View>

          <View style={styles.expertExpertise}>
            <Text style={styles.expertiseLabel}>Expertise:</Text>
            <View style={styles.expertiseTags}>
              {expert.expertise.map((skill, index) => (
                <View key={index} style={styles.expertiseTag}>
                  <Text style={styles.expertiseTagText}>{skill}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.expertBadges}>
            {expert.badges.map((badge, index) => (
              <View key={index} style={styles.badge}>
                <Text style={styles.badgeText}>{badge}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[
              styles.contactExpertButton,
              !expert.isOnline && styles.contactExpertButtonDisabled
            ]}
            disabled={!expert.isOnline}
            onPress={() => {
              Alert.alert(
                'Contact Expert',
                `Send your doubt to ${expert.name}? Average response time: ${expert.averageResponseTime}`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Send', onPress: () => onExpertMatch?.(expert) },
                ]
              );
            }}
          >
            <Text style={[
              styles.contactExpertButtonText,
              !expert.isOnline && styles.contactExpertButtonTextDisabled
            ]}>
              {expert.isOnline ? 'Ask Expert' : 'Expert Offline'}
            </Text>
          </TouchableOpacity>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderAIHelp = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.aiHelpContainer}>
        <View style={styles.aiAnalysisCard}>
          <Text style={styles.aiAnalysisTitle}>🤖 AI Analysis</Text>
          
          {analysisResults?.aiCategory && (
            <View style={styles.aiAnalysisContent}>
              <View style={styles.aiAnalysisRow}>
                <Text style={styles.aiAnalysisLabel}>Category:</Text>
                <Text style={styles.aiAnalysisValue}>
                  {analysisResults.aiCategory.category} → {analysisResults.aiCategory.subcategory}
                </Text>
              </View>
              
              <View style={styles.aiAnalysisRow}>
                <Text style={styles.aiAnalysisLabel}>Difficulty:</Text>
                <View style={[
                  styles.aiDifficultyBadge,
                  { backgroundColor: 
                    analysisResults.aiCategory.estimatedDifficulty === 'easy' ? '#4CAF50' :
                    analysisResults.aiCategory.estimatedDifficulty === 'medium' ? '#FF9800' : '#F44336'
                  }
                ]}>
                  <Text style={styles.aiDifficultyText}>
                    {analysisResults.aiCategory.estimatedDifficulty.toUpperCase()}
                  </Text>
                </View>
              </View>
              
              <View style={styles.aiAnalysisRow}>
                <Text style={styles.aiAnalysisLabel}>Confidence:</Text>
                <Text style={styles.aiConfidenceValue}>
                  {analysisResults.aiCategory.confidence}%
                </Text>
              </View>

              <View style={styles.suggestedTagsSection}>
                <Text style={styles.suggestedTagsLabel}>Suggested Tags:</Text>
                <View style={styles.suggestedTags}>
                  {analysisResults.aiCategory.suggestedTags.map((tag, index) => (
                    <View key={index} style={styles.suggestedTag}>
                      <Text style={styles.suggestedTagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}
        </View>

        <View style={styles.aiRecommendationsCard}>
          <Text style={styles.aiRecommendationsTitle}>💡 AI Recommendations</Text>
          
          <View style={styles.recommendation}>
            <Text style={styles.recommendationTitle}>Study Approach:</Text>
            <Text style={styles.recommendationText}>
              Based on your question pattern, I recommend reviewing integration by parts fundamentals before tackling this problem. Focus on the LIATE rule for choosing u and dv.
            </Text>
          </View>

          <View style={styles.recommendation}>
            <Text style={styles.recommendationTitle}>Similar Topics:</Text>
            <Text style={styles.recommendationText}>
              Students who ask this question often struggle with: substitution method, trigonometric integration, and partial fractions.
            </Text>
          </View>

          <View style={styles.recommendation}>
            <Text style={styles.recommendationTitle}>Next Steps:</Text>
            <Text style={styles.recommendationText}>
              1. Review the similar questions above
              2. Practice with simpler integration by parts problems
              3. If still stuck, contact Dr. Sarah Wilson (expert in integration techniques)
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.getAIHelpButton}>
          <Text style={styles.getAIHelpButtonText}>🤖 Get AI Tutor Help</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  if (isAnalyzing) {
    return renderLoadingState();
  }

  if (!analysisResults) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>Enter a doubt to see AI suggestions</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tab Selector */}
      <View style={styles.tabSelector}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'similar' && styles.activeTab]}
          onPress={() => setSelectedTab('similar')}
        >
          <Text style={[styles.tabText, selectedTab === 'similar' && styles.activeTabText]}>
            Similar ({analysisResults.similarQuestions.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'experts' && styles.activeTab]}
          onPress={() => setSelectedTab('experts')}
        >
          <Text style={[styles.tabText, selectedTab === 'experts' && styles.activeTabText]}>
            Experts ({analysisResults.suggestedExperts.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'ai-help' && styles.activeTab]}
          onPress={() => setSelectedTab('ai-help')}
        >
          <Text style={[styles.tabText, selectedTab === 'ai-help' && styles.activeTabText]}>
            AI Help
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {selectedTab === 'similar' && renderSimilarQuestions()}
      {selectedTab === 'experts' && renderExperts()}
      {selectedTab === 'ai-help' && renderAIHelp()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LightTheme.Background,
  },
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: LightTheme.Surface,
    marginHorizontal: Spacing.MD,
    marginVertical: Spacing.SM,
    borderRadius: BorderRadius.MD,
    padding: Spacing.XS,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.SM,
    paddingHorizontal: Spacing.MD,
    borderRadius: BorderRadius.SM,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: LightTheme.Primary,
  },
  tabText: {
    fontSize: Typography.labelMedium.fontSize,
    fontFamily: Typography.labelMedium.fontFamily,
    color: LightTheme.OnSurfaceVariant,
  },
  activeTabText: {
    color: LightTheme.OnPrimary,
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: Spacing.MD,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.XL,
  },
  loadingText: {
    fontSize: Typography.titleMedium.fontSize,
    fontFamily: Typography.titleMedium.fontFamily,
    color: LightTheme.OnBackground,
    marginBottom: Spacing.SM,
  },
  loadingSubtext: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.XL,
  },
  emptyStateText: {
    fontSize: Typography.bodyLarge.fontSize,
    fontFamily: Typography.bodyLarge.fontFamily,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
  },
  sectionHeader: {
    marginBottom: Spacing.MD,
  },
  sectionTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontFamily: Typography.titleMedium.fontFamily,
    fontWeight: Typography.titleMedium.fontWeight,
    color: LightTheme.OnBackground,
  },
  sectionSubtitle: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: LightTheme.OnSurfaceVariant,
  },

  // Similar Questions Styles
  questionCard: {
    backgroundColor: LightTheme.Surface,
    borderRadius: BorderRadius.MD,
    padding: Spacing.MD,
    marginBottom: Spacing.SM,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  questionHeader: {
    marginBottom: Spacing.SM,
  },
  questionTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.SM,
  },
  questionTitle: {
    flex: 1,
    fontSize: Typography.bodyLarge.fontSize,
    fontFamily: Typography.bodyLarge.fontFamily,
    fontWeight: '600',
    color: LightTheme.OnSurface,
    marginRight: Spacing.SM,
  },
  matchScore: {
    backgroundColor: LightTheme.primaryContainer,
    borderRadius: BorderRadius.SM,
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
  },
  matchScoreText: {
    fontSize: Typography.labelSmall.fontSize,
    fontFamily: Typography.labelSmall.fontFamily,
    fontWeight: '600',
    color: LightTheme.OnPrimaryContainer,
  },
  questionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  questionTopic: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    color: LightTheme.OnSurfaceVariant,
  },
  difficultyBadge: {
    borderRadius: BorderRadius.SM,
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
  },
  difficultyText: {
    fontSize: Typography.labelSmall.fontSize,
    fontFamily: Typography.labelSmall.fontFamily,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  questionAnswer: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: LightTheme.OnSurface,
    lineHeight: Typography.bodyMedium.lineHeight,
    marginBottom: Spacing.MD,
  },
  questionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  questionTags: {
    flexDirection: 'row',
    flex: 1,
  },
  tag: {
    backgroundColor: LightTheme.secondaryContainer,
    borderRadius: BorderRadius.SM,
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    marginRight: Spacing.XS,
  },
  tagText: {
    fontSize: Typography.labelSmall.fontSize,
    fontFamily: Typography.labelSmall.fontFamily,
    color: LightTheme.OnSecondaryContainer,
  },
  questionStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedBadge: {
    fontSize: Typography.labelSmall.fontSize,
    fontFamily: Typography.labelSmall.fontFamily,
    color: '#4CAF50',
    fontWeight: '600',
    marginRight: Spacing.SM,
  },
  expertName: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    color: LightTheme.OnSurfaceVariant,
    marginRight: Spacing.SM,
  },
  upvotes: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    color: LightTheme.OnSurfaceVariant,
  },

  // Expert Styles
  expertCard: {
    backgroundColor: LightTheme.Surface,
    borderRadius: BorderRadius.MD,
    padding: Spacing.MD,
    marginBottom: Spacing.SM,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  expertHeader: {
    marginBottom: Spacing.MD,
  },
  expertInfo: {
    flex: 1,
  },
  expertNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.XS,
  },
  expertName: {
    fontSize: Typography.titleSmall.fontSize,
    fontFamily: Typography.titleSmall.fontFamily,
    fontWeight: Typography.titleSmall.fontWeight,
    color: LightTheme.OnSurface,
  },
  expertStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.XS,
  },
  statusText: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    color: LightTheme.OnSurfaceVariant,
  },
  expertSpecialization: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: LightTheme.Primary,
    marginBottom: Spacing.SM,
  },
  expertStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  expertRating: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    color: LightTheme.OnSurfaceVariant,
  },
  expertAnswers: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    color: LightTheme.OnSurfaceVariant,
  },
  responseTime: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    color: LightTheme.OnSurfaceVariant,
  },
  expertExpertise: {
    marginBottom: Spacing.MD,
  },
  expertiseLabel: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    fontWeight: '600',
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
  },
  expertiseTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  expertiseTag: {
    backgroundColor: LightTheme.TertiaryContainer,
    borderRadius: BorderRadius.SM,
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    marginRight: Spacing.XS,
    marginBottom: Spacing.XS,
  },
  expertiseTagText: {
    fontSize: Typography.labelSmall.fontSize,
    fontFamily: Typography.labelSmall.fontFamily,
    color: LightTheme.OnTertiaryContainer,
  },
  expertBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.MD,
  },
  badge: {
    backgroundColor: LightTheme.secondaryContainer,
    borderRadius: BorderRadius.SM,
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    marginRight: Spacing.XS,
    marginBottom: Spacing.XS,
  },
  badgeText: {
    fontSize: Typography.labelSmall.fontSize,
    fontFamily: Typography.labelSmall.fontFamily,
    color: LightTheme.OnSecondaryContainer,
  },
  contactExpertButton: {
    backgroundColor: LightTheme.Primary,
    borderRadius: BorderRadius.SM,
    paddingVertical: Spacing.MD,
    alignItems: 'center',
  },
  contactExpertButtonDisabled: {
    backgroundColor: LightTheme.SurfaceVariant,
  },
  contactExpertButtonText: {
    fontSize: Typography.labelMedium.fontSize,
    fontFamily: Typography.labelMedium.fontFamily,
    fontWeight: '600',
    color: LightTheme.OnPrimary,
  },
  contactExpertButtonTextDisabled: {
    color: LightTheme.OnSurfaceVariant,
  },

  // AI Help Styles
  aiHelpContainer: {
    paddingBottom: Spacing.XL,
  },
  aiAnalysisCard: {
    backgroundColor: LightTheme.TertiaryContainer,
    borderRadius: BorderRadius.MD,
    padding: Spacing.MD,
    marginBottom: Spacing.MD,
  },
  aiAnalysisTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontFamily: Typography.titleMedium.fontFamily,
    fontWeight: Typography.titleMedium.fontWeight,
    color: LightTheme.OnTertiaryContainer,
    marginBottom: Spacing.MD,
  },
  aiAnalysisContent: {
    gap: Spacing.SM,
  },
  aiAnalysisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aiAnalysisLabel: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    fontWeight: '600',
    color: LightTheme.OnTertiaryContainer,
  },
  aiAnalysisValue: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: LightTheme.OnTertiaryContainer,
  },
  aiDifficultyBadge: {
    borderRadius: BorderRadius.SM,
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
  },
  aiDifficultyText: {
    fontSize: Typography.labelSmall.fontSize,
    fontFamily: Typography.labelSmall.fontFamily,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  aiConfidenceValue: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    fontWeight: '600',
    color: '#4CAF50',
  },
  suggestedTagsSection: {
    marginTop: Spacing.SM,
  },
  suggestedTagsLabel: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    fontWeight: '600',
    color: LightTheme.OnTertiaryContainer,
    marginBottom: Spacing.SM,
  },
  suggestedTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  suggestedTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: BorderRadius.SM,
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    marginRight: Spacing.XS,
    marginBottom: Spacing.XS,
  },
  suggestedTagText: {
    fontSize: Typography.labelSmall.fontSize,
    fontFamily: Typography.labelSmall.fontFamily,
    color: LightTheme.OnTertiaryContainer,
  },
  aiRecommendationsCard: {
    backgroundColor: LightTheme.Surface,
    borderRadius: BorderRadius.MD,
    padding: Spacing.MD,
    marginBottom: Spacing.MD,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  aiRecommendationsTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontFamily: Typography.titleMedium.fontFamily,
    fontWeight: Typography.titleMedium.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.MD,
  },
  recommendation: {
    marginBottom: Spacing.MD,
  },
  recommendationTitle: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    fontWeight: '600',
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
  },
  recommendationText: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: LightTheme.OnSurfaceVariant,
    lineHeight: Typography.bodyMedium.lineHeight,
  },
  getAIHelpButton: {
    backgroundColor: LightTheme.Primary,
    borderRadius: BorderRadius.MD,
    padding: Spacing.LG,
    alignItems: 'center',
  },
  getAIHelpButtonText: {
    fontSize: Typography.bodyLarge.fontSize,
    fontFamily: Typography.bodyLarge.fontFamily,
    fontWeight: '600',
    color: LightTheme.OnPrimary,
  },
});

export default AIDoubtResolver;