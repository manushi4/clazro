import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useQueryClient } from '@tanstack/react-query';
import { useAppTheme } from '../../theme/useAppTheme';
import { AppText } from '../../ui/components/AppText';
import { useDemoRoleStore } from '../../stores/demoRoleStore';
import { useConfigStore } from '../../stores/configStore';
import type { Role } from '../../types/permission.types';

const ROLES: { id: Role; label: string; icon: string }[] = [
  { id: 'student', label: 'Student', icon: 'school' },
  { id: 'parent', label: 'Parent', icon: 'account-child' },
  { id: 'teacher', label: 'Teacher', icon: 'human-male-board' },
  { id: 'admin', label: 'Admin', icon: 'shield-account' },
];

export const DevRoleSwitcher: React.FC = () => {
  const { colors, borderRadius } = useAppTheme();
  const { role, setRole } = useDemoRoleStore();
  const resetForRoleChange = useConfigStore((s) => s.resetForRoleChange);
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  const currentRole = ROLES.find((r) => r.id === role) || ROLES[0];

  const handleRoleSelect = (selectedRole: Role) => {
    if (selectedRole === role) {
      setIsOpen(false);
      return;
    }
    // Reset config store to trigger reload
    resetForRoleChange();
    // Invalidate navigation queries for new role
    queryClient.invalidateQueries({ queryKey: ['navigation-tabs'] });
    // Set new role
    setRole(selectedRole);
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating Button */}
      <TouchableOpacity
        style={[
          styles.fab,
          {
            backgroundColor: colors.tertiary,
            borderRadius: borderRadius.large,
          },
        ]}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.8}
      >
        <Icon name={currentRole.icon} size={24} color={colors.onTertiary} />
      </TouchableOpacity>

      {/* Role Selection Modal */}
      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setIsOpen(false)}>
          <View
            style={[
              styles.modal,
              {
                backgroundColor: colors.surface,
                borderRadius: borderRadius.large,
              },
            ]}
          >
            <AppText
              style={[styles.title, { color: colors.onSurface }]}
            >
              Switch Role
            </AppText>
            <AppText
              style={[styles.subtitle, { color: colors.onSurfaceVariant }]}
            >
              Select a role to test the app
            </AppText>

            <View style={styles.roleList}>
              {ROLES.map((r) => (
                <TouchableOpacity
                  key={r.id}
                  style={[
                    styles.roleItem,
                    {
                      backgroundColor:
                        role === r.id
                          ? colors.primaryContainer
                          : colors.surfaceVariant,
                      borderRadius: borderRadius.medium,
                    },
                  ]}
                  onPress={() => handleRoleSelect(r.id)}
                >
                  <Icon
                    name={r.icon}
                    size={28}
                    color={role === r.id ? colors.primary : colors.onSurfaceVariant}
                  />
                  <AppText
                    style={[
                      styles.roleLabel,
                      {
                        color:
                          role === r.id ? colors.primary : colors.onSurface,
                        fontWeight: role === r.id ? '600' : '400',
                      },
                    ]}
                  >
                    {r.label}
                  </AppText>
                  {role === r.id && (
                    <Icon name="check" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <AppText style={[styles.hint, { color: colors.onSurfaceVariant }]}>
              App will reload with selected role
            </AppText>
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    zIndex: 1000,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    width: '100%',
    maxWidth: 320,
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  roleList: {
    gap: 10,
    marginTop: 8,
  },
  roleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  roleLabel: {
    flex: 1,
    fontSize: 16,
  },
  hint: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
});
