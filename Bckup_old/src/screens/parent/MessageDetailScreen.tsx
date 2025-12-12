/**
 * MessageDetailScreen
 * View single message with reply functionality
 * Phase 1 - Overview Tab
 */

import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BaseScreen } from '../../shared/components/BaseScreen';
import { Col, T, Button, Spacer } from '../../ui';
import { trackAction } from '../../utils/navigationAnalytics';
import type { ParentStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<ParentStackParamList, 'MessageDetail'>;

const MessageDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  // Track screen view
  React.useEffect(() => {
    trackAction('view_message_detail_screen', 'MessageDetail');
  }, []);

  // Get params with validation
  const { messageId } = route.params;

  return (
    <BaseScreen
      scrollable
      loading={false}
      error={null}
      empty={false}
    >
      <Col sx={{ p: 'xl' }}>
        <T variant="headline" weight="bold">Message Details</T>
        <Spacer size="md" />
        <T variant="body" color="textSecondary">
          This screen will be implemented in Phase 1.
        </T>
        <Spacer size="sm" />
        <T variant="caption" color="textSecondary">
          Message ID: {messageId}
        </T>
        <Spacer size="md" />
        <T variant="body">
          Features: Full message content, sender info, date/time, attachments, reply button, mark read/unread
        </T>
        <Spacer size="lg" />
        <Button
          variant="primary"
          onPress={() => navigation.goBack()}
        >
          Go Back
        </Button>
      </Col>
    </BaseScreen>
  );
};

export default MessageDetailScreen;
