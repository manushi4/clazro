import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DynamicScreen } from '../../navigation/DynamicScreen';
import { useAppTheme } from '../../theme/useAppTheme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<any, 'GradingHub'>;

/**
 * GradingHubScreen - Dynamic screen for grading and assignments
 *
 * This screen displays:
 * - Quick Actions (grade now, new assignment, all assignments, rubrics)
 * - Submissions List (pending submissions to grade)
 * - Grading Stats
 * - Pending Grading by Assignment
 * - Recent Grades
 * - Rubric Templates
 *
 * Layout is configured in the database via screen_layouts table.
 */
export const GradingHubScreen: React.FC<Props> = () => {
  const { colors } = useAppTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <DynamicScreen
        screenId="grading-hub"
        role="teacher"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default GradingHubScreen;
