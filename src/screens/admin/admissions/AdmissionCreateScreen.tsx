/**
 * AdmissionCreateScreen - Fixed Screen (Admin)
 *
 * Purpose: Create a new admission inquiry with student and parent details
 * Type: Fixed (custom component - not widget-based)
 * Accessible from: AdmissionStatsWidget "Add New Inquiry" button, AdmissionsListScreen FAB
 *
 * ============================================================================
 * PHASE 1: PLANNING & ANALYSIS ✓
 * ============================================================================
 * - Screen purpose: Create new admission/inquiry record with full form
 * - Target role: admin, super_admin, counselor
 * - Screen ID: admission-create
 * - Route params: none (optional: program for pre-selection)
 * - Data requirements: admissions table, user_profiles for counselor assignment
 * - Required permissions: create_admissions
 *
 * ============================================================================
 * PHASE 2: SUPABASE DATABASE SETUP ✓
 * ============================================================================
 * - Uses admissions table (created in Phase 5 of admin_demo.md)
 * - RLS: admin role can insert into admissions where customer_id matches
 *
 * ============================================================================
 * PHASE 3: QUERY/MUTATION HOOKS ✓
 * ============================================================================
 * - useCreateAdmissionMutation: src/hooks/mutations/admin/useCreateAdmissionMutation.ts
 * - Types: CreateAdmissionInput, CreateAdmissionResult, AdmissionSource
 *
 * ============================================================================
 * PHASE 4: SCREEN COMPONENT ✓
 * ============================================================================
 */

import React, { useEffect, useCallback, useState, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// Theme & Branding
import { useAppTheme } from "../../../theme/useAppTheme";
import { useBranding } from "../../../context/BrandingContext";

// Analytics & Error Tracking
import { useAnalytics } from "../../../hooks/useAnalytics";
import { addBreadcrumb } from "../../../error/errorReporting";

// Offline Support
import { useNetworkStatus } from "../../../offline/networkStore";
import { OfflineBanner } from "../../../offline/OfflineBanner";

// UI Components
import { AppText } from "../../../ui/components/AppText";
import { AppCard } from "../../../ui/components/AppCard";

// Mutation Hook
import { 
  useCreateAdmissionMutation,
  AdmissionSource,
} from "../../../hooks/mutations/admin";

// Constants
import { DEMO_CUSTOMER_ID } from "../../../lib/supabaseClient";

// =============================================================================
// TYPES
// =============================================================================

type Props = {
  screenId?: string;
  role?: string;
  customerId?: string;
  navigation?: any;
  route?: any;
  onFocused?: () => void;
};

type RouteParams = {
  program?: string;
};

type FormData = {
  studentName: string;
  studentNameHi: string;
  phone: string;
  altPhone: string;
  email: string;
  parentName: string;
  parentPhone: string;
  program: string;
  batchPreference: string;
  currentClass: string;
  currentSchool: string;
  source: AdmissionSource;
  referralName: string;
  feeQuoted: string;
  nextFollowUp: string;
  notes: string;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

// =============================================================================
// CONSTANTS
// =============================================================================

const PROGRAMS = [
  { value: 'JEE', label: 'JEE (Engineering)', color: '#2196F3' },
  { value: 'NEET', label: 'NEET (Medical)', color: '#4CAF50' },
  { value: 'Foundation', label: 'Foundation', color: '#FF9800' },
];

const SOURCES: Array<{ value: AdmissionSource; label: string; icon: string }> = [
  { value: 'walk-in', label: 'Walk-in', icon: 'walk' },
  { value: 'website', label: 'Website', icon: 'web' },
  { value: 'referral', label: 'Referral', icon: 'account-group' },
  { value: 'advertisement', label: 'Advertisement', icon: 'bullhorn' },
  { value: 'social-media', label: 'Social Media', icon: 'share-variant' },
  { value: 'other', label: 'Other', icon: 'dots-horizontal' },
];

const CLASSES = [
  'Class 9', 'Class 10', 'Class 11', 'Class 12', 'Dropper'
];

const INITIAL_FORM_DATA: FormData = {
  studentName: '',
  studentNameHi: '',
  phone: '',
  altPhone: '',
  email: '',
  parentName: '',
  parentPhone: '',
  program: '',
  batchPreference: '',
  currentClass: '',
  currentSchool: '',
  source: 'walk-in',
  referralName: '',
  feeQuoted: '',
  nextFollowUp: '',
  notes: '',
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const validatePhone = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10 || cleaned.length === 12;
};

const validateEmail = (email: string): boolean => {
  if (!email) return true; // Optional field
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const formatPhoneInput = (text: string): string => {
  const cleaned = text.replace(/\D/g, '');
  if (cleaned.length <= 10) {
    return cleaned;
  }
  return cleaned.slice(0, 12);
};

// =============================================================================
// COMPONENT
// =============================================================================

export const AdmissionCreateScreen: React.FC<Props> = ({
  screenId = "admission-create",
  role = "admin",
  customerId = DEMO_CUSTOMER_ID,
  navigation: navProp,
  route: routeProp,
  onFocused,
}) => {
  // ===========================================================================
  // HOOKS
  // ===========================================================================
  const { colors, borderRadius } = useAppTheme();
  const branding = useBranding();
  const { t } = useTranslation(["admin", "common"]);
  const { trackScreenView, trackEvent } = useAnalytics();
  const { isOnline } = useNetworkStatus();
  const navigation = navProp || useNavigation<any>();
  const route = routeProp || useRoute<any>();

  // Get route params
  const params = (route?.params || {}) as RouteParams;

  // Refs for form inputs
  const phoneRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const parentNameRef = useRef<TextInput>(null);
  const parentPhoneRef = useRef<TextInput>(null);
  const schoolRef = useRef<TextInput>(null);
  const notesRef = useRef<TextInput>(null);

  // ===========================================================================
  // STATE
  // ===========================================================================
  const [formData, setFormData] = useState<FormData>({
    ...INITIAL_FORM_DATA,
    program: params.program || '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [activeSection, setActiveSection] = useState<number>(0);

  // ===========================================================================
  // MUTATION
  // ===========================================================================
  const createMutation = useCreateAdmissionMutation();

  // ===========================================================================
  // LIFECYCLE
  // ===========================================================================
  useEffect(() => {
    trackScreenView(screenId);
    addBreadcrumb({
      category: "navigation",
      message: `Screen viewed: ${screenId}`,
      level: "info",
      data: { role, customerId },
    });
  }, [screenId, role, customerId, trackScreenView]);

  // ===========================================================================
  // HANDLERS
  // ===========================================================================
  const handleBack = useCallback(() => {
    if (hasChanges()) {
      Alert.alert(
        t("common:alerts.unsavedChanges", { defaultValue: "Unsaved Changes" }),
        t("common:alerts.unsavedChangesMessage", { defaultValue: "You have unsaved changes. Are you sure you want to leave?" }),
        [
          { text: t("common:actions.cancel", { defaultValue: "Cancel" }), style: "cancel" },
          { text: t("common:actions.leave", { defaultValue: "Leave" }), style: "destructive", onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  }, [navigation, t, formData]);

  const hasChanges = useCallback((): boolean => {
    return Object.keys(formData).some(key => {
      const k = key as keyof FormData;
      return formData[k] !== INITIAL_FORM_DATA[k] && formData[k] !== '';
    });
  }, [formData]);

  const updateField = useCallback((field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    // Required fields
    if (!formData.studentName.trim()) {
      newErrors.studentName = 'Student name is required';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Invalid phone number';
    }
    if (!formData.program) {
      newErrors.program = 'Program is required';
    }
    if (formData.email && !validateEmail(formData.email)) {
      newErrors.email = 'Invalid email address';
    }
    if (formData.parentPhone && !validatePhone(formData.parentPhone)) {
      newErrors.parentPhone = 'Invalid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      trackEvent("admission_create_validation_failed", { screenId });
      return;
    }

    trackEvent("admission_create_submit", { screenId, program: formData.program });

    try {
      const result = await createMutation.mutateAsync({
        studentName: formData.studentName.trim(),
        studentNameHi: formData.studentNameHi.trim() || undefined,
        phone: formData.phone.trim(),
        altPhone: formData.altPhone.trim() || undefined,
        email: formData.email.trim() || undefined,
        parentName: formData.parentName.trim() || undefined,
        parentPhone: formData.parentPhone.trim() || undefined,
        program: formData.program,
        batchPreference: formData.batchPreference.trim() || undefined,
        currentClass: formData.currentClass || undefined,
        currentSchool: formData.currentSchool.trim() || undefined,
        source: formData.source,
        referralName: formData.referralName.trim() || undefined,
        feeQuoted: formData.feeQuoted ? parseFloat(formData.feeQuoted) : undefined,
        nextFollowUp: formData.nextFollowUp || undefined,
        notes: formData.notes.trim() || undefined,
      });

      trackEvent("admission_create_success", { screenId, admissionId: result.id });

      Alert.alert(
        t("common:alerts.success", { defaultValue: "Success" }),
        t("admin:admissionCreate.successMessage", { defaultValue: "Admission inquiry created successfully!" }),
        [
          {
            text: t("common:actions.viewDetails", { defaultValue: "View Details" }),
            onPress: () => navigation.replace("admission-detail", { admissionId: result.id }),
          },
          {
            text: t("common:actions.addAnother", { defaultValue: "Add Another" }),
            onPress: () => setFormData({ ...INITIAL_FORM_DATA }),
          },
        ]
      );
    } catch (error) {
      trackEvent("admission_create_error", { screenId, error: (error as Error).message });
      Alert.alert(
        t("common:errors.title", { defaultValue: "Error" }),
        t("admin:admissionCreate.errorMessage", { defaultValue: "Failed to create admission. Please try again." })
      );
    }
  }, [formData, validateForm, createMutation, navigation, t, trackEvent, screenId]);

  const selectProgram = useCallback((program: string) => {
    updateField('program', program);
    trackEvent("admission_create_program_selected", { screenId, program });
  }, [updateField, trackEvent, screenId]);

  const selectSource = useCallback((source: AdmissionSource) => {
    updateField('source', source);
    trackEvent("admission_create_source_selected", { screenId, source });
  }, [updateField, trackEvent, screenId]);

  const selectClass = useCallback((cls: string) => {
    updateField('currentClass', cls);
  }, [updateField]);

  // ===========================================================================
  // RENDER
  // ===========================================================================
  const isSubmitting = createMutation.isPending;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      {/* Offline Banner */}
      <OfflineBanner />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.headerBackButton}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Icon name="arrow-left" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
          {t("admin:admissionCreate.title", { defaultValue: "New Admission Inquiry" })}
        </AppText>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Student Information Section */}
          <AppCard style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Icon name="account" size={20} color={colors.primary} />
              <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
                {t("admin:admissionCreate.studentInfo", { defaultValue: "Student Information" })}
              </AppText>
            </View>

            {/* Student Name */}
            <View style={styles.inputGroup}>
              <AppText style={[styles.inputLabel, { color: colors.onSurfaceVariant }]}>
                {t("admin:admissionCreate.studentName", { defaultValue: "Student Name" })} *
              </AppText>
              <TextInput
                style={[
                  styles.textInput,
                  { backgroundColor: colors.surfaceVariant, color: colors.onSurface, borderColor: errors.studentName ? colors.error : colors.outlineVariant },
                ]}
                value={formData.studentName}
                onChangeText={(text) => updateField('studentName', text)}
                placeholder={t("admin:admissionCreate.studentNamePlaceholder", { defaultValue: "Enter student name" })}
                placeholderTextColor={colors.onSurfaceVariant}
                returnKeyType="next"
                onSubmitEditing={() => phoneRef.current?.focus()}
              />
              {errors.studentName && (
                <AppText style={[styles.errorText, { color: colors.error }]}>{errors.studentName}</AppText>
              )}
            </View>

            {/* Student Name (Hindi) */}
            <View style={styles.inputGroup}>
              <AppText style={[styles.inputLabel, { color: colors.onSurfaceVariant }]}>
                {t("admin:admissionCreate.studentNameHi", { defaultValue: "Student Name (Hindi)" })}
              </AppText>
              <TextInput
                style={[
                  styles.textInput,
                  { backgroundColor: colors.surfaceVariant, color: colors.onSurface, borderColor: colors.outlineVariant },
                ]}
                value={formData.studentNameHi}
                onChangeText={(text) => updateField('studentNameHi', text)}
                placeholder={t("admin:admissionCreate.studentNameHiPlaceholder", { defaultValue: "छात्र का नाम" })}
                placeholderTextColor={colors.onSurfaceVariant}
              />
            </View>

            {/* Current Class */}
            <View style={styles.inputGroup}>
              <AppText style={[styles.inputLabel, { color: colors.onSurfaceVariant }]}>
                {t("admin:admissionCreate.currentClass", { defaultValue: "Current Class" })}
              </AppText>
              <View style={styles.chipContainer}>
                {CLASSES.map((cls) => (
                  <TouchableOpacity
                    key={cls}
                    style={[
                      styles.chip,
                      { borderColor: colors.outlineVariant },
                      formData.currentClass === cls && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                    onPress={() => selectClass(cls)}
                  >
                    <AppText
                      style={[
                        styles.chipText,
                        { color: formData.currentClass === cls ? '#FFF' : colors.onSurface },
                      ]}
                    >
                      {cls}
                    </AppText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Current School */}
            <View style={styles.inputGroup}>
              <AppText style={[styles.inputLabel, { color: colors.onSurfaceVariant }]}>
                {t("admin:admissionCreate.currentSchool", { defaultValue: "Current School" })}
              </AppText>
              <TextInput
                ref={schoolRef}
                style={[
                  styles.textInput,
                  { backgroundColor: colors.surfaceVariant, color: colors.onSurface, borderColor: colors.outlineVariant },
                ]}
                value={formData.currentSchool}
                onChangeText={(text) => updateField('currentSchool', text)}
                placeholder={t("admin:admissionCreate.currentSchoolPlaceholder", { defaultValue: "Enter current school name" })}
                placeholderTextColor={colors.onSurfaceVariant}
              />
            </View>
          </AppCard>

          {/* Contact Information Section */}
          <AppCard style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Icon name="phone" size={20} color={colors.primary} />
              <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
                {t("admin:admissionCreate.contactInfo", { defaultValue: "Contact Information" })}
              </AppText>
            </View>

            {/* Phone */}
            <View style={styles.inputGroup}>
              <AppText style={[styles.inputLabel, { color: colors.onSurfaceVariant }]}>
                {t("admin:admissionCreate.phone", { defaultValue: "Phone Number" })} *
              </AppText>
              <TextInput
                ref={phoneRef}
                style={[
                  styles.textInput,
                  { backgroundColor: colors.surfaceVariant, color: colors.onSurface, borderColor: errors.phone ? colors.error : colors.outlineVariant },
                ]}
                value={formData.phone}
                onChangeText={(text) => updateField('phone', formatPhoneInput(text))}
                placeholder={t("admin:admissionCreate.phonePlaceholder", { defaultValue: "10-digit mobile number" })}
                placeholderTextColor={colors.onSurfaceVariant}
                keyboardType="phone-pad"
                maxLength={12}
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
              />
              {errors.phone && (
                <AppText style={[styles.errorText, { color: colors.error }]}>{errors.phone}</AppText>
              )}
            </View>

            {/* Alt Phone */}
            <View style={styles.inputGroup}>
              <AppText style={[styles.inputLabel, { color: colors.onSurfaceVariant }]}>
                {t("admin:admissionCreate.altPhone", { defaultValue: "Alternate Phone" })}
              </AppText>
              <TextInput
                style={[
                  styles.textInput,
                  { backgroundColor: colors.surfaceVariant, color: colors.onSurface, borderColor: colors.outlineVariant },
                ]}
                value={formData.altPhone}
                onChangeText={(text) => updateField('altPhone', formatPhoneInput(text))}
                placeholder={t("admin:admissionCreate.altPhonePlaceholder", { defaultValue: "Alternate number (optional)" })}
                placeholderTextColor={colors.onSurfaceVariant}
                keyboardType="phone-pad"
                maxLength={12}
              />
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <AppText style={[styles.inputLabel, { color: colors.onSurfaceVariant }]}>
                {t("admin:admissionCreate.email", { defaultValue: "Email Address" })}
              </AppText>
              <TextInput
                ref={emailRef}
                style={[
                  styles.textInput,
                  { backgroundColor: colors.surfaceVariant, color: colors.onSurface, borderColor: errors.email ? colors.error : colors.outlineVariant },
                ]}
                value={formData.email}
                onChangeText={(text) => updateField('email', text)}
                placeholder={t("admin:admissionCreate.emailPlaceholder", { defaultValue: "email@example.com" })}
                placeholderTextColor={colors.onSurfaceVariant}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="next"
                onSubmitEditing={() => parentNameRef.current?.focus()}
              />
              {errors.email && (
                <AppText style={[styles.errorText, { color: colors.error }]}>{errors.email}</AppText>
              )}
            </View>
          </AppCard>

          {/* Parent Information Section */}
          <AppCard style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Icon name="account-tie" size={20} color={colors.primary} />
              <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
                {t("admin:admissionCreate.parentInfo", { defaultValue: "Parent Information" })}
              </AppText>
            </View>

            {/* Parent Name */}
            <View style={styles.inputGroup}>
              <AppText style={[styles.inputLabel, { color: colors.onSurfaceVariant }]}>
                {t("admin:admissionCreate.parentName", { defaultValue: "Parent/Guardian Name" })}
              </AppText>
              <TextInput
                ref={parentNameRef}
                style={[
                  styles.textInput,
                  { backgroundColor: colors.surfaceVariant, color: colors.onSurface, borderColor: colors.outlineVariant },
                ]}
                value={formData.parentName}
                onChangeText={(text) => updateField('parentName', text)}
                placeholder={t("admin:admissionCreate.parentNamePlaceholder", { defaultValue: "Enter parent name" })}
                placeholderTextColor={colors.onSurfaceVariant}
                returnKeyType="next"
                onSubmitEditing={() => parentPhoneRef.current?.focus()}
              />
            </View>

            {/* Parent Phone */}
            <View style={styles.inputGroup}>
              <AppText style={[styles.inputLabel, { color: colors.onSurfaceVariant }]}>
                {t("admin:admissionCreate.parentPhone", { defaultValue: "Parent Phone" })}
              </AppText>
              <TextInput
                ref={parentPhoneRef}
                style={[
                  styles.textInput,
                  { backgroundColor: colors.surfaceVariant, color: colors.onSurface, borderColor: errors.parentPhone ? colors.error : colors.outlineVariant },
                ]}
                value={formData.parentPhone}
                onChangeText={(text) => updateField('parentPhone', formatPhoneInput(text))}
                placeholder={t("admin:admissionCreate.parentPhonePlaceholder", { defaultValue: "Parent mobile number" })}
                placeholderTextColor={colors.onSurfaceVariant}
                keyboardType="phone-pad"
                maxLength={12}
              />
              {errors.parentPhone && (
                <AppText style={[styles.errorText, { color: colors.error }]}>{errors.parentPhone}</AppText>
              )}
            </View>
          </AppCard>

          {/* Program Selection Section */}
          <AppCard style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Icon name="book-education" size={20} color={colors.primary} />
              <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
                {t("admin:admissionCreate.programSelection", { defaultValue: "Program Selection" })} *
              </AppText>
            </View>

            <View style={styles.programContainer}>
              {PROGRAMS.map((prog) => (
                <TouchableOpacity
                  key={prog.value}
                  style={[
                    styles.programCard,
                    { borderColor: formData.program === prog.value ? prog.color : colors.outlineVariant },
                    formData.program === prog.value && { backgroundColor: `${prog.color}15` },
                  ]}
                  onPress={() => selectProgram(prog.value)}
                >
                  <View style={[styles.programIcon, { backgroundColor: `${prog.color}20` }]}>
                    <Icon
                      name={prog.value === 'JEE' ? 'calculator-variant' : prog.value === 'NEET' ? 'medical-bag' : 'school'}
                      size={24}
                      color={prog.color}
                    />
                  </View>
                  <AppText style={[styles.programLabel, { color: colors.onSurface }]}>{prog.label}</AppText>
                  {formData.program === prog.value && (
                    <Icon name="check-circle" size={20} color={prog.color} style={styles.programCheck} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
            {errors.program && (
              <AppText style={[styles.errorText, { color: colors.error, marginTop: 8 }]}>{errors.program}</AppText>
            )}

            {/* Batch Preference */}
            <View style={[styles.inputGroup, { marginTop: 16 }]}>
              <AppText style={[styles.inputLabel, { color: colors.onSurfaceVariant }]}>
                {t("admin:admissionCreate.batchPreference", { defaultValue: "Batch Preference" })}
              </AppText>
              <TextInput
                style={[
                  styles.textInput,
                  { backgroundColor: colors.surfaceVariant, color: colors.onSurface, borderColor: colors.outlineVariant },
                ]}
                value={formData.batchPreference}
                onChangeText={(text) => updateField('batchPreference', text)}
                placeholder={t("admin:admissionCreate.batchPreferencePlaceholder", { defaultValue: "e.g., Morning, Evening, Weekend" })}
                placeholderTextColor={colors.onSurfaceVariant}
              />
            </View>
          </AppCard>

          {/* Source Selection Section */}
          <AppCard style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Icon name="source-branch" size={20} color={colors.primary} />
              <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
                {t("admin:admissionCreate.sourceSelection", { defaultValue: "Inquiry Source" })}
              </AppText>
            </View>

            <View style={styles.sourceContainer}>
              {SOURCES.map((src) => (
                <TouchableOpacity
                  key={src.value}
                  style={[
                    styles.sourceChip,
                    { borderColor: colors.outlineVariant },
                    formData.source === src.value && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                  onPress={() => selectSource(src.value)}
                >
                  <Icon
                    name={src.icon}
                    size={16}
                    color={formData.source === src.value ? '#FFF' : colors.onSurfaceVariant}
                  />
                  <AppText
                    style={[
                      styles.sourceChipText,
                      { color: formData.source === src.value ? '#FFF' : colors.onSurface },
                    ]}
                  >
                    {src.label}
                  </AppText>
                </TouchableOpacity>
              ))}
            </View>

            {/* Referral Name (shown when source is referral) */}
            {formData.source === 'referral' && (
              <View style={[styles.inputGroup, { marginTop: 16 }]}>
                <AppText style={[styles.inputLabel, { color: colors.onSurfaceVariant }]}>
                  {t("admin:admissionCreate.referralName", { defaultValue: "Referred By" })}
                </AppText>
                <TextInput
                  style={[
                    styles.textInput,
                    { backgroundColor: colors.surfaceVariant, color: colors.onSurface, borderColor: colors.outlineVariant },
                  ]}
                  value={formData.referralName}
                  onChangeText={(text) => updateField('referralName', text)}
                  placeholder={t("admin:admissionCreate.referralNamePlaceholder", { defaultValue: "Name of referrer" })}
                  placeholderTextColor={colors.onSurfaceVariant}
                />
              </View>
            )}
          </AppCard>

          {/* Additional Information Section */}
          <AppCard style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Icon name="information" size={20} color={colors.primary} />
              <AppText style={[styles.sectionTitle, { color: colors.onSurface }]}>
                {t("admin:admissionCreate.additionalInfo", { defaultValue: "Additional Information" })}
              </AppText>
            </View>

            {/* Fee Quoted */}
            <View style={styles.inputGroup}>
              <AppText style={[styles.inputLabel, { color: colors.onSurfaceVariant }]}>
                {t("admin:admissionCreate.feeQuoted", { defaultValue: "Fee Quoted (₹)" })}
              </AppText>
              <TextInput
                style={[
                  styles.textInput,
                  { backgroundColor: colors.surfaceVariant, color: colors.onSurface, borderColor: colors.outlineVariant },
                ]}
                value={formData.feeQuoted}
                onChangeText={(text) => updateField('feeQuoted', text.replace(/[^0-9]/g, ''))}
                placeholder={t("admin:admissionCreate.feeQuotedPlaceholder", { defaultValue: "Enter fee amount" })}
                placeholderTextColor={colors.onSurfaceVariant}
                keyboardType="numeric"
              />
            </View>

            {/* Notes */}
            <View style={styles.inputGroup}>
              <AppText style={[styles.inputLabel, { color: colors.onSurfaceVariant }]}>
                {t("admin:admissionCreate.notes", { defaultValue: "Notes" })}
              </AppText>
              <TextInput
                ref={notesRef}
                style={[
                  styles.textInput,
                  styles.textArea,
                  { backgroundColor: colors.surfaceVariant, color: colors.onSurface, borderColor: colors.outlineVariant },
                ]}
                value={formData.notes}
                onChangeText={(text) => updateField('notes', text)}
                placeholder={t("admin:admissionCreate.notesPlaceholder", { defaultValue: "Any additional notes or remarks..." })}
                placeholderTextColor={colors.onSurfaceVariant}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </AppCard>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: isOnline ? colors.primary : colors.onSurfaceVariant },
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting || !isOnline}
            accessibilityLabel="Create admission inquiry"
            accessibilityRole="button"
          >
            {isSubmitting ? (
              <View style={styles.submitButtonContent}>
                <ActivityIndicator size="small" color="#FFF" />
                <AppText style={styles.submitButtonText}>
                  {t("common:status.creating", { defaultValue: "Creating..." })}
                </AppText>
              </View>
            ) : (
              <View style={styles.submitButtonContent}>
                <Icon name="check" size={20} color="#FFF" />
                <AppText style={styles.submitButtonText}>
                  {t("admin:admissionCreate.submit", { defaultValue: "Create Inquiry" })}
                </AppText>
              </View>
            )}
          </TouchableOpacity>

          {!isOnline && (
            <AppText style={[styles.offlineHint, { color: colors.error }]}>
              {t("common:offline.cannotCreate", { defaultValue: "You are offline. Please connect to create new records." })}
            </AppText>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollView: { flex: 1 },
  content: { padding: 16, gap: 16, paddingBottom: 32 },

  // Header
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  headerBackButton: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: "600", textAlign: "center" },
  headerSpacer: { width: 32 },

  // Section Card
  sectionCard: { padding: 16 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: "600" },

  // Input Group
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 13, marginBottom: 6, fontWeight: "500" },
  textInput: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  textArea: { minHeight: 100, paddingTop: 12 },
  errorText: { fontSize: 11, marginTop: 4 },

  // Chips
  chipContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
  chipText: { fontSize: 12, fontWeight: "500" },

  // Program Selection
  programContainer: { flexDirection: "row", gap: 12 },
  programCard: { flex: 1, alignItems: "center", padding: 12, borderRadius: 12, borderWidth: 2 },
  programIcon: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  programLabel: { fontSize: 12, fontWeight: "600", textAlign: "center" },
  programCheck: { position: "absolute", top: 8, right: 8 },

  // Source Selection
  sourceContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  sourceChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  sourceChipText: { fontSize: 12, fontWeight: "500" },

  // Submit Button
  submitButton: { paddingVertical: 14, borderRadius: 8, alignItems: "center", marginTop: 8 },
  submitButtonContent: { flexDirection: "row", alignItems: "center", gap: 8 },
  submitButtonText: { color: "#FFF", fontSize: 15, fontWeight: "600" },
  offlineHint: { fontSize: 12, textAlign: "center", marginTop: 8 },
});

export default AdmissionCreateScreen;
