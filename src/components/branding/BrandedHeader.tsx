import React from "react";
import { View, StyleSheet, Image, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBranding } from "../../context/BrandingContext";
import { useAppTheme } from "../../theme/useAppTheme";
import { AppText } from "../../ui/components/AppText";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

type Props = {
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightAction?: React.ReactNode;
  title?: string; // Override title (otherwise uses app name)
};

export const BrandedHeader: React.FC<Props> = ({
  showBackButton = false,
  onBackPress,
  rightAction,
  title,
}) => {
  const branding = useBranding();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();

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
        {/* Left section - Back button or Logo */}
        <View style={styles.leftSection}>
          {showBackButton ? (
            <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
              <Icon name="arrow-left" size={24} color={colors.onSurface} />
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
            <TouchableOpacity style={styles.iconButton}>
              <Icon name="bell-outline" size={22} color={colors.onSurfaceVariant} />
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
  iconButton: {
    padding: 4,
  },
});
