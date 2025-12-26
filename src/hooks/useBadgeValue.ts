/**
 * Badge Value Hook
 * Returns badge count/status for drawer menu items
 */

type BadgeValue = number | boolean | null;

/**
 * Returns the badge value for a given source key
 * Used by drawer menu items to display dynamic badges
 *
 * TODO: Connect to actual stores when they are implemented
 */
export function useBadgeValue(source: string | undefined): BadgeValue {
  if (!source) return null;

  // Map source keys to actual values
  // For now, return null - implement when stores are available
  switch (source) {
    // Notification badges
    case 'notifications_unread':
    case 'unread_notifications':
      // TODO: Connect to notification store
      return null;

    // Calendar badges
    case 'calendar_events_today':
      // TODO: Connect to calendar store
      return null;

    // Leave/Approval badges
    case 'pending_leaves':
    case 'pending_approvals':
      // TODO: Connect to approval store
      return null;

    // Message badges
    case 'new_messages':
    case 'unread_messages':
      // TODO: Connect to messages store
      return null;

    // Downloads badge
    case 'downloads_count':
      // TODO: Connect to downloads store
      return null;

    // Fees badge
    case 'pending_fees':
      // TODO: Connect to fees store
      return null;

    // Achievement badges
    case 'new_achievements':
      // TODO: Connect to gamification store
      return null;

    // Feature update badge
    case 'has_updates':
      return null;

    default:
      return null;
  }
}

/**
 * Formats badge value for display
 */
export function formatBadgeValue(value: BadgeValue): string | null {
  if (value === null || value === false) return null;
  if (value === true) return '';
  if (typeof value === 'number') {
    if (value <= 0) return null;
    if (value > 99) return '99+';
    return value.toString();
  }
  return null;
}
