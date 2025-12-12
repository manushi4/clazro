/**
 * StudyRecommendationsScreen
 * Teacher recommendations for study focus areas
 * Phase 3 - Academic Tab
 */

import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BaseScreen } from '../../shared/components/BaseScreen';
import { Col, T, Button, Spacer } from '../../ui';
import { trackAction } from '../../utils/navigationAnalytics';
import type { ParentStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<ParentStackParamList, 'StudyRecommendations'>;

const StudyRecommendationsScreen: React.FC<Props> = ({ route, navigation }) => {
  // Track screen view
  React.useEffect(() => {
    trackAction('view_study_recommendations_screen', 'StudyRecommendations');
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
        <T variant="headline" weight="bold">Study Recommendations</T>
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
          Features: Recommended focus areas, study time estimates, priority subjects, resources
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

export default StudyRecommendationsScreen;
