import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  Alert,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export interface Subject {
  id: string;
  name: string;
  chapters: Chapter[];
}

export interface Chapter {
  id: string;
  name: string;
  topics: Topic[];
}

export interface Topic {
  id: string;
  name: string;
  difficulty: 'Basic' | 'Intermediate' | 'Advanced';
}

export interface CategorySelection {
  subject?: Subject;
  chapter?: Chapter;
  topic?: Topic;
}

interface CategorySelectorProps {
  onSelectionChange: (selection: CategorySelection) => void;
  initialSelection?: CategorySelection;
  mandatory?: boolean;
  placeholder?: string;
}

const SUBJECTS_DATA: Subject[] = [
  {
    id: 'math',
    name: 'Mathematics',
    chapters: [
      {
        id: 'algebra',
        name: 'Algebra',
        topics: [
          { id: 'linear-eq', name: 'Linear Equations', difficulty: 'Basic' },
          { id: 'quadratic', name: 'Quadratic Equations', difficulty: 'Intermediate' },
          { id: 'polynomials', name: 'Polynomials', difficulty: 'Advanced' },
        ],
      },
      {
        id: 'geometry',
        name: 'Geometry',
        topics: [
          { id: 'triangles', name: 'Triangles', difficulty: 'Basic' },
          { id: 'circles', name: 'Circles', difficulty: 'Intermediate' },
          { id: 'coordinate-geo', name: 'Coordinate Geometry', difficulty: 'Advanced' },
        ],
      },
      {
        id: 'calculus',
        name: 'Calculus',
        topics: [
          { id: 'limits', name: 'Limits', difficulty: 'Intermediate' },
          { id: 'derivatives', name: 'Derivatives', difficulty: 'Advanced' },
          { id: 'integrals', name: 'Integrals', difficulty: 'Advanced' },
        ],
      },
    ],
  },
  {
    id: 'physics',
    name: 'Physics',
    chapters: [
      {
        id: 'mechanics',
        name: 'Mechanics',
        topics: [
          { id: 'motion', name: 'Motion', difficulty: 'Basic' },
          { id: 'forces', name: 'Forces', difficulty: 'Intermediate' },
          { id: 'energy', name: 'Energy', difficulty: 'Advanced' },
        ],
      },
      {
        id: 'thermodynamics',
        name: 'Thermodynamics',
        topics: [
          { id: 'heat', name: 'Heat Transfer', difficulty: 'Intermediate' },
          { id: 'entropy', name: 'Entropy', difficulty: 'Advanced' },
        ],
      },
    ],
  },
  {
    id: 'chemistry',
    name: 'Chemistry',
    chapters: [
      {
        id: 'organic',
        name: 'Organic Chemistry',
        topics: [
          { id: 'hydrocarbons', name: 'Hydrocarbons', difficulty: 'Basic' },
          { id: 'functional-groups', name: 'Functional Groups', difficulty: 'Intermediate' },
          { id: 'reactions', name: 'Organic Reactions', difficulty: 'Advanced' },
        ],
      },
      {
        id: 'inorganic',
        name: 'Inorganic Chemistry',
        topics: [
          { id: 'periodic-table', name: 'Periodic Table', difficulty: 'Basic' },
          { id: 'chemical-bonding', name: 'Chemical Bonding', difficulty: 'Intermediate' },
        ],
      },
    ],
  },
  {
    id: 'biology',
    name: 'Biology',
    chapters: [
      {
        id: 'cell-biology',
        name: 'Cell Biology',
        topics: [
          { id: 'cell-structure', name: 'Cell Structure', difficulty: 'Basic' },
          { id: 'cell-division', name: 'Cell Division', difficulty: 'Intermediate' },
        ],
      },
      {
        id: 'genetics',
        name: 'Genetics',
        topics: [
          { id: 'inheritance', name: 'Inheritance', difficulty: 'Intermediate' },
          { id: 'molecular-genetics', name: 'Molecular Genetics', difficulty: 'Advanced' },
        ],
      },
    ],
  },
];

export default function CategorySelector({
  onSelectionChange,
  initialSelection,
  mandatory = false,
  placeholder = 'Select Subject → Chapter → Topic',
}: CategorySelectorProps) {
  const { theme } = useTheme();
  const [selection, setSelection] = useState<CategorySelection>(initialSelection || {});
  const [modalVisible, setModalVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState<'subject' | 'chapter' | 'topic'>('subject');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    onSelectionChange(selection);
  }, [selection, onSelectionChange]);

  const handleSubjectSelect = (subject: Subject) => {
    const newSelection: CategorySelection = { subject };
    setSelection(newSelection);
    setCurrentStep('chapter');
  };

  const handleChapterSelect = (chapter: Chapter) => {
    const newSelection: CategorySelection = { 
      ...selection, 
      chapter,
      topic: undefined // Reset topic when chapter changes
    };
    setSelection(newSelection);
    setCurrentStep('topic');
  };

  const handleTopicSelect = (topic: Topic) => {
    const newSelection: CategorySelection = { ...selection, topic };
    setSelection(newSelection);
    setModalVisible(false);
    setCurrentStep('subject');
  };

  const resetSelection = () => {
    setSelection({});
    setCurrentStep('subject');
  };

  const getFilteredItems = () => {
    const query = searchQuery.toLowerCase();
    
    switch (currentStep) {
      case 'subject':
        return SUBJECTS_DATA.filter(subject =>
          subject.name.toLowerCase().includes(query)
        );
      case 'chapter':
        return selection.subject?.chapters.filter(chapter =>
          chapter.name.toLowerCase().includes(query)
        ) || [];
      case 'topic':
        return selection.chapter?.topics.filter(topic =>
          topic.name.toLowerCase().includes(query)
        ) || [];
      default:
        return [];
    }
  };

  const getSelectionText = () => {
    if (!selection.subject) return placeholder;
    
    let text = selection.subject.name;
    if (selection.chapter) text += ` → ${selection.chapter.name}`;
    if (selection.topic) text += ` → ${selection.topic.name}`;
    
    return text;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Basic': return theme.success;
      case 'Intermediate': return theme.warning;
      case 'Advanced': return theme.error;
      default: return theme.OnSurface;
    }
  };

  const renderStepIndicator = () => (
    <View style={[styles.stepIndicator, { backgroundColor: theme.Surface }]}>
      <View style={styles.stepRow}>
        <View style={[
          styles.stepDot,
          { backgroundColor: currentStep === 'subject' ? theme.primary : theme.Outline }
        ]}>
          <Text style={[styles.stepNumber, { color: theme.OnPrimary }]}>1</Text>
        </View>
        <Text style={[styles.stepLabel, { color: theme.OnSurface }]}>Subject</Text>
      </View>
      
      <View style={[styles.stepConnector, { backgroundColor: theme.Outline }]} />
      
      <View style={styles.stepRow}>
        <View style={[
          styles.stepDot,
          { backgroundColor: currentStep === 'chapter' ? theme.primary : theme.Outline }
        ]}>
          <Text style={[styles.stepNumber, { color: theme.OnPrimary }]}>2</Text>
        </View>
        <Text style={[styles.stepLabel, { color: theme.OnSurface }]}>Chapter</Text>
      </View>
      
      <View style={[styles.stepConnector, { backgroundColor: theme.Outline }]} />
      
      <View style={styles.stepRow}>
        <View style={[
          styles.stepDot,
          { backgroundColor: currentStep === 'topic' ? theme.primary : theme.Outline }
        ]}>
          <Text style={[styles.stepNumber, { color: theme.OnPrimary }]}>3</Text>
        </View>
        <Text style={[styles.stepLabel, { color: theme.OnSurface }]}>Topic</Text>
      </View>
    </View>
  );

  const renderSubjectItem = ({ item }: { item: Subject }) => (
    <TouchableOpacity
      style={[styles.listItem, { backgroundColor: theme.Surface }]}
      onPress={() => handleSubjectSelect(item)}
      accessibilityRole="button"
      accessibilityLabel={`Select ${item.name} subject`}
    >
      <Text style={[styles.itemText, { color: theme.OnSurface }]}>{item.name}</Text>
      <Text style={[styles.itemCount, { color: theme.OnSurfaceVariant }]}>
        {item.chapters.length} chapters
      </Text>
    </TouchableOpacity>
  );

  const renderChapterItem = ({ item }: { item: Chapter }) => (
    <TouchableOpacity
      style={[styles.listItem, { backgroundColor: theme.Surface }]}
      onPress={() => handleChapterSelect(item)}
      accessibilityRole="button"
      accessibilityLabel={`Select ${item.name} chapter`}
    >
      <Text style={[styles.itemText, { color: theme.OnSurface }]}>{item.name}</Text>
      <Text style={[styles.itemCount, { color: theme.OnSurfaceVariant }]}>
        {item.topics.length} topics
      </Text>
    </TouchableOpacity>
  );

  const renderTopicItem = ({ item }: { item: Topic }) => (
    <TouchableOpacity
      style={[styles.listItem, { backgroundColor: theme.Surface }]}
      onPress={() => handleTopicSelect(item)}
      accessibilityRole="button"
      accessibilityLabel={`Select ${item.name} topic, difficulty ${item.difficulty}`}
    >
      <View style={styles.topicInfo}>
        <Text style={[styles.itemText, { color: theme.OnSurface }]}>{item.name}</Text>
        <View style={[
          styles.difficultyBadge,
          { backgroundColor: getDifficultyColor(item.difficulty) }
        ]}>
          <Text style={[styles.difficultyText, { color: theme.OnPrimary }]}>
            {item.difficulty}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.selector,
          { backgroundColor: theme.Surface, borderColor: theme.Outline }
        ]}
        onPress={() => setModalVisible(true)}
        accessibilityRole="button"
        accessibilityLabel="Open category selector"
      >
        <Text
          style={[
            styles.selectorText,
            { color: selection.subject ? theme.OnSurface : theme.OnSurfaceVariant }
          ]}
          numberOfLines={2}
        >
          {getSelectionText()}
        </Text>
        {mandatory && !selection.topic && (
          <Text style={[styles.requiredIndicator, { color: theme.error }]}>*</Text>
        )}
      </TouchableOpacity>

      {selection.subject && (
        <TouchableOpacity
          style={[styles.resetButton, { backgroundColor: theme.errorContainer }]}
          onPress={resetSelection}
          accessibilityRole="button"
          accessibilityLabel="Clear category selection"
        >
          <Text style={[styles.resetText, { color: theme.OnErrorContainer }]}>
            Clear Selection
          </Text>
        </TouchableOpacity>
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.Outline }]}>
              <Text style={[styles.modalTitle, { color: theme.OnSurface }]}>
                Select Category
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="Close category selector"
              >
                <Text style={[styles.closeButtonText, { color: theme.primary }]}>
                  Close
                </Text>
              </TouchableOpacity>
            </View>

            {renderStepIndicator()}

            <TextInput
              style={[
                styles.searchInput,
                { backgroundColor: theme.Surface, color: theme.OnSurface }
              ]}
              placeholder={`Search ${currentStep}...`}
              placeholderTextColor={theme.OnSurfaceVariant}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            <FlatList
              data={getFilteredItems()}
              renderItem={
                currentStep === 'subject' ? renderSubjectItem :
                currentStep === 'chapter' ? renderChapterItem :
                renderTopicItem
              }
              keyExtractor={(item) => item.id}
              style={styles.list}
              showsVerticalScrollIndicator={false}
            />

            {currentStep !== 'subject' && (
              <TouchableOpacity
                style={[styles.backButton, { backgroundColor: theme.Surface }]}
                onPress={() => {
                  if (currentStep === 'chapter') setCurrentStep('subject');
                  if (currentStep === 'topic') setCurrentStep('chapter');
                  setSearchQuery('');
                }}
                accessibilityRole="button"
                accessibilityLabel="Go back to previous step"
              >
                <Text style={[styles.backButtonText, { color: theme.primary }]}>
                  ← Back to {currentStep === 'chapter' ? 'Subjects' : 'Chapters'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  selector: {
    minHeight: 56,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorText: {
    fontSize: 16,
    flex: 1,
  },
  requiredIndicator: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  resetButton: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  resetText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
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
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  stepRow: {
    alignItems: 'center',
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  stepConnector: {
    flex: 1,
    height: 2,
    marginHorizontal: 8,
  },
  searchInput: {
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    fontSize: 16,
  },
  list: {
    flex: 1,
    paddingHorizontal: 16,
  },
  listItem: {
    padding: 12,
    marginVertical: 2,
    borderRadius: 6,
    elevation: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  itemText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  itemCount: {
    fontSize: 14,
  },
  topicInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  backButton: {
    margin: 16,
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
export { CategorySelection as CategorySelector };
