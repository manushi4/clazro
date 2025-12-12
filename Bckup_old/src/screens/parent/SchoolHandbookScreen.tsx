/**
 * SchoolHandbookScreen
 * Student handbook with search and bookmarks
 * Phase 5 - Info Tab
 */

import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BaseScreen } from '../../shared/components/BaseScreen';
import { Col, T, Button, Spacer } from '../../ui';
import { trackAction } from '../../utils/navigationAnalytics';
import type { ParentStackParamList } from '../../types/navigation';

type Props = NativeStackScreenProps<ParentStackParamList, 'SchoolHandbook'>;

const SchoolHandbookScreen: React.FC<Props> = ({ navigation }) => {
  // Track screen view
  React.useEffect(() => {
    trackAction('view_school_handbook_screen', 'SchoolHandbook');
  }, []);

  return (
    <BaseScreen
      scrollable
      loading={false}
      error={null}
      empty={false}
    >
      <Col sx={{ p: 'xl' }}>
        <T variant="headline" weight="bold">School Handbook</T>
        <Spacer size="md" />
        <T variant="body" color="textSecondary">
          This screen will be implemented in Phase 5.
        </T>
        <Spacer size="md" />
        <T variant="body">
          Features: Handbook sections, search functionality, bookmarks, download PDF
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

export default SchoolHandbookScreen;
