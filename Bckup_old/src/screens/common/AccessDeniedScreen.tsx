/**
 * Access Denied Screen
 * Shown when admin tries to access a feature they don't have permission for
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { T } from '../../ui/typography/T';
import { Colors, Spacing } from '../../theme/designSystem';
import { navigationRef } from '../../utils/navigationService';
import { trackAction } from '../../utils/navigationAnalytics';

interface AccessDeniedScreenProps {
  message?: string;
  requiredPermission?: string;
}

const AccessDeniedScreen: React.FC<AccessDeniedScreenProps> = ({
  message = 'You do not have permission to access this feature.',
  requiredPermission,
}) => {
  React.useEffect(() => {
    trackAction('access_denied_shown', 'AccessDenied', { requiredPermission });
  }, [requiredPermission]);

  const handleGoBack = () => {
    trackAction('access_denied_go_back', 'AccessDenied');
    // Go back in navigation stack
    if (navigationRef.canGoBack()) {
      navigationRef.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Icon */}
        <T variant="display" style={styles.icon}>
          🔒
        </T>

        {/* Title */}
        <T variant="headline" weight="bold" align="center" style={styles.title}>
          Access Denied
        </T>

        {/* Message */}
        <T variant="body" align="center" color="textSecondary" style={styles.message}>
          {message}
        </T>

        {/* Permission Info */}
        {requiredPermission && (
          <View style={styles.permissionBox}>
            <T variant="caption" color="textSecondary">
              Required Permission:
            </T>
            <T variant="body" weight="semiBold" style={styles.permissionText}>
              {requiredPermission.replace(/_/g, ' ').toUpperCase()}
            </T>
          </View>
        )}

        {/* Action */}
        <Button
          mode="contained"
          onPress={handleGoBack}
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          Return to Dashboard
        </Button>

        {/* Help Text */}
        <T variant="caption" align="center" color="textSecondary" style={styles.helpText}>
          Contact your system administrator to request access
        </T>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
  },
  icon: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  title: {
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  message: {
    marginBottom: Spacing.xl,
  },
  permissionBox: {
    backgroundColor: Colors.surface,
    padding: Spacing.base,
    borderRadius: 8,
    marginBottom: Spacing.xl,
    width: '100%',
    alignItems: 'center',
  },
  permissionText: {
    color: Colors.error,
    marginTop: Spacing.xs,
  },
  button: {
    width: '100%',
    marginBottom: Spacing.base,
  },
  buttonContent: {
    paddingVertical: Spacing.sm,
  },
  helpText: {
    marginTop: Spacing.base,
  },
});

export default AccessDeniedScreen;
