import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../../lib/supabaseClient';
import { useCustomerId } from '../../config/useCustomerId';

export type BatchStudent = {
  id: string;
  name: string;
  rollNumber: string;
  avgScore: number;
  attendance: number;
  rank: number;
  trend: number;
};

export type BatchTest = {
  id: string;
  name: string;
  date: string;
  avgScore: number;
  highestScore: number;
  lowestScore: number;
  passPercentage: number;
  totalStudents: number;
};

export type BatchSubject = {
  id: string;
  name: string;
  avgScore: number;
  passPercentage: number;
  topScorer: string;
  topScore: number;
};

export type BatchDetailData = {
  id: string;
  batchId: string;
  name: string;
  program: string;
  term: string;
  startDate: string;
  endDate: string | null;
  schedule: string;
  venue: string;
  avgScore: number;
  passPercentage: number;
  studentCount: number;
  testsCount: number;
  trend: number;
  rank: number;
  attendance: number;
  topScorer: {
    id: string;
    name: string;
    score: number;
  } | null;
  teacher: {
    id: string;
    name: string;
    subject: string;
    phone: string;
  } | null;
  recentTests: BatchTest[];
  topStudents: BatchStudent[];
  subjectPerformance: BatchSubject[];
};

// Demo data for when no real data exists
const generateDemoData = (batchId: string): BatchDetailData => {
  // Map batchId strings to demo data - support both id and batchId formats
  const demoBatches: Record<string, Partial<BatchDetailData>> = {
    // By simple id
    '1': { name: 'JEE Advanced 2025-A', program: 'JEE', avgScore: 89, passPercentage: 94, studentCount: 45 },
    '2': { name: 'NEET 2025-B', program: 'NEET', avgScore: 84, passPercentage: 91, studentCount: 52 },
    '3': { name: 'JEE Mains 2025-C', program: 'JEE', avgScore: 78, passPercentage: 87, studentCount: 68 },
    '4': { name: 'Foundation XI-A', program: 'Foundation', avgScore: 76, passPercentage: 85, studentCount: 40 },
    '5': { name: 'Foundation XI-B', program: 'Foundation', avgScore: 74, passPercentage: 82, studentCount: 38 },
    '6': { name: 'NEET 2025-C', program: 'NEET', avgScore: 72, passPercentage: 80, studentCount: 55 },
    // By full batchId string (from widget navigation)
    'batch-jee-adv-2025-a': { name: 'JEE Advanced 2025-A', program: 'JEE', avgScore: 89, passPercentage: 94, studentCount: 45 },
    'batch-neet-2025-b': { name: 'NEET 2025-B', program: 'NEET', avgScore: 84, passPercentage: 91, studentCount: 52 },
    'batch-jee-mains-2025-c': { name: 'JEE Mains 2025-C', program: 'JEE', avgScore: 78, passPercentage: 87, studentCount: 68 },
    'batch-foundation-xi-a': { name: 'Foundation XI-A', program: 'Foundation', avgScore: 76, passPercentage: 85, studentCount: 40 },
    'batch-foundation-xi-b': { name: 'Foundation XI-B', program: 'Foundation', avgScore: 74, passPercentage: 82, studentCount: 38 },
    'batch-neet-2025-c': { name: 'NEET 2025-C', program: 'NEET', avgScore: 72, passPercentage: 80, studentCount: 55 },
  };

  const batchInfo = demoBatches[batchId] || demoBatches['1'];
  
  // Generate a consistent rank based on batchId
  const rankMap: Record<string, number> = {
    '1': 1, 'batch-jee-adv-2025-a': 1,
    '2': 2, 'batch-neet-2025-b': 2,
    '3': 3, 'batch-jee-mains-2025-c': 3,
    '4': 4, 'batch-foundation-xi-a': 4,
    '5': 5, 'batch-foundation-xi-b': 5,
    '6': 6, 'batch-neet-2025-c': 6,
  };
  const rank = rankMap[batchId] || 1;

  return {
    id: batchId,
    batchId: batchId.startsWith('batch-') ? batchId : `batch-${batchId}`,
    name: batchInfo.name || 'JEE Advanced 2025-A',
    program: batchInfo.program || 'JEE',
    term: '2024-25',
    startDate: '2024-04-01',
    endDate: '2025-03-31',
    schedule: 'Mon-Sat, 9:00 AM - 1:00 PM',
    venue: 'Block A, Room 101-105',
    avgScore: batchInfo.avgScore || 85,
    passPercentage: batchInfo.passPercentage || 90,
    studentCount: batchInfo.studentCount || 45,
    testsCount: 12,
    trend: 5,
    rank: rank,
    attendance: 92,
    topScorer: { id: 'ts1', name: 'Arjun Sharma', score: 98 },
    teacher: { id: 't1', name: 'Dr. Rajesh Kumar', subject: 'Physics', phone: '+91 98765 43210' },
    recentTests: [
      { id: 't1', name: 'Weekly Test 12', date: '2024-12-20', avgScore: 78, highestScore: 98, lowestScore: 45, passPercentage: 89, totalStudents: 45 },
      { id: 't2', name: 'Monthly Test - Dec', date: '2024-12-15', avgScore: 82, highestScore: 96, lowestScore: 52, passPercentage: 92, totalStudents: 44 },
      { id: 't3', name: 'Weekly Test 11', date: '2024-12-13', avgScore: 75, highestScore: 94, lowestScore: 48, passPercentage: 85, totalStudents: 45 },
      { id: 't4', name: 'Weekly Test 10', date: '2024-12-06', avgScore: 80, highestScore: 97, lowestScore: 50, passPercentage: 90, totalStudents: 43 },
    ],
    topStudents: [
      { id: 's1', name: 'Arjun Sharma', rollNumber: 'JEE-A-001', avgScore: 95, attendance: 98, rank: 1, trend: 3 },
      { id: 's2', name: 'Priya Patel', rollNumber: 'JEE-A-002', avgScore: 93, attendance: 96, rank: 2, trend: 2 },
      { id: 's3', name: 'Rahul Kumar', rollNumber: 'JEE-A-003', avgScore: 91, attendance: 94, rank: 3, trend: -1 },
      { id: 's4', name: 'Sneha Gupta', rollNumber: 'JEE-A-004', avgScore: 90, attendance: 97, rank: 4, trend: 4 },
      { id: 's5', name: 'Amit Singh', rollNumber: 'JEE-A-005', avgScore: 88, attendance: 92, rank: 5, trend: 1 },
    ],
    subjectPerformance: [
      { id: 'sub1', name: 'Physics', avgScore: 82, passPercentage: 91, topScorer: 'Arjun Sharma', topScore: 98 },
      { id: 'sub2', name: 'Chemistry', avgScore: 78, passPercentage: 88, topScorer: 'Priya Patel', topScore: 95 },
      { id: 'sub3', name: 'Mathematics', avgScore: 85, passPercentage: 93, topScorer: 'Rahul Kumar', topScore: 97 },
    ],
  };
};

type UseBatchDetailOptions = {
  batchId: string;
};

export function useBatchDetailQuery(options: UseBatchDetailOptions) {
  const customerId = useCustomerId();
  const { batchId } = options;

  return useQuery({
    queryKey: ['batch-detail', customerId, batchId],
    queryFn: async (): Promise<BatchDetailData> => {
      const supabase = getSupabaseClient();

      // Try to fetch by id first, then by batch_id if that fails
      // This handles both navigation patterns (by id or by batch_id)
      let batchRecord = null;
      let error = null;

      // First try by id
      const { data: byId, error: errorById } = await supabase
        .from('batch_performance')
        .select('*')
        .eq('customer_id', customerId)
        .eq('id', batchId)
        .single();

      if (!errorById && byId) {
        batchRecord = byId;
      } else {
        // Try by batch_id
        const { data: byBatchId, error: errorByBatchId } = await supabase
          .from('batch_performance')
          .select('*')
          .eq('customer_id', customerId)
          .eq('batch_id', batchId)
          .single();

        if (!errorByBatchId && byBatchId) {
          batchRecord = byBatchId;
        } else {
          error = errorByBatchId || errorById;
        }
      }

      if (error || !batchRecord) {
        console.warn('Error fetching batch detail:', error);
        return generateDemoData(batchId);
      }

      // Transform to BatchDetailData (in real app, would join with other tables)
      return {
        id: batchRecord.id,
        batchId: batchRecord.batch_id,
        name: batchRecord.batch_name,
        program: batchRecord.program,
        term: batchRecord.term || '2024-25',
        startDate: batchRecord.start_date || '2024-04-01',
        endDate: batchRecord.end_date || null,
        schedule: batchRecord.schedule || 'Mon-Sat, 9:00 AM - 1:00 PM',
        venue: batchRecord.venue || 'Block A',
        avgScore: Number(batchRecord.avg_score) || 0,
        passPercentage: Number(batchRecord.pass_percentage) || 0,
        studentCount: batchRecord.total_students || 0,
        testsCount: batchRecord.tests_conducted || 0,
        trend: Number(batchRecord.trend) || 0,
        rank: 1,
        attendance: Number(batchRecord.attendance) || 90,
        topScorer: batchRecord.top_scorer_id ? {
          id: batchRecord.top_scorer_id,
          name: batchRecord.top_scorer_name || 'Unknown',
          score: Number(batchRecord.top_score) || 0,
        } : null,
        teacher: null,
        recentTests: [],
        topStudents: [],
        subjectPerformance: [],
      };
    },
    enabled: !!customerId && !!batchId,
    staleTime: 1000 * 60 * 5,
  });
}
