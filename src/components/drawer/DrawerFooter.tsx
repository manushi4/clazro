/**
 * DrawerFooter Component
 * Footer with version info and logout button
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../theme/useAppTheme';
import { AppText } from '../../ui/components/AppText';
import { DrawerConfig } from '../../types/drawer.types';
import { useTranslation } from 'react-i18next';
import DeviceInfo from 'react-native-device-info';

type Props = {
  config: DrawerConfig;
  onLogout: () => void;
};

export const DrawerFooter: React.FC<Props> = ({ config, onLogout }) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();

  if (!config.footer_enabled) {
    return null;
  }

  const appVersion = DeviceInfo.getVersion();
  const buildNumber = DeviceInfo.getBuildNumber();

  return (
    <View
      style={[
        styles.container,
        { borderTopColor: colors.outlineVariant },
      ]}
    >
      {config.footer_show_version && (
        <View style={styles.versionContainer}>
          <AppText style={[styles.versionText, { color: colors.onSurfaceVariant }]}>
            v{appVersion} ({buildNumber})
          </AppText>
        </View>
      )}

      {config.footer_show_logout && (
        <TouchableOpacity
          onPress={onLogout}
          style={[
            styles.logoutButton,
            { backgroundColor: `${colors.error}10` },
          ]}
          activeOpacity={0.7}
        >
          <Icon name="logout" size={20} color={colors.error} />
          <AppText style={[styles.logoutText, { color: colors.error }]}>
            {t('common.logout')}
          </AppText>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  versionContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  versionText: {
    fontSize: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
