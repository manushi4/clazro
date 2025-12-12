/**
 * BaseScreen Component
 * Standard screen template with built-in loading, error, and empty states
 *
 * Usage:
 * function MyScreen() {
 *   const { data, isLoading, isError, error, refetch } = useQuery({...});
 *
 *   return (
 *     <BaseScreen
 *       header={<T variant="title">My Screen</T>}
 *       loading={isLoading}
 *       error={isError ? error : null}
 *       empty={data?.items.length === 0}
 *       onRetry={refetch}
 *     >
 *       {* Your content *}
 *     </BaseScreen>
 *   );
 * }
 */

import React from 'react';
import { ScrollView, RefreshControl, ViewStyle } from 'react-native';
import { Col, Row, elevation, sx } from '../../ui';
import { SkeletonList } from '../../ui/feedback/Skeleton';
import { EmptyState } from '../../ui/feedback/EmptyState';
import { ErrorState } from '../../ui/feedback/ErrorState';
import { Colors } from '../../theme/designSystem';
import { useTheme } from '../../context/ThemeContext';

interface BaseScreenProps {
  /** Optional header content */
  header?: React.ReactNode;

  /** Loading state */
  loading?: boolean;

  /** Error state */
  error?: Error | string | null;

  /** Empty state */
  empty?: boolean;
  emptyTitle?: string;
  emptyBody?: string;
  emptyIcon?: string;
  onEmptyCTA?: () => void;
  emptyCtaLabel?: string;

  /** Retry function */
  onRetry?: () => void;

  /** Pull to refresh */
  onRefresh?: () => void;
  refreshing?: boolean;

  /** Children content */
  children: React.ReactNode;

  /** Scroll enabled */
  scrollable?: boolean;

  /** Background color */
  backgroundColor?: string;

  /** Content container style */
  contentContainerStyle?: ViewStyle;

  /** Custom skeleton count */
  skeletonCount?: number;
}

export const BaseScreen: React.FC<BaseScreenProps> = ({
  header,
  loading = false,
  error = null,
  empty = false,
  emptyTitle = 'No data',
  emptyBody = 'Nothing to show yet',
  emptyIcon = 'inbox',
  onEmptyCTA,
  emptyCtaLabel = 'Refresh',
  onRetry,
  onRefresh,
  refreshing = false,
  children,
  scrollable = true,
  backgroundColor,
  contentContainerStyle,
  skeletonCount = 5,
}) => {
  // Use theme colors
  const { theme } = useTheme();
  const bgColor = backgroundColor || theme.Background;
  const primaryColor = theme.Primary;

  // Determine error message
  const errorMessage =
    typeof error === 'string'
      ? error
      : error?.message || 'Something went wrong';

  const content = (
    <>
      {/* Loading State */}
      {loading && <SkeletonList count={skeletonCount} />}

      {/* Error State */}
      {!loading && error && <ErrorState message={errorMessage} onRetry={onRetry} />}

      {/* Empty State */}
      {!loading && !error && empty && (
        <EmptyState
          icon={emptyIcon}
          title={emptyTitle}
          body={emptyBody}
          cta={
            onEmptyCTA || onRefresh
              ? {
                  label: emptyCtaLabel,
                  onPress: onEmptyCTA || onRefresh || (() => {}),
                  variant: 'outline',
                }
              : undefined
          }
        />
      )}

      {/* Success State - Show Content */}
      {!loading && !error && !empty && children}
    </>
  );

  return (
    <Col flex={1} style={{ backgroundColor: bgColor }}>
      {/* Header */}
      {header && (
        <Row sx={{ p: 'base', bg: 'surface' }} style={elevation(2)}>
          {header}
        </Row>
      )}

      {/* Content */}
      {scrollable ? (
        <ScrollView
          contentContainerStyle={[sx({ p: 'base' }), contentContainerStyle]}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[primaryColor]}
                tintColor={primaryColor}
              />
            ) : undefined
          }
        >
          {content}
        </ScrollView>
      ) : (
        <Col flex={1} sx={{ p: 'base' }} style={contentContainerStyle}>
          {content}
        </Col>
      )}
    </Col>
  );
};
