import { useQuery } from '@tanstack/react-query';
import { useCustomerId } from '../../config/useCustomerId';

export type ClassStats = {
  classId: string;
  className: string;
  totalStudents: number;
  presentToday: number;
  absentToday: number;
  attendanceRate: number;
  averageScore: number;
  assignmentsPending: number;
  assignmentsCompleted: number;
  topPerformers: number;
  atRiskStudents: number;
  recentTestAverage: number;
  improvementRate: number;
};

// Demo data for development/fallback
const DEMO_CLASS_STATS: Record<string, ClassStats> = {
  'demo-1': {
    classId: 'demo-1',
    className: 'Class 10-A',
    totalStudents: 32,
    presentToday: 28,
    absentToday: 4,
    attendanceRate: 87.5,
    averageScore: 76.4,
    assignmentsPending: 12,
    assignmentsCompleted: 156,
    topPerformers: 8,
    atRiskStudents: 3,
    recentTestAverage: 72.8,
    improvementRate: 5.2,
  },
  'demo-2': {
    classId: 'demo-2',
    className: 'Class 10-B',
    totalStudents: 30,
    presentToday: 27,
    absentToday: 3,
    attendanceRate: 90.0,
    averageScore: 78.2,
    assignmentsPending: 8,
    assignmentsCompleted: 142,
    topPerformers: 10,
    atRiskStudents: 2,
    recentTestAverage: 75.5,
    improvementRate: 3.8,
  },
  'demo-3': {
    classId: 'demo-3',
    className: 'Class 9-A',
    totalStudents: 35,
    presentToday: 32,
    absentToday: 3,
    attendanceRate: 91.4,
    averageScore: 74.1,
    assignmentsPending: 15,
    assignmentsCompleted: 168,
    topPerformers: 9,
    atRiskStudents: 4,
    recentTestAverage: 70.2,
    improvementRate: 4.5,
  },
  'demo-4': {
    classId: 'demo-4',
    className: 'Class 9-B',
    totalStudents: 28,
    presentToday: 25,
    absentToday: 3,
    attendanceRate: 89.3,
    averageScore: 72.8,
    assignmentsPending: 10,
    assignmentsCompleted: 124,
    topPerformers: 6,
    atRiskStudents: 5,
    recentTestAverage: 68.9,
    improvementRate: 2.1,
  },
  'demo-5': {
    classId: 'demo-5',
    className: 'Class 8-A',
    totalStudents: 31,
    presentToday: 29,
    absentToday: 2,
    attendanceRate: 93.5,
    averageScore: 80.5,
    assignmentsPending: 6,
    assignmentsCompleted: 148,
    topPerformers: 12,
    atRiskStudents: 1,
    recentTestAverage: 78.4,
    improvementRate: 6.8,
  },
};

const DEFAULT_STATS: ClassStats = {
  classId: 'default',
  className: 'Class',
  totalStudents: 30,
  presentToday: 27,
  absentToday: 3,
  attendanceRate: 90.0,
  averageScore: 75.0,
  assignmentsPending: 10,
  assignmentsCompleted: 140,
  topPerformers: 8,
  atRiskStudents: 3,
  recentTestAverage: 72.0,
  improvementRate: 4.0,
};

export function useClassStatsQuery(classId: string) {
  const customerId = useCustomerId();

  return useQuery({
    queryKey: ['class-stats', customerId, classId],
    queryFn: async (): Promise<ClassStats> => {
      // Return demo stats for the class
      return DEMO_CLASS_STATS[classId] || { ...DEFAULT_STATS, classId };
    },
    enabled: !!customerId && !!classId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
