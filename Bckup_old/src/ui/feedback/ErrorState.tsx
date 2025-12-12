/**
 * ErrorState Component
 * Display when data loading fails or errors occur
 *
 * Usage:
 * <ErrorState
 *   title="Failed to load"
 *   message="Unable to fetch attendance data"
 *   onRetry={refetch}
 * />
 */

import React from 'react';
import { IconButton } from 'react-native-paper';
import { Col, T, Spacer, Button, sx } from '..';

interface ErrorStateProps {
  /** Error title */
  title?: string;

  /** Error message */
  message?: string;

  /** Retry function */
  onRetry?: () => void;

  /** Custom retry button label */
  retryLabel?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'Unable to load data. Please try again.',
  onRetry,
  retryLabel = 'Try Again',
}) => {
  return (
    <Col center sx={{ p: 'xl', my: '2xl' }}>
      {/* Error Icon */}
      <IconButton
        icon="alert-circle"
        size={64}
        iconColor="#EF4444"
        disabled
      />

      <Spacer size="base" />

      {/* Title */}
      <T variant="subtitle" weight="semiBold" color="error" align="center">
        {title}
      </T>

      <Spacer size="sm" />

      {/* Message */}
      <T variant="body" color="textSecondary" align="center" style={sx({ maxW: 300 })}>
        {message}
      </T>

      {/* Retry Button */}
      {onRetry && (
        <>
          <Spacer size="lg" />
          <Button variant="outline" onPress={onRetry}>
            {retryLabel}
          </Button>
        </>
      )}
    </Col>
  );
};
