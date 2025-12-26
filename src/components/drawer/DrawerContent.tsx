/**
 * DrawerContent Component
 * Main drawer content with header, menu items, and footer
 */

import React, { useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  Platform,
  Vibration,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { useAppTheme } from '../../theme/useAppTheme';
import { useDrawerConfigQuery } from '../../hooks/queries/useDrawerConfigQuery';
import { useDrawerStore } from '../../stores/drawerStore';
import { useAuthStore } from '../../stores/authStore';
import { getLocalizedField } from '../../utils/getLocalizedField';
import { AppText } from '../../ui/components/AppText';

import { DrawerHeader } from './DrawerHeader';
import { DrawerMenuItem } from './DrawerMenuItem';
import { DrawerDivider } from './DrawerDivider';
import { DrawerSectionHeader } from './DrawerSectionHeader';
import { DrawerFooter } from './DrawerFooter';
import { DrawerMenuItem as DrawerMenuItemType } from '../../types/drawer.types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const DrawerContent: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { colors } = useAppTheme();
  const {
    closeDrawer,
    expandedItems,
    toggleExpanded,
    setExpandedItems,
  } = useDrawerStore();
  const logout = useAuthStore((state) => state.logout);

  const { data, isLoading, error } = useDrawerConfigQuery();
  const config = data?.config;
  const menuItems = data?.menuItems ?? [];

  // Debug logging
  console.log('[DrawerContent] Query state:', {
    isLoading,
    hasData: !!data,
    hasConfig: !!config,
    menuItemsCount: menuItems.length,
    error: error?.message,
  });

  // Set initially expanded items on mount (only once when data loads)
  const hasInitializedRef = React.useRef(false);
  useEffect(() => {
    if (menuItems.length > 0 && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      const defaultExpanded = menuItems
        .filter(
          (item) =>
            item.item_type === 'expandable' && item.expanded_by_default
        )
        .map((item) => item.item_id);
      setExpandedItems(defaultExpanded);
    }
  }, [menuItems.length, setExpandedItems]);

  // Use default config while loading
  const defaultConfig = {
    width_percentage: 80,
    width_max_px: 320,
    position: 'left' as const,
    haptic_feedback: true,
    close_on_select: true,
    background_opacity: 100,
    border_radius: 0,
    shadow_enabled: true,
    shadow_opacity: 30,
    header_style: 'avatar' as const,
    header_show_role: true,
    header_show_email: false,
    footer_show_logout: true,
    footer_show_version: true,
  };

  const activeConfig = config || defaultConfig;

  const drawerWidth = Math.min(
    (SCREEN_WIDTH * activeConfig.width_percentage) / 100,
    activeConfig.width_max_px
  );

  const triggerHaptic = () => {
    if (activeConfig.haptic_feedback && Platform.OS !== 'web') {
      try {
        Vibration.vibrate(10);
      } catch {
        // Haptics not available
      }
    }
  };

  const handleItemPress = (item: DrawerMenuItemType) => {
    triggerHaptic();

    switch (item.item_type) {
      case 'link':
        if (item.route) {
          navigation.navigate(item.route as never, item.route_params as never);
          if (activeConfig.close_on_select) {
            closeDrawer();
          }
        }
        break;

      case 'action':
        handleAction(item.action_id);
        break;

      case 'expandable':
        toggleExpanded(item.item_id);
        break;

      default:
        break;
    }
  };

  const handleAction = (actionId?: string) => {
    switch (actionId) {
      case 'logout':
        closeDrawer();
        logout();
        break;

      case 'share_app':
        // TODO: Implement share functionality
        break;

      case 'rate_app':
        // TODO: Implement rating functionality
        break;

      case 'contact_support':
        navigation.navigate('help-center' as never);
        closeDrawer();
        break;

      case 'switch_role':
        // TODO: Implement role switching
        break;

      default:
        break;
    }
  };

  const handleLogout = () => {
    triggerHaptic();
    handleAction('logout');
  };

  const handleClose = () => {
    closeDrawer();
  };

  // Filter top-level items (no parent)
  const topLevelItems = menuItems.filter((item) => !item.parent_item_id);

  // Get children for expandable items
  const getChildren = (parentId: string) =>
    menuItems.filter((item) => item.parent_item_id === parentId);

  const renderItem = (item: DrawerMenuItemType) => {
    const label = getLocalizedField(item, 'label') || item.label_en;

    switch (item.item_type) {
      case 'divider':
        return <DrawerDivider key={item.item_id} />;

      case 'section_header':
        return <DrawerSectionHeader key={item.item_id} label={label} />;

      case 'expandable': {
        const isExpanded = expandedItems.includes(item.item_id);
        const children = getChildren(item.item_id);
        return (
          <View key={item.item_id}>
            <DrawerMenuItem
              item={item}
              onPress={() => handleItemPress(item)}
              isExpanded={isExpanded}
              hasChildren={children.length > 0}
            />
            {isExpanded &&
              children.map((child) => (
                <DrawerMenuItem
                  key={child.item_id}
                  item={child}
                  onPress={() => handleItemPress(child)}
                  isNested
                />
              ))}
          </View>
        );
      }

      default:
        return (
          <DrawerMenuItem
            key={item.item_id}
            item={item}
            onPress={() => handleItemPress(item)}
          />
        );
    }
  };

  const bgOpacity = activeConfig.background_opacity / 100;

  return (
    <View
      style={[
        styles.container,
        {
          width: drawerWidth,
          backgroundColor: colors.surface,
          opacity: bgOpacity,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
          // Border radius based on position
          borderTopRightRadius:
            activeConfig.position === 'left' ? activeConfig.border_radius : 0,
          borderBottomRightRadius:
            activeConfig.position === 'left' ? activeConfig.border_radius : 0,
          borderTopLeftRadius:
            activeConfig.position === 'right' ? activeConfig.border_radius : 0,
          borderBottomLeftRadius:
            activeConfig.position === 'right' ? activeConfig.border_radius : 0,
        },
        activeConfig.shadow_enabled && {
          shadowColor: '#000',
          shadowOffset: { width: activeConfig.position === 'left' ? 2 : -2, height: 0 },
          shadowOpacity: activeConfig.shadow_opacity / 100,
          shadowRadius: 10,
          elevation: 10,
        },
      ]}
    >
      {/* Header */}
      <DrawerHeader config={activeConfig} onClose={handleClose} />

      {/* Menu Items */}
      <ScrollView
        style={styles.menuContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.menuContent}
      >
        {isLoading ? (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <AppText style={{ color: colors.onSurfaceVariant }}>Loading...</AppText>
          </View>
        ) : topLevelItems.length > 0 ? (
          topLevelItems.map(renderItem)
        ) : (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <AppText style={{ color: colors.onSurfaceVariant }}>No menu items</AppText>
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      <DrawerFooter config={activeConfig} onLogout={handleLogout} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  menuContainer: {
    flex: 1,
  },
  menuContent: {
    paddingTop: 8,
    paddingBottom: 16,
  },
});
