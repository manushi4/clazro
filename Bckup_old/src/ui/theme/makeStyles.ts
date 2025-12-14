/**
 * makeStyles Utility
 * Create styles that read from theme
 *
 * Usage:
 * const useStyles = makeStyles((theme) => ({
 *   container: {
 *     backgroundColor: theme.colors.surface,
 *     padding: theme.spacing.base,
 *   },
 * }));
 *
 * // In component:
 * const styles = useStyles();
 */

import { useMemo } from 'react';
import { StyleSheet, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { useTheme } from './useTheme';
import { Theme } from './createTheme';

type NamedStyles<T> = {
  [P in keyof T]: ViewStyle | TextStyle | ImageStyle;
};

export function makeStyles<T extends NamedStyles<T>>(
  stylesFn: (theme: Theme) => T
) {
  return (): T => {
    const theme = useTheme();
    return useMemo(() => StyleSheet.create(stylesFn(theme)), [theme]);
  };
}
