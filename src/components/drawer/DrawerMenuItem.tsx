/**
 * DrawerMenuItem Component
 * Single menu item in drawer navigation
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../theme/useAppTheme';
import { AppText } from '../../ui/components/AppText';
import { getLocalizedField } from '../../utils/getLocalizedField';
import { useBadgeValue, formatBadgeValue } from '../../hooks/useBadgeValue';
import { DrawerMenuItem as DrawerMenuItemType } from '../../types/drawer.types';

type Props = {
  item: DrawerMenuItemType;
  onPress: () => void;
  isNested?: boolean;
  isExpanded?: boolean;
  hasChildren?: boolean;
  isActive?: boolean;
};

export const DrawerMenuItem: React.FC<Props> = ({
  item,
  onPress,
  isNested = false,
  isExpanded = false,
  hasChildren = false,
  isActive = false,
}) => {
  const { colors } = useAppTheme();
  const badgeValue = useBadgeValue(item.badge_source);
  const formattedBadge = formatBadgeValue(badgeValue);

  const label = getLocalizedField(item, 'label') || item.label_en;
  const iconColor = item.icon_color || colors.onSurfaceVariant;
  const textColor = item.text_color || colors.onSurface;

  const renderBadge = () => {
    if (item.badge_type === 'none') return null;

    const badgeColor = item.badge_color || colors.error;

    if (item.badge_type === 'dot' && badgeValue) {
      return (
        <View style={[styles.badgeDot, { backgroundColor: badgeColor }]} />
      );
    }

    if (item.badge_type === 'count' && formattedBadge) {
      return (
        <View style={[styles.badgeCount, { backgroundColor: badgeColor }]}>
          <AppText style={styles.badgeText}>{formattedBadge}</AppText>
        </View>
      );
    }

    return null;
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.container,
        isNested && styles.nested,
        item.highlight && { backgroundColor: `${colors.primary}10` },
        isActive && { backgroundColor: `${colors.primary}15` },
        { borderRadius: 12 },
      ]}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: `${iconColor}15` },
          isActive && { backgroundColor: `${colors.primary}20` },
        ]}
      >
        <Icon
          name={item.icon || 'circle'}
          size={20}
          color={isActive ? colors.primary : iconColor}
        />
      </View>

      <AppText
        style={[
          styles.label,
          { color: isActive ? colors.primary : textColor },
          isActive && styles.labelActive,
        ]}
        numberOfLines={1}
      >
        {label}
      </AppText>

      {renderBadge()}

      {hasChildren && (
        <Icon
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.onSurfaceVariant}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginVertical: 2,
    marginHorizontal: 8,
  },
  nested: {
    marginLeft: 32,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  label: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  labelActive: {
    fontWeight: '600',
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  badgeCount: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
});
