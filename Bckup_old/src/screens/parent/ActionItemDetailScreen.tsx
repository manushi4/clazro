/**
 * ActionItemDetailScreen
 * View single action item details with complete/uncomplete functionality
 * Phase 1 - Overview Tab
 */

import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BaseScreen } from '../../shared/components/BaseScreen';
import { Col, T, Button, Spacer } from '../../ui';
import { trackAction } from '../../utils/navigationAnalytics';
import type { ParentStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<ParentStackParamList, 'ActionItemDetail'>;

const ActionItemDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  // Track screen view
  React.useEffect(() => {
    trackAction('view_action_item_detail_screen', 'ActionItemDetail');
  }, []);

  // Get params with validation
  const { itemId } = route.params;

  return (
    <BaseScreen
      scrollable
      loading={false}
      error={null}
      empty={false}
    >
      <Col sx={{ p: 'xl' }}>
        <T variant="headline" weight="bold">Action Item Details</T>
        <Spacer size="md" />
        <T variant="body" color="textSecondary">
          This screen will be implemented in Phase 1.
        </T>
        <Spacer size="sm" />
        <T variant="caption" color="textSecondary">
          Item ID: {itemId}
        </T>
        <Spacer size="md" />
        <T variant="body">
          Features: Full description, attachments, complete/uncomplete button, related child
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

export default ActionItemDetailScreen;
