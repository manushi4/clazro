/**
 * AcademicReportsScreen
 * Downloadable reports (report cards, progress, attendance)
 * Phase 3 - Academic Tab
 */

import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BaseScreen } from '../../shared/components/BaseScreen';
import { Col, T, Button, Spacer } from '../../ui';
import { trackAction } from '../../utils/navigationAnalytics';
import type { ParentStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<ParentStackParamList, 'AcademicReports'>;

const AcademicReportsScreen: React.FC<Props> = ({ route, navigation }) => {
  // Track screen view
  React.useEffect(() => {
    trackAction('view_academic_reports_screen', 'AcademicReports');
  }, []);

  // Get params with validation
  const { studentId } = route.params;

  return (
    <BaseScreen
      scrollable
      loading={false}
      error={null}
      empty={false}
    >
      <Col sx={{ p: 'xl' }}>
        <T variant="headline" weight="bold">Academic Reports</T>
        <Spacer size="md" />
        <T variant="body" color="textSecondary">
          This screen will be implemented in Phase 3.
        </T>
        <Spacer size="sm" />
        <T variant="caption" color="textSecondary">
          Student ID: {studentId}
        </T>
        <Spacer size="md" />
        <T variant="body">
          Features: Report cards, progress reports, attendance reports, download PDFs
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

export default AcademicReportsScreen;
