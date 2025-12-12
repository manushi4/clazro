/**
 * ContentManagementScreen - Phase 38.2: Content and Resource Management
 * Educational content administration with curriculum mapping, digital resource management,
 * content approval workflows, version control, and usage analytics
 * Manushi Coaching Platform
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';

// Import theme and styling
import { LightTheme } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';

const { width } = Dimensions.get('window');

// Type definitions for Content Management System
interface CurriculumMap {
  id: string;
  subject: string;
  grade: string;
  academicYear: string;
  totalUnits: number;
  completedUnits: number;
  units: CurriculumUnit[];
  lastUpdated: string;
  updatedBy: string;
  status: 'draft' | 'active' | 'archived';
}

interface CurriculumUnit {
  id: string;
  unitNumber: number;
  title: string;
  description: string;
  learningObjectives: string[];
  estimatedHours: number;
  resources: EducationalResource[];
  assessments: Assessment[];
  prerequisites?: string[];
  status: 'planned' | 'in_progress' | 'completed';
}

interface EducationalResource {
  id: string;
  title: string;
  description: string;
  type: 'document' | 'video' | 'audio' | 'interactive' | 'assessment' | 'presentation' | 'image';
  category: 'lesson_plan' | 'textbook' | 'exercise' | 'reference' | 'multimedia' | 'tool';
  subject: string;
  grade: string;
  fileUrl?: string;
  fileSize?: number; // in bytes
  duration?: number; // in minutes for video/audio
  thumbnailUrl?: string;
  tags: string[];
  visibility: 'public' | 'restricted' | 'private';
  approvalStatus: 'pending' | 'approved' | 'rejected' | 'revision_required';
  version: string;
  createdBy: string;
  createdAt: string;
  lastModified: string;
  modifiedBy: string;
  downloadCount: number;
  viewCount: number;
  rating: number;
  reviews: ResourceReview[];
  isActive: boolean;
}

interface ResourceReview {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface Assessment {
  id: string;
  title: string;
  type: 'quiz' | 'assignment' | 'project' | 'exam' | 'practical';
  maxScore: number;
  passingScore: number;
  timeLimit?: number; // in minutes
  instructions: string;
  resources: string[];
  isActive: boolean;
}

interface ContentApprovalWorkflow {
  id: string;
  resourceId: string;
  resourceTitle: string;
  submittedBy: string;
  submittedAt: string;
  reviewers: ApprovalReviewer[];
  currentStage: 'submitted' | 'under_review' | 'revision_required' | 'approved' | 'rejected';
  comments: ApprovalComment[];
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
}

interface ApprovalReviewer {
  userId: string;
  userName: string;
  role: string;
  status: 'pending' | 'approved' | 'rejected' | 'revision_required';
  reviewedAt?: string;
  comments?: string;
}

interface ApprovalComment {
  id: string;
  userId: string;
  userName: string;
  comment: string;
  timestamp: string;
  isInternal: boolean;
}

interface VersionControl {
  id: string;
  resourceId: string;
  version: string;
  changes: string[];
  changedBy: string;
  changedAt: string;
  fileUrl: string;
  isActive: boolean;
  parentVersion?: string;
  mergedFrom?: string[];
}

interface ContentAnalytics {
  id: string;
  resourceId: string;
  resourceTitle: string;
  period: 'day' | 'week' | 'month' | 'year';
  views: number;
  downloads: number;
  uniqueUsers: number;
  averageRating: number;
  engagementTime: number; // in minutes
  completionRate: number; // percentage
  topViewers: UserEngagement[];
  deviceBreakdown: DeviceUsage[];
  geographicDistribution: GeographicUsage[];
}

interface UserEngagement {
  userId: string;
  userName: string;
  role: string;
  views: number;
  downloads: number;
  engagementTime: number;
  lastAccessed: string;
}

interface DeviceUsage {
  device: 'mobile' | 'tablet' | 'desktop';
  count: number;
  percentage: number;
}

interface GeographicUsage {
  location: string;
  count: number;
  percentage: number;
}

interface ContentManagementScreenProps {
  adminId: string;
  onNavigate: (screen: string) => void;
}

const ContentManagementScreen: React.FC<ContentManagementScreenProps> = ({
  adminId,
  onNavigate,
}) => {
  // State management
  const [activeTab, setActiveTab] = useState<'curriculum' | 'resources' | 'approval' | 'versions' | 'analytics'>('curriculum');
  const [curriculumMaps, setCurriculumMaps] = useState<CurriculumMap[]>([]);
  const [resources, setResources] = useState<EducationalResource[]>([]);
  const [approvalWorkflows, setApprovalWorkflows] = useState<ContentApprovalWorkflow[]>([]);
  const [versionHistory, setVersionHistory] = useState<VersionControl[]>([]);
  const [contentAnalytics, setContentAnalytics] = useState<ContentAnalytics[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState<string>('');
  const [filterGrade, setFilterGrade] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedResource, setSelectedResource] = useState<EducationalResource | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<ContentApprovalWorkflow | null>(null);

  // Initialize data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load curriculum mapping data
      const curriculumData: CurriculumMap[] = [
        {
          id: 'curr_001',
          subject: 'Mathematics',
          grade: '10th Grade',
          academicYear: '2024-2025',
          totalUnits: 12,
          completedUnits: 8,
          units: [
            {
              id: 'unit_001',
              unitNumber: 1,
              title: 'Linear Equations',
              description: 'Introduction to linear equations and their applications',
              learningObjectives: [
                'Solve linear equations in one variable',
                'Graph linear equations',
                'Apply linear equations to real-world problems'
              ],
              estimatedHours: 15,
              resources: [],
              assessments: [
                {
                  id: 'assess_001',
                  title: 'Linear Equations Quiz',
                  type: 'quiz',
                  maxScore: 100,
                  passingScore: 70,
                  timeLimit: 45,
                  instructions: 'Complete all questions within the time limit',
                  resources: ['textbook_ch1', 'practice_problems'],
                  isActive: true,
                }
              ],
              status: 'completed',
            },
            {
              id: 'unit_002',
              unitNumber: 2,
              title: 'Quadratic Equations',
              description: 'Solving quadratic equations using various methods',
              learningObjectives: [
                'Solve quadratic equations by factoring',
                'Use the quadratic formula',
                'Complete the square method'
              ],
              estimatedHours: 20,
              resources: [],
              assessments: [],
              prerequisites: ['unit_001'],
              status: 'in_progress',
            },
          ],
          lastUpdated: '2024-11-15T10:00:00Z',
          updatedBy: adminId,
          status: 'active',
        },
        {
          id: 'curr_002',
          subject: 'Physics',
          grade: '11th Grade',
          academicYear: '2024-2025',
          totalUnits: 10,
          completedUnits: 5,
          units: [],
          lastUpdated: '2024-10-20T14:30:00Z',
          updatedBy: 'teacher_001',
          status: 'active',
        },
      ];

      // Load educational resources data
      const resourcesData: EducationalResource[] = [
        {
          id: 'res_001',
          title: 'Introduction to Algebra - Video Series',
          description: 'Comprehensive video series covering basic algebraic concepts',
          type: 'video',
          category: 'lesson_plan',
          subject: 'Mathematics',
          grade: '9th Grade',
          fileUrl: 'https://content.manushi.edu/videos/algebra-intro.mp4',
          fileSize: 524288000, // 500MB
          duration: 45,
          thumbnailUrl: 'https://content.manushi.edu/thumbnails/algebra-intro.jpg',
          tags: ['algebra', 'mathematics', 'introduction', 'video'],
          visibility: 'public',
          approvalStatus: 'approved',
          version: '2.1',
          createdBy: 'teacher_001',
          createdAt: '2024-09-01T08:00:00Z',
          lastModified: '2024-11-01T10:30:00Z',
          modifiedBy: 'teacher_001',
          downloadCount: 1247,
          viewCount: 3456,
          rating: 4.7,
          reviews: [
            {
              id: 'rev_001',
              userId: 'student_001',
              userName: 'Alex Johnson',
              userRole: 'student',
              rating: 5,
              comment: 'Very helpful and easy to understand!',
              createdAt: '2024-11-02T14:15:00Z',
            },
            {
              id: 'rev_002',
              userId: 'teacher_002',
              userName: 'Dr. Sarah Williams',
              userRole: 'teacher',
              rating: 4,
              comment: 'Good content, could use more examples.',
              createdAt: '2024-11-05T09:30:00Z',
            },
          ],
          isActive: true,
        },
        {
          id: 'res_002',
          title: 'Physics Lab Manual - Mechanics',
          description: 'Laboratory experiments and procedures for mechanics concepts',
          type: 'document',
          category: 'reference',
          subject: 'Physics',
          grade: '11th Grade',
          fileUrl: 'https://content.manushi.edu/documents/physics-lab-manual.pdf',
          fileSize: 15728640, // 15MB
          tags: ['physics', 'laboratory', 'mechanics', 'experiments'],
          visibility: 'restricted',
          approvalStatus: 'pending',
          version: '1.0',
          createdBy: 'teacher_003',
          createdAt: '2024-11-20T16:00:00Z',
          lastModified: '2024-11-20T16:00:00Z',
          modifiedBy: 'teacher_003',
          downloadCount: 0,
          viewCount: 12,
          rating: 0,
          reviews: [],
          isActive: true,
        },
        {
          id: 'res_003',
          title: 'Interactive Chemistry Simulator',
          description: 'Web-based chemistry simulation tool for virtual experiments',
          type: 'interactive',
          category: 'tool',
          subject: 'Chemistry',
          grade: '12th Grade',
          fileUrl: 'https://tools.manushi.edu/chemistry-sim',
          tags: ['chemistry', 'simulation', 'interactive', 'experiments'],
          visibility: 'public',
          approvalStatus: 'approved',
          version: '3.2',
          createdBy: 'teacher_004',
          createdAt: '2024-08-15T12:00:00Z',
          lastModified: '2024-11-10T08:45:00Z',
          modifiedBy: 'developer_001',
          downloadCount: 0, // Not applicable for interactive tools
          viewCount: 5678,
          rating: 4.9,
          reviews: [
            {
              id: 'rev_003',
              userId: 'student_002',
              userName: 'Maria Garcia',
              userRole: 'student',
              rating: 5,
              comment: 'Amazing tool! Makes chemistry come alive.',
              createdAt: '2024-11-12T11:20:00Z',
            },
          ],
          isActive: true,
        },
      ];

      // Load approval workflows data
      const approvalData: ContentApprovalWorkflow[] = [
        {
          id: 'wf_001',
          resourceId: 'res_002',
          resourceTitle: 'Physics Lab Manual - Mechanics',
          submittedBy: 'teacher_003',
          submittedAt: '2024-11-20T16:00:00Z',
          reviewers: [
            {
              userId: 'admin_001',
              userName: 'Jennifer Anderson',
              role: 'admin',
              status: 'pending',
            },
            {
              userId: 'head_physics',
              userName: 'Dr. Robert Chen',
              role: 'department_head',
              status: 'pending',
            },
          ],
          currentStage: 'under_review',
          comments: [
            {
              id: 'comm_001',
              userId: 'teacher_003',
              userName: 'Dr. Lisa Park',
              comment: 'Updated lab manual with new safety protocols and modern equipment procedures.',
              timestamp: '2024-11-20T16:05:00Z',
              isInternal: false,
            },
          ],
        },
        {
          id: 'wf_002',
          resourceId: 'res_004',
          resourceTitle: 'Advanced Calculus Problem Set',
          submittedBy: 'teacher_002',
          submittedAt: '2024-11-18T14:30:00Z',
          reviewers: [
            {
              userId: 'admin_001',
              userName: 'Jennifer Anderson',
              role: 'admin',
              status: 'approved',
              reviewedAt: '2024-11-19T10:15:00Z',
              comments: 'Excellent problem set, well structured.',
            },
            {
              userId: 'head_math',
              userName: 'Dr. Michael Thompson',
              role: 'department_head',
              status: 'revision_required',
              reviewedAt: '2024-11-19T15:45:00Z',
              comments: 'Please add more worked examples for complex problems.',
            },
          ],
          currentStage: 'revision_required',
          comments: [
            {
              id: 'comm_002',
              userId: 'teacher_002',
              userName: 'Prof. Sarah Williams',
              comment: 'Comprehensive problem set for advanced calculus students.',
              timestamp: '2024-11-18T14:35:00Z',
              isInternal: false,
            },
            {
              id: 'comm_003',
              userId: 'head_math',
              userName: 'Dr. Michael Thompson',
              comment: 'Internal note: Check alignment with curriculum standards.',
              timestamp: '2024-11-19T15:50:00Z',
              isInternal: true,
            },
          ],
        },
      ];

      // Load version history data
      const versionData: VersionControl[] = [
        {
          id: 'ver_001',
          resourceId: 'res_001',
          version: '2.1',
          changes: ['Updated examples in chapter 3', 'Fixed audio sync issues', 'Added closed captions'],
          changedBy: 'teacher_001',
          changedAt: '2024-11-01T10:30:00Z',
          fileUrl: 'https://content.manushi.edu/videos/algebra-intro-v2.1.mp4',
          isActive: true,
          parentVersion: '2.0',
        },
        {
          id: 'ver_002',
          resourceId: 'res_001',
          version: '2.0',
          changes: ['Major content restructure', 'Added practice problems', 'Improved video quality'],
          changedBy: 'teacher_001',
          changedAt: '2024-10-01T08:15:00Z',
          fileUrl: 'https://content.manushi.edu/videos/algebra-intro-v2.0.mp4',
          isActive: false,
          parentVersion: '1.5',
        },
        {
          id: 'ver_003',
          resourceId: 'res_003',
          version: '3.2',
          changes: ['Added new reaction simulations', 'Fixed periodic table display bug', 'Performance optimizations'],
          changedBy: 'developer_001',
          changedAt: '2024-11-10T08:45:00Z',
          fileUrl: 'https://tools.manushi.edu/chemistry-sim',
          isActive: true,
          parentVersion: '3.1',
        },
      ];

      // Load content analytics data
      const analyticsData: ContentAnalytics[] = [
        {
          id: 'ana_001',
          resourceId: 'res_001',
          resourceTitle: 'Introduction to Algebra - Video Series',
          period: 'month',
          views: 3456,
          downloads: 1247,
          uniqueUsers: 892,
          averageRating: 4.7,
          engagementTime: 38.5,
          completionRate: 78.3,
          topViewers: [
            {
              userId: 'student_001',
              userName: 'Alex Johnson',
              role: 'student',
              views: 15,
              downloads: 3,
              engagementTime: 145,
              lastAccessed: '2024-12-02T14:30:00Z',
            },
            {
              userId: 'teacher_002',
              userName: 'Prof. Sarah Williams',
              role: 'teacher',
              views: 8,
              downloads: 2,
              engagementTime: 67,
              lastAccessed: '2024-12-01T10:15:00Z',
            },
          ],
          deviceBreakdown: [
            { device: 'mobile', count: 1890, percentage: 54.7 },
            { device: 'desktop', count: 1234, percentage: 35.7 },
            { device: 'tablet', count: 332, percentage: 9.6 },
          ],
          geographicDistribution: [
            { location: 'New York', count: 1456, percentage: 42.1 },
            { location: 'California', count: 987, percentage: 28.6 },
            { location: 'Texas', count: 543, percentage: 15.7 },
            { location: 'Others', count: 470, percentage: 13.6 },
          ],
        },
        {
          id: 'ana_002',
          resourceId: 'res_003',
          resourceTitle: 'Interactive Chemistry Simulator',
          period: 'month',
          views: 5678,
          downloads: 0,
          uniqueUsers: 1234,
          averageRating: 4.9,
          engagementTime: 52.3,
          completionRate: 85.7,
          topViewers: [],
          deviceBreakdown: [
            { device: 'desktop', count: 3407, percentage: 60.0 },
            { device: 'tablet', count: 1702, percentage: 30.0 },
            { device: 'mobile', count: 569, percentage: 10.0 },
          ],
          geographicDistribution: [
            { location: 'California', count: 2271, percentage: 40.0 },
            { location: 'New York', count: 1703, percentage: 30.0 },
            { location: 'Others', count: 1704, percentage: 30.0 },
          ],
        },
      ];

      setCurriculumMaps(curriculumData);
      setResources(resourcesData);
      setApprovalWorkflows(approvalData);
      setVersionHistory(versionData);
      setContentAnalytics(analyticsData);
    } catch (error) {
      Alert.alert('error', 'Failed to load content management data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Content management actions
  const handleApproveResource = (workflowId: string) => {
    Alert.alert(
      'Approve Resource',
      'Are you sure you want to approve this resource?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: () => {
            setApprovalWorkflows(workflows => workflows.map(workflow =>
              workflow.id === workflowId
                ? {
                    ...workflow,
                    currentStage: 'approved' as const,
                    approvedAt: new Date().toISOString(),
                    approvedBy: adminId
                  }
                : workflow
            ));
            Alert.alert('success', 'Resource approved successfully');
          }
        }
      ]
    );
  };

  const handleRejectResource = (workflowId: string) => {
    Alert.prompt(
      'Reject Resource',
      'Please provide a reason for rejection:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          onPress: (reason) => {
            setApprovalWorkflows(workflows => workflows.map(workflow =>
              workflow.id === workflowId
                ? {
                    ...workflow,
                    currentStage: 'rejected' as const,
                    rejectionReason: reason || 'No reason provided'
                  }
                : workflow
            ));
            Alert.alert('Resource Rejected', 'The resource has been rejected and the author has been notified.');
          }
        }
      ]
    );
  };

  const handleBulkApproval = () => {
    const pendingWorkflows = approvalWorkflows.filter(wf => wf.currentStage === 'under_review');
    if (pendingWorkflows.length === 0) {
      Alert.alert('No Pending Resources', 'There are no resources pending approval.');
      return;
    }

    Alert.alert(
      'Bulk Approval',
      `Are you sure you want to approve ${pendingWorkflows.length} pending resources?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve All',
          onPress: () => {
            setApprovalWorkflows(workflows => workflows.map(workflow =>
              workflow.currentStage === 'under_review'
                ? {
                    ...workflow,
                    currentStage: 'approved' as const,
                    approvedAt: new Date().toISOString(),
                    approvedBy: adminId
                  }
                : workflow
            ));
            Alert.alert('success', `${pendingWorkflows.length} resources approved successfully`);
          }
        }
      ]
    );
  };

  // Filter data based on search and filters
  const filteredResources = resources.filter((resource) => {
    const matchesSearch = searchQuery === '' || 
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesSubject = filterSubject === '' || resource.subject === filterSubject;
    const matchesGrade = filterGrade === '' || resource.grade === filterGrade;
    
    return matchesSearch && matchesSubject && matchesGrade;
  });

  const filteredWorkflows = approvalWorkflows.filter((workflow) => {
    return searchQuery === '' || 
      workflow.resourceTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      workflow.submittedBy.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Helper functions
  const getApprovalStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return LightTheme.Success;
      case 'pending': return LightTheme.Warning;
      case 'rejected': return LightTheme.Error;
      case 'revision_required': return LightTheme.Info;
      default: return LightTheme.OnSurfaceVariant;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getResourceTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return '🎥';
      case 'document': return '📄';
      case 'audio': return '🎵';
      case 'interactive': return '🔧';
      case 'assessment': return '📝';
      case 'presentation': return '📊';
      case 'image': return '🖼️';
      default: return '📁';
    }
  };

  // Render functions
  const renderCurriculumItem = ({ item: curriculum }: { item: CurriculumMap }) => (
    <View style={styles.curriculumCard}>
      <View style={styles.curriculumHeader}>
        <View style={styles.curriculumInfo}>
          <Text style={styles.curriculumTitle}>
            {curriculum.subject} - {curriculum.grade}
          </Text>
          <Text style={styles.curriculumSubtitle}>
            Academic Year: {curriculum.academicYear}
          </Text>
          <Text style={styles.curriculumMeta}>
            Last updated: {new Date(curriculum.lastUpdated).toLocaleDateString()} by {curriculum.updatedBy}
          </Text>
        </View>
        <View style={[styles.statusTag, { backgroundColor: getApprovalStatusColor(curriculum.status) }]}>
          <Text style={styles.statusTagText}>{curriculum.status.toUpperCase()}</Text>
        </View>
      </View>
      
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          Progress: {curriculum.completedUnits}/{curriculum.totalUnits} units
        </Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, {
            width: `${(curriculum.completedUnits / curriculum.totalUnits) * 100}%`
          }]} />
        </View>
      </View>

      <View style={styles.curriculumActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => Alert.alert('Edit Curriculum', `Edit ${curriculum.subject} curriculum`)}
        >
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.viewButton]}
          onPress={() => Alert.alert('View Details', `View detailed curriculum for ${curriculum.subject}`)}
        >
          <Text style={styles.actionButtonText}>View Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderResourceItem = ({ item: resource }: { item: EducationalResource }) => (
    <View style={styles.resourceCard}>
      <View style={styles.resourceHeader}>
        <View style={styles.resourceInfo}>
          <View style={styles.resourceTitleRow}>
            <Text style={styles.resourceIcon}>{getResourceTypeIcon(resource.type)}</Text>
            <Text style={styles.resourceTitle}>{resource.title}</Text>
          </View>
          <Text style={styles.resourceDescription}>{resource.description}</Text>
          <View style={styles.resourceMeta}>
            <Text style={styles.resourceMetaText}>{resource.subject} • {resource.grade}</Text>
            <Text style={styles.resourceMetaText}>v{resource.version}</Text>
            {resource.fileSize && (
              <Text style={styles.resourceMetaText}>{formatFileSize(resource.fileSize)}</Text>
            )}
            {resource.duration && (
              <Text style={styles.resourceMetaText}>{resource.duration} min</Text>
            )}
          </View>
        </View>
        <View style={[styles.statusTag, { backgroundColor: getApprovalStatusColor(resource.approvalStatus) }]}>
          <Text style={styles.statusTagText}>{resource.approvalStatus.replace('_', ' ').toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.resourceStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{resource.viewCount.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Views</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{resource.downloadCount.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Downloads</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>⭐ {resource.rating.toFixed(1)}</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{resource.reviews.length}</Text>
          <Text style={styles.statLabel}>Reviews</Text>
        </View>
      </View>

      <View style={styles.resourceTags}>
        {resource.tags.slice(0, 4).map((tag, index) => (
          <View key={index} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
        {resource.tags.length > 4 && (
          <Text style={styles.moreTagsText}>+{resource.tags.length - 4} more</Text>
        )}
      </View>

      <View style={styles.resourceActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => {
            setSelectedResource(resource);
            setShowResourceModal(true);
          }}
        >
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.analyticsButton]}
          onPress={() => Alert.alert('Analytics', `View analytics for ${resource.title}`)}
        >
          <Text style={styles.actionButtonText}>Analytics</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.versionsButton]}
          onPress={() => Alert.alert('Versions', `View version history for ${resource.title}`)}
        >
          <Text style={styles.actionButtonText}>Versions</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderApprovalItem = ({ item: workflow }: { item: ContentApprovalWorkflow }) => (
    <View style={styles.approvalCard}>
      <View style={styles.approvalHeader}>
        <View style={styles.approvalInfo}>
          <Text style={styles.approvalTitle}>{workflow.resourceTitle}</Text>
          <Text style={styles.approvalSubtitle}>
            Submitted by: {workflow.submittedBy}
          </Text>
          <Text style={styles.approvalMeta}>
            Submitted: {new Date(workflow.submittedAt).toLocaleString()}
          </Text>
        </View>
        <View style={[styles.statusTag, { backgroundColor: getApprovalStatusColor(workflow.currentStage) }]}>
          <Text style={styles.statusTagText}>{workflow.currentStage.replace('_', ' ').toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.reviewersContainer}>
        <Text style={styles.reviewersTitle}>Reviewers:</Text>
        {workflow.reviewers.map((reviewer, index) => (
          <View key={index} style={styles.reviewerItem}>
            <Text style={styles.reviewerName}>{reviewer.userName} ({reviewer.role})</Text>
            <View style={[styles.reviewerStatus, { 
              backgroundColor: getApprovalStatusColor(reviewer.status) 
            }]}>
              <Text style={styles.reviewerStatusText}>{reviewer.status.replace('_', ' ').toUpperCase()}</Text>
            </View>
          </View>
        ))}
      </View>

      {workflow.comments.length > 0 && (
        <View style={styles.commentsContainer}>
          <Text style={styles.commentsTitle}>Latest Comment:</Text>
          <Text style={styles.commentText}>
            "{workflow.comments[workflow.comments.length - 1].comment}"
          </Text>
          <Text style={styles.commentMeta}>
            - {workflow.comments[workflow.comments.length - 1].userName}
          </Text>
        </View>
      )}

      {workflow.currentStage === 'under_review' && (
        <View style={styles.approvalActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => handleApproveResource(workflow.id)}
          >
            <Text style={styles.actionButtonText}>Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleRejectResource(workflow.id)}
          >
            <Text style={styles.actionButtonText}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.reviewButton]}
            onPress={() => {
              setSelectedWorkflow(workflow);
              setShowApprovalModal(true);
            }}
          >
            <Text style={styles.actionButtonText}>Review</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderAnalyticsItem = ({ item: analytics }: { item: ContentAnalytics }) => (
    <View style={styles.analyticsCard}>
      <Text style={styles.analyticsTitle}>{analytics.resourceTitle}</Text>
      
      <View style={styles.analyticsGrid}>
        <View style={styles.analyticsItem}>
          <Text style={styles.analyticsValue}>{analytics.views.toLocaleString()}</Text>
          <Text style={styles.analyticsLabel}>Views</Text>
        </View>
        <View style={styles.analyticsItem}>
          <Text style={styles.analyticsValue}>{analytics.uniqueUsers.toLocaleString()}</Text>
          <Text style={styles.analyticsLabel}>Unique Users</Text>
        </View>
        <View style={styles.analyticsItem}>
          <Text style={styles.analyticsValue}>{analytics.engagementTime.toFixed(1)}m</Text>
          <Text style={styles.analyticsLabel}>Avg Time</Text>
        </View>
        <View style={styles.analyticsItem}>
          <Text style={styles.analyticsValue}>{analytics.completionRate.toFixed(1)}%</Text>
          <Text style={styles.analyticsLabel}>Completion</Text>
        </View>
      </View>

      <View style={styles.deviceBreakdown}>
        <Text style={styles.breakdownTitle}>Device Usage:</Text>
        {analytics.deviceBreakdown.map((device, index) => (
          <View key={index} style={styles.deviceItem}>
            <Text style={styles.deviceLabel}>
              {device.device.charAt(0).toUpperCase() + device.device.slice(1)}
            </Text>
            <View style={styles.deviceBar}>
              <View style={[styles.deviceBarFill, {
                width: `${device.percentage}%`,
                backgroundColor: index === 0 ? LightTheme.Primary : index === 1 ? LightTheme.Success : LightTheme.Warning
              }]} />
            </View>
            <Text style={styles.devicePercentage}>{device.percentage.toFixed(1)}%</Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => onNavigate('back')}
        >
          <Text style={styles.backButtonText}>← Admin Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Content Management</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => Alert.alert('Add Content', 'Upload new educational resource')}
        >
          <Text style={styles.addButtonText}>📁 Upload</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {['curriculum', 'resources', 'approval', 'versions', 'analytics'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              activeTab === tab && styles.activeTab
            ]}
            onPress={() => setActiveTab(tab as any)}
          >
            <Text style={[
              styles.tabText,
              activeTab === tab && styles.activeTabText
            ]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search and Filters */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={`Search ${activeTab}...`}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={LightTheme.OnSurfaceVariant}
        />
        {activeTab === 'approval' && (
          <TouchableOpacity
            style={styles.bulkApprovalButton}
            onPress={handleBulkApproval}
          >
            <Text style={styles.bulkApprovalButtonText}>✓ Bulk Approve</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {activeTab === 'curriculum' && (
          <FlatList
            data={curriculumMaps}
            keyExtractor={(item) => item.id}
            renderItem={renderCurriculumItem}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}

        {activeTab === 'resources' && (
          <FlatList
            data={filteredResources}
            keyExtractor={(item) => item.id}
            renderItem={renderResourceItem}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}

        {activeTab === 'approval' && (
          <FlatList
            data={filteredWorkflows}
            keyExtractor={(item) => item.id}
            renderItem={renderApprovalItem}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}

        {activeTab === 'versions' && (
          <View style={styles.versionContainer}>
            <Text style={styles.sectionTitle}>Version Control</Text>
            {versionHistory.map((version) => (
              <View key={version.id} style={styles.versionCard}>
                <View style={styles.versionHeader}>
                  <Text style={styles.versionTitle}>
                    Version {version.version}
                  </Text>
                  <Text style={styles.versionDate}>
                    {new Date(version.changedAt).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.versionAuthor}>
                  Changed by: {version.changedBy}
                </Text>
                <View style={styles.changesContainer}>
                  <Text style={styles.changesTitle}>Changes:</Text>
                  {version.changes.map((change, index) => (
                    <Text key={index} style={styles.changeText}>• {change}</Text>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'analytics' && (
          <FlatList
            data={contentAnalytics}
            keyExtractor={(item) => item.id}
            renderItem={renderAnalyticsItem}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LightTheme.Background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    backgroundColor: LightTheme.Surface,
    borderBottomWidth: 1,
    borderBottomColor: LightTheme.Outline,
  },
  backButton: {
    padding: Spacing.XS,
  },
  backButtonText: {
    ...Typography.bodyMedium,
    color: LightTheme.Primary,
    fontWeight: '500',
  },
  headerTitle: {
    ...Typography.headlineMedium,
    color: LightTheme.OnSurface,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: LightTheme.Primary,
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
  },
  addButtonText: {
    ...Typography.bodyMedium,
    color: LightTheme.Surface,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: LightTheme.Surface,
    paddingHorizontal: Spacing.MD,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.SM,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: LightTheme.Primary,
  },
  tabText: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
    fontWeight: '500',
  },
  activeTabText: {
    color: LightTheme.Primary,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    backgroundColor: LightTheme.Surface,
    alignItems: 'center',
    gap: Spacing.SM,
  },
  searchInput: {
    flex: 1,
    ...Typography.bodyMedium,
    backgroundColor: LightTheme.Background,
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    borderRadius: BorderRadius.SM,
    borderWidth: 1,
    borderColor: LightTheme.Outline,
    color: LightTheme.OnSurface,
  },
  bulkApprovalButton: {
    backgroundColor: LightTheme.Success,
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    borderRadius: BorderRadius.SM,
  },
  bulkApprovalButtonText: {
    ...Typography.bodyMedium,
    color: LightTheme.Surface,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: Spacing.MD,
  },
  sectionTitle: {
    ...Typography.headlineSmall,
    color: LightTheme.OnSurface,
    fontWeight: '600',
    marginBottom: Spacing.MD,
  },
  // Curriculum styles
  curriculumCard: {
    backgroundColor: LightTheme.Surface,
    padding: Spacing.MD,
    borderRadius: BorderRadius.SM,
    borderWidth: 1,
    borderColor: LightTheme.Outline,
  },
  curriculumHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.SM,
  },
  curriculumInfo: {
    flex: 1,
    marginRight: Spacing.MD,
  },
  curriculumTitle: {
    ...Typography.bodyMedium,
    color: LightTheme.OnSurface,
    fontWeight: '600',
    marginBottom: Spacing.XS / 2,
  },
  curriculumSubtitle: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.XS / 2,
  },
  curriculumMeta: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
  },
  progressContainer: {
    marginBottom: Spacing.SM,
  },
  progressText: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.XS,
  },
  progressBar: {
    height: 4,
    backgroundColor: LightTheme.Outline,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: LightTheme.Success,
  },
  curriculumActions: {
    flexDirection: 'row',
    gap: Spacing.SM,
  },
  // Resource styles
  resourceCard: {
    backgroundColor: LightTheme.Surface,
    padding: Spacing.MD,
    borderRadius: BorderRadius.SM,
    borderWidth: 1,
    borderColor: LightTheme.Outline,
  },
  resourceHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.SM,
  },
  resourceInfo: {
    flex: 1,
    marginRight: Spacing.MD,
  },
  resourceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.XS / 2,
  },
  resourceIcon: {
    fontSize: 20,
    marginRight: Spacing.XS,
  },
  resourceTitle: {
    ...Typography.bodyMedium,
    color: LightTheme.OnSurface,
    fontWeight: '600',
    flex: 1,
  },
  resourceDescription: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.XS,
  },
  resourceMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.SM,
  },
  resourceMetaText: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
  },
  resourceStats: {
    flexDirection: 'row',
    marginBottom: Spacing.SM,
    gap: Spacing.MD,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurface,
    fontWeight: '600',
  },
  statLabel: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
    marginTop: 2,
  },
  resourceTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.XS,
    marginBottom: Spacing.SM,
  },
  tag: {
    backgroundColor: LightTheme.primaryContainer,
    paddingHorizontal: Spacing.XS,
    paddingVertical: 2,
    borderRadius: BorderRadius.XS,
  },
  tagText: {
    ...Typography.bodySmall,
    color: LightTheme.Primary,
    fontWeight: '500',
  },
  moreTagsText: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
    alignSelf: 'center',
  },
  resourceActions: {
    flexDirection: 'row',
    gap: Spacing.SM,
  },
  // Approval styles
  approvalCard: {
    backgroundColor: LightTheme.Surface,
    padding: Spacing.MD,
    borderRadius: BorderRadius.SM,
    borderWidth: 1,
    borderColor: LightTheme.Outline,
  },
  approvalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.SM,
  },
  approvalInfo: {
    flex: 1,
    marginRight: Spacing.MD,
  },
  approvalTitle: {
    ...Typography.bodyMedium,
    color: LightTheme.OnSurface,
    fontWeight: '600',
    marginBottom: Spacing.XS / 2,
  },
  approvalSubtitle: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.XS / 2,
  },
  approvalMeta: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
  },
  reviewersContainer: {
    marginBottom: Spacing.SM,
  },
  reviewersTitle: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurface,
    fontWeight: '600',
    marginBottom: Spacing.XS,
  },
  reviewerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.XS / 2,
  },
  reviewerName: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
    flex: 1,
  },
  reviewerStatus: {
    paddingHorizontal: Spacing.XS,
    paddingVertical: 1,
    borderRadius: BorderRadius.XS,
  },
  reviewerStatusText: {
    ...Typography.bodySmall,
    color: LightTheme.Surface,
    fontWeight: '500',
  },
  commentsContainer: {
    backgroundColor: LightTheme.Background,
    padding: Spacing.SM,
    borderRadius: BorderRadius.XS,
    marginBottom: Spacing.SM,
  },
  commentsTitle: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurface,
    fontWeight: '600',
    marginBottom: Spacing.XS / 2,
  },
  commentText: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
    fontStyle: 'italic',
    marginBottom: Spacing.XS / 2,
  },
  commentMeta: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
  },
  approvalActions: {
    flexDirection: 'row',
    gap: Spacing.SM,
  },
  // Version styles
  versionContainer: {
    gap: Spacing.SM,
  },
  versionCard: {
    backgroundColor: LightTheme.Surface,
    padding: Spacing.MD,
    borderRadius: BorderRadius.SM,
    borderWidth: 1,
    borderColor: LightTheme.Outline,
  },
  versionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.XS,
  },
  versionTitle: {
    ...Typography.bodyMedium,
    color: LightTheme.OnSurface,
    fontWeight: '600',
  },
  versionDate: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
  },
  versionAuthor: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.SM,
  },
  changesContainer: {
    backgroundColor: LightTheme.Background,
    padding: Spacing.SM,
    borderRadius: BorderRadius.XS,
  },
  changesTitle: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurface,
    fontWeight: '600',
    marginBottom: Spacing.XS,
  },
  changeText: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: 2,
  },
  // Analytics styles
  analyticsCard: {
    backgroundColor: LightTheme.Surface,
    padding: Spacing.MD,
    borderRadius: BorderRadius.SM,
    borderWidth: 1,
    borderColor: LightTheme.Outline,
  },
  analyticsTitle: {
    ...Typography.bodyMedium,
    color: LightTheme.OnSurface,
    fontWeight: '600',
    marginBottom: Spacing.MD,
  },
  analyticsGrid: {
    flexDirection: 'row',
    marginBottom: Spacing.MD,
    gap: Spacing.SM,
  },
  analyticsItem: {
    flex: 1,
    alignItems: 'center',
  },
  analyticsValue: {
    ...Typography.headlineSmall,
    color: LightTheme.Primary,
    fontWeight: '700',
  },
  analyticsLabel: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
    marginTop: 2,
  },
  deviceBreakdown: {
    backgroundColor: LightTheme.Background,
    padding: Spacing.SM,
    borderRadius: BorderRadius.XS,
  },
  breakdownTitle: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurface,
    fontWeight: '600',
    marginBottom: Spacing.XS,
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.XS,
  },
  deviceLabel: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
    width: 60,
  },
  deviceBar: {
    flex: 1,
    height: 4,
    backgroundColor: LightTheme.Outline,
    borderRadius: 2,
    overflow: 'hidden',
    marginHorizontal: Spacing.SM,
  },
  deviceBarFill: {
    height: '100%',
  },
  devicePercentage: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
    width: 40,
    textAlign: 'right',
  },
  // Common styles
  statusTag: {
    paddingHorizontal: Spacing.XS,
    paddingVertical: 2,
    borderRadius: BorderRadius.XS,
    alignSelf: 'flex-start',
  },
  statusTagText: {
    ...Typography.bodySmall,
    color: LightTheme.Surface,
    fontWeight: '500',
  },
  actionButton: {
    flex: 1,
    paddingVertical: Spacing.XS,
    alignItems: 'center',
    borderRadius: BorderRadius.XS,
  },
  editButton: {
    backgroundColor: LightTheme.Info,
  },
  viewButton: {
    backgroundColor: LightTheme.Primary,
  },
  analyticsButton: {
    backgroundColor: LightTheme.Warning,
  },
  versionsButton: {
    backgroundColor: LightTheme.Success,
  },
  approveButton: {
    backgroundColor: LightTheme.Success,
  },
  rejectButton: {
    backgroundColor: LightTheme.Error,
  },
  reviewButton: {
    backgroundColor: LightTheme.Primary,
  },
  actionButtonText: {
    ...Typography.bodySmall,
    color: LightTheme.Surface,
    fontWeight: '500',
  },
  separator: {
    height: 1,
    backgroundColor: LightTheme.Outline,
    marginVertical: Spacing.XS,
  },
});

export default ContentManagementScreen;