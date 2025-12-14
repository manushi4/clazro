/**
 * Language Selection Screen
 * Allows users to choose between English and Hindi
 */

import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Alert } from 'react-native';
import { IconButton } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import type { ParentStackScreenProps } from '../../types/navigation';
import { T } from '../../ui/typography/T';
import { Col, Row } from '../../ui';
import { Card, CardContent } from '../../ui/surfaces/Card';
import { ListItem } from '../../ui/lists/ListItem';
import { BaseScreen } from '../../shared/components/BaseScreen';
import { Colors, Spacing } from '../../theme/designSystem';
import { saveLanguagePreference } from '../../i18n';

type Props = ParentStackScreenProps<'LanguageSelection'>;

interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

const languages: LanguageOption[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '<�<�',
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: '9?&@',
    flag: '<�<�',
  },
];

const LanguageSelectionScreen: React.FC<Props> = ({ route, navigation }) => {
  const { t, i18n } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);

  const handleLanguageSelect = async (languageCode: string) => {
    try {
      console.log('🌐 [LanguageSelection] Language selected:', languageCode);
      console.log('🌐 [LanguageSelection] Current language:', i18n.language);

      // Update i18n
      console.log('🌐 [LanguageSelection] Changing language...');
      await i18n.changeLanguage(languageCode);
      console.log('✅ [LanguageSelection] Language changed to:', languageCode);

      // Save preference
      console.log('💾 [LanguageSelection] Saving language preference...');
      await saveLanguagePreference(languageCode);
      console.log('✅ [LanguageSelection] Language preference saved');

      // Update local state
      setSelectedLanguage(languageCode);

      // Show success message
      Alert.alert(
        t('common.success'),
        t('language.changeLanguageConfirm'),
        [
          {
            text: t('common.done'),
            onPress: () => {
              console.log('🌐 [LanguageSelection] Going back to Settings');
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error) {
      console.error('❌ [LanguageSelection] Failed to change language:', error);
      Alert.alert(
        t('common.error'),
        'Failed to change language. Please try again.'
      );
    }
  };

  return (
    <BaseScreen scrollable>
      <Col sx={{ p: 'md' }}>
        {/* Header Info */}
        <Card variant="elevated" style={styles.headerCard}>
          <CardContent>
            <Col centerH sx={{ py: 'base' }}>
              <View style={styles.iconContainer}>
                <IconButton
                  icon="translate"
                  size={48}
                  iconColor={Colors.primary}
                />
              </View>
              <T variant="title" weight="bold" align="center" sx={{ mt: 'sm' }}>
                {t('language.title')}
              </T>
              <T variant="body" color="textSecondary" align="center" sx={{ mt: 'xs' }}>
                {t('language.subtitle')}
              </T>
            </Col>
          </CardContent>
        </Card>

        {/* Language Options */}
        <T variant="body" weight="semiBold" color="textSecondary" sx={{ mt: 'lg', mb: 'sm', ml: 'xs' }}>
          AVAILABLE LANGUAGES
        </T>
        <Card variant="elevated">
          <CardContent style={styles.listContainer}>
            {languages.map((lang) => {
              const isSelected = selectedLanguage === lang.code;
              return (
                <Pressable
                  key={lang.code}
                  onPress={() => handleLanguageSelect(lang.code)}
                  style={({ pressed }) => [
                    styles.languageItem,
                    isSelected && styles.languageItemSelected,
                    pressed && styles.languageItemPressed,
                  ]}
                  android_ripple={{
                    color: Colors.primary + '1F',
                    borderless: false,
                  }}
                >
                  <Row centerV style={styles.languageContent}>
                    {/* Flag */}
                    <T variant="headline" style={styles.flag}>
                      {lang.flag}
                    </T>

                    {/* Language Names */}
                    <Col flex={1} sx={{ ml: 'base' }}>
                      <T variant="body" weight="semiBold">
                        {lang.name}
                      </T>
                      <T variant="caption" color="textSecondary">
                        {lang.nativeName}
                      </T>
                    </Col>

                    {/* Selected Indicator */}
                    {isSelected && (
                      <IconButton
                        icon="check-circle"
                        size={24}
                        iconColor={Colors.primary}
                        style={{ margin: 0 }}
                      />
                    )}
                  </Row>
                </Pressable>
              );
            })}
          </CardContent>
        </Card>

        {/* Info Note */}
        <Card variant="elevated" style={styles.noteCard}>
          <CardContent>
            <Row centerV>
              <IconButton
                icon="information"
                size={20}
                iconColor={Colors.primary}
                style={{ margin: 0, marginRight: 8 }}
              />
              <T variant="caption" color="textSecondary" flex={1}>
                The language will be applied immediately and persisted across app restarts.
              </T>
            </Row>
          </CardContent>
        </Card>

        <View style={{ height: 24 }} />
      </Col>
    </BaseScreen>
  );
};

const styles = StyleSheet.create({
  headerCard: {
    marginBottom: Spacing.base,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingVertical: 0,
  },
  languageItem: {
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.base,
    borderRadius: 8,
    marginVertical: 4,
  },
  languageItemSelected: {
    backgroundColor: Colors.primaryContainer,
  },
  languageItemPressed: {
    opacity: 0.7,
  },
  languageContent: {
    width: '100%',
  },
  flag: {
    fontSize: 32,
  },
  noteCard: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.primaryContainer + '40',
  },
});

export default LanguageSelectionScreen;
