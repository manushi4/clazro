/**
 * Navigation Drawer Component - Exact Ship-Ready Spec
 * Modal drawer that slides in from left, LTR direction
 *
 * Specs (exact):
 * - Width: min(360dp, screenWidth - 56dp)
 * - Header: 64dp account area
 * - Rows: 56dp (≥48dp tap target)
 * - Elevation: 1dp
 * - Motion: 250ms
 * - Scrim: rgba(15,23,42,0.32)
 *
 * Usage:
 * <NavigationDrawer
 *   visible={drawerVisible}
 *   onClose={() => setDrawerVisible(false)}
 *   userProfile={{ name: 'John Doe', email: 'john@example.com', initials: 'JD' }}
 *   navigation={navigation}
 *   currentRoute="NewDashboard"
 *   onLogout={() => {}}
 * />
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  Pressable,
  ScrollView,
  Animated,
  StatusBar,
} from 'react-native';
import { IconButton } from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Drawer } from '../../theme/drawer';

const DRAWER_WIDTH = Drawer.getWidth();

interface UserProfile {
  name: string;
  email: string;
  initials: string;
  imageUri?: string;
}

interface DrawerItem {
  id: string;
  label: string;
  icon: string;
  route?: string;
  onPress?: () => void;
}

interface NavigationDrawerProps {
  visible: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  navigation: any; // Navigation prop from React Navigation
  currentRoute?: string; // Current active route for highlighting
  onLogout: () => void;
}

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  visible,
  onClose,
  userProfile,
  navigation,
  currentRoute,
  onLogout,
}) => {
  // Safe area insets (status bar, notch, navigation bar)
  const insets = useSafeAreaInsets();

  // Animation for LTR slide (from left edge)
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Animate drawer in/out
  useEffect(() => {
    if (visible) {
      // Slide in from left + fade in scrim
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0, // Final position (left edge)
          duration: Drawer.motionMs, // 250ms
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: Drawer.motionMs,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Slide out to left + fade out scrim
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH, // Off screen left
          duration: Drawer.motionMs,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: Drawer.motionMs,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  // Secondary navigation items (not in bottom nav)
  const drawerItems: DrawerItem[] = [
    { id: 'home', label: 'Home', icon: 'home', route: 'NewDashboard' },
    { id: 'students', label: 'Students', icon: 'account-group', route: 'ChildrenList' },
    { id: 'fees', label: 'Fees', icon: 'currency-rupee', route: 'BillingInvoice' },
    { id: 'events', label: 'Events', icon: 'calendar', route: 'SchoolCalendar' },
    { id: 'settings', label: 'Settings', icon: 'cog', route: 'Settings' },
    { id: 'help', label: 'Help & Feedback', icon: 'help-circle', route: 'HelpFeedback' },
  ];

  const handleItemPress = (item: DrawerItem) => {
    onClose(); // Close drawer first (250ms transition)

    // Small delay to let drawer close smoothly
    setTimeout(() => {
      if (item.onPress) {
        item.onPress();
      } else if (item.route) {
        try {
          navigation.navigate(item.route);
        } catch (error) {
          console.log(`Screen not found: ${item.route}. TODO: Create ${item.label} screen`);
        }
      } else {
        console.log(`TODO: Implement ${item.label} screen`);
      }
    }, 100);
  };

  const handleLogout = () => {
    onClose();
    setTimeout(() => onLogout(), 100);
  };

  // Check if item is active (current route)
  const isActive = (item: DrawerItem) => {
    return item.route && currentRoute === item.route;
  };

  if (!visible && opacityAnim._value === 0) {
    return null; // Don't render when fully closed
  }

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      onRequestClose={onClose}
    >
      <StatusBar backgroundColor="transparent" translucent={false} />
      <View style={styles.modalContainer}>
        {/* Drawer Content - Slides from LEFT (LTR) with safe area */}
        <Animated.View
          style={[
            styles.drawer,
            {
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left']}>
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
            {/* Header - 64dp account area (exact spec) */}
            <View style={styles.header}>
              {/* Avatar - 40dp to fit in 64dp header */}
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{userProfile.initials}</Text>
              </View>

              {/* Account Name */}
              <View style={styles.accountInfo}>
                <Text style={styles.accountName} numberOfLines={1}>
                  {userProfile.name}
                </Text>
              </View>

              {/* Close Button */}
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeButton}
                hitSlop={Drawer.hitSlop}
                accessibilityLabel="Close drawer"
              >
                <IconButton
                  icon="close"
                  size={20}
                  iconColor={Drawer.colors.text}
                  style={{ margin: 0 }}
                />
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Navigation Items - 56dp rows */}
            <View style={styles.itemsSection}>
              {drawerItems.map((item) => {
                const active = isActive(item);
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => handleItemPress(item)}
                    style={({ pressed }) => [
                      styles.drawerItem,
                      active && styles.drawerItemActive,
                      pressed && styles.drawerItemPressed,
                    ]}
                    android_ripple={{
                      color: Drawer.colors.activeTint,
                      borderless: false,
                    }}
                    hitSlop={Drawer.hitSlop}
                  >
                    {/* Leading Icon - 24dp */}
                    <IconButton
                      icon={item.icon}
                      size={Drawer.iconSize.leading}
                      iconColor={active ? Drawer.colors.activeTint : Drawer.colors.text}
                      style={styles.leadingIcon}
                    />

                    {/* Label - 13sp/18/500 */}
                    <Text
                      style={[
                        styles.itemLabel,
                        active && styles.itemLabelActive,
                      ]}
                    >
                      {item.label}
                    </Text>

                    {/* Trailing Chevron - 20dp (for items with routes) */}
                    {item.route && (
                      <IconButton
                        icon="chevron-right"
                        size={Drawer.iconSize.trailing}
                        iconColor={active ? Drawer.colors.activeTint : Drawer.colors.text2}
                        style={styles.trailingIcon}
                      />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

            {/* Footer - Meta info at 12sp */}
            <View style={styles.footer}>
              <View style={styles.divider} />
              <View style={styles.footerContent}>
                <Text style={styles.footerMeta}>Version 1.0.0 • Parent App</Text>
              </View>
            </View>
          </SafeAreaView>
        </Animated.View>

        {/* Scrim - Fades in/out with drawer */}
        <Animated.View
          style={[
            styles.scrim,
            {
              opacity: opacityAnim,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.scrimTouchable}
            activeOpacity={1}
            onPress={onClose}
          />
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  // Modal Container
  modalContainer: {
    flex: 1,
    position: 'relative',
  },

  // Drawer - 65% width, positioned on LEFT
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: Drawer.colors.bg,
    elevation: Drawer.elevation,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 }, // Shadow to the right
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 2, // Above scrim
  },

  // SafeAreaView wrapper - ensures content respects status bar, notch, nav bar
  safeArea: {
    flex: 1,
    backgroundColor: Drawer.colors.bg,
  },

  // Scrim - Exact spec: rgba(15,23,42,0.32), fills entire screen
  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 1, // Below drawer
  },

  scrimTouchable: {
    flex: 1,
    backgroundColor: Drawer.colors.scrim,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
  },

  // Header - 64dp account area (exact)
  header: {
    height: Drawer.headerHeight,
    paddingHorizontal: Drawer.paddingX,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Drawer.colors.bg,
  },

  // Avatar - 40dp (fits in 64dp header)
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Drawer.colors.activeTint,
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Account Info
  accountInfo: {
    flex: 1,
    marginLeft: Drawer.iconGap,
    marginRight: 8,
  },

  accountName: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    color: Drawer.colors.text,
  },

  closeButton: {
    padding: 4,
  },

  // Divider - exact spec
  divider: {
    height: 1,
    backgroundColor: Drawer.colors.divider,
    opacity: 0.8,
  },

  // Items Section
  itemsSection: {
    paddingVertical: 8,
  },

  // Drawer Item - 56dp row height (≥48dp tap)
  drawerItem: {
    height: Drawer.rowHeight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Drawer.paddingX,
  },

  // Active state - primary @ .12 with border radius
  drawerItemActive: {
    backgroundColor: `${Drawer.colors.activeTint}1F`, // 12% opacity (1F in hex)
    borderRadius: Drawer.radius,
    marginHorizontal: 8,
    paddingHorizontal: Drawer.paddingX - 8,
  },

  // Pressed state - primary @ .12
  drawerItemPressed: {
    backgroundColor: `${Drawer.colors.activeTint}1F`,
  },

  // Leading Icon - 24dp
  leadingIcon: {
    margin: 0,
    marginRight: Drawer.iconGap,
  },

  // Label - 13sp/18/500 (exact spec)
  itemLabel: {
    flex: 1,
    fontSize: Drawer.typography.label.fontSize,
    lineHeight: Drawer.typography.label.lineHeight,
    fontWeight: Drawer.typography.label.fontWeight,
    color: Drawer.colors.text,
  },

  // Active label - tinted primary
  itemLabelActive: {
    color: Drawer.colors.activeTint,
  },

  // Trailing Icon - 20dp
  trailingIcon: {
    margin: 0,
    marginLeft: 4,
  },

  // Footer - meta info
  footer: {
    borderTopWidth: 1,
    borderTopColor: Drawer.colors.divider,
    backgroundColor: Drawer.colors.bg,
  },

  footerContent: {
    paddingHorizontal: Drawer.paddingX,
    paddingVertical: 12,
    alignItems: 'center',
  },

  // Footer meta - 12sp/16/400 (exact spec)
  footerMeta: {
    fontSize: Drawer.typography.meta.fontSize,
    lineHeight: Drawer.typography.meta.lineHeight,
    fontWeight: Drawer.typography.meta.fontWeight,
    color: Drawer.colors.text2,
  },
});
