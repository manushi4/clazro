/**
 * PaymentHistoryScreen
 * View all past payments with filter and download receipts
 * Phase 2 - Financial Tab
 */

import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BaseScreen } from '../../shared/components/BaseScreen';
import { Col, T, Button, Spacer } from '../../ui';
import { trackAction } from '../../utils/navigationAnalytics';
import type { ParentStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<ParentStackParamList, 'PaymentHistory'>;

const PaymentHistoryScreen: React.FC<Props> = ({ navigation }) => {
  // Track screen view
  React.useEffect(() => {
    trackAction('view_payment_history_screen', 'PaymentHistory');
  }, []);

  return (
    <BaseScreen
      scrollable
      loading={false}
      error={null}
      empty={false}
    >
      <Col sx={{ p: 'xl' }}>
        <T variant="headline" weight="bold">Payment History</T>
        <Spacer size="md" />
        <T variant="body" color="textSecondary">
          This screen will be implemented in Phase 2.
        </T>
        <Spacer size="md" />
        <T variant="body">
          Features: Payment history list, filter by date/status, download receipts, payment details
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

export default PaymentHistoryScreen;
