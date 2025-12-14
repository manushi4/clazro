/**
 * FilterDropdowns Component
 * Reusable dropdown filters for all screens
 */

import React from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, Pressable } from 'react-native';
import { Col, Row, T, Card, CardContent, Badge } from '../../ui';
import { Colors, Spacing } from '../../theme/designSystem';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterDropdownsProps {
  filters: {
    label: string;
    value: string;
    options: FilterOption[];
    onChange: (value: string) => void;
  }[];
  activeFilters?: { label: string; variant?: 'info' | 'error' | 'warning' | 'success' | 'default' }[];
  onClearAll?: () => void;
}

export const FilterDropdowns: React.FC<FilterDropdownsProps> = ({
  filters,
  activeFilters = [],
  onClearAll,
}) => {
  const [activeModalIndex, setActiveModalIndex] = React.useState<number | null>(null);

  return (
    <>
      <Card variant="outlined">
        <CardContent>
          <T variant="caption" color="textSecondary" style={{ marginBottom: Spacing.sm }}>
            Filters
          </T>
          <Row style={{ gap: Spacing.sm, flexWrap: 'wrap' }}>
            {filters.map((filter, index) => (
              <Pressable
                key={index}
                style={styles.filterDropdown}
                onPress={() => setActiveModalIndex(index)}
              >
                <View style={{ flex: 1 }}>
                  <T variant="caption" color="textSecondary">{filter.label}</T>
                  <T variant="body" weight="semiBold" style={{ marginTop: 2 }}>
                    {filter.value === 'all' ? 'All' : filter.options.find(o => o.value === filter.value)?.label || filter.value}
                  </T>
                </View>
                <T variant="body">▼</T>
              </Pressable>
            ))}
          </Row>

          {/* Active Filters Display */}
          {activeFilters.length > 0 && (
            <Row style={{ gap: Spacing.xs, marginTop: Spacing.sm, flexWrap: 'wrap' }}>
              {activeFilters.map((badge, index) => (
                <Badge
                  key={index}
                  variant={badge.variant || 'info'}
                  label={badge.label}
                />
              ))}
              {onClearAll && (
                <Pressable onPress={onClearAll} style={{ marginLeft: Spacing.xs }}>
                  <T variant="caption" color="primary" weight="semiBold">Clear All</T>
                </Pressable>
              )}
            </Row>
          )}
        </CardContent>
      </Card>

      {/* Filter Modals */}
      {filters.map((filter, index) => (
        <Modal
          key={index}
          visible={activeModalIndex === index}
          transparent
          animationType="fade"
          onRequestClose={() => setActiveModalIndex(null)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setActiveModalIndex(null)}
          >
            <View style={styles.modalContent}>
              <T variant="title" weight="bold" style={{ marginBottom: Spacing.md }}>
                Select {filter.label}
              </T>
              <Col gap="xs">
                {filter.options.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.modalOption,
                      filter.value === option.value && styles.modalOptionSelected
                    ]}
                    onPress={() => {
                      filter.onChange(option.value);
                      setActiveModalIndex(null);
                    }}
                  >
                    <T variant="body" weight={filter.value === option.value ? 'semiBold' : 'regular'}>
                      {option.label}
                    </T>
                    {filter.value === option.value && (
                      <T variant="body" color="primary">✓</T>
                    )}
                  </TouchableOpacity>
                ))}
              </Col>
            </View>
          </TouchableOpacity>
        </Modal>
      ))}
    </>
  );
};

const styles = StyleSheet.create({
  filterDropdown: {
    flex: 1,
    minWidth: 140,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 60,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: Spacing.lg,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    marginBottom: Spacing.xs,
  },
  modalOptionSelected: {
    backgroundColor: Colors.primaryLight || Colors.surface,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
});
