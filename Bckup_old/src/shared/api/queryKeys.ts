/**
 * Query Keys Factory
 * Centralized query key management for TanStack Query
 *
 * Usage:
 * const { data } = useQuery({
 *   queryKey: queryKeys.attendance.byClass(classId, date),
 *   queryFn: () => fetchAttendance(classId, date),
 * });
 *
 * // Invalidate specific queries:
 * queryClient.invalidateQueries({ queryKey: queryKeys.attendance.byClass(classId, date) });
 * queryClient.invalidateQueries({ queryKey: queryKeys.attendance.all });
 */

export const queryKeys = {
  // ============================================================================
  // PARENT QUERIES
  // ============================================================================
  parent: {
    all: ['parent'] as const,
    profile: (parentId: string) => [...queryKeys.parent.all, 'profile', parentId] as const,
    children: (parentId: string) => [...queryKeys.parent.all, 'children', parentId] as const,
    notifications: (parentId: string) => [...queryKeys.parent.all, 'notifications', parentId] as const,
    financial: (parentId: string) => [...queryKeys.parent.all, 'financial', parentId] as const,
    dashboard: (parentId: string) => [...queryKeys.parent.all, 'dashboard', parentId] as const,
  },

  // ============================================================================
  // STUDENT QUERIES
  // ============================================================================
  student: {
    all: ['student'] as const,
    profile: (studentId: string) => [...queryKeys.student.all, 'profile', studentId] as const,
    byParent: (parentId: string) => [...queryKeys.student.all, 'byParent', parentId] as const,
    byClass: (classId: string) => [...queryKeys.student.all, 'byClass', classId] as const,
    byBatch: (batchId: string) => [...queryKeys.student.all, 'byBatch', batchId] as const,
    detail: (studentId: string) => [...queryKeys.student.all, 'detail', studentId] as const,
    dashboard: (studentId: string) => [...queryKeys.student.all, 'dashboard', studentId] as const,
    progress: (studentId: string) => [...queryKeys.student.all, 'progress', studentId] as const,
  },

  // ============================================================================
  // TEACHER QUERIES
  // ============================================================================
  teacher: {
    all: ['teacher'] as const,
    profile: (teacherId: string) => [...queryKeys.teacher.all, 'profile', teacherId] as const,
    classes: (teacherId: string) => [...queryKeys.teacher.all, 'classes', teacherId] as const,
    students: (teacherId: string) => [...queryKeys.teacher.all, 'students', teacherId] as const,
    dashboard: (teacherId: string) => [...queryKeys.teacher.all, 'dashboard', teacherId] as const,
    schedule: (teacherId: string, date: string) => [...queryKeys.teacher.all, 'schedule', teacherId, date] as const,
  },

  // ============================================================================
  // ATTENDANCE QUERIES
  // ============================================================================
  attendance: {
    all: ['attendance'] as const,
    byClass: (classId: string, date: string) =>
      [...queryKeys.attendance.all, 'class', classId, date] as const,
    byStudent: (studentId: string, month: string) =>
      [...queryKeys.attendance.all, 'student', studentId, month] as const,
    summary: (classId: string, month: string) =>
      [...queryKeys.attendance.all, 'summary', classId, month] as const,
    statistics: (classId: string, startDate: string, endDate: string) =>
      [...queryKeys.attendance.all, 'statistics', classId, startDate, endDate] as const,
  },

  // ============================================================================
  // PAYMENT QUERIES
  // ============================================================================
  payment: {
    all: ['payment'] as const,
    byParent: (parentId: string) => [...queryKeys.payment.all, 'parent', parentId] as const,
    invoice: (invoiceId: string) => [...queryKeys.payment.all, 'invoice', invoiceId] as const,
    pending: (parentId: string) => [...queryKeys.payment.all, 'pending', parentId] as const,
    overdue: (parentId: string) => [...queryKeys.payment.all, 'overdue', parentId] as const,
    history: (parentId: string, year?: number) =>
      [...queryKeys.payment.all, 'history', parentId, year] as const,
    summary: (parentId: string) => [...queryKeys.payment.all, 'summary', parentId] as const,
  },

  // ============================================================================
  // CLASS QUERIES
  // ============================================================================
  class: {
    all: ['class'] as const,
    detail: (classId: string) => [...queryKeys.class.all, 'detail', classId] as const,
    students: (classId: string) => [...queryKeys.class.all, 'students', classId] as const,
    timetable: (classId: string) => [...queryKeys.class.all, 'timetable', classId] as const,
    byTeacher: (teacherId: string) => [...queryKeys.class.all, 'byTeacher', teacherId] as const,
    byBatch: (batchId: string) => [...queryKeys.class.all, 'byBatch', batchId] as const,
    list: (filters?: Record<string, any>) => [...queryKeys.class.all, 'list', filters] as const,
  },

  // ============================================================================
  // BATCH QUERIES
  // ============================================================================
  batch: {
    all: ['batch'] as const,
    detail: (batchId: string) => [...queryKeys.batch.all, 'detail', batchId] as const,
    students: (batchId: string) => [...queryKeys.batch.all, 'students', batchId] as const,
    classes: (batchId: string) => [...queryKeys.batch.all, 'classes', batchId] as const,
    list: () => [...queryKeys.batch.all, 'list'] as const,
  },

  // ============================================================================
  // MESSAGE QUERIES
  // ============================================================================
  message: {
    all: ['message'] as const,
    threads: (userId: string) => [...queryKeys.message.all, 'threads', userId] as const,
    thread: (threadId: string) => [...queryKeys.message.all, 'thread', threadId] as const,
    unread: (userId: string) => [...queryKeys.message.all, 'unread', userId] as const,
    conversation: (userId: string, recipientId: string) =>
      [...queryKeys.message.all, 'conversation', userId, recipientId] as const,
  },

  // ============================================================================
  // NOTIFICATION QUERIES
  // ============================================================================
  notification: {
    all: ['notification'] as const,
    byUser: (userId: string) => [...queryKeys.notification.all, 'user', userId] as const,
    unread: (userId: string) => [...queryKeys.notification.all, 'unread', userId] as const,
    count: (userId: string) => [...queryKeys.notification.all, 'count', userId] as const,
  },

  // ============================================================================
  // ASSIGNMENT QUERIES
  // ============================================================================
  assignment: {
    all: ['assignment'] as const,
    byClass: (classId: string) => [...queryKeys.assignment.all, 'class', classId] as const,
    byStudent: (studentId: string) => [...queryKeys.assignment.all, 'student', studentId] as const,
    detail: (assignmentId: string) => [...queryKeys.assignment.all, 'detail', assignmentId] as const,
    submissions: (assignmentId: string) => [...queryKeys.assignment.all, 'submissions', assignmentId] as const,
    pending: (studentId: string) => [...queryKeys.assignment.all, 'pending', studentId] as const,
  },

  // ============================================================================
  // EXAM QUERIES
  // ============================================================================
  exam: {
    all: ['exam'] as const,
    byClass: (classId: string) => [...queryKeys.exam.all, 'class', classId] as const,
    byStudent: (studentId: string) => [...queryKeys.exam.all, 'student', studentId] as const,
    detail: (examId: string) => [...queryKeys.exam.all, 'detail', examId] as const,
    results: (examId: string) => [...queryKeys.exam.all, 'results', examId] as const,
    upcoming: (studentId: string) => [...queryKeys.exam.all, 'upcoming', studentId] as const,
  },

  // ============================================================================
  // TIMETABLE QUERIES
  // ============================================================================
  timetable: {
    all: ['timetable'] as const,
    byClass: (classId: string, date?: string) =>
      [...queryKeys.timetable.all, 'class', classId, date] as const,
    byTeacher: (teacherId: string, date?: string) =>
      [...queryKeys.timetable.all, 'teacher', teacherId, date] as const,
    byStudent: (studentId: string, date?: string) =>
      [...queryKeys.timetable.all, 'student', studentId, date] as const,
  },

  // ============================================================================
  // REPORT QUERIES
  // ============================================================================
  report: {
    all: ['report'] as const,
    student: (studentId: string, termId?: string) =>
      [...queryKeys.report.all, 'student', studentId, termId] as const,
    class: (classId: string, termId?: string) =>
      [...queryKeys.report.all, 'class', classId, termId] as const,
    attendance: (entityId: string, type: 'student' | 'class', month: string) =>
      [...queryKeys.report.all, 'attendance', entityId, type, month] as const,
    financial: (startDate: string, endDate: string) =>
      [...queryKeys.report.all, 'financial', startDate, endDate] as const,
  },

  // ============================================================================
  // ANALYTICS QUERIES
  // ============================================================================
  analytics: {
    all: ['analytics'] as const,
    dashboard: (role: string, userId: string) =>
      [...queryKeys.analytics.all, 'dashboard', role, userId] as const,
    performance: (studentId: string, subject?: string) =>
      [...queryKeys.analytics.all, 'performance', studentId, subject] as const,
    classPerformance: (classId: string, subject?: string) =>
      [...queryKeys.analytics.all, 'classPerformance', classId, subject] as const,
  },
};

/**
 * Helper type for query keys
 */
export type QueryKey = ReturnType<typeof queryKeys[keyof typeof queryKeys][keyof any]>;
