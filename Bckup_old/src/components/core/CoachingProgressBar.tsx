/**
 * CoachingProgressBar - Core progress indicator components
 * Linear and circular progress bars for tracking student progress
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  Animated,
} from 'react-native';
import { LightTheme, SemanticColors } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';

interface CoachingProgressBarProps {
  progress: number; // 0 to 1
  label?: string;
  showPercentage?: boolean;
  color?: string;
  backgroundColor?: string;
  height?: number;
  animated?: boolean;
  style?: ViewStyle;
  testID?: string;
}

const CoachingProgressBar: React.FC<CoachingProgressBarProps> = ({
  progress,
  label,
  showPercentage = true,
  color = LightTheme.Primary,
  backgroundColor = LightTheme.Primary + '20',
  height = 8,
  animated = true,
  style,
  testID,
}) => {
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const percentage = Math.round(clampedProgress * 100);

  const progressBarStyle: ViewStyle = {
    height,
    backgroundColor,
    borderRadius: height / 2,
    overflow: 'hidden',
  };

  const progressFillStyle: ViewStyle = {
    height: '100%',
    backgroundColor: color,
    borderRadius: height / 2,
    width: `${percentage}%`,
  };

  return (
    <View style={[styles.container, style]} testID={testID}>
      {/* Label and Percentage Row */}
      {(label || showPercentage) && (
        <View style={styles.labelRow}>
          {label && (
            <Text style={styles.label}>
              {label}
            </Text>
          )}
          {showPercentage && (
            <Text style={[styles.percentage, { color }]}>
              {percentage}%
            </Text>
          )}
        </View>
      )}

      {/* Progress Bar */}
      <View style={progressBarStyle}>
        {animated ? (
          <Animated.View style={progressFillStyle} />
        ) : (
          <View style={progressFillStyle} />
        )}
      </View>
    </View>
  );
};

// Circular Progress Component
interface CircularProgressProps {
  progress: number; // 0 to 1
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  showPercentage?: boolean;
  label?: string;
  animated?: boolean;
  style?: ViewStyle;
  testID?: string;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  progress,
  size = 80,
  strokeWidth = 6,
  color = LightTheme.Primary,
  backgroundColor = LightTheme.Primary + '20',
  showPercentage = true,
  label,
  animated = true,
  style,
  testID,
}) => {
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const percentage = Math.round(clampedProgress * 100);
  
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference * (1 - clampedProgress);

  return (
    <View 
      style={[styles.circularContainer, { width: size, height: size }, style]} 
      testID={testID}
    >
      {/* Background Circle - using View with border as SVG alternative */}
      <View
        style={[
          styles.circularBackground,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: backgroundColor,
          }
        ]}
      />

      {/* Progress Circle - simplified version without SVG */}
      <View
        style={[
          styles.circularProgress,
          {
            width: size - strokeWidth,
            height: size - strokeWidth,
            borderRadius: (size - strokeWidth) / 2,
            borderWidth: strokeWidth,
            borderColor: color,
            transform: [{ rotate: '-90deg' }],
          }
        ]}
      />

      {/* Center Content */}
      <View style={styles.circularContent}>
        {showPercentage && (
          <Text style={[styles.circularPercentage, { color }]}>
            {percentage}%
          </Text>
        )}
        {label && (
          <Text style={styles.circularLabel} numberOfLines={2}>
            {label}
          </Text>
        )}
      </View>
    </View>
  );
};

// Subject Progress Component
export type SubjectProgressLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

interface SubjectProgressProps {
  subject: string;
  level: SubjectProgressLevel;
  progress: number; // 0 to 1
  grade?: string;
  style?: ViewStyle;
  testID?: string;
}

const SubjectProgress: React.FC<SubjectProgressProps> = ({
  subject,
  level,
  progress,
  grade,
  style,
  testID,
}) => {
  const getLevelColor = () => {
    switch (level) {
      case 'expert':
        return SemanticColors.Success;
      case 'advanced':
        return LightTheme.Primary;
      case 'intermediate':
        return SemanticColors.Warning;
      default: // beginner
        return SemanticColors.Info;
    }
  };

  const getLevelText = () => {
    return level.charAt(0).toUpperCase() + level.slice(1);
  };

  const color = getLevelColor();

  return (
    <View style={[styles.subjectContainer, style]} testID={testID}>
      {/* Subject Header */}
      <View style={styles.subjectHeader}>
        <View style={styles.subjectInfo}>
          <Text style={styles.subjectName}>
            {subject}
          </Text>
          <Text style={[styles.subjectLevel, { color }]}>
            {getLevelText()}
          </Text>
        </View>
        {grade && (
          <Text style={styles.subjectGrade}>
            {grade}
          </Text>
        )}
      </View>

      {/* Progress Bar */}
      <CoachingProgressBar
        progress={progress}
        color={color}
        backgroundColor={color + '20'}
        height={6}
        showPercentage={false}
        style={styles.subjectProgress}
      />
    </View>
  );
};

// Multi-Progress Component (for multiple subjects)
interface MultiProgressProps {
  subjects: Array<{
    name: string;
    progress: number;
    color?: string;
    grade?: string;
  }>;
  title?: string;
  style?: ViewStyle;
  testID?: string;
}

const MultiProgress: React.FC<MultiProgressProps> = ({
  subjects,
  title,
  style,
  testID,
}) => {
  return (
    <View style={[styles.multiProgressContainer, style]} testID={testID}>
      {title && (
        <Text style={styles.multiProgressTitle}>
          {title}
        </Text>
      )}
      
      {subjects.map((subject, index) => (
        <View key={index} style={styles.multiProgressItem}>
          <View style={styles.multiProgressHeader}>
            <Text style={styles.multiProgressSubject}>
              {subject.name}
            </Text>
            <View style={styles.multiProgressRight}>
              {subject.grade && (
                <Text style={styles.multiProgressGrade}>
                  {subject.grade}
                </Text>
              )}
              <Text style={styles.multiProgressPercentage}>
                {Math.round(subject.progress * 100)}%
              </Text>
            </View>
          </View>
          
          <CoachingProgressBar
            progress={subject.progress}
            color={subject.color || LightTheme.Primary}
            backgroundColor={(subject.color || LightTheme.Primary) + '20'}
            height={4}
            showPercentage={false}
            style={styles.multiProgressBar}
          />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.SM,
  },
  label: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: LightTheme.OnSurface,
    flex: 1,
  },
  percentage: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    fontWeight: Typography.labelMedium.fontWeight,
    marginLeft: Spacing.SM,
  },
  circularContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circularBackground: {
    position: 'absolute',
  },
  circularProgress: {
    position: 'absolute',
  },
  circularContent: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circularPercentage: {
    fontSize: Typography.titleMedium.fontSize,
    fontFamily: Typography.titleMedium.fontFamily,
    fontWeight: Typography.titleMedium.fontWeight,
  },
  circularLabel: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
    marginTop: 2,
    maxWidth: '80%',
  },
  subjectContainer: {
    marginBottom: Spacing.MD,
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.SM,
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: Typography.titleSmall.fontSize,
    fontFamily: Typography.titleSmall.fontFamily,
    fontWeight: Typography.titleSmall.fontWeight,
    color: LightTheme.OnSurface,
  },
  subjectLevel: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    marginTop: 2,
  },
  subjectGrade: {
    fontSize: Typography.titleMedium.fontSize,
    fontFamily: Typography.titleMedium.fontFamily,
    fontWeight: Typography.titleMedium.fontWeight,
    color: LightTheme.Primary,
  },
  subjectProgress: {
    marginTop: Spacing.XS,
  },
  multiProgressContainer: {
    // Container styles
  },
  multiProgressTitle: {
    fontSize: Typography.titleMedium.fontSize,
    fontFamily: Typography.titleMedium.fontFamily,
    fontWeight: Typography.titleMedium.fontWeight,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.MD,
  },
  multiProgressItem: {
    marginBottom: Spacing.MD,
  },
  multiProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.XS,
  },
  multiProgressSubject: {
    fontSize: Typography.bodyMedium.fontSize,
    fontFamily: Typography.bodyMedium.fontFamily,
    color: LightTheme.OnSurface,
    flex: 1,
  },
  multiProgressRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  multiProgressGrade: {
    fontSize: Typography.labelLarge.fontSize,
    fontFamily: Typography.labelLarge.fontFamily,
    fontWeight: Typography.labelLarge.fontWeight,
    color: LightTheme.Primary,
    marginRight: Spacing.SM,
  },
  multiProgressPercentage: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    color: LightTheme.OnSurfaceVariant,
    minWidth: 35,
    textAlign: 'right',
  },
  multiProgressBar: {
    marginTop: Spacing.XS,
  },
});

export default CoachingProgressBar;