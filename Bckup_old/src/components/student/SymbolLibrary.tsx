/**
 * SymbolLibrary - Comprehensive Mathematical Symbol Library
 * Phase 20: Rich Mathematical Editor
 * Provides organized access to mathematical symbols, templates, and recent usage
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
  TextInput,
  Modal,
  Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../context/ThemeContext';
import {
  MATH_SYMBOLS,
  MATH_TEMPLATES,
  searchSymbols,
  getSymbolsByCategory,
} from '../../utils/mathUtils';

export interface SymbolLibraryProps {
  onSymbolSelect?: (latex: string, symbol: string) => void;
  onTemplateSelect?: (template: string) => void;
  onClose?: () => void;
  visible?: boolean;
  maxRecentItems?: number;
  enableFavorites?: boolean;
}

interface SymbolItem {
  symbol: string;
  latex: string;
  name: string;
  category?: string;
}

interface RecentItem extends SymbolItem {
  timestamp: number;
  count: number;
}

interface FavoriteItem extends SymbolItem {
  dateAdded: number;
}

type LibraryView = 'categories' | 'recent' | 'favorites' | 'search' | 'templates';

const SYMBOL_CATEGORIES = [
  { key: 'basic', label: 'Basic Operations', icon: 'calculate', color: '#FF6B6B' },
  { key: 'fractions', label: 'Fractions & Powers', icon: 'architecture', color: '#4ECDC4' },
  { key: 'greek', label: 'Greek Letters', icon: 'language', color: '#45B7D1' },
  { key: 'comparison', label: 'Comparison', icon: 'compare_arrows', color: '#96CEB4' },
  { key: 'sets', label: 'Set Theory', icon: 'category', color: '#FECA57' },
  { key: 'calculus', label: 'Calculus', icon: 'functions', color: '#FF9FF3' },
  { key: 'logic', label: 'Logic', icon: 'psychology', color: '#54A0FF' },
] as const;

const STORAGE_KEYS = {
  RECENT_SYMBOLS: '@math_editor_recent_symbols',
  FAVORITE_SYMBOLS: '@math_editor_favorite_symbols',
};

const SymbolLibrary: React.FC<SymbolLibraryProps> = ({
  onSymbolSelect,
  onTemplateSelect,
  onClose,
  visible = true,
  maxRecentItems = 50,
  enableFavorites = true,
}) => {
  const { theme } = useTheme();

  const [currentView, setCurrentView] = useState<LibraryView>('categories');
  const [selectedCategory, setSelectedCategory] = useState<keyof typeof MATH_SYMBOLS>('basic');
  const [searchQuery, setSearchQuery] = useState('');
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [favoriteItems, setFavoriteItems] = useState<FavoriteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load stored data on mount
  useEffect(() => {
    loadStoredData();
  }, []);

  const loadStoredData = async () => {
    try {
      setIsLoading(true);
      
      // Load recent items
      const recentData = await AsyncStorage.getItem(STORAGE_KEYS.RECENT_SYMBOLS);
      if (recentData) {
        setRecentItems(JSON.parse(recentData));
      }

      // Load favorites
      if (enableFavorites) {
        const favoriteData = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITE_SYMBOLS);
        if (favoriteData) {
          setFavoriteItems(JSON.parse(favoriteData));
        }
      }
    } catch (error) {
      console.warn('Failed to load symbol library data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Save recent items to storage
  const saveRecentItems = async (items: RecentItem[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.RECENT_SYMBOLS, JSON.stringify(items));
    } catch (error) {
      console.warn('Failed to save recent symbols:', error);
    }
  };

  // Save favorite items to storage
  const saveFavoriteItems = async (items: FavoriteItem[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.FAVORITE_SYMBOLS, JSON.stringify(items));
    } catch (error) {
      console.warn('Failed to save favorite symbols:', error);
    }
  };

  // Add to recent items
  const addToRecent = useCallback((symbol: SymbolItem) => {
    setRecentItems(prev => {
      const existingIndex = prev.findIndex(item => item.latex === symbol.latex);
      let newItems: RecentItem[];

      if (existingIndex >= 0) {
        // Update existing item
        newItems = [...prev];
        newItems[existingIndex] = {
          ...newItems[existingIndex],
          count: newItems[existingIndex].count + 1,
          timestamp: Date.now(),
        };
        
        // Move to front
        const [updatedItem] = newItems.splice(existingIndex, 1);
        newItems.unshift(updatedItem);
      } else {
        // Add new item
        const newItem: RecentItem = {
          ...symbol,
          timestamp: Date.now(),
          count: 1,
        };
        
        newItems = [newItem, ...prev].slice(0, maxRecentItems);
      }

      saveRecentItems(newItems);
      return newItems;
    });
  }, [maxRecentItems]);

  // Toggle favorite
  const toggleFavorite = useCallback((symbol: SymbolItem) => {
    if (!enableFavorites) return;

    setFavoriteItems(prev => {
      const existingIndex = prev.findIndex(item => item.latex === symbol.latex);
      let newItems: FavoriteItem[];

      if (existingIndex >= 0) {
        // Remove from favorites
        newItems = prev.filter((_, index) => index !== existingIndex);
      } else {
        // Add to favorites
        const newItem: FavoriteItem = {
          ...symbol,
          dateAdded: Date.now(),
        };
        newItems = [newItem, ...prev];
      }

      saveFavoriteItems(newItems);
      return newItems;
    });
  }, [enableFavorites]);

  // Check if item is favorite
  const isFavorite = useCallback((symbol: SymbolItem) => {
    return favoriteItems.some(item => item.latex === symbol.latex);
  }, [favoriteItems]);

  // Handle symbol selection
  const handleSymbolSelect = useCallback((symbol: SymbolItem) => {
    addToRecent(symbol);
    onSymbolSelect?.(symbol.latex, symbol.symbol);
  }, [addToRecent, onSymbolSelect]);

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchSymbols(searchQuery);
  }, [searchQuery]);

  // Current category symbols
  const categorySymbols = useMemo(() => {
    return getSymbolsByCategory(selectedCategory);
  }, [selectedCategory]);

  // Navigation items
  const navigationItems = [
    { key: 'categories' as LibraryView, label: 'Categories', icon: 'category' },
    { key: 'recent' as LibraryView, label: 'Recent', icon: 'history' },
    ...(enableFavorites ? [{ key: 'favorites' as LibraryView, label: 'Favorites', icon: 'favorite' }] : []),
    { key: 'templates' as LibraryView, label: 'Templates', icon: 'architecture' },
    { key: 'search' as LibraryView, label: 'Search', icon: 'search' },
  ];

  const getStyles = (theme: any) => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.Surface,
    },

    modal: {
      margin: 0,
      justifyContent: 'flex-end',
    },

    modalContent: {
      backgroundColor: theme.Surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '80%',
      minHeight: '50%',
    },

    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.OutlineVariant,
    },

    title: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.OnSurface,
    },

    closeButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: theme.SurfaceVariant,
    },

    navigation: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.OutlineVariant,
    },

    navScrollView: {
      flexGrow: 0,
    },

    navItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: theme.SurfaceVariant,
      marginRight: 12,
      gap: 6,
    },

    navItemActive: {
      backgroundColor: theme.primary,
    },

    navIcon: {
      color: theme.OnSurfaceVariant,
    },

    navIconActive: {
      color: theme.OnPrimary,
    },

    navText: {
      fontSize: 13,
      fontWeight: '500',
      color: theme.OnSurfaceVariant,
    },

    navTextActive: {
      color: theme.OnPrimary,
    },

    content: {
      flex: 1,
      padding: 16,
    },

    categoryGrid: {
      gap: 12,
    },

    categoryCard: {
      backgroundColor: theme.background,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.Outline,
      minHeight: 100,
      justifyContent: 'center',
    },

    categoryIcon: {
      marginBottom: 8,
    },

    categoryLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.OnBackground,
      textAlign: 'center',
    },

    categoryCount: {
      fontSize: 11,
      color: theme.OnSurfaceVariant,
      marginTop: 2,
    },

    symbolGrid: {
      flex: 1,
    },

    symbolCard: {
      backgroundColor: theme.background,
      borderRadius: 8,
      padding: 12,
      margin: 4,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.Outline,
      minHeight: 80,
      justifyContent: 'center',
      position: 'relative',
    },

    symbolText: {
      fontSize: 24,
      color: theme.OnBackground,
      marginBottom: 4,
    },

    symbolName: {
      fontSize: 10,
      color: theme.OnSurfaceVariant,
      textAlign: 'center',
    },

    symbolLatex: {
      fontSize: 8,
      fontFamily: 'monospace',
      color: theme.Outline,
      textAlign: 'center',
      marginTop: 2,
    },

    favoriteButton: {
      position: 'absolute',
      top: 4,
      right: 4,
      padding: 4,
      borderRadius: 12,
      backgroundColor: theme.SurfaceVariant,
    },

    favoriteIcon: {
      color: theme.OnSurfaceVariant,
    },

    favoriteIconActive: {
      color: '#FF6B6B',
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

    searchResultCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.background,
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: theme.Outline,
    },

    searchResultSymbol: {
      fontSize: 20,
      marginRight: 12,
      minWidth: 40,
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

    templateCard: {
      backgroundColor: theme.background,
      borderRadius: 8,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.Outline,
    },

    templateName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.OnBackground,
      marginBottom: 8,
    },

    templateLatex: {
      fontSize: 12,
      fontFamily: 'monospace',
      color: theme.OnSurfaceVariant,
      backgroundColor: theme.SurfaceVariant,
      padding: 8,
      borderRadius: 4,
    },

    recentCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.background,
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: theme.Outline,
    },

    recentSymbol: {
      fontSize: 20,
      marginRight: 12,
      minWidth: 40,
      textAlign: 'center',
    },

    recentInfo: {
      flex: 1,
    },

    recentName: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.OnBackground,
    },

    recentMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 2,
      gap: 8,
    },

    recentCount: {
      fontSize: 11,
      color: theme.OnSurfaceVariant,
    },

    recentTime: {
      fontSize: 11,
      color: theme.Outline,
    },

    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 40,
    },

    emptyIcon: {
      color: theme.OnSurfaceVariant,
      marginBottom: 12,
    },

    emptyText: {
      fontSize: 16,
      color: theme.OnSurfaceVariant,
      textAlign: 'center',
      marginBottom: 8,
    },

    emptySubtext: {
      fontSize: 13,
      color: theme.Outline,
      textAlign: 'center',
    },

    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },

    loadingText: {
      fontSize: 14,
      color: theme.OnSurfaceVariant,
      marginTop: 12,
    },
  });

  const styles = getStyles(theme);

  const formatRelativeTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const renderCategoryGrid = () => (
    <FlatList
      data={SYMBOL_CATEGORIES}
      numColumns={2}
      renderItem={({ item }) => (
        <View style={{ flex: 0.5 }}>
          <TouchableOpacity
            style={[styles.categoryCard, { borderColor: item.color + '40' }]}
            onPress={() => {
              setSelectedCategory(item.key as keyof typeof MATH_SYMBOLS);
              setCurrentView('categories');
            }}
          >
            <Icon
              name={item.icon}
              size={32}
              color={item.color}
              style={styles.categoryIcon}
            />
            <Text style={styles.categoryLabel}>{item.label}</Text>
            <Text style={styles.categoryCount}>
              {getSymbolsByCategory(item.key as keyof typeof MATH_SYMBOLS).length} symbols
            </Text>
          </TouchableOpacity>
        </View>
      )}
      contentContainerStyle={styles.categoryGrid}
      scrollEnabled={true}
    />
  );

  const renderSymbolGrid = (symbols: SymbolItem[]) => (
    <FlatList
      data={symbols}
      numColumns={3}
      renderItem={({ item }) => (
        <View style={{ flex: 0.33 }}>
          <TouchableOpacity
            style={styles.symbolCard}
            onPress={() => handleSymbolSelect(item)}
          >
            {enableFavorites && (
              <TouchableOpacity
                style={styles.favoriteButton}
                onPress={() => toggleFavorite(item)}
              >
                <Icon
                  name={isFavorite(item) ? 'favorite' : 'favorite-border'}
                  size={12}
                  style={[
                    styles.favoriteIcon,
                    isFavorite(item) && styles.favoriteIconActive,
                  ]}
                />
              </TouchableOpacity>
            )}
            
            <Text style={styles.symbolText}>{item.symbol}</Text>
            <Text style={styles.symbolName}>{item.name}</Text>
            <Text style={styles.symbolLatex}>{item.latex}</Text>
          </TouchableOpacity>
        </View>
      )}
      style={styles.symbolGrid}
      scrollEnabled={true}
    />
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <Icon name="hourglass-empty" size={32} color={theme.OnSurfaceVariant} />
          <Text style={styles.loadingText}>Loading symbol library...</Text>
        </View>
      );
    }

    switch (currentView) {
      case 'categories':
        if (selectedCategory) {
          return renderSymbolGrid(categorySymbols);
        }
        return renderCategoryGrid();

      case 'recent':
        if (recentItems.length === 0) {
          return (
            <View style={styles.emptyState}>
              <Icon name="history" size={48} style={styles.emptyIcon} />
              <Text style={styles.emptyText}>No Recent Symbols</Text>
              <Text style={styles.emptySubtext}>
                Symbols you use will appear here for quick access
              </Text>
            </View>
          );
        }
        
        return (
          <FlatList
            data={recentItems}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.recentCard}
                onPress={() => handleSymbolSelect(item)}
              >
                <Text style={styles.recentSymbol}>{item.symbol}</Text>
                <View style={styles.recentInfo}>
                  <Text style={styles.recentName}>{item.name}</Text>
                  <View style={styles.recentMeta}>
                    <Text style={styles.recentCount}>Used {item.count} times</Text>
                    <Text style={styles.recentTime}>
                      {formatRelativeTime(item.timestamp)}
                    </Text>
                  </View>
                </View>
                {enableFavorites && (
                  <TouchableOpacity
                    style={styles.favoriteButton}
                    onPress={() => toggleFavorite(item)}
                  >
                    <Icon
                      name={isFavorite(item) ? 'favorite' : 'favorite-border'}
                      size={16}
                      style={[
                        styles.favoriteIcon,
                        isFavorite(item) && styles.favoriteIconActive,
                      ]}
                    />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            )}
            scrollEnabled={true}
          />
        );

      case 'favorites':
        if (!enableFavorites) return null;
        
        if (favoriteItems.length === 0) {
          return (
            <View style={styles.emptyState}>
              <Icon name="favorite-border" size={48} style={styles.emptyIcon} />
              <Text style={styles.emptyText}>No Favorite Symbols</Text>
              <Text style={styles.emptySubtext}>
                Tap the heart icon on symbols to add them to favorites
              </Text>
            </View>
          );
        }
        
        return renderSymbolGrid(favoriteItems);

      case 'templates':
        return (
          <FlatList
            data={Object.entries(MATH_TEMPLATES)}
            renderItem={({ item: [key, template] }) => (
              <TouchableOpacity
                style={styles.templateCard}
                onPress={() => onTemplateSelect?.(template.latex)}
              >
                <Text style={styles.templateName}>{template.name}</Text>
                <Text style={styles.templateLatex}>{template.latex}</Text>
              </TouchableOpacity>
            )}
            scrollEnabled={true}
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
                autoFocus
              />
            </View>
            
            {searchQuery.trim() ? (
              searchResults.length > 0 ? (
                <FlatList
                  data={searchResults}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.searchResultCard}
                      onPress={() => handleSymbolSelect(item)}
                    >
                      <Text style={styles.searchResultSymbol}>{item.symbol}</Text>
                      <View style={styles.searchResultInfo}>
                        <Text style={styles.searchResultName}>{item.name}</Text>
                        <Text style={styles.searchResultLatex}>{item.latex}</Text>
                        {item.category && (
                          <Text style={styles.searchResultCategory}>{item.category}</Text>
                        )}
                      </View>
                      {enableFavorites && (
                        <TouchableOpacity
                          style={styles.favoriteButton}
                          onPress={() => toggleFavorite(item)}
                        >
                          <Icon
                            name={isFavorite(item) ? 'favorite' : 'favorite-border'}
                            size={16}
                            style={[
                              styles.favoriteIcon,
                              isFavorite(item) && styles.favoriteIconActive,
                            ]}
                          />
                        </TouchableOpacity>
                      )}
                    </TouchableOpacity>
                  )}
                  style={styles.searchResults}
                  scrollEnabled={true}
                />
              ) : (
                <View style={styles.emptyState}>
                  <Icon name="search-off" size={48} style={styles.emptyIcon} />
                  <Text style={styles.emptyText}>No Results Found</Text>
                  <Text style={styles.emptySubtext}>
                    Try searching with different keywords
                  </Text>
                </View>
              )
            ) : (
              <View style={styles.emptyState}>
                <Icon name="search" size={48} style={styles.emptyIcon} />
                <Text style={styles.emptyText}>Search Symbol Library</Text>
                <Text style={styles.emptySubtext}>
                  Enter keywords to find mathematical symbols
                </Text>
              </View>
            )}
          </>
        );

      default:
        return null;
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Symbol Library</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Icon name="close" size={20} color={theme.OnSurfaceVariant} />
          </TouchableOpacity>
        </View>

        <View style={styles.navigation}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.navScrollView}
          >
            {navigationItems.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={[
                  styles.navItem,
                  currentView === item.key && styles.navItemActive,
                ]}
                onPress={() => {
                  setCurrentView(item.key);
                  if (item.key !== 'search') {
                    setSearchQuery('');
                  }
                }}
              >
                <Icon
                  name={item.icon}
                  size={16}
                  style={[
                    styles.navIcon,
                    currentView === item.key && styles.navIconActive,
                  ]}
                />
                <Text
                  style={[
                    styles.navText,
                    currentView === item.key && styles.navTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.content}>
          {renderContent()}
        </View>
      </View>
    </Modal>
  );
};

export default SymbolLibrary;