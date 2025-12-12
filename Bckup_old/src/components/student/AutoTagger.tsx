import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export interface Tag {
  id: string;
  name: string;
  confidence: number;
  category: 'concept' | 'difficulty' | 'skill' | 'topic' | 'keyword';
  color?: string;
}

export interface TagSuggestion {
  tag: Tag;
  reason: string;
  sources: string[];
}

interface AutoTaggerProps {
  questionText: string;
  questionType?: 'text' | 'image' | 'code' | 'math';
  mediaContent?: string;
  selectedSubject?: string;
  onTagsChange: (tags: Tag[]) => void;
  maxTags?: number;
  confidenceThreshold?: number;
}

const PREDEFINED_TAGS: Tag[] = [
  // Math Concepts
  { id: 'algebra-basic', name: 'Basic Algebra', confidence: 0.9, category: 'concept', color: '#4CAF50' },
  { id: 'geometry-2d', name: '2D Geometry', confidence: 0.85, category: 'concept', color: '#2196F3' },
  { id: 'calculus-diff', name: 'Differentiation', confidence: 0.8, category: 'concept', color: '#9C27B0' },
  { id: 'trigonometry', name: 'Trigonometry', confidence: 0.75, category: 'concept', color: '#FF9800' },
  
  // Physics Concepts
  { id: 'mechanics', name: 'Mechanics', confidence: 0.9, category: 'concept', color: '#F44336' },
  { id: 'thermodynamics', name: 'Thermodynamics', confidence: 0.85, category: 'concept', color: '#607D8B' },
  { id: 'optics', name: 'Optics', confidence: 0.8, category: 'concept', color: '#FFEB3B' },
  { id: 'electromagnetism', name: 'Electromagnetism', confidence: 0.75, category: 'concept', color: '#3F51B5' },
  
  // Chemistry Concepts
  { id: 'organic-chem', name: 'Organic Chemistry', confidence: 0.9, category: 'concept', color: '#8BC34A' },
  { id: 'inorganic-chem', name: 'Inorganic Chemistry', confidence: 0.85, category: 'concept', color: '#00BCD4' },
  { id: 'physical-chem', name: 'Physical Chemistry', confidence: 0.8, category: 'concept', color: '#795548' },
  
  // Biology Concepts
  { id: 'cell-biology', name: 'Cell Biology', confidence: 0.9, category: 'concept', color: '#4CAF50' },
  { id: 'genetics', name: 'Genetics', confidence: 0.85, category: 'concept', color: '#E91E63' },
  { id: 'evolution', name: 'Evolution', confidence: 0.8, category: 'concept', color: '#FF5722' },
  
  // Difficulty Tags
  { id: 'basic', name: 'Basic', confidence: 0.9, category: 'difficulty', color: '#4CAF50' },
  { id: 'intermediate', name: 'Intermediate', confidence: 0.85, category: 'difficulty', color: '#FF9800' },
  { id: 'advanced', name: 'Advanced', confidence: 0.8, category: 'difficulty', color: '#F44336' },
  
  // Skill Tags
  { id: 'problem-solving', name: 'Problem Solving', confidence: 0.9, category: 'skill', color: '#9C27B0' },
  { id: 'analytical', name: 'Analytical', confidence: 0.85, category: 'skill', color: '#3F51B5' },
  { id: 'conceptual', name: 'Conceptual', confidence: 0.8, category: 'skill', color: '#607D8B' },
  { id: 'application', name: 'Application', confidence: 0.75, category: 'skill', color: '#795548' },
];

const KEYWORD_PATTERNS = {
  // Math Keywords
  'equation|solve|unknown': { tag: 'algebra-basic', weight: 0.9 },
  'triangle|angle|side': { tag: 'geometry-2d', weight: 0.85 },
  'derivative|differentiate|rate': { tag: 'calculus-diff', weight: 0.8 },
  'sin|cos|tan|trigonometric': { tag: 'trigonometry', weight: 0.75 },
  
  // Physics Keywords
  'force|motion|velocity|acceleration': { tag: 'mechanics', weight: 0.9 },
  'heat|temperature|entropy': { tag: 'thermodynamics', weight: 0.85 },
  'light|reflection|refraction': { tag: 'optics', weight: 0.8 },
  'electric|magnetic|current': { tag: 'electromagnetism', weight: 0.75 },
  
  // Chemistry Keywords
  'carbon|hydrocarbon|functional group': { tag: 'organic-chem', weight: 0.9 },
  'periodic|element|compound': { tag: 'inorganic-chem', weight: 0.85 },
  'thermochemistry|kinetics|equilibrium': { tag: 'physical-chem', weight: 0.8 },
  
  // Biology Keywords
  'cell|membrane|organelle': { tag: 'cell-biology', weight: 0.9 },
  'DNA|gene|chromosome': { tag: 'genetics', weight: 0.85 },
  'natural selection|species|adaptation': { tag: 'evolution', weight: 0.8 },
  
  // Difficulty Keywords
  'basic|simple|fundamental': { tag: 'basic', weight: 0.9 },
  'complex|intermediate|moderate': { tag: 'intermediate', weight: 0.85 },
  'advanced|difficult|challenging': { tag: 'advanced', weight: 0.8 },
  
  // Skill Keywords
  'solve|find|calculate': { tag: 'problem-solving', weight: 0.9 },
  'analyze|examine|evaluate': { tag: 'analytical', weight: 0.85 },
  'understand|explain|concept': { tag: 'conceptual', weight: 0.8 },
  'apply|use|implement': { tag: 'application', weight: 0.75 },
};

export default function AutoTagger({
  questionText,
  questionType = 'text',
  mediaContent,
  selectedSubject,
  onTagsChange,
  maxTags = 8,
  confidenceThreshold = 0.6,
}: AutoTaggerProps) {
  const { theme } = useTheme();
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [suggestedTags, setSuggestedTags] = useState<TagSuggestion[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);

  // AI-powered tag analysis simulation
  const analyzeContent = useMemo(() => {
    const analysis = () => {
      if (!questionText.trim()) {
        setSuggestedTags([]);
        return;
      }

      setIsAnalyzing(true);
      
      // Simulate AI processing delay
      setTimeout(() => {
        const suggestions: TagSuggestion[] = [];
        const text = questionText.toLowerCase();
        
        // Pattern matching analysis
        Object.entries(KEYWORD_PATTERNS).forEach(([pattern, config]) => {
          const regex = new RegExp(pattern, 'i');
          if (regex.test(text)) {
            const tag = PREDEFINED_TAGS.find(t => t.id === config.tag);
            if (tag && tag.confidence >= confidenceThreshold) {
              suggestions.push({
                tag: { ...tag, confidence: config.weight },
                reason: `Detected keywords matching "${pattern}"`,
                sources: ['Content Analysis']
              });
            }
          }
        });

        // Subject-based suggestions
        if (selectedSubject) {
          const subjectTags = PREDEFINED_TAGS.filter(tag => 
            tag.name.toLowerCase().includes(selectedSubject.toLowerCase()) ||
            tag.id.includes(selectedSubject.toLowerCase())
          );
          
          subjectTags.forEach(tag => {
            if (!suggestions.some(s => s.tag.id === tag.id)) {
              suggestions.push({
                tag: { ...tag, confidence: 0.7 },
                reason: `Related to selected subject: ${selectedSubject}`,
                sources: ['Subject Context']
              });
            }
          });
        }

        // Question type analysis
        const typeBoost = questionType === 'math' ? 0.1 : 
                         questionType === 'code' ? 0.05 : 0;
        
        suggestions.forEach(suggestion => {
          suggestion.tag.confidence = Math.min(1, suggestion.tag.confidence + typeBoost);
        });

        // Sort by confidence and remove duplicates
        const uniqueSuggestions = suggestions
          .filter((suggestion, index, self) => 
            self.findIndex(s => s.tag.id === suggestion.tag.id) === index
          )
          .sort((a, b) => b.tag.confidence - a.tag.confidence)
          .slice(0, 12); // Limit suggestions

        setSuggestedTags(uniqueSuggestions);
        setIsAnalyzing(false);
      }, 1500); // Simulate processing time
    };

    return analysis;
  }, [questionText, selectedSubject, questionType, confidenceThreshold]);

  useEffect(() => {
    analyzeContent();
  }, [analyzeContent]);

  useEffect(() => {
    onTagsChange(selectedTags);
  }, [selectedTags, onTagsChange]);

  const handleTagSelect = (tag: Tag) => {
    if (selectedTags.some(t => t.id === tag.id)) return;
    if (selectedTags.length >= maxTags) {
      Alert.alert('Maximum Tags', `You can select up to ${maxTags} tags.`);
      return;
    }

    setSelectedTags(prev => [...prev, tag]);
  };

  const handleTagRemove = (tagId: string) => {
    setSelectedTags(prev => prev.filter(t => t.id !== tagId));
  };

  const handleCustomTagAdd = () => {
    if (!customTagInput.trim()) return;
    
    const customTag: Tag = {
      id: `custom-${Date.now()}`,
      name: customTagInput.trim(),
      confidence: 1.0,
      category: 'keyword',
      color: theme.primary,
    };

    handleTagSelect(customTag);
    setCustomTagInput('');
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'concept': return '#2196F3';
      case 'difficulty': return '#FF9800';
      case 'skill': return '#9C27B0';
      case 'topic': return '#4CAF50';
      case 'keyword': return '#607D8B';
      default: return theme.primary;
    }
  };

  const renderTag = (tag: Tag, isSelected: boolean = false, onPress?: () => void) => (
    <TouchableOpacity
      key={tag.id}
      style={[
        styles.tag,
        {
          backgroundColor: isSelected 
            ? (tag.color || getCategoryColor(tag.category))
            : theme.Surface,
          borderColor: tag.color || getCategoryColor(tag.category),
        }
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${isSelected ? 'Remove' : 'Add'} tag ${tag.name}`}
    >
      <Text
        style={[
          styles.tagText,
          {
            color: isSelected 
              ? theme.OnPrimary
              : (tag.color || getCategoryColor(tag.category))
          }
        ]}
      >
        {tag.name}
      </Text>
      {tag.confidence < 1 && (
        <Text
          style={[
            styles.confidenceText,
            {
              color: isSelected 
                ? theme.OnPrimary + '80'
                : theme.OnSurfaceVariant
            }
          ]}
        >
          {Math.round(tag.confidence * 100)}%
        </Text>
      )}
    </TouchableOpacity>
  );

  const displayedSuggestions = showAllSuggestions 
    ? suggestedTags 
    : suggestedTags.slice(0, 6);

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: theme.OnSurface }]}>
        Smart Tags
      </Text>

      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.OnSurfaceVariant }]}>
            Selected Tags ({selectedTags.length}/{maxTags})
          </Text>
          <View style={styles.tagsContainer}>
            {selectedTags.map(tag => 
              renderTag(tag, true, () => handleTagRemove(tag.id))
            )}
          </View>
        </View>
      )}

      {/* AI Analysis Status */}
      {isAnalyzing && (
        <View style={[styles.analysisContainer, { backgroundColor: theme.Surface }]}>
          <ActivityIndicator size="small" color={theme.primary} />
          <Text style={[styles.analysisText, { color: theme.OnSurface }]}>
            Analyzing question content...
          </Text>
        </View>
      )}

      {/* Suggested Tags */}
      {suggestedTags.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.OnSurfaceVariant }]}>
            AI Suggestions
          </Text>
          <View style={styles.tagsContainer}>
            {displayedSuggestions.map(suggestion => 
              renderTag(
                suggestion.tag, 
                selectedTags.some(t => t.id === suggestion.tag.id),
                () => handleTagSelect(suggestion.tag)
              )
            )}
          </View>
          
          {suggestedTags.length > 6 && (
            <TouchableOpacity
              style={styles.showMoreButton}
              onPress={() => setShowAllSuggestions(!showAllSuggestions)}
              accessibilityRole="button"
            >
              <Text style={[styles.showMoreText, { color: theme.primary }]}>
                {showAllSuggestions ? 'Show Less' : `Show ${suggestedTags.length - 6} More`}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Custom Tag Input */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: theme.OnSurfaceVariant }]}>
          Add Custom Tag
        </Text>
        <View style={styles.customTagContainer}>
          <TextInput
            style={[
              styles.customTagInput,
              { backgroundColor: theme.Surface, color: theme.OnSurface }
            ]}
            placeholder="Enter custom tag..."
            placeholderTextColor={theme.OnSurfaceVariant}
            value={customTagInput}
            onChangeText={setCustomTagInput}
            onSubmitEditing={handleCustomTagAdd}
            returnKeyType="done"
          />
          <TouchableOpacity
            style={[
              styles.addButton,
              { 
                backgroundColor: customTagInput.trim() 
                  ? theme.primary 
                  : theme.Surface
              }
            ]}
            onPress={handleCustomTagAdd}
            disabled={!customTagInput.trim()}
            accessibilityRole="button"
            accessibilityLabel="Add custom tag"
          >
            <Text
              style={[
                styles.addButtonText,
                {
                  color: customTagInput.trim() 
                    ? theme.OnPrimary 
                    : theme.OnSurfaceVariant
                }
              ]}
            >
              Add
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tag Categories Legend */}
      <View style={[styles.legendContainer, { backgroundColor: theme.Surface }]}>
        <Text style={[styles.legendTitle, { color: theme.OnSurface }]}>
          Tag Categories:
        </Text>
        <View style={styles.legendItems}>
          {['concept', 'difficulty', 'skill', 'topic', 'keyword'].map(category => (
            <View key={category} style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  { backgroundColor: getCategoryColor(category) }
                ]}
              />
              <Text
                style={[styles.legendText, { color: theme.OnSurfaceVariant }]}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '400',
  },
  analysisContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  analysisText: {
    marginLeft: 8,
    fontSize: 14,
    fontStyle: 'italic',
  },
  showMoreButton: {
    marginTop: 8,
    alignSelf: 'center',
    paddingVertical: 8,
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: '600',
  },
  customTagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customTagInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    fontSize: 16,
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  legendContainer: {
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
  },
});