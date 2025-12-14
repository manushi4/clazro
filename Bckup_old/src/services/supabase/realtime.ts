/**
 * Supabase Real-time Subscriptions for React Native
 *
 * This module provides real-time subscriptions to database tables
 * for live updates in the parent section.
 *
 * Features:
 * - React Native compatible cleanup
 * - Type-safe event handlers
 * - Automatic reconnection
 * - Memory leak prevention
 *
 * Usage:
 * ```ts
 * import { subscribeToCommunications } from '@/services/supabase/realtime';
 *
 * useEffect(() => {
 *   const unsubscribe = subscribeToCommunications(parentId, (payload) => {
 *     console.log('New message:', payload);
 *     queryClient.invalidateQueries({ queryKey: communicationsKeys.all });
 *   });
 *
 *   return unsubscribe; // Cleanup on unmount
 * }, [parentId]);
 * ```
 */

import { supabase } from './client';
import type {
  ParentTeacherCommunication,
  AIInsight,
  ParentActionItem,
  RiskFactor,
  Opportunity,
  RecommendedAction,
} from '../../types/supabase-parent.types';

/**
 * Real-time event payload types
 */
type RealtimePayload<T> = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T;
  old: Partial<T>;
  errors: string[] | null;
};

type SubscriptionCallback<T> = (payload: RealtimePayload<T>) => void;

/**
 * Subscribe to parent-teacher communications
 *
 * Triggers on:
 * - New messages received
 * - Message status changes (delivered, read)
 * - Replies to existing messages
 *
 * @param parentId - Parent ID to filter messages
 * @param callback - Function to call when communication changes
 * @returns Unsubscribe function
 */
export function subscribeToCommunications(
  parentId: string,
  callback: SubscriptionCallback<ParentTeacherCommunication>
): () => void {
  const channel = supabase
    .channel(`communications:${parentId}`)
    .on(
      'postgres_changes',
      {
        event: '*', // Listen to INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'parent_teacher_communications',
        filter: `parent_id=eq.${parentId}`,
      },
      (payload: any) => {
        callback(payload as RealtimePayload<ParentTeacherCommunication>);
      }
    )
    .subscribe();

  // Return cleanup function
  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to AI insights
 *
 * Triggers on:
 * - New insights generated
 * - Insight severity changes
 * - Insights marked as viewed
 *
 * @param parentId - Parent ID to filter insights
 * @param callback - Function to call when insight changes
 * @returns Unsubscribe function
 */
export function subscribeToInsights(
  parentId: string,
  callback: SubscriptionCallback<AIInsight>
): () => void {
  const channel = supabase
    .channel(`insights:${parentId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'ai_insights',
        filter: `parent_id=eq.${parentId}`,
      },
      (payload: any) => {
        callback(payload as RealtimePayload<AIInsight>);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to action items
 *
 * Triggers on:
 * - New action items created
 * - Action item status changes (pending, completed, dismissed)
 * - Due date changes
 *
 * @param parentId - Parent ID to filter action items
 * @param callback - Function to call when action item changes
 * @returns Unsubscribe function
 */
export function subscribeToActionItems(
  parentId: string,
  callback: SubscriptionCallback<ParentActionItem>
): () => void {
  const channel = supabase
    .channel(`action-items:${parentId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'parent_action_items',
        filter: `parent_id=eq.${parentId}`,
      },
      (payload: any) => {
        callback(payload as RealtimePayload<ParentActionItem>);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to risk factors
 *
 * Triggers on:
 * - New risks detected
 * - Risk severity changes
 * - Risks resolved
 *
 * @param parentId - Parent ID to filter risks
 * @param callback - Function to call when risk changes
 * @returns Unsubscribe function
 */
export function subscribeToRisks(
  parentId: string,
  callback: SubscriptionCallback<RiskFactor>
): () => void {
  const channel = supabase
    .channel(`risks:${parentId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'risk_factors',
        filter: `parent_id=eq.${parentId}`,
      },
      (payload: any) => {
        callback(payload as RealtimePayload<RiskFactor>);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to opportunities
 *
 * Triggers on:
 * - New opportunities identified
 * - Opportunity status changes
 * - Parent expresses interest
 *
 * @param parentId - Parent ID to filter opportunities
 * @param callback - Function to call when opportunity changes
 * @returns Unsubscribe function
 */
export function subscribeToOpportunities(
  parentId: string,
  callback: SubscriptionCallback<Opportunity>
): () => void {
  const channel = supabase
    .channel(`opportunities:${parentId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'opportunities',
        filter: `parent_id=eq.${parentId}`,
      },
      (payload: any) => {
        callback(payload as RealtimePayload<Opportunity>);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to recommended actions
 *
 * Triggers on:
 * - New recommendations generated
 * - Action status changes
 * - Actions completed or dismissed
 *
 * @param parentId - Parent ID to filter recommended actions
 * @param callback - Function to call when recommended action changes
 * @returns Unsubscribe function
 */
export function subscribeToRecommendedActions(
  parentId: string,
  callback: SubscriptionCallback<RecommendedAction>
): () => void {
  const channel = supabase
    .channel(`recommended-actions:${parentId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'recommended_actions',
        filter: `parent_id=eq.${parentId}`,
      },
      (payload: any) => {
        callback(payload as RealtimePayload<RecommendedAction>);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to unread message count changes
 *
 * More efficient than subscribing to all communications when you only need the count
 *
 * @param parentId - Parent ID
 * @param callback - Function to call when count changes
 * @returns Unsubscribe function
 */
export function subscribeToUnreadCount(
  parentId: string,
  callback: (count: number) => void
): () => void {
  const channel = supabase
    .channel(`unread-count:${parentId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'parent_teacher_communications',
        filter: `parent_id=eq.${parentId}`,
      },
      async () => {
        // Fetch updated count when communications change
        const { count, error } = await supabase
          .from('parent_teacher_communications')
          .select('*', { count: 'exact', head: true })
          .eq('parent_id', parentId)
          .eq('recipient_id', parentId)
          .is('read_at', null);

        if (!error && count !== null) {
          callback(count);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to all parent-related events
 *
 * Convenience function that subscribes to all relevant tables at once
 * Useful for dashboard screens that need comprehensive real-time updates
 *
 * @param parentId - Parent ID
 * @param callbacks - Object with callbacks for each event type
 * @returns Unsubscribe function that cleans up all subscriptions
 */
export function subscribeToAllParentEvents(
  parentId: string,
  callbacks: {
    onCommunication?: SubscriptionCallback<ParentTeacherCommunication>;
    onInsight?: SubscriptionCallback<AIInsight>;
    onActionItem?: SubscriptionCallback<ParentActionItem>;
    onRisk?: SubscriptionCallback<RiskFactor>;
    onOpportunity?: SubscriptionCallback<Opportunity>;
    onRecommendedAction?: SubscriptionCallback<RecommendedAction>;
  }
): () => void {
  const unsubscribers: Array<() => void> = [];

  if (callbacks.onCommunication) {
    unsubscribers.push(subscribeToCommunications(parentId, callbacks.onCommunication));
  }

  if (callbacks.onInsight) {
    unsubscribers.push(subscribeToInsights(parentId, callbacks.onInsight));
  }

  if (callbacks.onActionItem) {
    unsubscribers.push(subscribeToActionItems(parentId, callbacks.onActionItem));
  }

  if (callbacks.onRisk) {
    unsubscribers.push(subscribeToRisks(parentId, callbacks.onRisk));
  }

  if (callbacks.onOpportunity) {
    unsubscribers.push(subscribeToOpportunities(parentId, callbacks.onOpportunity));
  }

  if (callbacks.onRecommendedAction) {
    unsubscribers.push(subscribeToRecommendedActions(parentId, callbacks.onRecommendedAction));
  }

  // Return cleanup function that calls all unsubscribers
  return () => {
    unsubscribers.forEach(unsub => unsub());
  };
}

/**
 * React hook for real-time subscriptions (optional)
 *
 * Example usage:
 * ```ts
 * import { useRealtimeSubscription } from '@/services/supabase/realtime';
 *
 * function MyComponent({ parentId }: { parentId: string }) {
 *   const queryClient = useQueryClient();
 *
 *   useRealtimeSubscription(parentId, {
 *     onCommunication: () => {
 *       queryClient.invalidateQueries({ queryKey: communicationsKeys.all });
 *     },
 *     onInsight: () => {
 *       queryClient.invalidateQueries({ queryKey: insightsKeys.all });
 *     },
 *   });
 *
 *   return <View>...</View>;
 * }
 * ```
 */
export function useRealtimeSubscription(
  parentId: string,
  callbacks: Parameters<typeof subscribeToAllParentEvents>[1]
) {
  // Import React at the top of your component file, not here
  // This is just for reference
  const React = require('react');

  React.useEffect(() => {
    if (!parentId) return;

    const unsubscribe = subscribeToAllParentEvents(parentId, callbacks);

    return unsubscribe;
  }, [parentId]); // Don't add callbacks to deps to avoid re-subscribing
}
