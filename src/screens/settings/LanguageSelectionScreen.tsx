/**
 * Language Selection Screen - Fixed Screen
 * 
 * Simple language picker for English/Hindi.
 * Persists selection to AsyncStorage and updates i18n.
 */

import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useAppTheme } from "../../theme/useAppTheme";
import { useAnalytics } from "../../hooks/useAnalytics";
import { AppText } from "../../ui/components/AppText";

// Alias trackEvent as trackAction for readability
const useSettingsAnalytics = () => {
  const { trackScreenView, trackEvent } = useAnalytics();
  return { trackScreenView, trackAction: trackEvent };
};
import { AppCard } from "../../ui/components/AppCard";
import { BrandedHeader } from "../../components/branding/BrandedHeader";

const LANGUAGE_STORAGE_KEY = "@settings/language";

type Language = {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
};

const LANGUAGES: Language[] = [
  {
    code: "en",
    name: "English",
    nativeName: "English",
    flag: "🇺🇸",
  },
  {
    code: "hi",
    name: "Hindi",
    nativeName: "हिंदी",
    flag: "🇮🇳",
  },
];

export const LanguageSelectionScreen: React.FC = () => {
  const { colors, borderRadius } = useAppTheme();
  const { t, i18n } = useTranslation("settings");
  const { trackScreenView, trackAction } = useSettingsAnalytics();
  const navigation = useNavigation();

  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);
  const [isChanging, setIsChanging] = useState(false);

  React.useEffect(() => {
    trackScreenView("language_selection");
  }, []);

  const handleLanguageSelect = useCallback(
    async (languageCode: string) => {
      if (languageCode === selectedLanguage || isChanging) return;

      setIsChanging(true);
      trackAction("language_changed", { from: selectedLanguage, to: languageCode });

      try {
        // Update i18n
        await i18n.changeLanguage(languageCode);

        // Persist to storage
        await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, languageCode);

        setSelectedLanguage(languageCode);

        // Go back after successful change
        setTimeout(() => {
          navigation.goBack();
        }, 300);
      } catch (error) {
        console.error("Failed to change language:", error);
      } finally {
        setIsChanging(false);
      }
    },
    [selectedLanguage, isChanging, i18n, navigation]
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <BrandedHeader
        title={t("language.screenTitle", { defaultValue: "Select Language" })}
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      <View style={styles.content}>
        <AppText style={[styles.description, { color: colors.onSurfaceVariant }]}>
          {t("language.description", {
            defaultValue: "Choose your preferred language for the app",
          })}
        </AppText>

        <AppCard padding="sm">
          {LANGUAGES.map((language, index) => {
            const isSelected = selectedLanguage === language.code;
            const isLast = index === LANGUAGES.length - 1;

            return (
              <TouchableOpacity
                key={language.code}
                style={[
                  styles.languageItem,
                  !isLast && { borderBottomColor: colors.outlineVariant },
                  !isLast && styles.languageItemBorder,
                ]}
                onPress={() => handleLanguageSelect(language.code)}
                disabled={isChanging}
                activeOpacity={0.7}
              >
                <View style={styles.languageInfo}>
                  <AppText style={styles.flag}>{language.flag}</AppText>
                  <View style={styles.languageText}>
                    <AppText style={[styles.languageName, { color: colors.onSurface }]}>
                      {language.nativeName}
                    </AppText>
                    <AppText style={[styles.languageSubtitle, { color: colors.onSurfaceVariant }]}>
                      {language.name}
                    </AppText>
                  </View>
                </View>

                {isChanging && isSelected ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : isSelected ? (
                  <View style={[styles.checkCircle, { backgroundColor: colors.primary }]}>
                    <Icon name="check" size={16} color={colors.onPrimary} />
                  </View>
                ) : (
                  <View
                    style={[
                      styles.emptyCircle,
                      { borderColor: colors.outline },
                    ]}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </AppCard>

        <AppText style={[styles.note, { color: colors.onSurfaceVariant }]}>
          {t("language.note", {
            defaultValue: "The app will restart to apply the language change.",
          })}
        </AppText>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  description: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: "center",
  },
  languageItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  languageItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  languageInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  flag: {
    fontSize: 28,
    marginRight: 12,
  },
  languageText: {
    gap: 2,
  },
  languageName: {
    fontSize: 17,
    fontWeight: "600",
  },
  languageSubtitle: {
    fontSize: 13,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
  },
  note: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 16,
    fontStyle: "italic",
  },
});

export default LanguageSelectionScreen;
