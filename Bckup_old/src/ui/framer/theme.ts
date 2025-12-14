// Framer design tokens for consistent UI across screens
export const FRAMER_COLORS = {
  background: '#F9FAFB',
  card: '#FFFFFF',
  primary: '#5B47FB',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  stroke: '#E5E7EB',
  softStroke: '#EEF2FF',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  iconBg: 'rgba(91, 71, 251, 0.15)',
};

export const FRAMER_RADII = {
  card: 20,
  button: 14,
  input: 12,
  chip: 12,
  calendarCell: 12,
};

export const FRAMER_SHADOWS = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
};

export const FRAMER_SIZES = {
  inputHeight: 48,
  buttonHeight: 52,
  iconContainer: 32,
};

// Legacy spacing (kept for compatibility with older references)
export const FRAMER_SPACING = {
  screen: 16,
  cardPadding: 18,
  sectionGap: 16,
  itemGap: 12,
};
