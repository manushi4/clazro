import React from "react";
import { View, StyleSheet, Image, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, NavigationProp, ParamListBase } from "@react-navigation/native";
import { useBranding } from "../../context/BrandingContext";
import { useAppTheme } from "../../theme/useAppTheme";
import { AppText } from "../../ui/components/AppText";
import { useDrawerEnabled } from "../../hooks/queries/useDrawerConfigQuery";
import { useDrawerStore } from "../../stores/drawerStore";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

type Props = {
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightAction?: React.ReactNode;
  title?: string; // Override title (otherwise uses app name)
  onNotificationPress?: () => void;
  notificationCount?: number;
  showDrawerButton?: boolean; // Show hamburger menu (default: true if drawer enabled)
};

export const BrandedHeader: React.FC<Props> = ({
  showBackButton = false,
  onBackPress,
  rightAction,
  title,
  onNotificationPress,
  notificationCount = 0,
  showDrawerButton,
}) => {
  const branding = useBranding();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const drawerEnabled = useDrawerEnabled();
  const { openDrawer } = useDrawerStore();

  // Show drawer button if drawer is enabled and we're not showing back button
  const shouldShowDrawer = showDrawerButton ?? (drawerEnabled && !showBackButton);

  const handleDrawerPress = () => {
    openDrawer();
  };

  const handleNotificationPress = () => {
    if (onNotificationPress) {
      onNotificationPress();
    } else {
      navigation.navigate("notifications");
    }
  };

  const displayTitle = title || branding?.appName || "Learning App";
  const logoUrl = branding?.logoSmallUrl || branding?.logoUrl;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          paddingTop: insets.top + 8,
          borderBottomColor: colors.outlineVariant,
        },
      ]}
    >
      <View style={styles.content}>
        {/* Left section - Drawer button, Back button, or Logo */}
        <View style={styles.leftSection}>
          {showBackButton ? (
            <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
              <Icon name="arrow-left" size={24} color={colors.onSurface} />
            </TouchableOpacity>
          ) : shouldShowDrawer ? (
            <TouchableOpacity onPress={handleDrawerPress} style={styles.menuButton}>
              <Icon name="menu" size={24} color={colors.onSurface} />
            </TouchableOpacity>
          ) : logoUrl ? (
            <Image
              source={{ uri: logoUrl }}
              style={styles.logo}
              resizeMode="contain"
            />
          ) : (
            <View style={[styles.logoPlaceholder, { backgroundColor: colors.primary }]}>
              <AppText style={[styles.logoText, { color: colors.onPrimary }]}>
                {displayTitle.charAt(0).toUpperCase()}
              </AppText>
            </View>
          )}
        </View>

        {/* Center section - App name */}
        <View style={styles.centerSection}>
          <AppText
            variant="title"
            style={[styles.title, { color: colors.onSurface }]}
            numberOfLines={1}
          >
            {displayTitle}
          </AppText>
          {branding?.appTagline && !title && (
            <AppText
              variant="caption"
              style={[styles.tagline, { color: colors.onSurfaceVariant }]}
              numberOfLines={1}
            >
              {branding.appTagline}
            </AppText>
          )}
        </View>

        {/* Right section - Actions */}
        <View style={styles.rightSection}>
          {rightAction || (
            <TouchableOpacity style={styles.iconButton} onPress={handleNotificationPress}>
              <Icon name="bell-outline" size={22} color={colors.onSurfaceVariant} />
              {notificationCount > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.error }]}>
                  <AppText style={[styles.badgeText, { color: colors.onError }]}>
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </AppText>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    minHeight: 48,
  },
  leftSection: {
    width: 40,
    alignItems: "flex-start",
  },
  centerSection: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 8,
  },
  rightSection: {
    width: 40,
    alignItems: "flex-end",
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 6,
  },
  logoPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: 16,
    fontWeight: "700",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  tagline: {
    fontSize: 12,
    marginTop: 2,
  },
  backButton: {
    padding: 4,
  },
  menuButton: {
    padding: 4,
  },
  iconButton: {
    padding: 4,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
