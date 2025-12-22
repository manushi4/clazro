/**
 * QuickCreateWidget - Admin Quick Create Organization Entity
 *
 * Provides quick action buttons to create organization entities:
 * - Organization (root level)
 * - Department (under organization)
 * - Class (under department)
 * - Batch (under class)
 *
 * Widget ID: org.quick-create
 * Category: actions
 * Roles: admin, super_admin
 *
 * Phase 1: Database - organizations table (existing)
 * Phase 2: Mutation Hook - useCreateOrganization
 * Phase 3: Widget Component - This file
 * Phase 4: Translations - admin.json (EN/HI)
 * Phase 5: Widget Registry - src/config/widgetRegistry.ts
 * Phase 6: Platform Studio - platform-studio/src/config/widgetRegistry.ts
 * Phase 7: Database - Test creation
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';

import { useAppTheme } from '../../../../theme/useAppTheme';
import { AppText } from '../../../../ui/components/AppText';
import { AppCard } from '../../../../ui/components/AppCard';
import { useCreateOrganization, OrgEntityType } from '../../../../hooks/mutations/admin/useCreateOrganization';
import { useOrgTreeQuery, ORG_TYPE_CONFIG } from '../../../../hooks/queries/admin/useOrgTreeQuery';
import type { WidgetProps } from '../../../../types/widget.types';

type QuickCreateConfig = {
  showOrganization?: boolean;
  showDepartment?: boolean;
  showClass?: boolean;
  showBatch?: boolean;
  compactMode?: boolean;
  columns?: number;
  showDescription?: boolean;
  enableTap?: boolean;
};

type EntityOption = {
  type: OrgEntityType;
  icon: string;
  color: string;
  requiresParent: boolean;
  parentType: OrgEntityType | null;
};

const ENTITY_OPTIONS: EntityOption[] = [
  { type: 'organization', icon: 'domain', color: 'primary', requiresParent: false, parentType: null },
  { type: 'department', icon: 'office-building', color: 'secondary', requiresParent: true, parentType: 'organization' },
  { type: 'class', icon: 'google-classroom', color: 'tertiary', requiresParent: true, parentType: 'department' },
  { type: 'batch', icon: 'account-group', color: 'success', requiresParent: true, parentType: 'class' },
];

export const QuickCreateWidget: React.FC<WidgetProps> = ({
  config,
  onNavigate,
}) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation('admin');

  const widgetConfig: QuickCreateConfig = {
    showOrganization: true,
    showDepartment: true,
    showClass: true,
    showBatch: true,
    compactMode: false,
    columns: 2,
    showDescription: true,
    enableTap: true,
    ...config,
  };

  const createMutation = useCreateOrganization();
  const { data: orgData } = useOrgTreeQuery();

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState<OrgEntityType | null>(null);
  const [entityName, setEntityName] = useState('');
  const [entityDescription, setEntityDescription] = useState('');
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);

  // Get color from theme
  const getThemeColor = useCallback(
    (colorKey: string): string => {
      const colorMap: Record<string, string> = {
        primary: colors.primary,
        secondary: colors.secondary,
        tertiary: colors.tertiary || '#9C27B0',
        success: colors.success || '#4CAF50',
        warning: colors.warning || '#FF9800',
        error: colors.error,
      };
      return colorMap[colorKey] || colors.primary;
    },
    [colors]
  );

  // Get available parents for a type
  const getAvailableParents = useCallback(
    (type: OrgEntityType) => {
      const option = ENTITY_OPTIONS.find((o) => o.type === type);
      if (!option?.parentType || !orgData?.tree) return [];

      const parents: { id: string; name: string }[] = [];
      const collectParents = (nodes: any[], targetType: OrgEntityType) => {
        nodes.forEach((node) => {
          if (node.type === targetType) {
            parents.push({ id: node.id, name: node.name });
          }
          if (node.children) {
            collectParents(node.children, targetType);
          }
        });
      };
      collectParents(orgData.tree, option.parentType);
      return parents;
    },
    [orgData]
  );

  const handleOpenModal = useCallback((type: OrgEntityType) => {
    setSelectedType(type);
    setEntityName('');
    setEntityDescription('');
    setSelectedParentId(null);
    setModalVisible(true);
  }, []);

  const handleCreate = useCallback(async () => {
    if (!selectedType || !entityName.trim()) {
      Alert.alert(
        t('widgets.quickCreate.error', { defaultValue: 'Error' }),
        t('widgets.quickCreate.nameRequired', { defaultValue: 'Please enter a name' })
      );
      return;
    }

    const option = ENTITY_OPTIONS.find((o) => o.type === selectedType);
    if (option?.requiresParent && !selectedParentId) {
      Alert.alert(
        t('widgets.quickCreate.error', { defaultValue: 'Error' }),
        t('widgets.quickCreate.parentRequired', {
          type: selectedType,
          defaultValue: `Please select a parent for this ${selectedType}`,
        })
      );
      return;
    }

    const result = await createMutation.mutateAsync({
      name: entityName.trim(),
      type: selectedType,
      description: entityDescription.trim() || undefined,
      parentId: selectedParentId,
    });

    if (result.success) {
      setModalVisible(false);
      Alert.alert(
        t('widgets.quickCreate.success', { defaultValue: 'Success' }),
        result.message
      );
    } else {
      Alert.alert(
        t('widgets.quickCreate.error', { defaultValue: 'Error' }),
        result.message
      );
    }
  }, [selectedType, entityName, entityDescription, selectedParentId, createMutation, t]);

  const handleViewAll = useCallback(() => {
    onNavigate?.('org-management');
  }, [onNavigate]);

  // Filter visible entity types based on config
  const visibleOptions = ENTITY_OPTIONS.filter((option) => {
    switch (option.type) {
      case 'organization':
        return widgetConfig.showOrganization;
      case 'department':
        return widgetConfig.showDepartment;
      case 'class':
        return widgetConfig.showClass;
      case 'batch':
        return widgetConfig.showBatch;
      default:
        return true;
    }
  });

  const availableParents = selectedType ? getAvailableParents(selectedType) : [];
  const selectedOption = selectedType
    ? ENTITY_OPTIONS.find((o) => o.type === selectedType)
    : null;

  return (
    <AppCard style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <AppText style={[styles.title, { color: colors.onSurface }]}>
            {t('widgets.quickCreate.title', { defaultValue: 'Quick Create' })}
          </AppText>
          {widgetConfig.showDescription && (
            <AppText style={[styles.subtitle, { color: colors.onSurfaceVariant }]}>
              {t('widgets.quickCreate.subtitle', { defaultValue: 'Add new organization entities' })}
            </AppText>
          )}
        </View>
        <TouchableOpacity onPress={handleViewAll}>
          <AppText style={[styles.viewAll, { color: colors.primary }]}>
            {t('common:actions.viewAll', { defaultValue: 'View All' })}
          </AppText>
        </TouchableOpacity>
      </View>

      {/* Action Buttons Grid */}
      <View
        style={[
          styles.actionsGrid,
          { flexDirection: widgetConfig.compactMode ? 'row' : 'column' },
        ]}
      >
        {visibleOptions.map((option) => {
          const optionColor = getThemeColor(option.color);
          const typeConfig = ORG_TYPE_CONFIG[option.type];

          return (
            <TouchableOpacity
              key={option.type}
              style={[
                styles.actionButton,
                {
                  backgroundColor: `${optionColor}15`,
                  borderColor: `${optionColor}30`,
                  borderRadius: borderRadius.md,
                },
                widgetConfig.compactMode && styles.actionButtonCompact,
              ]}
              onPress={() => handleOpenModal(option.type)}
              disabled={!widgetConfig.enableTap}
              activeOpacity={0.7}
              accessibilityLabel={t('widgets.quickCreate.createHint', {
                type: typeConfig.label,
                defaultValue: `Create new ${typeConfig.label}`,
              })}
              accessibilityRole="button"
            >
              <View style={[styles.iconContainer, { backgroundColor: `${optionColor}25` }]}>
                <Icon name={option.icon} size={24} color={optionColor} />
              </View>
              <View style={styles.actionInfo}>
                <AppText style={[styles.actionTitle, { color: colors.onSurface }]}>
                  {t(`widgets.quickCreate.types.${option.type}`, {
                    defaultValue: typeConfig.label,
                  })}
                </AppText>
                <AppText style={[styles.actionSubtitle, { color: colors.onSurfaceVariant }]}>
                  {t(`widgets.quickCreate.typeDescriptions.${option.type}`, {
                    defaultValue: `Add new ${typeConfig.label.toLowerCase()}`,
                  })}
                </AppText>
              </View>
              <Icon name="plus-circle" size={20} color={optionColor} />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Create Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <AppText style={[styles.modalTitle, { color: colors.onSurface }]}>
                {t('widgets.quickCreate.createTitle', {
                  type: selectedOption ? ORG_TYPE_CONFIG[selectedOption.type].label : '',
                  defaultValue: `Create ${selectedOption ? ORG_TYPE_CONFIG[selectedOption.type].label : ''}`,
                })}
              </AppText>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="close" size={24} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>

            {/* Name Input */}
            <View style={styles.inputGroup}>
              <AppText style={[styles.inputLabel, { color: colors.onSurface }]}>
                {t('widgets.quickCreate.nameLabel', { defaultValue: 'Name' })} *
              </AppText>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.surfaceVariant,
                    color: colors.onSurface,
                    borderRadius: borderRadius.sm,
                  },
                ]}
                value={entityName}
                onChangeText={setEntityName}
                placeholder={t('widgets.quickCreate.namePlaceholder', {
                  defaultValue: 'Enter name...',
                })}
                placeholderTextColor={colors.onSurfaceVariant}
              />
            </View>

            {/* Description Input */}
            <View style={styles.inputGroup}>
              <AppText style={[styles.inputLabel, { color: colors.onSurface }]}>
                {t('widgets.quickCreate.descriptionLabel', { defaultValue: 'Description' })}
              </AppText>
              <TextInput
                style={[
                  styles.textInput,
                  styles.textArea,
                  {
                    backgroundColor: colors.surfaceVariant,
                    color: colors.onSurface,
                    borderRadius: borderRadius.sm,
                  },
                ]}
                value={entityDescription}
                onChangeText={setEntityDescription}
                placeholder={t('widgets.quickCreate.descriptionPlaceholder', {
                  defaultValue: 'Enter description (optional)...',
                })}
                placeholderTextColor={colors.onSurfaceVariant}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Parent Selection (if required) */}
            {selectedOption?.requiresParent && (
              <View style={styles.inputGroup}>
                <AppText style={[styles.inputLabel, { color: colors.onSurface }]}>
                  {t('widgets.quickCreate.parentLabel', {
                    type: selectedOption.parentType,
                    defaultValue: `Select ${selectedOption.parentType}`,
                  })} *
                </AppText>
                {availableParents.length === 0 ? (
                  <AppText style={[styles.noParentsText, { color: colors.error }]}>
                    {t('widgets.quickCreate.noParents', {
                      type: selectedOption.parentType,
                      defaultValue: `No ${selectedOption.parentType}s available. Create one first.`,
                    })}
                  </AppText>
                ) : (
                  <View style={styles.parentOptions}>
                    {availableParents.map((parent) => (
                      <TouchableOpacity
                        key={parent.id}
                        style={[
                          styles.parentOption,
                          {
                            backgroundColor:
                              selectedParentId === parent.id
                                ? `${colors.primary}20`
                                : colors.surfaceVariant,
                            borderColor:
                              selectedParentId === parent.id
                                ? colors.primary
                                : 'transparent',
                            borderRadius: borderRadius.sm,
                          },
                        ]}
                        onPress={() => setSelectedParentId(parent.id)}
                      >
                        <AppText
                          style={[
                            styles.parentOptionText,
                            {
                              color:
                                selectedParentId === parent.id
                                  ? colors.primary
                                  : colors.onSurface,
                            },
                          ]}
                        >
                          {parent.name}
                        </AppText>
                        {selectedParentId === parent.id && (
                          <Icon name="check" size={18} color={colors.primary} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.cancelButton,
                  { borderColor: colors.outline, borderRadius: borderRadius.sm },
                ]}
                onPress={() => setModalVisible(false)}
              >
                <AppText style={[styles.cancelButtonText, { color: colors.onSurface }]}>
                  {t('common:actions.cancel', { defaultValue: 'Cancel' })}
                </AppText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.createButton,
                  {
                    backgroundColor: colors.primary,
                    borderRadius: borderRadius.sm,
                    opacity: createMutation.isPending ? 0.7 : 1,
                  },
                ]}
                onPress={handleCreate}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <AppText style={styles.createButtonText}>
                    {t('common:actions.create', { defaultValue: 'Create' })}
                  </AppText>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </AppCard>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  viewAll: {
    fontSize: 14,
    fontWeight: '500',
  },
  actionsGrid: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderWidth: 1,
    gap: 12,
  },
  actionButtonCompact: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    padding: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  actionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  textInput: {
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  noParentsText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  parentOptions: {
    gap: 8,
  },
  parentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
  },
  parentOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  createButton: {},
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default QuickCreateWidget;
