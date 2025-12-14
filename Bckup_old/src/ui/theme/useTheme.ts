/**
 * Theme Hook
 * Access theme tokens anywhere in your components
 *
 * Usage:
 * const theme = useTheme();
 * const color = theme.colors.primary;
 */

import { useContext } from 'react';
import { ThemeContext } from './ThemeProvider';

export const useTheme = () => {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return theme;
};
