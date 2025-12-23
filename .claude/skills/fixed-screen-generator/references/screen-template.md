# Fixed Screen Component Template

Complete template for creating fixed screens with all required patterns.

## Table of Contents

1. [Full Screen Template](#full-screen-template)
2. [Props Interface](#props-interface)
3. [State Patterns](#state-patterns)
4. [Offline Handling](#offline-handling)
5. [Form Screen Variant](#form-screen-variant)
6. [Detail Screen Variant](#detail-screen-variant)

---

## Full Screen Template

```typescript
/**
 * <ScreenName>Screen - Fixed Screen
 *
 * Purpose: <description of what this screen does>
 * Type: Fixed (non-widget-based)
 * Category: <admin/fees/payroll/academic/admissions>
 * Accessible from: <list widgets/screens that navigate here>
 */

import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// Theme & Branding
import { useAppTheme } from "../../theme/useAppTheme";
import { useBranding } from "../../context/BrandingContext";

// Analytics & Error Tracking
import { useAnalytics } from "../../hooks/useAnalytics";
import { addBreadcrumb, captureException } from "../../error/errorReporting";

// Offline Support
import { useNetworkStatus } from "../../offline/networkStore";
import { OfflineBanner } from "../../offline/OfflineBanner";

// Permissions
import { usePermissions } from "../../hooks/config/usePermissions";

// Localization
import { getLocalizedField } from "../../utils/getLocalizedField";

// UI Components
import { AppText } from "../../ui/components/AppText";
import { AppCard } from "../../ui/components/AppCard";
import { AppButton } from "../../ui/components/AppButton";

// Data Hooks
import { use<Entity>Query } from "../../hooks/queries/admin/use<Entity>Query";

// Types
type Props = {
  screenId?: string;
  role?: string;
  navigation?: any;
  onFocused?: () => void;
};

// Constants
const SCREEN_ID = "<screen-id>";

export const <ScreenName>Screen: React.FC<Props> = ({
  screenId = SCREEN_ID,
  role = "admin",
  navigation: navProp,
  onFocused,
}) => {
  // ═══════════════════════════════════════════════════════════
  // HOOKS
  // ═══════════════════════════════════════════════════════════
  const { colors, borderRadius } = useAppTheme();
  const branding = useBranding();
  const { t } = useTranslation("admin");
  const { trackScreenView, trackEvent } = useAnalytics();
  const { isOnline } = useNetworkStatus();
  const { has } = usePermissions(role);
  const navigation = navProp || useNavigation<any>();
  const route = useRoute<any>();

  // ═══════════════════════════════════════════════════════════
  // ROUTE PARAMS
  // ═══════════════════════════════════════════════════════════
  const { entityId, mode } = route.params || {};

  // ═══════════════════════════════════════════════════════════
  // DATA FETCHING
  // ═══════════════════════════════════════════════════════════
  const { data, isLoading, error, refetch } = use<Entity>Query(entityId);
  const [refreshing, setRefreshing] = useState(false);

  // ═══════════════════════════════════════════════════════════
  // LIFECYCLE
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    trackScreenView(screenId);
    addBreadcrumb({
      category: "navigation",
      message: `Screen viewed: ${screenId}`,
      level: "info",
      data: { entityId, mode },
    });
  }, [screenId, entityId]);

  // ═══════════════════════════════════════════════════════════
  // EVENT HANDLERS
  // ═══════════════════════════════════════════════════════════
  const handleRefresh = useCallback(async () => {
    if (!isOnline) {
      Alert.alert(
        t("common:offline.title", { defaultValue: "You're Offline" }),
        t("common:offline.refreshDisabled", { defaultValue: "Refresh requires internet connection" })
      );
      return;
    }
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [isOnline, refetch, t]);

  const handleBack = useCallback(() => {
    trackEvent("back_pressed", { screen: screenId });
    navigation.goBack();
  }, [navigation, trackEvent, screenId]);

  const handleAction = useCallback(() => {
    if (!isOnline) {
      Alert.alert(
        t("common:offline.title"),
        t("common:offline.actionRequired", { defaultValue: "This action requires internet connection" })
      );
      return;
    }
    trackEvent("action_pressed", { screen: screenId, action: "primary" });
    // Handle action
  }, [isOnline, trackEvent, screenId, t]);

  // ═══════════════════════════════════════════════════════════
  // LOADING STATE
  // ═══════════════════════════════════════════════════════════
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText style={[styles.loadingText, { color: colors.onSurfaceVariant }]}>
            {t("screens.<screenId>.states.loading", { defaultValue: "Loading..." })}
          </AppText>
        </View>
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // ERROR STATE
  // ═══════════════════════════════════════════════════════════
  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <Icon name="alert-circle-outline" size={64} color={colors.error} />
          <AppText style={[styles.errorTitle, { color: colors.error }]}>
            {t("common:errors.title", { defaultValue: "Oops!" })}
          </AppText>
          <AppText style={[styles.errorMessage, { color: colors.onSurfaceVariant }]}>
            {t("screens.<screenId>.states.error", { defaultValue: "Failed to load data" })}
          </AppText>
          <View style={styles.errorActions}>
            <AppButton
              title={t("common:actions.retry", { defaultValue: "Try Again" })}
              onPress={() => refetch()}
              variant="primary"
            />
            <AppButton
              title={t("common:actions.goBack", { defaultValue: "Go Back" })}
              onPress={handleBack}
              variant="outline"
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // EMPTY STATE
  // ═══════════════════════════════════════════════════════════
  if (!data) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerContent}>
          <Icon name="inbox-outline" size={64} color={colors.onSurfaceVariant} />
          <AppText style={[styles.emptyTitle, { color: colors.onSurface }]}>
            {t("screens.<screenId>.states.empty", { defaultValue: "No data available" })}
          </AppText>
          <AppText style={[styles.emptySubtitle, { color: colors.onSurfaceVariant }]}>
            {t("screens.<screenId>.states.emptyHint", { defaultValue: "Check back later" })}
          </AppText>
          <AppButton
            title={t("common:actions.goBack", { defaultValue: "Go Back" })}
            onPress={handleBack}
            variant="outline"
          />
        </View>
      </SafeAreaView>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // SUCCESS STATE
  // ═══════════════════════════════════════════════════════════
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Offline Banner */}
      <OfflineBanner />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
          accessibilityLabel={t("common:actions.goBack")}
          accessibilityRole="button"
        >
          <Icon name="arrow-left" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <AppText style={[styles.headerTitle, { color: colors.onSurface }]} numberOfLines={1}>
            {getLocalizedField(data, "title") || t("screens.<screenId>.title")}
          </AppText>
        </View>
        <View style={styles.headerRight}>
          {/* Optional: Add action button */}
          {has("edit_<entity>") && (
            <TouchableOpacity
              onPress={handleAction}
              style={styles.actionButton}
              accessibilityLabel={t("common:actions.edit")}
            >
              <Icon name="pencil" size={20} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Main Content Card */}
        <AppCard style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="information-outline" size={24} color={colors.primary} />
            <AppText style={[styles.cardTitle, { color: colors.onSurface }]}>
              {t("screens.<screenId>.sections.main", { defaultValue: "Details" })}
            </AppText>
          </View>

          {/* Data Fields */}
          <View style={styles.fieldContainer}>
            <AppText style={[styles.fieldLabel, { color: colors.onSurfaceVariant }]}>
              {t("screens.<screenId>.labels.field1", { defaultValue: "Field 1" })}
            </AppText>
            <AppText style={[styles.fieldValue, { color: colors.onSurface }]}>
              {data.field1 || "-"}
            </AppText>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />

          <View style={styles.fieldContainer}>
            <AppText style={[styles.fieldLabel, { color: colors.onSurfaceVariant }]}>
              {t("screens.<screenId>.labels.field2", { defaultValue: "Field 2" })}
            </AppText>
            <AppText style={[styles.fieldValue, { color: colors.onSurface }]}>
              {getLocalizedField(data, "field2") || "-"}
            </AppText>
          </View>
        </AppCard>

        {/* Additional Sections */}
        {has("view_<entity>_details") && (
          <AppCard style={styles.card}>
            <View style={styles.cardHeader}>
              <Icon name="chart-line" size={24} color={colors.primary} />
              <AppText style={[styles.cardTitle, { color: colors.onSurface }]}>
                {t("screens.<screenId>.sections.details", { defaultValue: "Additional Details" })}
              </AppText>
            </View>
            {/* Additional content */}
          </AppCard>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <AppButton
            title={t("screens.<screenId>.actions.primary", { defaultValue: "Primary Action" })}
            onPress={handleAction}
            variant="primary"
            disabled={!isOnline}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ═══════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 8,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  errorMessage: {
    fontSize: 14,
    textAlign: "center",
    marginVertical: 8,
  },
  errorActions: {
    flexDirection: "column",
    gap: 12,
    marginTop: 16,
    width: "100%",
    maxWidth: 200,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 32,
  },
  card: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  fieldContainer: {
    paddingVertical: 8,
  },
  fieldLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 16,
    fontWeight: "500",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 8,
  },
  actionsContainer: {
    marginTop: 8,
    gap: 12,
  },
});

export default <ScreenName>Screen;
```

---

## Props Interface

```typescript
type Props = {
  // Screen identification
  screenId?: string;              // Screen ID from route

  // User context
  role?: string;                   // Current user role

  // Navigation
  navigation?: NavigationProp;     // Navigation object (optional if using hook)

  // Callbacks
  onFocused?: () => void;          // Called when screen gains focus
};
```

---

## State Patterns

### Loading State

```typescript
if (isLoading) {
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.centerContent}>
        <ActivityIndicator size="large" color={colors.primary} />
        <AppText style={{ color: colors.onSurfaceVariant }}>
          {t("common:status.loading")}
        </AppText>
      </View>
    </SafeAreaView>
  );
}
```

### Error State

```typescript
if (error) {
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.centerContent}>
        <Icon name="alert-circle-outline" size={64} color={colors.error} />
        <AppText style={{ color: colors.error }}>
          {t("common:errors.title")}
        </AppText>
        <AppText style={{ color: colors.onSurfaceVariant }}>
          {error.message || t("common:errors.generic")}
        </AppText>
        <AppButton
          title={t("common:actions.retry")}
          onPress={() => refetch()}
          variant="primary"
        />
      </View>
    </SafeAreaView>
  );
}
```

### Empty State

```typescript
if (!data || data.length === 0) {
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.centerContent}>
        <Icon name="inbox-outline" size={64} color={colors.onSurfaceVariant} />
        <AppText style={{ color: colors.onSurface }}>
          {t("screens.myScreen.states.empty")}
        </AppText>
        <AppText style={{ color: colors.onSurfaceVariant }}>
          {t("screens.myScreen.states.emptyHint")}
        </AppText>
      </View>
    </SafeAreaView>
  );
}
```

---

## Offline Handling

### Check Before Mutations

```typescript
const handleSave = useCallback(async () => {
  if (!isOnline) {
    Alert.alert(
      t("common:offline.title", { defaultValue: "You're Offline" }),
      t("common:offline.actionRequired", {
        defaultValue: "This action requires internet connection. Please try again when online."
      }),
      [{ text: t("common:actions.ok", { defaultValue: "OK" }) }]
    );
    return;
  }

  try {
    await mutation.mutateAsync(formData);
    Alert.alert(
      t("common:success", { defaultValue: "Success" }),
      t("screens.myScreen.messages.saveSuccess")
    );
    navigation.goBack();
  } catch (err) {
    captureException(err, { tags: { screen: screenId } });
    Alert.alert(
      t("common:error", { defaultValue: "Error" }),
      t("screens.myScreen.messages.saveFailed")
    );
  }
}, [isOnline, mutation, formData, t, navigation]);
```

### Disable Refresh When Offline

```typescript
const handleRefresh = useCallback(async () => {
  if (!isOnline) {
    Alert.alert(
      t("common:offline.title"),
      t("common:offline.refreshDisabled")
    );
    return;
  }
  setRefreshing(true);
  await refetch();
  setRefreshing(false);
}, [isOnline, refetch, t]);
```

---

## Form Screen Variant

For screens with forms and input fields:

```typescript
import { useState, useCallback } from "react";
import { TextInput, KeyboardAvoidingView, Platform } from "react-native";

// Additional state for form
const [formData, setFormData] = useState({
  field1: "",
  field2: "",
});
const [errors, setErrors] = useState<Record<string, string>>({});

// Validation
const validate = useCallback(() => {
  const newErrors: Record<string, string> = {};

  if (!formData.field1.trim()) {
    newErrors.field1 = t("screens.myScreen.validation.field1Required");
  }

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
}, [formData, t]);

// Submit handler
const handleSubmit = useCallback(async () => {
  if (!validate()) return;
  if (!isOnline) {
    Alert.alert(t("common:offline.title"), t("common:offline.actionRequired"));
    return;
  }

  try {
    await mutation.mutateAsync(formData);
    navigation.goBack();
  } catch (err) {
    Alert.alert(t("common:error"), t("screens.myScreen.messages.saveFailed"));
  }
}, [validate, isOnline, mutation, formData, navigation, t]);

// Render form
return (
  <KeyboardAvoidingView
    style={styles.container}
    behavior={Platform.OS === "ios" ? "padding" : undefined}
  >
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.fieldContainer}>
        <AppText style={styles.label}>{t("screens.myScreen.labels.field1")}</AppText>
        <TextInput
          style={[
            styles.input,
            { borderColor: errors.field1 ? colors.error : colors.outline }
          ]}
          value={formData.field1}
          onChangeText={(text) => setFormData(prev => ({ ...prev, field1: text }))}
          placeholder={t("screens.myScreen.placeholders.field1")}
          placeholderTextColor={colors.onSurfaceVariant}
        />
        {errors.field1 && (
          <AppText style={{ color: colors.error, fontSize: 12 }}>
            {errors.field1}
          </AppText>
        )}
      </View>

      <AppButton
        title={t("common:actions.save")}
        onPress={handleSubmit}
        disabled={!isOnline || mutation.isPending}
        loading={mutation.isPending}
      />
    </ScrollView>
  </KeyboardAvoidingView>
);
```

---

## Detail Screen Variant

For screens showing a single entity's details:

```typescript
// Get entity ID from route
const { entityId } = route.params || {};

// Fetch entity data
const { data: entity, isLoading, error, refetch } = useEntityDetailQuery(entityId);

// Render detail sections
return (
  <SafeAreaView style={styles.container}>
    <OfflineBanner />

    <ScrollView contentContainerStyle={styles.content}>
      {/* Hero Section */}
      <View style={[styles.heroSection, { backgroundColor: colors.primaryContainer }]}>
        <Icon name="account-circle" size={80} color={colors.primary} />
        <AppText style={[styles.heroTitle, { color: colors.onPrimaryContainer }]}>
          {getLocalizedField(entity, "name")}
        </AppText>
        <AppText style={[styles.heroSubtitle, { color: colors.onPrimaryContainer }]}>
          {entity.status}
        </AppText>
      </View>

      {/* Info Cards */}
      <AppCard style={styles.infoCard}>
        <InfoRow
          icon="email"
          label={t("screens.detail.email")}
          value={entity.email}
        />
        <InfoRow
          icon="phone"
          label={t("screens.detail.phone")}
          value={entity.phone}
        />
        <InfoRow
          icon="calendar"
          label={t("screens.detail.createdAt")}
          value={formatDate(entity.created_at)}
        />
      </AppCard>

      {/* Action Buttons */}
      <View style={styles.actions}>
        {has("edit_entity") && (
          <AppButton
            title={t("common:actions.edit")}
            onPress={() => navigation.navigate("entity-edit", { entityId })}
            variant="primary"
          />
        )}
        {has("delete_entity") && (
          <AppButton
            title={t("common:actions.delete")}
            onPress={handleDelete}
            variant="destructive"
          />
        )}
      </View>
    </ScrollView>
  </SafeAreaView>
);

// Helper component
const InfoRow = ({ icon, label, value }) => (
  <View style={styles.infoRow}>
    <Icon name={icon} size={20} color={colors.primary} />
    <View style={styles.infoContent}>
      <AppText style={styles.infoLabel}>{label}</AppText>
      <AppText style={styles.infoValue}>{value || "-"}</AppText>
    </View>
  </View>
);
```
