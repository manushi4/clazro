/**
 * MathToolbar - Comprehensive Equation Building Tools
 * Phase 20: Rich Mathematical Editor
 * Provides categorized mathematical symbols, templates, and functions
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../context/ThemeContext';
import {
  MATH_SYMBOLS,
  MATH_TEMPLATES,
  getSymbolsByCategory,
  searchSymbols,
  getTemplatePlaceholders,
  fillTemplate,
} from '../../utils/mathUtils';

export interface MathToolbarProps {
  onInsertSymbol?: (latex: string) => void;
  onInsertTemplate?: (template: string) => void;
  onInsertFunction?: (functionName: string) => void;
  compactMode?: boolean;
  showCategories?: boolean;
  maxHeight?: number;
}

interface SymbolItem {
  symbol: string;
  latex: string;
  name: string;
  category?: string;
}

interface TemplateModalState {
  visible: boolean;
  template: { latex: string; name: string } | null;
  placeholders: string[];
  values: { [key: string]: string };
}

type ToolbarTab = 'symbols' | 'templates' | 'functions' | 'search';

const SYMBOL_CATEGORIES = [
  { key: 'basic', label: 'Basic', icon: 'calculate' },
  { key: 'fractions', label: 'Fractions', icon: 'architecture' },
  { key: 'greek', label: 'Greek', icon: 'language' },
  { key: 'comparison', label: 'Compare', icon: 'compare_arrows' },
  { key: 'sets', label: 'Sets', icon: 'category' },
  { key: 'calculus', label: 'Calculus', icon: 'functions' },
  { key: 'logic', label: 'Logic', icon: 'psychology' },
] as const;

const COMMON_FUNCTIONS = [
  { name: 'sin', latex: '\\sin()', display: 'sin(x)' },
  { name: 'cos', latex: '\\cos()', display: 'cos(x)' },
  { name: 'tan', latex: '\\tan()', display: 'tan(x)' },
  { name: 'log', latex: '\\log()', display: 'log(x)' },
  { name: 'ln', latex: '\\ln()', display: 'ln(x)' },
  { name: 'exp', latex: '\\exp()', display: 'exp(x)' },
  { name: 'sqrt', latex: '\\sqrt{}', display: '√x' },
  { name: 'abs', latex: '|{}|', display: '|x|' },
  { name: 'floor', latex: '\\lfloor {} \\rfloor', display: '⌊x⌋' },
  { name: 'ceil', latex: '\\lceil {} \\rceil', display: '⌈x⌉' },
];

const MathToolbar: React.FC<MathToolbarProps> = ({
  onInsertSymbol,
  onInsertTemplate,
  onInsertFunction,
  compactMode = false,
  showCategories = true,
  maxHeight = 300,
}) => {
  const { theme } = useTheme();
  
  const [activeTab, setActiveTab] = useState<ToolbarTab>('symbols');
  const [activeCategory, setActiveCategory] = useState<keyof typeof MATH_SYMBOLS>('basic');
  const [searchQuery, setSearchQuery] = useState('');
  const [templateModal, setTemplateModal] = useState<TemplateModalState>({
    visible: false,
    template: null,
    placeholders: [],
    values: {},
  });

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchSymbols(searchQuery);
  }, [searchQuery]);

  // Current symbols based on active category
  const currentSymbols = useMemo(() => {
    return getSymbolsByCategory(activeCategory);
  }, [activeCategory]);

  // Handle symbol insertion
  const handleSymbolPress = useCallback((symbol: SymbolItem) => {
    onInsertSymbol?.(symbol.latex);
  }, [onInsertSymbol]);

  // Handle template selection
  const handleTemplatePress = useCallback((templateKey: keyof typeof MATH_TEMPLATES) => {
    const template = MATH_TEMPLATES[templateKey];
    const placeholders = getTemplatePlaceholders(template.latex);
    
    if (placeholders.length > 0) {
      // Show modal for placeholder input
      setTemplateModal({
        visible: true,
        template,
        placeholders,
        values: {},
      });
    } else {
      // Insert directly if no placeholders
      onInsertTemplate?.(template.latex);
    }
  }, [onInsertTemplate]);

  // Handle template modal completion
  const handleTemplateComplete = useCallback(() => {
    if (!templateModal.template) return;
    
    const filledTemplate = fillTemplate(templateModal.template.latex, templateModal.values);
    onInsertTemplate?.(filledTemplate);
    
    setTemplateModal({
      visible: false,
      template: null,
      placeholders: [],
      values: {},
    });
  }, [templateModal, onInsertTemplate]);

  // Handle function insertion
  const handleFunctionPress = useCallback((func: typeof COMMON_FUNCTIONS[0]) => {
    onInsertFunction?.(func.latex);
  }, [onInsertFunction]);

  // Update placeholder value
  const updatePlaceholderValue = useCallback((placeholder: string, value: string) => {
    setTemplateModal(prev => ({
      ...prev,
      values: { ...prev.values, [placeholder]: value },
    }));
  }, []);

  const getStyles = (theme: any) => StyleSheet.create({
    container: {
      backgroundColor: theme.Surface,
      borderRadius: 12,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      maxHeight,
    },

    header: {
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 12,
    },

    title: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.OnSurface,
      marginBottom: 12,
    },

    tabContainer: {
      flexDirection: 'row',
      gap: 8,
    },

    tab: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: theme.SurfaceVariant,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },

    activeTab: {
      backgroundColor: theme.primary,
    },

    tabText: {
      fontSize: 13,
      fontWeight: '500',
      color: theme.OnSurfaceVariant,
    },

    activeTabText: {
      color: theme.OnPrimary,
    },

    tabIcon: {
      color: theme.OnSurfaceVariant,
    },

    activeTabIcon: {
      color: theme.OnPrimary,
    },

    content: {
      flex: 1,
      padding: 16,
    },

    compactContent: {
      paddingHorizontal: 12,
      paddingVertical: 8,
    },

    categoryContainer: {
      marginBottom: 12,
    },

    categoryScrollView: {
      marginBottom: 16,
    },

    categoryButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: theme.SurfaceVariant,
      marginRight: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },

    activeCategoryButton: {
      backgroundColor: theme.secondaryContainer,
    },

    categoryText: {
      fontSize: 12,
      fontWeight: '500',
      color: theme.OnSurfaceVariant,
    },

    activeCategoryText: {
      color: theme.OnSecondaryContainer,
    },

    categoryIcon: {
      color: theme.OnSurfaceVariant,
    },

    activeCategoryIcon: {
      color: theme.OnSecondaryContainer,
    },

    symbolGrid: {
      flex: 1,
    },

    symbolItem: {
      aspectRatio: 1,
      backgroundColor: theme.background,
      borderRadius: 8,
      margin: 4,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.Outline,
    },

    compactSymbolItem: {
      aspectRatio: 1.2,
      minHeight: 32,
    },

    symbolText: {
      fontSize: compactMode ? 16 : 20,
      color: theme.OnBackground,
      textAlign: 'center',
    },

    symbolName: {
      fontSize: 8,
      color: theme.OnSurfaceVariant,
      textAlign: 'center',
      marginTop: 2,
    },

    templateList: {
      flex: 1,
    },

    templateItem: {
      backgroundColor: theme.background,
      padding: 12,
      borderRadius: 8,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: theme.Outline,
    },

    templateName: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.OnBackground,
      marginBottom: 4,
    },

    templateLatex: {
      fontSize: 12,
      fontFamily: 'monospace',
      color: theme.OnSurfaceVariant,
      backgroundColor: theme.SurfaceVariant,
      padding: 4,
      borderRadius: 4,
    },

    functionGrid: {
      flex: 1,
    },

    functionItem: {
      backgroundColor: theme.background,
      padding: 12,
      borderRadius: 8,
      margin: 4,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.Outline,
      minHeight: 60,
      justifyContent: 'center',
    },

    functionDisplay: {
      fontSize: 16,
      color: theme.OnBackground,
      fontWeight: '500',
      marginBottom: 2,
    },

    functionName: {
      fontSize: 10,
      color: theme.OnSurfaceVariant,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },

    searchContainer: {
      marginBottom: 16,
    },

    searchInput: {
      backgroundColor: theme.background,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      color: theme.OnBackground,
      borderWidth: 1,
      borderColor: theme.Outline,
    },

    searchResults: {
      flex: 1,
    },

    searchResultItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      backgroundColor: theme.background,
      borderRadius: 8,
      marginBottom: 4,
      borderWidth: 1,
      borderColor: theme.Outline,
    },

    searchResultSymbol: {
      fontSize: 18,
      marginRight: 12,
      minWidth: 30,
      textAlign: 'center',
    },

    searchResultInfo: {
      flex: 1,
    },

    searchResultName: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.OnBackground,
    },

    searchResultLatex: {
      fontSize: 11,
      color: theme.OnSurfaceVariant,
      fontFamily: 'monospace',
      marginTop: 2,
    },

    searchResultCategory: {
      fontSize: 10,
      color: theme.primary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginTop: 2,
    },

    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },

    modalContainer: {
      backgroundColor: theme.Surface,
      borderRadius: 16,
      padding: 24,
      maxWidth: '90%',
      width: 320,
      elevation: 8,
    },

    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.OnSurface,
      marginBottom: 16,
      textAlign: 'center',
    },

    placeholderContainer: {
      marginBottom: 12,
    },

    placeholderLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.OnSurface,
      marginBottom: 6,
    },

    placeholderInput: {
      backgroundColor: theme.background,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: 14,
      color: theme.OnBackground,
      borderWidth: 1,
      borderColor: theme.Outline,
    },

    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 24,
      gap: 12,
    },

    modalButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 24,
      alignItems: 'center',
    },

    cancelButton: {
      backgroundColor: theme.SurfaceVariant,
    },

    confirmButton: {
      backgroundColor: theme.primary,
    },

    modalButtonText: {
      fontSize: 14,
      fontWeight: '600',
    },

    cancelButtonText: {
      color: theme.OnSurfaceVariant,
    },

    confirmButtonText: {
      color: theme.OnPrimary,
    },

    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 32,
    },

    emptyStateText: {
      fontSize: 14,
      color: theme.OnSurfaceVariant,
      textAlign: 'center',
      marginTop: 8,
    },
  });

  const styles = getStyles(theme);

  const tabs = [
    { key: 'symbols' as ToolbarTab, label: 'Symbols', icon: 'functions' },
    { key: 'templates' as ToolbarTab, label: 'Templates', icon: 'architecture' },
    { key: 'functions' as ToolbarTab, label: 'Functions', icon: 'calculate' },
    { key: 'search' as ToolbarTab, label: 'Search', icon: 'search' },
  ];

  const renderSymbolItem = ({ item, index }: { item: SymbolItem; index: number }) => (
    <TouchableOpacity
      style={[
        styles.symbolItem,
        compactMode && styles.compactSymbolItem,
      ]}
      onPress={() => handleSymbolPress(item)}
      accessibilityLabel={`Insert ${item.name}`}
      accessibilityRole="button"
    >
      <Text style={styles.symbolText}>{item.symbol}</Text>
      {!compactMode && <Text style={styles.symbolName}>{item.name}</Text>}
    </TouchableOpacity>
  );

  const renderTemplateItem = ({ item: [key, template] }: { item: [string, typeof MATH_TEMPLATES[keyof typeof MATH_TEMPLATES]] }) => (
    <TouchableOpacity
      style={styles.templateItem}
      onPress={() => handleTemplatePress(key as keyof typeof MATH_TEMPLATES)}
      accessibilityLabel={`Insert ${template.name} template`}
      accessibilityRole="button"
    >
      <Text style={styles.templateName}>{template.name}</Text>
      <Text style={styles.templateLatex}>{template.latex}</Text>
    </TouchableOpacity>
  );

  const renderFunctionItem = ({ item }: { item: typeof COMMON_FUNCTIONS[0] }) => (
    <TouchableOpacity
      style={styles.functionItem}
      onPress={() => handleFunctionPress(item)}
      accessibilityLabel={`Insert ${item.name} function`}
      accessibilityRole="button"
    >
      <Text style={styles.functionDisplay}>{item.display}</Text>
      <Text style={styles.functionName}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderSearchResult = ({ item }: { item: SymbolItem }) => (
    <TouchableOpacity
      style={styles.searchResultItem}
      onPress={() => handleSymbolPress(item)}
      accessibilityLabel={`Insert ${item.name}`}
      accessibilityRole="button"
    >
      <Text style={styles.searchResultSymbol}>{item.symbol}</Text>
      <View style={styles.searchResultInfo}>
        <Text style={styles.searchResultName}>{item.name}</Text>
        <Text style={styles.searchResultLatex}>{item.latex}</Text>
        {item.category && (
          <Text style={styles.searchResultCategory}>{item.category}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'symbols':
        return (
          <>
            {showCategories && (
              <View style={styles.categoryContainer}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoryScrollView}
                >
                  {SYMBOL_CATEGORIES.map((category) => (
                    <TouchableOpacity
                      key={category.key}
                      style={[
                        styles.categoryButton,
                        activeCategory === category.key && styles.activeCategoryButton,
                      ]}
                      onPress={() => setActiveCategory(category.key as keyof typeof MATH_SYMBOLS)}
                      accessibilityLabel={`Select ${category.label} category`}
                      accessibilityRole="button"
                    >
                      <Icon
                        name={category.icon}
                        size={12}
                        style={[
                          styles.categoryIcon,
                          activeCategory === category.key && styles.activeCategoryIcon,
                        ]}
                      />
                      <Text
                        style={[
                          styles.categoryText,
                          activeCategory === category.key && styles.activeCategoryText,
                        ]}
                      >
                        {category.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
            
            <FlatList
              data={currentSymbols}
              renderItem={renderSymbolItem}
              numColumns={compactMode ? 6 : 4}
              key={`symbols-${compactMode ? 'compact' : 'normal'}`}
              style={styles.symbolGrid}
              showsVerticalScrollIndicator={false}
            />
          </>
        );

      case 'templates':
        return (
          <FlatList
            data={Object.entries(MATH_TEMPLATES)}
            renderItem={renderTemplateItem}
            style={styles.templateList}
            showsVerticalScrollIndicator={false}
          />
        );

      case 'functions':
        return (
          <FlatList
            data={COMMON_FUNCTIONS}
            renderItem={renderFunctionItem}
            numColumns={compactMode ? 3 : 2}
            key={`functions-${compactMode ? 'compact' : 'normal'}`}
            style={styles.functionGrid}
            showsVerticalScrollIndicator={false}
          />
        );

      case 'search':
        return (
          <>
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search symbols, names, or LaTeX..."
                placeholderTextColor={theme.OnSurfaceVariant}
                accessibilityLabel="Search mathematical symbols"
              />
            </View>
            
            {searchQuery.trim() ? (
              searchResults.length > 0 ? (
                <FlatList
                  data={searchResults}
                  renderItem={renderSearchResult}
                  style={styles.searchResults}
                  showsVerticalScrollIndicator={false}
                />
              ) : (
                <View style={styles.emptyState}>
                  <Icon name="search-off" size={32} color={theme.OnSurfaceVariant} />
                  <Text style={styles.emptyStateText}>
                    No symbols found for "{searchQuery}"
                  </Text>
                </View>
              )
            ) : (
              <View style={styles.emptyState}>
                <Icon name="search" size={32} color={theme.OnSurfaceVariant} />
                <Text style={styles.emptyStateText}>
                  Enter a search term to find symbols
                </Text>
              </View>
            )}
          </>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          {!compactMode && <Text style={styles.title}>Math Toolbar</Text>}
          
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabContainer}
          >
            {tabs.map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tab,
                  activeTab === tab.key && styles.activeTab,
                ]}
                onPress={() => setActiveTab(tab.key)}
                accessibilityLabel={`Switch to ${tab.label} tab`}
                accessibilityRole="button"
              >
                <Icon
                  name={tab.icon}
                  size={16}
                  style={[
                    styles.tabIcon,
                    activeTab === tab.key && styles.activeTabIcon,
                  ]}
                />
                <Text
                  style={[
                    styles.tabText,
                    activeTab === tab.key && styles.activeTabText,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={[styles.content, compactMode && styles.compactContent]}>
          {renderContent()}
        </View>
      </View>

      {/* Template Modal */}
      <Modal
        visible={templateModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setTemplateModal(prev => ({ ...prev, visible: false }))}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              {templateModal.template?.name}
            </Text>

            {templateModal.placeholders.map((placeholder, index) => (
              <View key={placeholder} style={styles.placeholderContainer}>
                <Text style={styles.placeholderLabel}>
                  {placeholder.charAt(0).toUpperCase() + placeholder.slice(1)}:
                </Text>
                <TextInput
                  style={styles.placeholderInput}
                  value={templateModal.values[placeholder] || ''}
                  onChangeText={(text) => updatePlaceholderValue(placeholder, text)}
                  placeholder={`Enter ${placeholder}...`}
                  placeholderTextColor={theme.OnSurfaceVariant}
                  autoFocus={index === 0}
                />
              </View>
            ))}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setTemplateModal(prev => ({ ...prev, visible: false }))}
              >
                <Text style={[styles.modalButtonText, styles.cancelButtonText]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleTemplateComplete}
              >
                <Text style={[styles.modalButtonText, styles.confirmButtonText]}>
                  Insert
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default MathToolbar;