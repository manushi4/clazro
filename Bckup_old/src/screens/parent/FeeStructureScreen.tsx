/**
 * FeeStructureScreen
 * View detailed fee breakdown
 * Phase 2 - Financial Tab
 */

import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BaseScreen } from '../../shared/components/BaseScreen';
import { Col, T, Button, Spacer } from '../../ui';
import { trackAction } from '../../utils/navigationAnalytics';
import type { ParentStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<ParentStackParamList, 'FeeStructure'>;

const FeeStructureScreen: React.FC<Props> = ({ route, navigation }) => {
  // Track screen view
  React.useEffect(() => {
    trackAction('view_fee_structure_screen', 'FeeStructure');
  }, []);

  // Get params with validation
  const { studentId } = route.params || {};

  return (
    <BaseScreen
      scrollable
      loading={false}
      error={null}
      empty={false}
    >
      <Col sx={{ p: 'xl' }}>
        <T variant="headline" weight="bold">Fee Structure</T>
        <Spacer size="md" />
        <T variant="body" color="textSecondary">
          This screen will be implemented in Phase 2.
        </T>
        {studentId && (
          <>
            <Spacer size="sm" />
            <T variant="caption" color="textSecondary">
              Student ID: {studentId}
            </T>
          </>
        )}
        <Spacer size="md" />
        <T variant="body">
          Features: Fee components, academic year fees, per-term breakdown, comparison (if multiple children)
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

export default FeeStructureScreen;
