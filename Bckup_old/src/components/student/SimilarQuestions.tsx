import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export interface QuestionMatch {
  id: string;
  title: string;
  excerpt: string;
  similarity: number;
  tags: string[];
  category: {
    subject: string;
    chapter: string;
    topic: string;
  };
  difficulty: 'Basic' | 'Intermediate' | 'Advanced';
  answerCount: number;
  isAnswered: boolean;
  askedBy: string;
  askedAt: Date;
  lastActivity: Date;
  views: number;
  upvotes: number;
  source: 'internal' | 'community' | 'archive';
}

export interface SimilarityAnalysis {
  matches: QuestionMatch[];
  analysisMetrics: {
    totalScanned: number;
    processingTime: number;
    averageSimilarity: number;
    matchStrategies: string[];
  };
  suggestions: {
    refineQuery: string[];
    expandSearch: string[];
    alternativeKeywords: string[];
  };
}

interface SimilarQuestionsProps {
  questionText: string;
  questionTags?: string[];
  selectedCategory?: {
    subject: string;
    chapter?: string;
    topic?: string;
  };
  maxResults?: number;
  minSimilarity?: number;
  onQuestionSelect: (question: QuestionMatch) => void;
  showAnalytics?: boolean;
  autoRefresh?: boolean;
}

const MOCK_SIMILAR_QUESTIONS: QuestionMatch[] = [
  {
    id: 'q1',
    title: 'Solving Linear Equations with Multiple Variables',
    excerpt: 'I need help solving equations like 2x + 3y = 12 and x - y = 4. What is the best method to find the values of x and y?',
    similarity: 0.92,
    tags: ['algebra', 'linear-equations', 'system-of-equations'],
    category: { subject: 'Mathematics', chapter: 'Algebra', topic: 'Linear Equations' },
    difficulty: 'Intermediate',
    answerCount: 5,
    isAnswered: true,
    askedBy: 'student123',
    askedAt: new Date('2024-01-15'),
    lastActivity: new Date('2024-01-16'),
    views: 127,
    upvotes: 8,
    source: 'community',
  },
  {
    id: 'q2',
    title: 'Quadratic Formula Application Problem',
    excerpt: 'How do I use the quadratic formula to solve x² - 5x + 6 = 0? I keep getting confused with the discriminant calculation.',
    similarity: 0.87,
    tags: ['algebra', 'quadratic', 'formula'],
    category: { subject: 'Mathematics', chapter: 'Algebra', topic: 'Quadratic Equations' },
    difficulty: 'Basic',
    answerCount: 3,
    isAnswered: true,
    askedBy: 'mathlearner',
    askedAt: new Date('2024-01-10'),
    lastActivity: new Date('2024-01-12'),
    views: 89,
    upvotes: 12,
    source: 'internal',
  },
  {
    id: 'q3',
    title: 'Polynomial Long Division Steps',
    excerpt: 'Can someone explain the step-by-step process for dividing polynomials? I need to divide x³ + 2x² - x - 2 by x + 1.',
    similarity: 0.75,
    tags: ['algebra', 'polynomials', 'division'],
    category: { subject: 'Mathematics', chapter: 'Algebra', topic: 'Polynomials' },
    difficulty: 'Advanced',
    answerCount: 7,
    isAnswered: true,
    askedBy: 'polymath',
    askedAt: new Date('2024-01-08'),
    lastActivity: new Date('2024-01-14'),
    views: 203,
    upvotes: 15,
    source: 'archive',
  },
  {
    id: 'q4',
    title: 'Triangle Properties and Angle Calculations',
    excerpt: 'In a right triangle with sides 3, 4, and 5, how do I calculate the angles? What trigonometric functions should I use?',
    similarity: 0.68,
    tags: ['geometry', 'triangles', 'trigonometry'],
    category: { subject: 'Mathematics', chapter: 'Geometry', topic: 'Triangles' },
    difficulty: 'Intermediate',
    answerCount: 4,
    isAnswered: true,
    askedBy: 'geoexplorer',
    askedAt: new Date('2024-01-12'),
    lastActivity: new Date('2024-01-13'),
    views: 156,
    upvotes: 9,
    source: 'community',
  },
  {
    id: 'q5',
    title: 'Derivatives of Composite Functions',
    excerpt: 'I\'m struggling with the chain rule. How do I find the derivative of f(x) = sin(x²) and g(x) = (3x + 1)⁵?',
    similarity: 0.62,
    tags: ['calculus', 'derivatives', 'chain-rule'],
    category: { subject: 'Mathematics', chapter: 'Calculus', topic: 'Derivatives' },
    difficulty: 'Advanced',
    answerCount: 6,
    isAnswered: true,
    askedBy: 'calcstudent',
    askedAt: new Date('2024-01-05'),
    lastActivity: new Date('2024-01-11'),
    views: 234,
    upvotes: 18,
    source: 'internal',
  },
];

export default function SimilarQuestions({
  questionText,
  questionTags = [],
  selectedCategory,
  maxResults = 10,
  minSimilarity = 0.6,
  onQuestionSelect,
  showAnalytics = true,
  autoRefresh = true,
}: SimilarQuestionsProps) {
  const { theme } = useTheme();
  const [analysis, setAnalysis] = useState<SimilarityAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  const filteredQuestions = useMemo(() => {
    if (!analysis) return [];
    
    return analysis.matches
      .filter(q => q.similarity >= minSimilarity)
      .slice(0, maxResults)
      .sort((a, b) => b.similarity - a.similarity);
  }, [analysis, minSimilarity, maxResults]);

  const performSimilarityAnalysis = async (refresh = false) => {
    if (!questionText.trim()) {
      setAnalysis(null);
      return;
    }

    if (refresh) {
      setRefreshing(true);
    } else {
      setIsLoading(true);
    }

    // Simulate AI-powered similarity analysis
    setTimeout(() => {
      const matches = MOCK_SIMILAR_QUESTIONS.filter(q => {
        // Basic keyword matching simulation
        const queryWords = questionText.toLowerCase().split(/\s+/);
        const questionWords = (q.title + ' ' + q.excerpt).toLowerCase();
        const matchCount = queryWords.filter(word => 
          word.length > 3 && questionWords.includes(word)
        ).length;
        
        const baseScore = matchCount / queryWords.length;
        
        // Tag matching bonus
        const tagBonus = questionTags.length > 0 
          ? q.tags.filter(tag => questionTags.includes(tag)).length * 0.1
          : 0;
        
        // Category matching bonus  
        const categoryBonus = selectedCategory && 
          q.category.subject === selectedCategory.subject ? 0.15 : 0;
        
        q.similarity = Math.min(0.95, baseScore + tagBonus + categoryBonus);
        return q.similarity >= minSimilarity;
      });

      const analysisResult: SimilarityAnalysis = {
        matches: matches.sort((a, b) => b.similarity - a.similarity),
        analysisMetrics: {
          totalScanned: 1247,
          processingTime: 1.3,
          averageSimilarity: matches.reduce((sum, q) => sum + q.similarity, 0) / matches.length || 0,
          matchStrategies: [
            'Keyword Matching',
            'Semantic Analysis',
            'Tag Correlation',
            'Category Context'
          ],
        },
        suggestions: {
          refineQuery: [
            'Add more specific mathematical terms',
            'Include the problem type (equation, proof, application)',
            'Specify the difficulty level you\'re working with',
          ],
          expandSearch: [
            'Try broader topic keywords',
            'Include related mathematical concepts',
            'Search in adjacent difficulty levels',
          ],
          alternativeKeywords: [
            'mathematical problem',
            'solution method',
            'step-by-step explanation',
            'formula application',
          ],
        },
      };

      setAnalysis(analysisResult);
      setIsLoading(false);
      setRefreshing(false);
    }, 2000); // Simulate processing time
  };

  useEffect(() => {
    if (autoRefresh) {
      performSimilarityAnalysis();
    }
  }, [questionText, questionTags, selectedCategory]);

  const handleQuestionToggle = (questionId: string) => {
    setExpandedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Basic': return theme.success || '#4CAF50';
      case 'Intermediate': return theme.warning || '#FF9800';
      case 'Advanced': return theme.error || '#F44336';
      default: return theme.OnSurface;
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'internal': return '🏠';
      case 'community': return '👥';
      case 'archive': return '📚';
      default: return '❓';
    }
  };

  const renderQuestionCard = (question: QuestionMatch) => {
    const isExpanded = expandedQuestions.has(question.id);
    
    return (
      <View
        key={question.id}
        style={[styles.questionCard, { backgroundColor: theme.Surface }]}
      >
        <TouchableOpacity
          style={styles.questionHeader}
          onPress={() => handleQuestionToggle(question.id)}
          accessibilityRole="button"
          accessibilityLabel={`${isExpanded ? 'Collapse' : 'Expand'} question details`}
        >
          <View style={styles.questionTitleRow}>
            <Text style={[styles.questionTitle, { color: theme.OnSurface }]} numberOfLines={2}>
              {question.title}
            </Text>
            <View style={styles.similarityBadge}>
              <Text style={[styles.similarityText, { color: theme.OnPrimary }]}>
                {Math.round(question.similarity * 100)}%
              </Text>
            </View>
          </View>
          
          <View style={styles.questionMeta}>
            <Text style={[styles.categoryText, { color: theme.primary }]}>
              {question.category.subject} → {question.category.chapter}
            </Text>
            <View style={styles.questionStats}>
              <Text style={[styles.statText, { color: theme.OnSurfaceVariant }]}>
                {getSourceIcon(question.source)} {question.views} views
              </Text>
              <Text style={[styles.statText, { color: theme.OnSurfaceVariant }]}>
                • {question.answerCount} answers
              </Text>
              <Text style={[styles.statText, { color: theme.OnSurfaceVariant }]}>
                • ↑ {question.upvotes}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.questionDetails}>
            <Text style={[styles.questionExcerpt, { color: theme.OnSurface }]}>
              {question.excerpt}
            </Text>
            
            <View style={styles.tagsContainer}>
              {question.tags.map(tag => (
                <View
                  key={tag}
                  style={[styles.tag, { backgroundColor: theme.primaryContainer }]}
                >
                  <Text style={[styles.tagText, { color: theme.OnPrimaryContainer }]}>
                    {tag}
                  </Text>
                </View>
              ))}
            </View>
            
            <View style={styles.questionFooter}>
              <View style={styles.difficultyContainer}>
                <View
                  style={[
                    styles.difficultyBadge,
                    { backgroundColor: getDifficultyColor(question.difficulty) }
                  ]}
                >
                  <Text style={[styles.difficultyText, { color: theme.OnPrimary }]}>
                    {question.difficulty}
                  </Text>
                </View>
                <Text style={[styles.authorText, { color: theme.OnSurfaceVariant }]}>
                  by {question.askedBy} • {question.askedAt.toLocaleDateString()}
                </Text>
              </View>
              
              <TouchableOpacity
                style={[styles.viewButton, { backgroundColor: theme.primary }]}
                onPress={() => onQuestionSelect(question)}
                accessibilityRole="button"
                accessibilityLabel={`View question: ${question.title}`}
              >
                <Text style={[styles.viewButtonText, { color: theme.OnPrimary }]}>
                  View Question
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderAnalytics = () => {
    if (!showAnalytics || !analysis) return null;
    
    return (
      <View style={[styles.analyticsContainer, { backgroundColor: theme.Surface }]}>
        <Text style={[styles.analyticsTitle, { color: theme.OnSurface }]}>
          Analysis Summary
        </Text>
        
        <View style={styles.metricsGrid}>
          <View style={styles.metric}>
            <Text style={[styles.metricValue, { color: theme.primary }]}>
              {analysis.analysisMetrics.totalScanned.toLocaleString()}
            </Text>
            <Text style={[styles.metricLabel, { color: theme.OnSurfaceVariant }]}>
              Questions Scanned
            </Text>
          </View>
          
          <View style={styles.metric}>
            <Text style={[styles.metricValue, { color: theme.primary }]}>
              {analysis.matches.length}
            </Text>
            <Text style={[styles.metricLabel, { color: theme.OnSurfaceVariant }]}>
              Similar Found
            </Text>
          </View>
          
          <View style={styles.metric}>
            <Text style={[styles.metricValue, { color: theme.primary }]}>
              {Math.round(analysis.analysisMetrics.averageSimilarity * 100)}%
            </Text>
            <Text style={[styles.metricLabel, { color: theme.OnSurfaceVariant }]}>
              Avg Similarity
            </Text>
          </View>
          
          <View style={styles.metric}>
            <Text style={[styles.metricValue, { color: theme.primary }]}>
              {analysis.analysisMetrics.processingTime}s
            </Text>
            <Text style={[styles.metricLabel, { color: theme.OnSurfaceVariant }]}>
              Process Time
            </Text>
          </View>
        </View>
        
        {analysis.suggestions.refineQuery.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <Text style={[styles.suggestionsTitle, { color: theme.OnSurface }]}>
              💡 Suggestions to improve results:
            </Text>
            {analysis.suggestions.refineQuery.slice(0, 2).map((suggestion, index) => (
              <Text key={index} style={[styles.suggestionText, { color: theme.OnSurfaceVariant }]}>
                • {suggestion}
              </Text>
            ))}
          </View>
        )}
      </View>
    );
  };

  if (!questionText.trim()) {
    return (
      <View style={[styles.emptyState, { backgroundColor: theme.Surface }]}>
        <Text style={[styles.emptyTitle, { color: theme.OnSurface }]}>
          Similar Questions
        </Text>
        <Text style={[styles.emptyText, { color: theme.OnSurfaceVariant }]}>
          Start typing your question to see similar questions from the community
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => performSimilarityAnalysis(true)}
          colors={[theme.primary]}
          tintColor={theme.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.OnSurface }]}>
          Similar Questions
        </Text>
        <TouchableOpacity
          style={[styles.refreshButton, { backgroundColor: theme.primaryContainer }]}
          onPress={() => performSimilarityAnalysis(true)}
          disabled={isLoading || refreshing}
          accessibilityRole="button"
          accessibilityLabel="Refresh similar questions"
        >
          <Text style={[styles.refreshButtonText, { color: theme.OnPrimaryContainer }]}>
            {isLoading || refreshing ? 'Analyzing...' : 'Refresh'}
          </Text>
        </TouchableOpacity>
      </View>

      {renderAnalytics()}

      {isLoading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.OnSurface }]}>
            Analyzing your question for similarities...
          </Text>
        </View>
      ) : filteredQuestions.length > 0 ? (
        <View style={styles.questionsContainer}>
          <Text style={[styles.resultsCount, { color: theme.OnSurfaceVariant }]}>
            Found {filteredQuestions.length} similar questions (showing top {Math.min(filteredQuestions.length, maxResults)})
          </Text>
          {filteredQuestions.map(renderQuestionCard)}
        </View>
      ) : analysis && (
        <View style={[styles.noResults, { backgroundColor: theme.Surface }]}>
          <Text style={[styles.noResultsTitle, { color: theme.OnSurface }]}>
            No Similar Questions Found
          </Text>
          <Text style={[styles.noResultsText, { color: theme.OnSurfaceVariant }]}>
            Your question appears to be unique! This is a great opportunity to contribute to the community.
          </Text>
          
          {analysis.suggestions.expandSearch.length > 0 && (
            <View style={styles.expandSuggestions}>
              <Text style={[styles.expandTitle, { color: theme.OnSurface }]}>
                Try expanding your search:
              </Text>
              {analysis.suggestions.expandSearch.slice(0, 3).map((suggestion, index) => (
                <Text key={index} style={[styles.expandText, { color: theme.OnSurfaceVariant }]}>
                  • {suggestion}
                </Text>
              ))}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  refreshButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  refreshButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  analyticsContainer: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  analyticsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  metric: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  metricLabel: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  suggestionsContainer: {
    marginTop: 8,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  suggestionText: {
    fontSize: 14,
    marginBottom: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
  questionsContainer: {
    flex: 1,
  },
  resultsCount: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  questionCard: {
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  questionHeader: {
    padding: 16,
  },
  questionTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  questionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    marginRight: 12,
    lineHeight: 22,
  },
  similarityBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 50,
    alignItems: 'center',
  },
  similarityText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  questionMeta: {
    marginTop: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  questionStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statText: {
    fontSize: 12,
    marginRight: 8,
  },
  questionDetails: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  questionExcerpt: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 4,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  questionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  difficultyContainer: {
    flex: 1,
  },
  difficultyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 4,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  authorText: {
    fontSize: 12,
  },
  viewButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    padding: 32,
    borderRadius: 8,
    alignItems: 'center',
    margin: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  noResults: {
    padding: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  noResultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  noResultsText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  expandSuggestions: {
    alignSelf: 'stretch',
  },
  expandTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  expandText: {
    fontSize: 14,
    marginBottom: 4,
    textAlign: 'left',
  },
});