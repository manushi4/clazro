/**
 * UI Utility Library - Main Export
 * Import all utilities from here
 *
 * Usage:
 * import { Row, Col, T, Button, useTheme } from '../ui';
 */

// Theme
export { createTheme, defaultTheme, tealTheme } from './theme/createTheme';
export { ThemeProvider, ThemeContext } from './theme/ThemeProvider';
export { useTheme } from './theme/useTheme';
export { makeStyles } from './theme/makeStyles';
export { sx } from './theme/sx';
export type { Theme, ThemeOverrides } from './theme/createTheme';
export type { SxProps } from './theme/sx';

// Layout
export { Row } from './layout/Row';
export { Col } from './layout/Col';

// Framer UI primitives
export * from './framer';
export { Stack } from './layout/Stack';
export { Spacer } from './layout/Spacer';
export { Divider } from './layout/divider';

// Typography
export { T, truncate } from './typography/T';

// Helpers
export { alpha, lighten, darken, isLight, getContrast } from './helpers/colors';
export { elevation, elevationPresets } from './helpers/elevation';
export type { ElevationLevel } from './helpers/elevation';

// Interactive
export { Button } from './interactive/Button';

// Feedback
export { Skeleton, SkeletonCard, SkeletonList, SkeletonRow } from './feedback/Skeleton';
export { EmptyState } from './feedback/EmptyState';
export { ErrorState } from './feedback/ErrorState';

// Data Display
export { ListItem } from './data-display/ListItem';
export { Badge } from './data-display/Badge';
export { KPICard } from './data-display/KPICard';
export { Chip } from './data-display/Chip';

// Surfaces
export { Card, CardHeader, CardContent, CardActions } from './surfaces/Card';

// Lists (MD3 enhanced)
export { ListItem as ListItemMD3 } from './lists/ListItem';

// Navigation
export { ContextSwitcher } from './navigation/ContextSwitcher';
