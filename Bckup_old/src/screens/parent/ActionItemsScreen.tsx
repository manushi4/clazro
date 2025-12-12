/**
 * ActionItemsScreen
 * View all action items and tasks for parents to complete
 *
 * Features:
 * - Real-time action items from Supabase
 * - Filter by status (All, Pending, Completed)
 * - Filter by type (8 types)
 * - Filter by priority (4 levels)
 * - Mark items as complete
 * - Show overdue/due soon indicators
 * - Navigate to action item detail
 * - Pull to refresh
 */

import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { BaseScreen } from '../../shared/components/BaseScreen';
import { Col, Row, T, Card, CardContent, Badge, Button } from '../../ui';
import { Colors, Spacing } from '../../theme/designSystem';
import { FilterDropdowns } from '../../components/common/FilterDropdowns';
import type { ParentStackParamList } from '../../types/navigation';
import { trackScreenView, trackAction } from '../../utils/navigationAnalytics';
import { safeNavigate } from '../../utils/navigationService';

type Props = NativeStackScreenProps<ParentStackParamList, 'ActionItems'>;

type StatusFilter = 'all' | 'pending' | 'completed';
type TypeFilter = 'all' | 'form_to_fill' | 'permission_needed' | 'fee_payment' | 'meeting_rsvp' | 'document_submission' | 'consent_required' | 'feedback_request' | 'general';
type PriorityFilter = 'all' | 'urgent' | 'high' | 'medium' | 'low';
type Priority = 'low' | 'medium' | 'high' | 'urgent';
type Status = 'pending' | 'in_progress' | 'completed' | 'cancelled';
type ItemType = Exclude<TypeFilter, 'all'>;

interface ActionItem {
  id: string;
  user_id: string;
  student_id: string | null;
  title: string;
  description: string | null;
  type: ItemType;
  priority: Priority;
  status: Status;
  completed_at: string | null;
  due_date: string | null;
  action_url: string | null;
  assigned_by: string | null;
  created_at: string;
}

const ActionItemsScreen: React.FC<Props> = () => {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const queryClient = useQueryClient();

  // Track screen view
  useEffect(() => {
    trackScreenView('ActionItems', { from: 'Dashboard' });
  }, []);

  // Get current user
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);
    };
    getUser();
  }, []);

  // Fetch action items
  const {
    data: actionItems = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['action_items', userId],
    queryFn: async () => {
      if (!userId) return [];

      console.log('🔍 [ActionItems] Fetching action items for user', userId);
      const { data, error } = await supabase
        .from('action_items')
        .select('*')
        .eq('user_id', userId)
        .order('status', { ascending: true })
        .order('due_date', { ascending: true, nullsFirst: false });

      if (error) {
        console.error('❌ [ActionItems] Error:', error);
        throw error;
      }

      console.log('✅ [ActionItems] Loaded', data?.length || 0, 'action items');
      return data as ActionItem[];
    },
    staleTime: 1000 * 60 * 3, // 3 minutes
    enabled: !!userId,
  });

  // Mark as complete mutation
  const markAsCompleteMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('action_items')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['action_items', userId] });
    },
    onError: (error) => {
      console.error('❌ [ActionItems] Mark as complete failed:', error);
      Alert.alert('Error', 'Failed to mark action item as complete');
    },
  });

  // Filter action items
  const filteredItems = useMemo(() => {
    let filtered = actionItems;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(item => item.type === typeFilter);
    }

    // Filter by priority
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(item => item.priority === priorityFilter);
    }

    return filtered;
  }, [actionItems, statusFilter, typeFilter, priorityFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = actionItems.length;
    const pending = actionItems.filter(item => item.status === 'pending').length;
    const completed = actionItems.filter(item => item.status === 'completed').length;
    const overdue = actionItems.filter(
      item =>
        item.status === 'pending' &&
        item.due_date &&
        new Date(item.due_date) < new Date()
    ).length;
    const dueSoon = actionItems.filter(
      item =>
        item.status === 'pending' &&
        item.due_date &&
        getDaysRemaining(item.due_date) >= 0 &&
        getDaysRemaining(item.due_date) <= 3
    ).length;

    return { total, pending, completed, overdue, dueSoon };
  }, [actionItems]);

  // Get priority color
  const getPriorityColor = (priority: Priority): string => {
    switch (priority) {
      case 'urgent':
        return Colors.error;
      case 'high':
        return Colors.warning;
      case 'medium':
        return Colors.primary;
      case 'low':
        return Colors.success;
      default:
        return Colors.textSecondary;
    }
  };

  // Get type label
  const getTypeLabel = (type: ItemType): string => {
    const labels: Record<ItemType, string> = {
      form_to_fill: '📝 Form to Fill',
      permission_needed: '✅ Permission',
      fee_payment: '💰 Fee Payment',
      meeting_rsvp: '📅 Meeting RSVP',
      document_submission: '📄 Document',
      consent_required: '🖊️ Consent',
      feedback_request: '💬 Feedback',
      general: '📋 General',
    };
    return labels[type] || type;
  };

  // Get days remaining
  const getDaysRemaining = (dueDateString: string): number => {
    const dueDate = new Date(dueDateString);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Get deadline badge
  const getDeadlineBadge = (item: ActionItem) => {
    if (!item.due_date || item.status === 'completed') return null;

    const daysRemaining = getDaysRemaining(item.due_date);

    if (daysRemaining < 0) {
      return { label: `Overdue by ${Math.abs(daysRemaining)}d`, variant: 'error' as const };
    } else if (daysRemaining === 0) {
      return { label: 'Due today', variant: 'error' as const };
    } else if (daysRemaining <= 3) {
      return { label: `Due in ${daysRemaining}d`, variant: 'warning' as const };
    } else {
      return { label: `${daysRemaining} days left`, variant: 'info' as const };
    }
  };

  // Handle item tap
  const handleItemTap = (item: ActionItem) => {
    trackAction('tap_action_item', 'ActionItems', {
      type: item.type,
      priority: item.priority,
      status: item.status,
    });

    // Navigate to action item detail
    safeNavigate('ActionItemDetail', { itemId: item.id });
  };

  // Handle mark as complete
  const handleMarkComplete = (item: ActionItem) => {
    Alert.alert(
      'Mark as Complete',
      `Mark "${item.title}" as completed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete',
          onPress: () => {
            markAsCompleteMutation.mutate(item.id);
            trackAction('mark_action_item_complete', 'ActionItems', {
              type: item.type,
              priority: item.priority,
            });
          },
        },
      ]
    );
  };

  return (
    <BaseScreen
      scrollable={true}
      loading={isLoading}
      error={error ? 'Failed to load action items' : null}
      empty={!isLoading && actionItems.length === 0}
      emptyBody="No action items yet. You'll see tasks and to-dos from school here."
      onRetry={refetch}
    >
      <Col sx={{ p: 'md' }} gap="md">
        {/* Header & Stats Card */}
        <Card variant="elevated">
          <CardContent>
            <Row spaceBetween centerV style={{ marginBottom: Spacing.sm }}>
              <T variant="title" weight="bold">
                Action Items
              </T>
              {stats.pending > 0 && (
                <Badge variant="error" label={`${stats.pending} pending`} />
              )}
            </Row>

            {/* Stats Summary */}
            <Row spaceBetween style={{ marginTop: Spacing.md }}>
              <View style={styles.statBox}>
                <T variant="display" weight="bold" style={{ fontSize: 24, color: Colors.primary }}>
                  {stats.total}
                </T>
                <T variant="caption" color="textSecondary">Total</T>
              </View>

              <View style={styles.statBox}>
                <T variant="display" weight="bold" style={{ fontSize: 24, color: Colors.warning }}>
                  {stats.pending}
                </T>
                <T variant="caption" color="textSecondary">Pending</T>
              </View>

              <View style={styles.statBox}>
                <T variant="display" weight="bold" style={{ fontSize: 24, color: Colors.success }}>
                  {stats.completed}
                </T>
                <T variant="caption" color="textSecondary">Done</T>
              </View>

              {stats.overdue > 0 && (
                <View style={styles.statBox}>
                  <T variant="display" weight="bold" style={{ fontSize: 24, color: Colors.error }}>
                    {stats.overdue}
                  </T>
                  <T variant="caption" color="textSecondary">Overdue</T>
                </View>
              )}
            </Row>
          </CardContent>
        </Card>

        {/* Filters */}
        <FilterDropdowns
          filters={[
            {
              label: 'Status',
              value: statusFilter,
              options: [
                { value: 'all', label: 'All' },
                { value: 'pending', label: 'Pending' },
                { value: 'completed', label: 'Completed' },
              ],
              onChange: (value) => {
                setStatusFilter(value as StatusFilter);
                trackAction('filter_status', 'ActionItems', { filter: value });
              },
            },
            {
              label: 'Priority',
              value: priorityFilter,
              options: [
                { value: 'all', label: 'All' },
                { value: 'urgent', label: 'Urgent' },
                { value: 'high', label: 'High' },
                { value: 'medium', label: 'Medium' },
                { value: 'low', label: 'Low' },
              ],
              onChange: (value) => {
                setPriorityFilter(value as PriorityFilter);
                trackAction('filter_priority', 'ActionItems', { priority: value });
              },
            },
            {
              label: 'Type',
              value: typeFilter,
              options: [
                { value: 'all', label: 'All Types' },
                { value: 'form_to_fill', label: 'Form to Fill' },
                { value: 'permission_needed', label: 'Permission Needed' },
                { value: 'fee_payment', label: 'Fee Payment' },
                { value: 'meeting_rsvp', label: 'Meeting RSVP' },
                { value: 'document_submission', label: 'Document Submission' },
                { value: 'consent_required', label: 'Consent Required' },
                { value: 'feedback_request', label: 'Feedback Request' },
                { value: 'general', label: 'General' },
              ],
              onChange: (value) => {
                setTypeFilter(value as TypeFilter);
                trackAction('filter_type', 'ActionItems', { type: value });
              },
            },
          ]}
          activeFilters={[
            statusFilter !== 'all' && { label: statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1), variant: 'info' as const },
            priorityFilter !== 'all' && { label: priorityFilter.charAt(0).toUpperCase() + priorityFilter.slice(1), variant: 'warning' as const },
            typeFilter !== 'all' && { label: typeFilter.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), variant: 'success' as const },
          ].filter(Boolean) as any}
          onClearAll={() => {
            setStatusFilter('all');
            setPriorityFilter('all');
            setTypeFilter('all');
            trackAction('clear_filters', 'ActionItems');
          }}
        />

        {/* Action Items List */}
        <Col gap="sm">
          {filteredItems.map(item => {
            const deadlineBadge = getDeadlineBadge(item);
            const isPending = item.status === 'pending';

            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => handleItemTap(item)}
                activeOpacity={0.7}
              >
                <Card
                  variant="elevated"
                  style={item.status === 'completed' ? styles.completedCard : {}}
                >
                  <CardContent>
                    {/* Header Row */}
                    <Row spaceBetween centerV style={{ marginBottom: Spacing.xs }}>
                      <T variant="caption" color="textSecondary">
                        {getTypeLabel(item.type)}
                      </T>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
                        <View
                          style={[
                            styles.priorityIndicator,
                            { backgroundColor: getPriorityColor(item.priority) },
                          ]}
                        />
                        {deadlineBadge && (
                          <Badge variant={deadlineBadge.variant} label={deadlineBadge.label} />
                        )}
                      </View>
                    </Row>

                    {/* Title */}
                    <T
                      variant="body"
                      weight="semiBold"
                      style={{
                        marginBottom: Spacing.xs,
                        ...(item.status === 'completed' && {
                          textDecorationLine: 'line-through',
                          color: Colors.textSecondary,
                        }),
                      }}
                    >
                      {item.title}
                    </T>

                    {/* Description */}
                    {item.description && (
                      <T
                        variant="body"
                        color="textSecondary"
                        numberOfLines={2}
                        style={{ marginBottom: Spacing.xs }}
                      >
                        {item.description}
                      </T>
                    )}

                    {/* Footer Row */}
                    <Row spaceBetween centerV style={{ marginTop: Spacing.sm }}>
                      <Row centerV style={{ gap: Spacing.xs }}>
                        {item.status === 'completed' ? (
                          <Badge variant="success" label="✅ Completed" />
                        ) : (
                          isPending && (
                            <Button
                              variant="outline"
                              onPress={(e) => {
                                e?.stopPropagation();
                                handleMarkComplete(item);
                              }}
                            >
                              Mark Complete
                            </Button>
                          )
                        )}
                      </Row>

                      {item.priority === 'urgent' && isPending && (
                        <Badge variant="error" label="🚨 Urgent" />
                      )}
                    </Row>
                  </CardContent>
                </Card>
              </TouchableOpacity>
            );
          })}
        </Col>

        {/* Empty State for Filters */}
        {filteredItems.length === 0 && actionItems.length > 0 && (
          <Card variant="outlined">
            <CardContent>
              <View style={{ alignItems: 'center', paddingVertical: Spacing.lg }}>
                <T variant="body" color="textSecondary" style={{ textAlign: 'center' }}>
                  No action items match your filters
                </T>
                <Button
                  variant="outline"
                  onPress={() => {
                    setStatusFilter('all');
                    setTypeFilter('all');
                    setPriorityFilter('all');
                  }}
                  style={{ marginTop: Spacing.md }}
                >
                  Clear Filters
                </Button>
              </View>
            </CardContent>
          </Card>
        )}
      </Col>
    </BaseScreen>
  );
};

const styles = StyleSheet.create({
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  completedCard: {
    opacity: 0.7,
  },
  priorityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default ActionItemsScreen;
