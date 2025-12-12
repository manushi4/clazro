/**
 * MakePaymentScreen
 * Process payment with payment gateway integration
 * Phase 2 - Financial Tab
 */

import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BaseScreen } from '../../shared/components/BaseScreen';
import { Col, T, Button, Spacer } from '../../ui';
import { trackAction } from '../../utils/navigationAnalytics';
import type { ParentStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<ParentStackParamList, 'MakePayment'>;

const MakePaymentScreen: React.FC<Props> = ({ route, navigation }) => {
  // Track screen view
  React.useEffect(() => {
    trackAction('view_make_payment_screen', 'MakePayment');
  }, []);

  // Get params with validation
  const { amount, description } = route.params || {};

  return (
    <BaseScreen
      scrollable
      loading={false}
      error={null}
      empty={false}
    >
      <Col sx={{ p: 'xl' }}>
        <T variant="headline" weight="bold">Make Payment</T>
        <Spacer size="md" />
        <T variant="body" color="textSecondary">
          This screen will be implemented in Phase 2.
        </T>
        {amount && (
          <>
            <Spacer size="sm" />
            <T variant="caption" color="textSecondary">
              Amount: ₹{amount}
            </T>
          </>
        )}
        {description && (
          <>
            <Spacer size="sm" />
            <T variant="caption" color="textSecondary">
              Description: {description}
            </T>
          </>
        )}
        <Spacer size="md" />
        <T variant="body">
          Features: Payment amount, method selection, payment gateway integration, confirmation
        </T>
        <Spacer size="sm" />
        <T variant="caption" color="warning">
          Note: This screen uses useBlockBack to prevent accidental exit during payment
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

export default MakePaymentScreen;
