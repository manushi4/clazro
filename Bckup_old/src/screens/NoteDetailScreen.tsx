import React, { useEffect } from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Animated, { FadeInUp, FadeIn, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { BaseScreen } from '../shared/components/BaseScreen';
import { Row, T } from '../ui';
import { trackScreenView, trackAction } from '../utils/navigationAnalytics';

type Props = NativeStackScreenProps<any, 'NoteDetailScreen'>;

// Framer Design Colors (matching NotesAndHighlightsScreen)
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
  actionHover: '#F9FAFB',
  deleteHover: '#FEE2E2',
  deleteText: '#EF4444',
};

// Mock data - will be replaced with real data from params
const MOCK_NOTE = {
  id: 'n1',
  title: 'Algebra formula shortcuts',
  subject: 'Mathematics',
  type: 'notes' as const,
  content: `Important formulas to remember:

1. (a + b)² = a² + 2ab + b²
2. (a - b)² = a² - 2ab + b²
3. (a + b)(a - b) = a² - b²
4. (a + b)³ = a³ + 3a²b + 3ab² + b³
5. (a - b)³ = a³ - 3a²b + 3ab² - b³

Key points:
• Always expand brackets carefully
• Look for patterns before solving
• Practice makes perfect

Examples:
(x + 5)² = x² + 10x + 25
(2x - 3)² = 4x² - 12x + 9`,
  itemCount: 3,
  created_at: new Date(Date.now() - 86400000).toISOString(),
  updated_at: new Date(Date.now() - 86400000).toISOString(),
};

const MOCK_HIGHLIGHT = {
  id: 'h1',
  title: 'Optics highlights',
  subject: 'Physics',
  type: 'highlights' as const,
  sourceTitle: 'Concept: Light and Reflection',
  content: `Light and Reflection

Key Concepts:
• Light travels in straight lines
• Speed of light in vacuum: 3 × 10⁸ m/s
• Reflection: angle of incidence = angle of reflection

Laws of Reflection:
1. The incident ray, reflected ray, and normal all lie in the same plane
2. Angle of incidence equals angle of reflection

Applications:
- Mirrors (plane, concave, convex)
- Periscopes
- Kaleidoscopes

Important formulas:
• Mirror formula: 1/f = 1/v + 1/u
• Magnification: m = -v/u`,
  excerpt: 'Light travels in straight lines. Reflection: angle of incidence = angle of reflection',
  fromResource: true,
  created_at: new Date(Date.now() - 259200000).toISOString(),
  updated_at: new Date(Date.now() - 259200000).toISOString(),
};

const MOCK_DOUBT = {
  id: 'd1',
  title: 'Circular motion doubt',
  subject: 'Physics',
  type: 'doubts' as const,
  doubtTitle: 'Why does normal reaction change in circular motion?',
  content: `Question:
Why does the normal reaction change when an object moves in a vertical circle?

Answer:
The normal reaction changes in circular motion because it must provide the centripetal force along with other forces.

At the top of the circle:
• Weight (mg) acts downward
• Normal force (N) acts downward
• Both contribute to centripetal force
• N + mg = mv²/r
• Therefore: N = mv²/r - mg

At the bottom of the circle:
• Weight (mg) acts downward
• Normal force (N) acts upward
• Net force provides centripetal force
• N - mg = mv²/r
• Therefore: N = mv²/r + mg

Key insight:
The normal force is greater at the bottom because it must overcome gravity AND provide centripetal force.

At the sides (horizontal position):
• N = mv²/r (only provides centripetal force)`,
  created_at: new Date(Date.now() - 172800000).toISOString(),
  updated_at: new Date(Date.now() - 172800000).toISOString(),
};

// Animated Button Component (Framer-style)
const AnimatedButton = ({
  onPress,
  icon,
  label,
  variant = 'default',
  delay = 0
}: {
  onPress: () => void;
  icon: string;
  label: string;
  variant?: 'default' | 'delete';
  delay?: number;
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 200 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  return (
    <Animated.View entering={FadeInUp.delay(delay).springify().stiffness(120).damping(15)}>
      <Pressable
        style={[styles.actionButton, variant === 'delete' && styles.deleteButton]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Animated.View style={[animatedStyle, styles.actionButtonInner]}>
          <Icon
            name={icon}
            size={20}
            color={variant === 'delete' ? FRAMER_COLORS.deleteText : FRAMER_COLORS.textPrimary}
          />
          <T style={[
            styles.actionButtonText,
            variant === 'delete' && styles.deleteButtonText
          ]}>
            {label}
          </T>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
};

// Chip Component (Framer-style)
const InfoChip = ({ icon, label, color }: { icon: string; label: string; color?: string }) => (
  <View style={[styles.infoChip, color && { backgroundColor: `${color}15` }]}>
    <Icon name={icon} size={14} color={color || FRAMER_COLORS.primary} />
    <T style={[styles.chipText, color && { color }]}>{label}</T>
  </View>
);

export default function NoteDetailScreen({ navigation, route }: Props) {
  const { noteId, noteType = 'notes' } = route.params || {};

  useEffect(() => {
    trackScreenView('NoteDetailScreen');
  }, []);

  // Get mock data based on type
  const getMockData = () => {
    if (noteType === 'highlights') return MOCK_HIGHLIGHT;
    if (noteType === 'doubts') return MOCK_DOUBT;
    return MOCK_NOTE;
  };

  const data = getMockData();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const handleEdit = () => {
    trackAction('edit_note', 'NoteDetailScreen', { id: data.id, type: data.type });
    // TODO: Navigate to edit screen
  };

  const handleDelete = () => {
    trackAction('delete_note', 'NoteDetailScreen', { id: data.id, type: data.type });
    // TODO: Show delete confirmation
  };

  const handleShare = () => {
    trackAction('share_note', 'NoteDetailScreen', { id: data.id, type: data.type });
    // TODO: Open share sheet
  };

  // Get title based on type
  const getTitle = () => {
    if (data.type === 'highlights') return (data as typeof MOCK_HIGHLIGHT).sourceTitle;
    if (data.type === 'doubts') return (data as typeof MOCK_DOUBT).doubtTitle;
    return data.title;
  };

  return (
    <BaseScreen backgroundColor={FRAMER_COLORS.background}>
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
              <T style={styles.headerTitle}>
                {data.type === 'notes' && 'Note Details'}
                {data.type === 'highlights' && 'Highlight'}
                {data.type === 'doubts' && 'Doubt Details'}
              </T>
              <View style={{ width: 24 }} />
            </Row>
          </Animated.View>

          {/* Header Card */}
          <Animated.View entering={FadeInUp.delay(100).springify().stiffness(120).damping(15)}>
            <View style={styles.headerCard}>
              {/* Icon Container */}
              <View style={[
                styles.iconContainer,
                { backgroundColor:
                  data.type === 'notes' ? FRAMER_COLORS.iconBg :
                  data.type === 'highlights' ? 'rgba(245, 158, 11, 0.15)' :
                  'rgba(239, 68, 68, 0.15)'
                }
              ]}>
                <Icon
                  name={
                    data.type === 'notes' ? 'description' :
                    data.type === 'highlights' ? 'highlight' :
                    'help-outline'
                  }
                  size={24}
                  color={
                    data.type === 'notes' ? FRAMER_COLORS.primary :
                    data.type === 'highlights' ? '#F59E0B' :
                    '#EF4444'
                  }
                />
              </View>

              {/* Title */}
              <T style={styles.cardTitle}>{getTitle()}</T>

              {/* Chips */}
              <Row style={{ flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                <InfoChip icon="label" label={data.subject} />
                {data.type === 'notes' && (
                  <InfoChip icon="inventory" label={`${(data as typeof MOCK_NOTE).itemCount} items`} />
                )}
                {data.type === 'highlights' && (data as typeof MOCK_HIGHLIGHT).fromResource && (
                  <InfoChip icon="article" label="From resource" color="#F59E0B" />
                )}
              </Row>

              {/* Date */}
              <T style={styles.dateText}>
                {data.type === 'doubts' ? 'Saved' : 'Updated'}: {formatDate(data.updated_at)}
              </T>
            </View>
          </Animated.View>

          {/* Content Card */}
          <Animated.View entering={FadeInUp.delay(200).springify().stiffness(120).damping(15)}>
            <View style={styles.contentCard}>
              <T style={styles.sectionTitle}>
                {data.type === 'notes' && 'Notes'}
                {data.type === 'highlights' && 'Content'}
                {data.type === 'doubts' && 'Explanation'}
              </T>
              <T style={styles.contentText}>{data.content}</T>
            </View>
          </Animated.View>

          {/* Quick Actions */}
          <Animated.View entering={FadeInUp.delay(300).springify().stiffness(120).damping(15)}>
            <View style={styles.actionsSection}>
              <T style={styles.sectionTitle}>Quick Actions</T>
              <Row style={{ gap: 12, marginTop: 12 }}>
                <Pressable style={styles.quickAction} onPress={handleEdit}>
                  <Icon name="edit" size={20} color={FRAMER_COLORS.primary} />
                  <T style={styles.quickActionText}>Edit</T>
                </Pressable>
                <Pressable style={styles.quickAction} onPress={handleShare}>
                  <Icon name="share" size={20} color={FRAMER_COLORS.primary} />
                  <T style={styles.quickActionText}>Share</T>
                </Pressable>
              </Row>
            </View>
          </Animated.View>

          {/* Action Buttons */}
          <View style={styles.buttonsSection}>
            <AnimatedButton
              icon="edit"
              label="Edit Note"
              onPress={handleEdit}
              delay={350}
            />
            <AnimatedButton
              icon="share"
              label="Share"
              onPress={handleShare}
              delay={400}
            />
            <AnimatedButton
              icon="delete"
              label="Delete"
              onPress={handleDelete}
              variant="delete"
              delay={450}
            />
          </View>

          {/* Metadata Footer */}
          <Animated.View entering={FadeInUp.delay(500).springify().stiffness(120).damping(15)}>
            <View style={styles.metadataCard}>
              <Row style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                <T style={styles.metadataLabel}>Created</T>
                <T style={styles.metadataValue}>{formatDate(data.created_at)}</T>
              </Row>
              <Row style={{ justifyContent: 'space-between' }}>
                <T style={styles.metadataLabel}>Last updated</T>
                <T style={styles.metadataValue}>{formatDate(data.updated_at)}</T>
              </Row>
            </View>
          </Animated.View>
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
  headerCard: {
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
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: FRAMER_COLORS.textPrimary,
    lineHeight: 26,
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: FRAMER_COLORS.chipBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
    color: FRAMER_COLORS.chipText,
  },
  dateText: {
    fontSize: 12,
    color: FRAMER_COLORS.textTertiary,
    marginTop: 12,
  },
  contentCard: {
    backgroundColor: FRAMER_COLORS.cardBg,
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
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
    marginBottom: 12,
  },
  contentText: {
    fontSize: 14,
    color: FRAMER_COLORS.textPrimary,
    lineHeight: 22,
  },
  actionsSection: {
    backgroundColor: FRAMER_COLORS.cardBg,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: FRAMER_COLORS.actionHover,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 6,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: FRAMER_COLORS.primary,
  },
  buttonsSection: {
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    backgroundColor: FRAMER_COLORS.cardBg,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  deleteButton: {
    backgroundColor: FRAMER_COLORS.deleteHover,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: FRAMER_COLORS.textPrimary,
  },
  deleteButtonText: {
    color: FRAMER_COLORS.deleteText,
  },
  metadataCard: {
    backgroundColor: FRAMER_COLORS.cardBg,
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  metadataLabel: {
    fontSize: 12,
    color: FRAMER_COLORS.textSecondary,
    fontWeight: '500',
  },
  metadataValue: {
    fontSize: 12,
    color: FRAMER_COLORS.textPrimary,
    fontWeight: '600',
  },
});
