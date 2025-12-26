/**
 * DrawerHeader Component
 * Header section with avatar/logo and user info
 */

import React from 'react';
import { View, StyleSheet, Image, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../theme/useAppTheme';
import { useBranding } from '../../context/BrandingContext';
import { useAuthStore } from '../../stores/authStore';
import { useDemoRoleStore } from '../../stores/demoRoleStore';
import { AppText } from '../../ui/components/AppText';
import { DrawerConfig } from '../../types/drawer.types';
import { useTranslation } from 'react-i18next';

type Props = {
  config: DrawerConfig;
  onClose?: () => void;
};

export const DrawerHeader: React.FC<Props> = ({ config, onClose }) => {
  const { colors } = useAppTheme();
  const branding = useBranding();
  const user = useAuthStore((state) => state.user);
  const role = useDemoRoleStore((state) => state.role);
  const { t } = useTranslation();

  const renderAvatarContent = () => (
    <View style={styles.avatarContainer}>
      {user?.avatar_url ? (
        <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
      ) : (
        <View
          style={[
            styles.avatarPlaceholder,
            { backgroundColor: `${colors.onPrimary}30` },
          ]}
        >
          <AppText style={[styles.avatarInitial, { color: colors.onPrimary }]}>
            {user?.display_name?.[0]?.toUpperCase() || 'U'}
          </AppText>
        </View>
      )}

      <AppText style={[styles.userName, { color: colors.onPrimary }]}>
        {user?.display_name || t('common.user')}
      </AppText>

      {config.header_show_role && role && (
        <View
          style={[styles.roleBadge, { backgroundColor: `${colors.onPrimary}20` }]}
        >
          <AppText style={[styles.roleText, { color: colors.onPrimary }]}>
            {role.toUpperCase()}
          </AppText>
        </View>
      )}

      {config.header_show_email && user?.email && (
        <AppText style={[styles.email, { color: `${colors.onPrimary}80` }]}>
          {user.email}
        </AppText>
      )}
    </View>
  );

  const renderLogoContent = () => (
    <View style={styles.logoContainer}>
      {branding?.logoUrl ? (
        <Image
          source={{ uri: branding.logoUrl }}
          style={styles.logo}
          resizeMode="contain"
        />
      ) : (
        <AppText style={[styles.appName, { color: colors.onPrimary }]}>
          {branding?.appName || 'App'}
        </AppText>
      )}
    </View>
  );

  const renderCompactContent = () => (
    <View style={styles.compactContainer}>
      <View
        style={[
          styles.compactAvatar,
          { backgroundColor: `${colors.onPrimary}30` },
        ]}
      >
        {user?.avatar_url ? (
          <Image
            source={{ uri: user.avatar_url }}
            style={styles.compactAvatarImage}
          />
        ) : (
          <AppText style={{ color: colors.onPrimary, fontWeight: 'bold' }}>
            {user?.display_name?.[0]?.toUpperCase() || 'U'}
          </AppText>
        )}
      </View>

      <View style={styles.compactInfo}>
        <AppText style={[styles.compactName, { color: colors.onPrimary }]}>
          {user?.display_name || t('common.user')}
        </AppText>
        {config.header_show_role && role && (
          <AppText
            style={[styles.compactRole, { color: `${colors.onPrimary}80` }]}
          >
            {role}
          </AppText>
        )}
      </View>

      {onClose && (
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Icon name="close" size={24} color={colors.onPrimary} />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderContent = () => {
    switch (config.header_style) {
      case 'avatar':
        return renderAvatarContent();
      case 'logo':
        return renderLogoContent();
      case 'compact':
        return renderCompactContent();
      default:
        return null;
    }
  };

  const renderBackground = () => {
    const content = renderContent();
    const height = config.header_height || 180;

    // All background styles use View (gradient effect achieved with primary color)
    const bgColor =
      config.header_background_style === 'none'
        ? colors.surface
        : colors.primary;

    return (
      <View style={[styles.headerBg, { height, backgroundColor: bgColor }]}>
        {content}
      </View>
    );
  };

  if (config.header_style === 'none') {
    return null;
  }

  return renderBackground();
};

const styles = StyleSheet.create({
  headerBg: {
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  avatarContainer: {
    alignItems: 'flex-start',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  email: {
    fontSize: 13,
    marginTop: 4,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  logo: {
    width: 120,
    height: 60,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  compactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  compactAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  compactInfo: {
    flex: 1,
  },
  compactName: {
    fontSize: 16,
    fontWeight: '600',
  },
  compactRole: {
    fontSize: 12,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  closeButton: {
    padding: 8,
  },
});
