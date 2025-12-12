/**
 * Profile Screen - User Profile Management
 * View and edit user profile information
 */

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { IconButton } from 'react-native-paper';
import type { ParentStackScreenProps } from '../../types/navigation';
import { T } from '../../ui/typography/T';
import { Col, Row } from '../../ui'; // ✅ Fixed: import from ui index
import { Card, CardContent, CardActions } from '../../ui/surfaces/Card';
import { ListItem } from '../../ui/lists/ListItem';
import { BaseScreen } from '../../shared/components/BaseScreen'; // ✅ Fixed: correct path
import { Colors, Spacing, Shadows } from '../../theme/designSystem';
import { useAuth } from '../../context/AuthContext';

type Props = ParentStackScreenProps<'Profile'>;

const ProfileScreen: React.FC<Props> = ({ route, navigation }) => {
  const { user } = useAuth();

  // Get user initials for avatar
  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
    : 'U';

  return (
    <BaseScreen scrollable>
      <Col sx={{ p: 'md' }}>
        {/* Profile Header Card */}
        <Card variant="elevated" style={styles.headerCard}>
          <CardContent>
            <Col centerH sx={{ py: 'lg' }}>
              {/* Avatar */}
              <View style={styles.avatar}>
                <T variant="headline" weight="bold" style={{ color: Colors.onPrimary, fontSize: 40 }}>
                  {initials}
                </T>
              </View>

              {/* User Info */}
              <T variant="title" weight="bold" align="center" sx={{ mt: 'base' }}>
                {user?.full_name || 'User'}
              </T>
              <T variant="body" color="textSecondary" align="center" sx={{ mt: 'xs' }}>
                {user?.email || 'user@example.com'}
              </T>

              {/* Role Badge */}
              <View style={styles.roleBadge}>
                <T variant="caption" weight="semiBold" style={{ color: Colors.onPrimary }}>
                  {user?.role?.toUpperCase() || 'PARENT'}
                </T>
              </View>
            </Col>
          </CardContent>
        </Card>

        {/* Account Section */}
        <T variant="body" weight="semiBold" color="textSecondary" sx={{ mt: 'lg', mb: 'sm', ml: 'xs' }}>
          ACCOUNT
        </T>
        <Card variant="elevated">
          <CardContent style={styles.listContainer}>
            <ListItem
              title="Edit Profile"
              subtitle="Update your personal information"
              leading={<IconButton icon="account-edit" size={24} iconColor={Colors.primary} />}
              trailing={<IconButton icon="chevron-right" size={24} iconColor={Colors.textSecondary} />}
              onPress={() => {
                console.log('Edit Profile pressed - TODO: Create EditProfileScreen');
              }}
            />
            <ListItem
              title="Change Password"
              subtitle="Update your account password"
              leading={<IconButton icon="lock-reset" size={24} iconColor={Colors.primary} />}
              trailing={<IconButton icon="chevron-right" size={24} iconColor={Colors.textSecondary} />}
              onPress={() => {
                console.log('Change Password pressed - TODO: Create ChangePasswordScreen');
              }}
            />
            <ListItem
              title="Notification Preferences"
              subtitle="Manage notification settings"
              leading={<IconButton icon="bell-cog" size={24} iconColor={Colors.primary} />}
              trailing={<IconButton icon="chevron-right" size={24} iconColor={Colors.textSecondary} />}
              onPress={() => {
                navigation.navigate('Settings');
              }}
            />
          </CardContent>
        </Card>

        {/* Personal Info Section */}
        <T variant="body" weight="semiBold" color="textSecondary" sx={{ mt: 'lg', mb: 'sm', ml: 'xs' }}>
          PERSONAL INFORMATION
        </T>
        <Card variant="elevated">
          <CardContent>
            <Col gap="base">
              <Row spaceBetween centerV>
                <T variant="body" color="textSecondary">Email</T>
                <T variant="body" weight="medium">{user?.email || 'Not provided'}</T>
              </Row>
              <Row spaceBetween centerV>
                <T variant="body" color="textSecondary">Phone</T>
                <T variant="body" weight="medium">{user?.phone || 'Not provided'}</T>
              </Row>
              <Row spaceBetween centerV>
                <T variant="body" color="textSecondary">User ID</T>
                <T variant="caption" weight="medium" color="textSecondary" numberOfLines={1}>
                  {user?.id || 'N/A'}
                </T>
              </Row>
              <Row spaceBetween centerV>
                <T variant="body" color="textSecondary">Role</T>
                <T variant="body" weight="medium">{user?.role || 'parent'}</T>
              </Row>
              <Row spaceBetween centerV>
                <T variant="body" color="textSecondary">Member Since</T>
                <T variant="body" weight="medium">
                  {user?.created_at
                    ? new Date(user.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })
                    : 'N/A'}
                </T>
              </Row>
            </Col>
          </CardContent>
        </Card>

        {/* App Info Section */}
        <T variant="body" weight="semiBold" color="textSecondary" sx={{ mt: 'lg', mb: 'sm', ml: 'xs' }}>
          APP INFORMATION
        </T>
        <Card variant="elevated">
          <CardContent style={styles.listContainer}>
            <ListItem
              title="App Version"
              subtitle="1.0.0 (Build 1)"
              leading={<IconButton icon="information" size={24} iconColor={Colors.primary} />}
            />
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
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.raised,
  },
  roleBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs,
    borderRadius: 16,
    marginTop: Spacing.sm,
  },
  listContainer: {
    paddingVertical: 0,
  },
});

export default ProfileScreen;
