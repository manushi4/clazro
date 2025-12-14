/**
 * Core Components Export File
 * Central export point for all core reusable components
 */

// Button Components
export { default as CoachingButton } from './CoachingButton';
export type { ButtonVariant, ButtonSize } from './CoachingButton';

// Input Components
export { default as CoachingTextField } from './CoachingTextField';

// Card Components
export { default as DashboardCard, StatisticsCard } from './DashboardCard';
export type { DashboardCardVariant } from './DashboardCard';

// Status Components
export { 
  default as StatusBadge, 
  PriorityIndicator, 
  AssignmentStatusBadge 
} from './StatusBadge';
export type { 
  BadgeType, 
  BadgeSize, 
  PriorityLevel, 
  AssignmentStatus 
} from './StatusBadge';

// Progress Components
export { 
  default as CoachingProgressBar,
  CircularProgress,
  SubjectProgress,
  MultiProgress
} from './CoachingProgressBar';
export type { SubjectProgressLevel } from './CoachingProgressBar';

// Phase 19: Polling & Quiz Components (Teacher)
export { default as LivePollCreator } from '../teacher/LivePollCreator';
export type { PollQuestion } from '../teacher/LivePollCreator';
export { default as PollResults } from '../teacher/PollResults';
export type { PollResultsProps } from '../teacher/PollResults';
export { default as QuickQuizCreator } from '../teacher/QuickQuizCreator';
export type { Quiz, QuizQuestion } from '../teacher/QuickQuizCreator';
export { default as QuizResults } from '../teacher/QuizResults';
export type { QuizResponse } from '../teacher/QuizResults';
export { default as PollManager } from '../teacher/PollManager';
export type { ActivePoll, ActiveQuiz } from '../teacher/PollManager';