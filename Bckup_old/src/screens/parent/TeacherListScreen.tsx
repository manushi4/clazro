/**
 * TeacherListScreen
 * View all teachers with contact info
 * Phase 4 - Communication Tab
 */

import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BaseScreen } from '../../shared/components/BaseScreen';
import { Col, T, Button, Spacer } from '../../ui';
import { trackAction } from '../../utils/navigationAnalytics';
import type { ParentStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<ParentStackParamList, 'TeacherList'>;

const TeacherListScreen: React.FC<Props> = ({ route, navigation }) => {
  // Track screen view
  React.useEffect(() => {
    trackAction('view_teacher_list_screen', 'TeacherList');
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
        <T variant="headline" weight="bold">Teachers</T>
        <Spacer size="md" />
        <T variant="body" color="textSecondary">
          This screen will be implemented in Phase 4.
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
          Features: Student's teachers, teacher profiles, contact info, message/call buttons
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

export default TeacherListScreen;
