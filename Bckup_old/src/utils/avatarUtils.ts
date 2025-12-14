/**
 * Avatar Utilities
 * Purpose: Generate consistent avatars for users
 * Used across: All screens displaying user avatars
 */

/**
 * Simple hash function to convert string to number
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Get avatar emoji based on user ID
 * Returns consistent emoji for same user ID
 */
export function getAvatarEmoji(userId: string): string {
  const avatarEmojis = ['👨', '👩', '👦', '👧', '🧑', '👱', '👴', '👵', '🧔', '👨‍🦰', '👩‍🦰', '👨‍🦱', '👩‍🦱'];
  const hash = hashString(userId);
  const index = hash % avatarEmojis.length;
  return avatarEmojis[index];
}

/**
 * Get initials from name
 * Returns up to 2 uppercase initials
 */
export function getInitials(name: string): string {
  if (!name || name.trim() === '') return '??';

  const parts = name.trim().split(' ').filter(part => part.length > 0);

  if (parts.length === 0) return '??';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();

  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Get avatar color based on user ID
 * Returns consistent hex color for same user ID
 */
export function getAvatarColor(userId: string): string {
  const colors = [
    '#EF4444', // red
    '#F59E0B', // orange
    '#10B981', // green
    '#3B82F6', // blue
    '#8B5CF6', // purple
    '#EC4899', // pink
    '#14B8A6', // teal
    '#F97316', // orange-red
    '#6366F1', // indigo
    '#84CC16', // lime
  ];

  const hash = hashString(userId);
  const index = hash % colors.length;
  return colors[index];
}

/**
 * Get avatar background color (lighter version)
 * Returns consistent light background color for same user ID
 */
export function getAvatarBackgroundColor(userId: string): string {
  const backgrounds = [
    '#FEE2E2', // light red
    '#FED7AA', // light orange
    '#D1FAE5', // light green
    '#DBEAFE', // light blue
    '#EDE9FE', // light purple
    '#FCE7F3', // light pink
    '#CCFBF1', // light teal
    '#FFEDD5', // light orange
    '#E0E7FF', // light indigo
    '#ECFCCB', // light lime
  ];

  const hash = hashString(userId);
  const index = hash % backgrounds.length;
  return backgrounds[index];
}
