/**
 * Help & Feedback Screen - Fixed (Low Customization)
 * 
 * Support options using branding config:
 * - Support email from branding.supportEmail
 * - Help URL from branding.helpCenterUrl
 * - WhatsApp from branding.whatsappNumber
 */

import React, { useCallback } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useTranslation } from "react-i18next";

import { useAppTheme } from "../../theme/useAppTheme";
import { useBranding } from "../../context/BrandingContext";
import { useAnalytics } from "../../hooks/useAnalytics";
import { AppText } from "../../ui/components/AppText";
import { AppCard } from "../../ui/components/AppCard";
import { OfflineBanner } from "../../offline/OfflineBanner";

type SupportOption = {
  id: string;
  icon: string;
  titleKey: string;
  subtitleKey: string;
  color: string;
  action: () => void;
};

export const HelpFeedbackScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const { colors, borderRadius } = useAppTheme();
  const branding = useBranding();
  const { t } = useTranslation("profile");
  const { trackScreenView, trackEvent } = useAnalytics();

  React.useEffect(() => {
    trackScreenView("help-feedback");
  }, []);

  const openUrl = useCallback(async (url: string, eventName: string) => {
    trackEvent(eventName);
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          t("help.error.title", { defaultValue: "Error" }),
          t("help.error.cannotOpen", { defaultValue: "Cannot open this link" })
        );
      }
    } catch (error) {
      console.error("Failed to open URL:", error);
      Alert.alert(
        t("help.error.title", { defaultValue: "Error" }),
        t("help.error.failed", { defaultValue: "Something went wrong" })
      );
    }
  }, [trackEvent, t]);

  const handleEmail = useCallback(() => {
    const email = branding.supportEmail || "support@example.com";
    const subject = encodeURIComponent(`${branding.appName} - Support Request`);
    openUrl(`mailto:${email}?subject=${subject}`, "help_email_pressed");
  }, [branding, openUrl]);

  const handleWhatsApp = useCallback(() => {
    const phone = branding.whatsappNumber || "";
    if (!phone) {
      Alert.alert(
        t("help.error.title", { defaultValue: "Error" }),
        t("help.error.noWhatsapp", { defaultValue: "WhatsApp support not available" })
      );
      return;
    }
    const cleanPhone = phone.replace(/\D/g, "");
    openUrl(`https://wa.me/${cleanPhone}`, "help_whatsapp_pressed");
  }, [branding, openUrl, t]);

  const handleHelpCenter = useCallback(() => {
    const url = branding.helpCenterUrl || "https://help.example.com";
    openUrl(url, "help_center_pressed");
  }, [branding, openUrl]);

  const handlePhone = useCallback(() => {
    const phone = branding.supportPhone || "";
    if (!phone) {
      Alert.alert(
        t("help.error.title", { defaultValue: "Error" }),
        t("help.error.noPhone", { defaultValue: "Phone support not available" })
      );
      return;
    }
    openUrl(`tel:${phone}`, "help_phone_pressed");
  }, [branding, openUrl, t]);

  const supportOptions: SupportOption[] = [
    {
      id: "help-center",
      icon: "help-circle",
      titleKey: "helpCenter",
      subtitleKey: "helpCenterDesc",
      color: colors.primary,
      action: handleHelpCenter,
    },
    {
      id: "email",
      icon: "email",
      titleKey: "email",
      subtitleKey: "emailDesc",
      color: "#EA4335",
      action: handleEmail,
    },
    ...(branding.whatsappNumber ? [{
      id: "whatsapp",
      icon: "whatsapp",
      titleKey: "whatsapp",
      subtitleKey: "whatsappDesc",
      color: "#25D366",
      action: handleWhatsApp,
    }] : []),
    ...(branding.supportPhone ? [{
      id: "phone",
      icon: "phone",
      titleKey: "phone",
      subtitleKey: "phoneDesc",
      color: "#4285F4",
      action: handlePhone,
    }] : []),
  ];

  const faqItems = [
    { id: "faq1", questionKey: "faq.resetPassword", answerKey: "faq.resetPasswordAnswer" },
    { id: "faq2", questionKey: "faq.offlineAccess", answerKey: "faq.offlineAccessAnswer" },
    { id: "faq3", questionKey: "faq.changeLanguage", answerKey: "faq.changeLanguageAnswer" },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <OfflineBanner />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Icon name="lifebuoy" size={48} color={colors.primary} />
          <AppText style={[styles.headerTitle, { color: colors.onSurface }]}>
            {t("help.title", { defaultValue: "How can we help?" })}
          </AppText>
          <AppText style={[styles.headerSubtitle, { color: colors.onSurfaceVariant }]}>
            {t("help.subtitle", { defaultValue: "Choose a support option below" })}
          </AppText>
        </View>

        {/* Support Options */}
        <View style={styles.section}>
          <AppText style={[styles.sectionTitle, { color: colors.onSurfaceVariant }]}>
            {t("help.contactUs", { defaultValue: "Contact Us" })}
          </AppText>
          <AppCard padding="none">
            {supportOptions.map((option, index) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionItem,
                  index < supportOptions.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: colors.outlineVariant,
                  },
                ]}
                onPress={option.action}
                activeOpacity={0.7}
              >
                <View style={[styles.optionIcon, { backgroundColor: option.color + "15" }]}>
                  <Icon name={option.icon} size={24} color={option.color} />
                </View>
                <View style={styles.optionContent}>
                  <AppText style={[styles.optionTitle, { color: colors.onSurface }]}>
                    {t(`help.options.${option.titleKey}`, { defaultValue: option.titleKey })}
                  </AppText>
                  <AppText style={[styles.optionSubtitle, { color: colors.onSurfaceVariant }]}>
                    {t(`help.options.${option.subtitleKey}`, { defaultValue: option.subtitleKey })}
                  </AppText>
                </View>
                <Icon name="chevron-right" size={20} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            ))}
          </AppCard>
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <AppText style={[styles.sectionTitle, { color: colors.onSurfaceVariant }]}>
            {t("help.faqTitle", { defaultValue: "Frequently Asked Questions" })}
          </AppText>
          <AppCard padding="sm">
            {faqItems.map((faq, index) => (
              <View
                key={faq.id}
                style={[
                  styles.faqItem,
                  index < faqItems.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: colors.outlineVariant,
                  },
                ]}
              >
                <View style={styles.faqQuestion}>
                  <Icon name="help-circle-outline" size={18} color={colors.primary} />
                  <AppText style={[styles.faqQuestionText, { color: colors.onSurface }]}>
                    {t(`help.${faq.questionKey}`, { defaultValue: faq.questionKey })}
                  </AppText>
                </View>
                <AppText style={[styles.faqAnswer, { color: colors.onSurfaceVariant }]}>
                  {t(`help.${faq.answerKey}`, { defaultValue: faq.answerKey })}
                </AppText>
              </View>
            ))}
          </AppCard>
        </View>

        {/* App Info */}
        <View style={[styles.appInfo, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}>
          <AppText style={[styles.appName, { color: colors.onSurface }]}>
            {branding.appName}
          </AppText>
          <AppText style={[styles.appVersion, { color: colors.onSurfaceVariant }]}>
            {t("help.version", { defaultValue: "Version" })} 1.0.0
          </AppText>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  content: { padding: 16 },
  header: { alignItems: "center", paddingVertical: 24 },
  headerTitle: { fontSize: 22, fontWeight: "700", marginTop: 12 },
  headerSubtitle: { fontSize: 14, marginTop: 4 },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  optionContent: { flex: 1 },
  optionTitle: { fontSize: 16, fontWeight: "600" },
  optionSubtitle: { fontSize: 13, marginTop: 2 },
  faqItem: { paddingVertical: 14 },
  faqQuestion: { flexDirection: "row", alignItems: "center", gap: 8 },
  faqQuestionText: { fontSize: 15, fontWeight: "600", flex: 1 },
  faqAnswer: { fontSize: 14, marginTop: 6, marginLeft: 26, lineHeight: 20 },
  appInfo: { alignItems: "center", padding: 16, marginTop: 8 },
  appName: { fontSize: 16, fontWeight: "600" },
  appVersion: { fontSize: 13, marginTop: 2 },
  bottomSpacer: { height: 32 },
});

export default HelpFeedbackScreen;
