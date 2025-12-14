/**
 * EmptyState Component
 * Display when lists or content areas are empty
 *
 * Usage:
 * <EmptyState
 *   icon="inbox"
 *   title="No messages"
 *   body="You don't have any messages yet"
 *   cta={{
 *     label: "Send Message",
 *     onPress: handleSendMessage,
 *     variant: "primary"
 *   }}
 * />
 */

import React from 'react';
import { IconButton } from 'react-native-paper';
import { Col, T, Spacer, Button, sx } from '..';

interface EmptyStateProps {
  /** Icon name from MaterialCommunityIcons */
  icon?: string;

  /** Main title */
  title: string;

  /** Optional description text */
  body?: string;

  /** Optional call-to-action button */
  cta?: {
    label: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'inbox',
  title,
  body,
  cta,
}) => {
  return (
    <Col center sx={{ p: '3xl', my: '2xl' }}>
      {/* Icon */}
      <IconButton
        icon={icon}
        size={64}
        iconColor="#94A3B8"
        disabled
      />

      <Spacer size="base" />

      {/* Title */}
      <T variant="title" weight="semiBold" align="center">
        {title}
      </T>

      {/* Body text */}
      {body && (
        <>
          <Spacer size="sm" />
          <T variant="body" color="textSecondary" align="center" style={sx({ maxW: 300 })}>
            {body}
          </T>
        </>
      )}

      {/* Call to action button */}
      {cta && (
        <>
          <Spacer size="xl" />
          <Button
            variant={cta.variant || 'primary'}
            onPress={cta.onPress}
          >
            {cta.label}
          </Button>
        </>
      )}
    </Col>
  );
};
