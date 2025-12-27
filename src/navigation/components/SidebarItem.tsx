/**
 * SidebarItem - Individual menu item in sidebar
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../theme/useAppTheme';
import { AppText } from '../../ui/components/AppText';

interface SidebarItemProps {
  icon: string;
  label: string;
  isActive?: boolean;
  isExpanded?: boolean;
  onPress: () => void;
  badge?: number;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({
  icon,
  label,
  isActive = false,
  isExpanded = true,
  onPress,
  badge,
}) => {
  const { colors } = useAppTheme();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isActive && { backgroundColor: colors.primaryContainer },
        !isExpanded && styles.containerCollapsed,
      ]}
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityRole="menuitem"
      accessibilityState={{ selected: isActive }}
    >
      <View style={styles.iconContainer}>
        <Icon
          name={icon}
          size={22}
          color={isActive ? colors.onPrimaryContainer : colors.onSurfaceVariant}
        />
        {badge !== undefined && badge > 0 && !isExpanded && (
          <View style={[styles.badgeSmall, { backgroundColor: colors.error }]}>
            <AppText variant="labelSmall" style={styles.badgeText}>
              {badge > 9 ? '9+' : badge}
            </AppText>
          </View>
        )}
      </View>
      {isExpanded && (
        <>
          <AppText
            variant="bodyMedium"
            style={[
              styles.label,
              { color: isActive ? colors.onPrimaryContainer : colors.onSurface },
              isActive && styles.labelActive,
            ]}
            numberOfLines={1}
          >
            {label}
          </AppText>
          {badge !== undefined && badge > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.error }]}>
              <AppText variant="labelSmall" style={styles.badgeText}>
                {badge > 99 ? '99+' : badge}
              </AppText>
            </View>
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 8,
    marginVertical: 2,
  },
  containerCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: 0,
    marginHorizontal: 12,
  },
  iconContainer: {
    width: 24,
    alignItems: 'center',
    position: 'relative',
  },
  label: {
    marginLeft: 12,
    flex: 1,
  },
  labelActive: {
    fontWeight: '600',
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeSmall: {
    position: 'absolute',
    top: -6,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
});

export default SidebarItem;
