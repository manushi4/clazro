import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Animated, { FadeInUp, FadeIn, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { BaseScreen } from '../../shared/components/BaseScreen';
import { Row, T } from '../../ui';
import { trackScreenView, trackAction } from '../../utils/navigationAnalytics';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

type Props = NativeStackScreenProps<any, 'DownloadsManagerScreen'>;
type TypeFilter = 'all' | 'videos' | 'pdfs' | 'notes' | 'other';

interface Download {
  id: string;
  title: string;
  subject: string;
  type: TypeFilter;
  size_mb: number;
  downloaded_at: string;
  file_path: string;
  student_id: string;
}

// Framer Design Colors
const FRAMER_COLORS = {
  background: '#F7F7F7',
  cardBg: '#FFFFFF',
  primary: '#2D5BFF',
  textPrimary: '#1A1A1A',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  iconBg: 'rgba(45, 91, 255, 0.15)',
  chipBg: '#F3F4F6',
  chipText: '#374151',
  chipSelectedBg: '#2D5BFF',
  chipSelectedText: '#FFFFFF',
  progressBg: '#E5E7EB',
  progressFill: '#2D5BFF',
  deleteText: '#EF4444',
  deleteHover: '#FEE2E2',
  videoColor: '#2D5BFF',
  pdfColor: '#EF4444',
  notesColor: '#F59E0B',
  otherColor: '#6B7280',
};

const TYPE_LABELS: Record<TypeFilter, string> = {
  all: 'All',
  videos: 'Videos',
  pdfs: 'PDFs',
  notes: 'Notes',
  other: 'Other',
};

const TYPE_ICONS: Record<TypeFilter, string> = {
  all: 'folder',
  videos: 'play-circle-filled',
  pdfs: 'picture-as-pdf',
  notes: 'description',
  other: 'folder-open',
};

const TYPE_COLORS: Record<TypeFilter, string> = {
  all: FRAMER_COLORS.primary,
  videos: FRAMER_COLORS.videoColor,
  pdfs: FRAMER_COLORS.pdfColor,
  notes: FRAMER_COLORS.notesColor,
  other: FRAMER_COLORS.otherColor,
};

// Icon Container Component (Framer style)
const IconContainer = ({ iconName, color = FRAMER_COLORS.primary, size = 32 }: { iconName: string; color?: string; size?: number }) => (
  <View style={[styles.iconContainer, { backgroundColor: `${color}26`, width: size, height: size, borderRadius: size / 3.2 }]}>
    <Icon name={iconName} size={size * 0.5625} color={color} />
  </View>
);

// Progress Bar Component
const ProgressBar = ({ used, total, delay = 0 }: { used: number; total: number; delay?: number }) => {
  const percentage = (used / total) * 100;
  const progressWidth = useSharedValue(0);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  useEffect(() => {
    progressWidth.value = withSpring(percentage, { damping: 15, stiffness: 80 });
  }, [percentage]);

  return (
    <Animated.View entering={FadeInUp.delay(delay).springify().stiffness(120).damping(15)}>
      <View style={styles.progressBarContainer}>
        <Animated.View style={[styles.progressBarFill, progressStyle]} />
      </View>
    </Animated.View>
  );
};

// Download Card Component
const DownloadCard = ({
  item,
  onOpen,
  onRemove,
  delay
}: {
  item: Download;
  onOpen: () => void;
  onRemove: () => void;
  delay: number;
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const typeColor = TYPE_COLORS[item.type];
  const typeIcon = TYPE_ICONS[item.type];

  return (
    <Animated.View entering={FadeInUp.delay(delay).springify().stiffness(120).damping(15)}>
      <View style={styles.downloadCard}>
        <Row style={{ alignItems: 'center', marginBottom: 12, gap: 12 }}>
          <IconContainer iconName={typeIcon} color={typeColor} size={40} />
          <View style={{ flex: 1 }}>
            <T style={styles.cardTitle} numberOfLines={2}>{item.title}</T>
            <T style={styles.cardSubtitle}>{item.subject}</T>
          </View>
        </Row>

        <T style={styles.cardMeta}>
          {item.size_mb.toFixed(1)} MB • Downloaded {formatDate(item.downloaded_at)}
        </T>

        <Row style={{ gap: 12, marginTop: 16 }}>
          <Pressable
            style={[styles.actionButton, styles.primaryAction]}
            onPress={onOpen}
            accessibilityRole="button"
            accessibilityLabel={`Open ${item.title}`}
          >
            <Icon name="open-in-new" size={16} color={FRAMER_COLORS.primary} />
            <T style={styles.primaryActionText}>Open</T>
          </Pressable>

          <Pressable
            style={[styles.actionButton, styles.secondaryAction]}
            onPress={onRemove}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${item.title}`}
          >
            <Icon name="delete-outline" size={16} color={FRAMER_COLORS.deleteText} />
            <T style={styles.secondaryActionText}>Remove</T>
          </Pressable>
        </Row>
      </View>
    </Animated.View>
  );
};

export default function DownloadsManagerScreen({ navigation }: Props) {
  const [activeFilter, setActiveFilter] = useState<TypeFilter>('all');

  useEffect(() => {
    trackScreenView('DownloadsManagerScreen');
  }, []);

  // Fetch downloads from Supabase
  const { data: downloads, isLoading, error } = useQuery({
    queryKey: ['downloads', activeFilter],
    queryFn: async () => {
      let query = supabase
        .from('downloads')
        .select('*')
        .order('downloaded_at', { ascending: false });

      if (activeFilter !== 'all') {
        query = query.eq('type', activeFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Download[];
    },
  });

  // Calculate totals
  const totals = useMemo(() => {
    if (!downloads) return { all: 0, videos: 0, pdfs: 0, notes: 0, other: 0 };

    return downloads.reduce(
      (acc, item) => {
        acc.all += 1;
        acc[item.type] += 1;
        return acc;
      },
      { all: 0, videos: 0, pdfs: 0, notes: 0, other: 0 } as Record<TypeFilter, number>
    );
  }, [downloads]);

  // Calculate storage
  const storageUsed = useMemo(() => {
    if (!downloads) return 0;
    return downloads.reduce((sum, item) => sum + item.size_mb, 0);
  }, [downloads]);

  const storageTotal = 1024; // 1 GB in MB

  const handleFilterChange = (filter: TypeFilter) => {
    setActiveFilter(filter);
    trackAction('downloads_filter_change', 'DownloadsManagerScreen', { filter });
  };

  const handleOpenDownload = (item: Download) => {
    trackAction('open_download', 'DownloadsManagerScreen', { id: item.id, type: item.type });
    // TODO: Open file with appropriate viewer
  };

  const handleRemoveDownload = (item: Download) => {
    trackAction('remove_download', 'DownloadsManagerScreen', { id: item.id, type: item.type });
    // TODO: Show confirmation dialog and delete from Supabase + device storage
  };

  const isEmpty = !downloads || downloads.length === 0;

  return (
    <BaseScreen
      backgroundColor={FRAMER_COLORS.background}
      loading={isLoading}
      error={error}
      empty={false}
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Header */}
          <Animated.View entering={FadeIn.duration(400)}>
            <Row style={styles.topBar}>
              <Pressable onPress={() => navigation.goBack?.()} accessibilityRole="button" accessibilityLabel="Back">
                <Icon name="arrow-back" size={24} color={FRAMER_COLORS.textPrimary} />
              </Pressable>
              <T style={styles.headerTitle}>Downloads</T>
              <View style={{ width: 24 }} />
            </Row>
          </Animated.View>

          {/* Hero Card */}
          <Animated.View entering={FadeInUp.delay(100).springify().stiffness(120).damping(15)}>
            <View style={styles.heroCard}>
              <T style={styles.workspaceLabel}>Downloads Manager</T>
              <T style={styles.heroTitle}>Manage your offline files</T>
              <T style={styles.heroSubtitle}>
                Manage your offline videos, notes, and PDFs.
              </T>
            </View>
          </Animated.View>

          {/* Storage Summary Card */}
          <Animated.View entering={FadeInUp.delay(200).springify().stiffness(120).damping(15)}>
            <View style={styles.storageCard}>
              <Row style={{ alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <IconContainer iconName="sd-storage" size={36} />
                  <T style={styles.sectionTitle}>Storage</T>
                </View>
                <T style={styles.storageValue}>
                  {storageUsed.toFixed(1)} MB / {(storageTotal / 1024).toFixed(1)} GB
                </T>
              </Row>

              <ProgressBar used={storageUsed} total={storageTotal} delay={250} />

              <T style={styles.storageHint}>
                Remove items you no longer need to free up space.
              </T>
            </View>
          </Animated.View>

          {/* Type Filter Row */}
          <Animated.View entering={FadeInUp.delay(300).springify().stiffness(120).damping(15)}>
            <Row style={styles.filtersRow}>
              {(Object.keys(TYPE_LABELS) as TypeFilter[]).map((filter, index) => (
                <Animated.View
                  key={filter}
                  entering={FadeInUp.delay(350 + index * 50).springify().stiffness(120).damping(15)}
                >
                  <Pressable
                    style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}
                    onPress={() => handleFilterChange(filter)}
                    accessibilityRole="button"
                    accessibilityLabel={`Filter by ${TYPE_LABELS[filter]}`}
                  >
                    <Icon
                      name={TYPE_ICONS[filter]}
                      size={14}
                      color={activeFilter === filter ? FRAMER_COLORS.chipSelectedText : TYPE_COLORS[filter]}
                    />
                    <T style={StyleSheet.flatten([styles.filterText, activeFilter === filter && styles.filterTextActive])}>
                      {TYPE_LABELS[filter]} {totals[filter] > 0 && `(${totals[filter]})`}
                    </T>
                  </Pressable>
                </Animated.View>
              ))}
            </Row>
          </Animated.View>

          {/* Downloads List Header */}
          <Animated.View entering={FadeInUp.delay(550).springify().stiffness(120).damping(15)}>
            <View style={styles.sectionHeader}>
              <T style={styles.sectionTitle}>
                {activeFilter === 'all' ? 'All Downloads' : TYPE_LABELS[activeFilter]}
              </T>
              <T style={styles.sectionSubtitle}>
                {isEmpty
                  ? 'No downloads yet.'
                  : `${downloads.length} ${downloads.length === 1 ? 'item' : 'items'}`
                }
              </T>
            </View>
          </Animated.View>

          {/* Empty State */}
          {isEmpty ? (
            <Animated.View entering={FadeInUp.delay(600).springify().stiffness(120).damping(15)}>
              <View style={styles.emptyCard}>
                <IconContainer iconName="cloud-download" size={64} color={FRAMER_COLORS.textTertiary} />
                <T style={styles.emptyTitle}>No downloads yet</T>
                <T style={styles.emptyText}>
                  Download videos or PDFs from classes and library to keep them offline.
                </T>
                <Pressable
                  style={styles.emptyButton}
                  onPress={() => {
                    trackAction('go_to_library', 'DownloadsManagerScreen');
                    navigation.navigate('NewStudyLibraryScreen' as any);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Go to Library"
                >
                  <T style={styles.emptyButtonText}>Browse Library</T>
                  <Icon name="arrow-forward" size={16} color={FRAMER_COLORS.primary} />
                </Pressable>
              </View>
            </Animated.View>
          ) : (
            <>
              {/* Download Cards */}
              {downloads.map((item, index) => (
                <DownloadCard
                  key={item.id}
                  item={item}
                  onOpen={() => handleOpenDownload(item)}
                  onRemove={() => handleRemoveDownload(item)}
                  delay={600 + index * 80}
                />
              ))}

              {/* Bulk Actions (optional - shown if items exist) */}
              {downloads.length > 0 && (
                <Animated.View entering={FadeInUp.delay(600 + downloads.length * 80 + 100).springify().stiffness(120).damping(15)}>
                  <View style={styles.bulkActionsCard}>
                    <T style={styles.sectionTitle}>Bulk Actions</T>
                    <T style={styles.sectionSubtitle}>Manage multiple downloads at once</T>

                    <Pressable
                      style={styles.bulkActionButton}
                      onPress={() => {
                        trackAction('clear_all_downloads', 'DownloadsManagerScreen');
                        // TODO: Show confirmation dialog
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Clear all downloads"
                    >
                      <Icon name="delete-sweep" size={20} color={FRAMER_COLORS.deleteText} />
                      <T style={styles.bulkActionText}>Clear all downloads</T>
                    </Pressable>
                  </View>
                </Animated.View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </BaseScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  topBar: {
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: FRAMER_COLORS.textPrimary,
  },
  heroCard: {
    backgroundColor: FRAMER_COLORS.cardBg,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  workspaceLabel: {
    fontSize: 12,
    color: FRAMER_COLORS.textSecondary,
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: FRAMER_COLORS.textPrimary,
    marginBottom: 6,
    lineHeight: 28,
  },
  heroSubtitle: {
    fontSize: 14,
    color: FRAMER_COLORS.textSecondary,
    lineHeight: 22,
  },
  storageCard: {
    backgroundColor: FRAMER_COLORS.cardBg,
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  storageValue: {
    fontSize: 14,
    fontWeight: '600',
    color: FRAMER_COLORS.textPrimary,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: FRAMER_COLORS.progressBg,
    borderRadius: 4,
    overflow: 'hidden',
    marginVertical: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: FRAMER_COLORS.progressFill,
    borderRadius: 4,
  },
  storageHint: {
    fontSize: 12,
    color: FRAMER_COLORS.textTertiary,
    marginTop: 4,
  },
  filtersRow: {
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: FRAMER_COLORS.chipBg,
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: FRAMER_COLORS.chipSelectedBg,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: FRAMER_COLORS.chipText,
  },
  filterTextActive: {
    color: FRAMER_COLORS.chipSelectedText,
  },
  sectionHeader: {
    backgroundColor: FRAMER_COLORS.cardBg,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: FRAMER_COLORS.textPrimary,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: FRAMER_COLORS.textSecondary,
    marginTop: 4,
  },
  emptyCard: {
    backgroundColor: FRAMER_COLORS.cardBg,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: FRAMER_COLORS.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: FRAMER_COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${FRAMER_COLORS.primary}15`,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: FRAMER_COLORS.primary,
  },
  downloadCard: {
    backgroundColor: FRAMER_COLORS.cardBg,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: FRAMER_COLORS.textPrimary,
    marginBottom: 4,
    lineHeight: 20,
  },
  cardSubtitle: {
    fontSize: 12,
    color: FRAMER_COLORS.textSecondary,
  },
  cardMeta: {
    fontSize: 11,
    color: FRAMER_COLORS.textTertiary,
    marginTop: 4,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  primaryAction: {
    backgroundColor: `${FRAMER_COLORS.primary}15`,
  },
  secondaryAction: {
    backgroundColor: FRAMER_COLORS.deleteHover,
  },
  primaryActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: FRAMER_COLORS.primary,
  },
  secondaryActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: FRAMER_COLORS.deleteText,
  },
  bulkActionsCard: {
    backgroundColor: FRAMER_COLORS.cardBg,
    borderRadius: 18,
    padding: 16,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  bulkActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: FRAMER_COLORS.deleteHover,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 10,
    marginTop: 12,
  },
  bulkActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: FRAMER_COLORS.deleteText,
  },
});
