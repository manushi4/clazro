/**
 * Services Index
 * Centralized export for all Supabase API services
 * Phase 71: Comprehensive API Integration Layer
 */

// Core Configuration & Client
export { default as supabase } from '../lib/supabase';
export * from '../lib/supabase';

// Database Types
export * from '../types/database';

// Utilities
export {
  ErrorHandler,
  SupabaseError,
  errorHandler,
  handleSupabaseError,
  createErrorResponse,
  createSuccessResponse,
} from './utils/ErrorHandler';

export {
  ValidationHelper,
  ValidationSchemas,
} from './utils/ValidationHelper';

export {
  CacheManager,
  cacheManager,
  CacheKeys,
  CacheDurations,
  setCache,
  getCache,
  clearCache,
  invalidateUserCache,
} from './utils/CacheManager';

// Database Services
export {
  AuthService,
  authService,
  type LoginResult,
  type RegisterResult,
  type PasswordResetResult,
} from './database/AuthService';

export {
  StudentService,
  studentService,
} from './database/StudentService';

export {
  ClassService,
  classService,
} from './database/ClassService';

export {
  AssignmentService,
  assignmentService,
} from './database/AssignmentService';

export {
  NotificationService,
  notificationService,
} from './database/NotificationService';

// Real-time Services
export {
  RealtimeService,
  realtimeService,
  type ConnectionState,
  type SubscriptionCallback,
  type ChannelConfig,
} from './realtime/RealtimeService';

// Storage Services (Phase 73)
export {
  StorageService,
  storageService,
  FileValidator,
  MediaProcessor,
  UploadManager,
  CDNService,
  cdnService,
  type FileMetadata,
  type UploadProgress,
  type UploadOptions,
  type FileSearchFilters,
  type ValidationResult,
  type ProcessingOptions,
  type ProcessingResult,
  type UploadTask,
  type UploadResult,
  type ImageTransformOptions,
  type CacheOptions,
  type VideoStreamingOptions,
  STORAGE_BUCKETS,
  FILE_PATHS,
  FILE_TYPES,
  BUCKET_CONFIGS,
  PROCESSING_CONFIG,
  RESPONSIVE_BREAKPOINTS,
} from './storage';

// Service Collections for Easy Access
export const DatabaseServices = {
  auth: authService,
  student: studentService,
  class: classService,
  assignment: assignmentService,
  notification: notificationService,
} as const;

export const RealtimeServices = {
  realtime: realtimeService,
} as const;

export const StorageServices = {
  storage: storageService,
  cdn: cdnService,
  fileValidator: new FileValidator(),
  mediaProcessor: new MediaProcessor(),
  uploadManager: new UploadManager(),
} as const;

export const UtilityServices = {
  error: errorHandler,
  validation: ValidationHelper,
  cache: cacheManager,
} as const;

// All Services Combined
export const Services = {
  ...DatabaseServices,
  ...RealtimeServices,
  ...StorageServices,
  ...UtilityServices,
} as const;

// Service Health Check
export const performServicesHealthCheck = async (): Promise<{
  supabase: boolean;
  cache: boolean;
  realtime: boolean;
  overall: boolean;
}> => {
  try {
    // Test Supabase connection
    const { testSupabaseConnection } = await import('../lib/supabase');
    const supabaseResult = await testSupabaseConnection();
    const supabaseHealth = supabaseResult.success;

    // Test cache
    const cacheHealth = cacheManager.getStats().size >= 0; // Basic health check

    // Test realtime
    const realtimeHealth = realtimeService.getConnectionState() !== 'closed';

    const overall = supabaseHealth && cacheHealth;

    return {
      supabase: supabaseHealth,
      cache: cacheHealth,
      realtime: realtimeHealth,
      overall,
    };
  } catch (error) {
    console.error('Services health check failed:', error);
    return {
      supabase: false,
      cache: false,
      realtime: false,
      overall: false,
    };
  }
};

// Initialize Services
export const initializeServices = async (): Promise<void> => {
  try {
    console.log('🚀 Initializing Manushi Coaching Platform services...');

    // Test connections
    const health = await performServicesHealthCheck();
    
    if (health.overall) {
      console.log('✅ All services initialized successfully');
    } else {
      console.warn('⚠️ Some services failed to initialize:', health);
    }

    // Preload essential cache data (if user is authenticated)
    const session = await authService.getCurrentSession();
    if (session.data?.user?.id) {
      await cacheManager.preload([
        async () => {
          const profile = await authService.getProfile(session.data!.user!.id);
          if (profile.data) {
            await cacheManager.set(
              CacheKeys.userProfile(session.data!.user!.id),
              profile.data,
              { ttl: CacheDurations.PERSISTENT }
            );
          }
        },
      ]);
    }

  } catch (error) {
    console.error('❌ Failed to initialize services:', error);
    throw error;
  }
};

// Cleanup Services (for app shutdown)
export const cleanupServices = async (): Promise<void> => {
  try {
    console.log('🧹 Cleaning up services...');

    // Disconnect real-time connections
    await realtimeService.disconnectAll();

    // Clear sensitive cache data
    await cacheManager.clear();

    console.log('✅ Services cleanup completed');
  } catch (error) {
    console.error('❌ Failed to cleanup services:', error);
  }
};

// Import services for proper initialization
import { assignmentService } from './database/AssignmentService';
import { notificationService } from './database/NotificationService';

// Service Usage Examples and API Documentation
export const ServiceExamples = {
  // Authentication examples
  auth: {
    login: `
      const result = await authService.login('user@example.com', 'password');
      if (result.success) {
        console.log('Logged in user:', result.data.profile);
      }
    `,
    register: `
      const result = await authService.register(
        'newuser@example.com',
        'securePassword123',
        {
          full_name: 'John Doe',
          role: 'student',
          phone: '+1234567890'
        }
      );
    `,
  },
  
  // Student service examples
  student: {
    getDashboard: `
      const dashboard = await studentService.getDashboardData(userId);
      if (dashboard.success) {
        console.log('Upcoming classes:', dashboard.data.upcomingClasses);
        console.log('Pending assignments:', dashboard.data.pendingAssignments);
      }
    `,
    submitAssignment: `
      const submission = await studentService.submitAssignment(
        studentId,
        assignmentId,
        {
          content: { answer: 'My solution...' },
          attachments: [{ type: 'pdf', url: 'file.pdf' }]
        }
      );
    `,
  },
  
  // Class service examples
  class: {
    createClass: `
      const newClass = await classService.createClass(teacherId, {
        title: 'Advanced Mathematics',
        subject: 'Math',
        grade_level: '12th',
        scheduled_at: '2025-01-15T10:00:00Z',
        duration_minutes: 60,
        class_type: 'live'
      });
    `,
    recordAttendance: `
      await classService.recordAttendance(
        classId,
        studentId,
        'present',
        'Participated actively in discussion'
      );
    `,
  },
  
  // Assignment service examples
  assignment: {
    createAssignment: `
      const assignment = await assignmentService.createAssignment(teacherId, {
        title: 'Calculus Problem Set 1',
        description: 'Solve problems 1-20 from chapter 5',
        type: 'homework',
        class_id: classId,
        due_date: '2025-01-20T23:59:59Z',
        total_points: 100
      });
    `,
    gradeSubmission: `
      await assignmentService.gradeSubmission(
        submissionId,
        85,
        'Good work! Consider reviewing integration by parts.',
        teacherId
      );
    `,
  },
  
  // Notification service examples
  notification: {
    sendClassNotification: `
      await notificationService.sendClassNotification(
        classId,
        'class_starting',
        'Class Starting Soon',
        'Your Advanced Mathematics class starts in 10 minutes',
        teacherId
      );
    `,
    markAsRead: `
      await notificationService.markAsRead(notificationId, userId);
    `,
  },
  
  // Real-time service examples
  realtime: {
    subscribeToNotifications: `
      await realtimeService.subscribeToNotifications(
        userId,
        (payload) => {
          console.log('New notification:', payload.new);
          // Update UI with new notification
        }
      );
    `,
    subscribeToClassMessages: `
      await realtimeService.subscribeToClassMessages(
        classId,
        userId,
        (payload) => {
          if (payload.eventType === 'INSERT') {
            console.log('New message:', payload.new);
            // Add message to chat UI
          }
        }
      );
    `,
  },
};

// Comprehensive API Reference
export const ApiReference = {
  baseUrl: 'https://qrwroibhzgywaiecbcoa.supabase.co',
  features: {
    authentication: [
      'User registration and login',
      'Password reset and change',
      'OAuth integration (Google, Apple, GitHub)',
      'Profile management',
      'Role-based access control',
    ],
    studentFeatures: [
      'Dashboard with upcoming classes and assignments',
      'Assignment submission with file uploads',
      'Progress tracking and analytics',
      'Class enrollment management',
      'Academic summary and statistics',
    ],
    teacherFeatures: [
      'Class creation and management',
      'Assignment creation and grading',
      'Attendance tracking',
      'Student progress monitoring',
      'Analytics and reporting',
    ],
    classManagement: [
      'Live class scheduling',
      'Attendance recording',
      'Class analytics',
      'Enrollment management',
      'Class status tracking',
    ],
    assignmentSystem: [
      'Assignment creation with rich content',
      'Submission handling',
      'Automated grading preparation',
      'Feedback and comments',
      'Due date management',
    ],
    notifications: [
      'Real-time push notifications',
      'Email integration (planned)',
      'Bulk notification sending',
      'Notification categorization',
      'Read/unread status tracking',
    ],
    realTimeFeatures: [
      'Live chat in classes',
      'Real-time attendance updates',
      'Instant notifications',
      'Presence tracking',
      'Live collaboration',
    ],
  },
  errorHandling: {
    standardResponse: `{
      data: T | null,
      error: string | null,
      success: boolean,
      timestamp: Date
    }`,
    errorCategories: [
      'authentication',
      'authorization',
      'validation',
      'network',
      'database',
      'storage',
      'realtime',
      'business_logic',
      'unknown'
    ],
  },
  caching: {
    strategy: 'Client-side caching with TTL',
    durations: {
      SHORT: '1 minute',
      MEDIUM: '5 minutes',
      LONG: '30 minutes',
      PERSISTENT: '24 hours'
    },
    automaticInvalidation: 'On data mutations',
  },
};

// Default export
export default Services;