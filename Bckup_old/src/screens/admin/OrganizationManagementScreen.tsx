/**
 * OrganizationManagementScreen - Phase 37.2: Organizational Structure Management
 * Hierarchical organization tools for department management, class structure,
 * teacher assignments, student grouping, and staff hierarchy setup
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

// Type definitions for Organizational Structure Management
interface Department {
  id: string;
  name: string;
  description: string;
  headOfDepartment: string;
  headOfDepartmentId: string;
  teacherCount: number;
  studentCount: number;
  subjects: string[];
  budget?: number;
  location?: string;
  establishedYear: number;
  isActive: boolean;
  parentDepartmentId?: string;
  subDepartments: string[];
}

interface ClassStructure {
  id: string;
  name: string;
  grade: string;
  section: string;
  departmentId: string;
  classTeacherId: string;
  classTeacherName: string;
  maxCapacity: number;
  currentEnrollment: number;
  subjects: ClassSubject[];
  schedule: ClassSchedule[];
  academicYear: string;
  isActive: boolean;
  room?: string;
}

interface ClassSubject {
  id: string;
  name: string;
  teacherId: string;
  teacherName: string;
  weeklyHours: number;
  room?: string;
  isCore: boolean;
}

interface ClassSchedule {
  id: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  startTime: string;
  endTime: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  room?: string;
}

interface TeacherAssignment {
  id: string;
  teacherId: string;
  teacherName: string;
  departmentId: string;
  departmentName: string;
  subjects: string[];
  classes: TeacherClass[];
  workload: number; // Total hours per week
  maxWorkload: number;
  specializations: string[];
  qualification: string;
  experience: number;
  isActive: boolean;
}

interface TeacherClass {
  classId: string;
  className: string;
  grade: string;
  section: string;
  subject: string;
  weeklyHours: number;
  role: 'class_teacher' | 'subject_teacher' | 'assistant';
}

interface StudentGroup {
  id: string;
  name: string;
  description: string;
  type: 'class' | 'house' | 'club' | 'activity' | 'academic' | 'custom';
  classId?: string;
  supervisorId: string;
  supervisorName: string;
  studentIds: string[];
  maxMembers?: number;
  meetingSchedule?: string;
  isActive: boolean;
  createdAt: string;
}

interface StaffHierarchy {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  position: string;
  department: string;
  level: number; // Hierarchy level (0 = top level)
  managerId?: string;
  managerName?: string;
  directReports: string[];
  responsibilities: string[];
  isActive: boolean;
}

interface OrganizationManagementScreenProps {
  adminId: string;
  onNavigate: (screen: string) => void;
}

const OrganizationManagementScreen: React.FC<OrganizationManagementScreenProps> = ({
  adminId,
  onNavigate,
}) => {
  // State management
  const [activeTab, setActiveTab] = useState<'departments' | 'classes' | 'assignments' | 'groups' | 'hierarchy'>('departments');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [classes, setClasses] = useState<ClassStructure[]>([]);
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [studentGroups, setStudentGroups] = useState<StudentGroup[]>([]);
  const [staffHierarchy, setStaffHierarchy] = useState<StaffHierarchy[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [showClassModal, setShowClassModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Initialize data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load departments data
      const departmentsData: Department[] = [
        {
          id: 'dept_001',
          name: 'Mathematics Department',
          description: 'Advanced mathematics education covering algebra, calculus, statistics, and applied mathematics',
          headOfDepartment: 'Dr. Michael Thompson',
          headOfDepartmentId: 'teacher_001',
          teacherCount: 8,
          studentCount: 245,
          subjects: ['Algebra', 'Calculus', 'Statistics', 'Geometry', 'Applied Mathematics'],
          budget: 150000,
          location: 'Building A, Floor 2',
          establishedYear: 1985,
          isActive: true,
          subDepartments: ['dept_001_1'],
        },
        {
          id: 'dept_001_1',
          name: 'Applied Mathematics',
          description: 'Specialized focus on practical applications of mathematical concepts',
          headOfDepartment: 'Prof. Sarah Williams',
          headOfDepartmentId: 'teacher_002',
          teacherCount: 3,
          studentCount: 78,
          subjects: ['Applied Statistics', 'Mathematical Modeling', 'Operations Research'],
          budget: 50000,
          location: 'Building A, Floor 2, Wing B',
          establishedYear: 2010,
          isActive: true,
          parentDepartmentId: 'dept_001',
          subDepartments: [],
        },
        {
          id: 'dept_002',
          name: 'Science Department',
          description: 'Comprehensive science education covering physics, chemistry, and biology',
          headOfDepartment: 'Dr. Robert Chen',
          headOfDepartmentId: 'teacher_003',
          teacherCount: 12,
          studentCount: 380,
          subjects: ['Physics', 'Chemistry', 'Biology', 'Environmental Science', 'Computer Science'],
          budget: 220000,
          location: 'Building B, All Floors',
          establishedYear: 1982,
          isActive: true,
          subDepartments: ['dept_002_1', 'dept_002_2'],
        },
        {
          id: 'dept_003',
          name: 'Languages Department',
          description: 'Language education including English, literature, and foreign languages',
          headOfDepartment: 'Ms. Jennifer Adams',
          headOfDepartmentId: 'teacher_004',
          teacherCount: 6,
          studentCount: 290,
          subjects: ['English Literature', 'Creative Writing', 'Spanish', 'French', 'Linguistics'],
          budget: 95000,
          location: 'Building C, Floor 1',
          establishedYear: 1980,
          isActive: true,
          subDepartments: [],
        },
      ];

      // Load classes data
      const classesData: ClassStructure[] = [
        {
          id: 'class_001',
          name: '10th Grade Mathematics - Section A',
          grade: '10th Grade',
          section: 'A',
          departmentId: 'dept_001',
          classTeacherId: 'teacher_001',
          classTeacherName: 'Dr. Michael Thompson',
          maxCapacity: 30,
          currentEnrollment: 28,
          subjects: [
            {
              id: 'subj_001',
              name: 'Algebra II',
              teacherId: 'teacher_001',
              teacherName: 'Dr. Michael Thompson',
              weeklyHours: 5,
              room: 'A201',
              isCore: true,
            },
            {
              id: 'subj_002',
              name: 'Geometry',
              teacherId: 'teacher_002',
              teacherName: 'Prof. Sarah Williams',
              weeklyHours: 4,
              room: 'A202',
              isCore: true,
            },
          ],
          schedule: [
            {
              id: 'sched_001',
              dayOfWeek: 1, // Monday
              startTime: '09:00',
              endTime: '10:00',
              subjectId: 'subj_001',
              subjectName: 'Algebra II',
              teacherId: 'teacher_001',
              teacherName: 'Dr. Michael Thompson',
              room: 'A201',
            },
            {
              id: 'sched_002',
              dayOfWeek: 1, // Monday
              startTime: '10:15',
              endTime: '11:15',
              subjectId: 'subj_002',
              subjectName: 'Geometry',
              teacherId: 'teacher_002',
              teacherName: 'Prof. Sarah Williams',
              room: 'A202',
            },
          ],
          academicYear: '2024-2025',
          isActive: true,
          room: 'A201',
        },
        {
          id: 'class_002',
          name: '11th Grade Science - Section B',
          grade: '11th Grade',
          section: 'B',
          departmentId: 'dept_002',
          classTeacherId: 'teacher_003',
          classTeacherName: 'Dr. Robert Chen',
          maxCapacity: 25,
          currentEnrollment: 24,
          subjects: [
            {
              id: 'subj_003',
              name: 'Advanced Physics',
              teacherId: 'teacher_003',
              teacherName: 'Dr. Robert Chen',
              weeklyHours: 6,
              room: 'B101',
              isCore: true,
            },
            {
              id: 'subj_004',
              name: 'Organic Chemistry',
              teacherId: 'teacher_005',
              teacherName: 'Dr. Lisa Park',
              weeklyHours: 5,
              room: 'B201',
              isCore: true,
            },
          ],
          schedule: [],
          academicYear: '2024-2025',
          isActive: true,
          room: 'B101',
        },
      ];

      // Load teacher assignments data
      const assignmentsData: TeacherAssignment[] = [
        {
          id: 'assign_001',
          teacherId: 'teacher_001',
          teacherName: 'Dr. Michael Thompson',
          departmentId: 'dept_001',
          departmentName: 'Mathematics Department',
          subjects: ['Algebra II', 'Calculus', 'Statistics'],
          classes: [
            {
              classId: 'class_001',
              className: '10th Grade Mathematics - Section A',
              grade: '10th Grade',
              section: 'A',
              subject: 'Algebra II',
              weeklyHours: 5,
              role: 'class_teacher',
            },
            {
              classId: 'class_003',
              className: '12th Grade Mathematics - Section A',
              grade: '12th Grade',
              section: 'A',
              subject: 'Calculus',
              weeklyHours: 6,
              role: 'subject_teacher',
            },
          ],
          workload: 22,
          maxWorkload: 25,
          specializations: ['Advanced Mathematics', 'Statistics', 'Mathematical Modeling'],
          qualification: 'Ph.D. in Mathematics',
          experience: 15,
          isActive: true,
        },
        {
          id: 'assign_002',
          teacherId: 'teacher_003',
          teacherName: 'Dr. Robert Chen',
          departmentId: 'dept_002',
          departmentName: 'Science Department',
          subjects: ['Physics', 'Advanced Physics'],
          classes: [
            {
              classId: 'class_002',
              className: '11th Grade Science - Section B',
              grade: '11th Grade',
              section: 'B',
              subject: 'Advanced Physics',
              weeklyHours: 6,
              role: 'class_teacher',
            },
          ],
          workload: 18,
          maxWorkload: 20,
          specializations: ['Quantum Physics', 'Thermodynamics', 'Electromagnetism'],
          qualification: 'Ph.D. in Physics',
          experience: 12,
          isActive: true,
        },
      ];

      // Load student groups data
      const studentGroupsData: StudentGroup[] = [
        {
          id: 'group_001',
          name: 'Mathematics Olympiad Team',
          description: 'Elite mathematics competition team for advanced students',
          type: 'academic',
          supervisorId: 'teacher_001',
          supervisorName: 'Dr. Michael Thompson',
          studentIds: ['student_001', 'student_002', 'student_003', 'student_004'],
          maxMembers: 12,
          meetingSchedule: 'Fridays 3:00 PM - 5:00 PM',
          isActive: true,
          createdAt: '2024-09-01T08:00:00Z',
        },
        {
          id: 'group_002',
          name: 'Phoenix House',
          description: 'One of the four school houses for inter-house competitions',
          type: 'house',
          supervisorId: 'teacher_004',
          supervisorName: 'Ms. Jennifer Adams',
          studentIds: ['student_005', 'student_006', 'student_007'],
          meetingSchedule: 'Monthly house meetings',
          isActive: true,
          createdAt: '2024-08-15T08:00:00Z',
        },
        {
          id: 'group_003',
          name: 'Science Research Club',
          description: 'Student research projects and science fair preparation',
          type: 'club',
          supervisorId: 'teacher_003',
          supervisorName: 'Dr. Robert Chen',
          studentIds: ['student_008', 'student_009', 'student_010'],
          maxMembers: 20,
          meetingSchedule: 'Wednesdays 4:00 PM - 6:00 PM',
          isActive: true,
          createdAt: '2024-09-10T08:00:00Z',
        },
      ];

      // Load staff hierarchy data
      const staffHierarchyData: StaffHierarchy[] = [
        {
          id: 'staff_001',
          employeeId: 'EMP001',
          firstName: 'Jennifer',
          lastName: 'Anderson',
          position: 'Principal',
          department: 'Administration',
          level: 0,
          directReports: ['staff_002', 'staff_003'],
          responsibilities: [
            'Overall school management and leadership',
            'Policy development and implementation',
            'Community relations and partnerships',
            'Strategic planning and vision',
          ],
          isActive: true,
        },
        {
          id: 'staff_002',
          employeeId: 'EMP002',
          firstName: 'Michael',
          lastName: 'Thompson',
          position: 'Academic Director',
          department: 'Academics',
          level: 1,
          managerId: 'staff_001',
          managerName: 'Jennifer Anderson',
          directReports: ['staff_004', 'staff_005'],
          responsibilities: [
            'Academic curriculum oversight',
            'Teacher performance management',
            'Student academic progress monitoring',
            'Educational program development',
          ],
          isActive: true,
        },
        {
          id: 'staff_003',
          employeeId: 'EMP003',
          firstName: 'Sarah',
          lastName: 'Johnson',
          position: 'Operations Director',
          department: 'Operations',
          level: 1,
          managerId: 'staff_001',
          managerName: 'Jennifer Anderson',
          directReports: ['staff_006', 'staff_007'],
          responsibilities: [
            'Facility management and maintenance',
            'Technology infrastructure',
            'Transportation and logistics',
            'Safety and security protocols',
          ],
          isActive: true,
        },
        {
          id: 'staff_004',
          employeeId: 'EMP004',
          firstName: 'Robert',
          lastName: 'Chen',
          position: 'Department Head - Science',
          department: 'Science',
          level: 2,
          managerId: 'staff_002',
          managerName: 'Michael Thompson',
          directReports: ['staff_008', 'staff_009'],
          responsibilities: [
            'Science department management',
            'Science curriculum development',
            'Laboratory safety oversight',
            'Teacher mentoring and development',
          ],
          isActive: true,
        },
      ];

      setDepartments(departmentsData);
      setClasses(classesData);
      setAssignments(assignmentsData);
      setStudentGroups(studentGroupsData);
      setStaffHierarchy(staffHierarchyData);
    } catch (error) {
      Alert.alert('error', 'Failed to load organizational data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Management actions
  const handleCreateDepartment = () => {
    setSelectedItem(null);
    setShowDepartmentModal(true);
  };

  const handleEditDepartment = (department: Department) => {
    setSelectedItem(department);
    setShowDepartmentModal(true);
  };

  const handleCreateClass = () => {
    setSelectedItem(null);
    setShowClassModal(true);
  };

  const handleEditClass = (classItem: ClassStructure) => {
    setSelectedItem(classItem);
    setShowClassModal(true);
  };

  const handleOptimizeAssignments = () => {
    Alert.alert(
      'Optimize Teacher Assignments',
      'This will automatically optimize teacher workloads and class assignments. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Optimize',
          onPress: () => {
            Alert.alert('success', 'Teacher assignments have been optimized for balanced workloads');
          }
        }
      ]
    );
  };

  // Filter data based on search
  const filteredDepartments = departments.filter(dept =>
    searchQuery === '' || dept.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredClasses = classes.filter(cls =>
    searchQuery === '' || cls.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAssignments = assignments.filter(assign =>
    searchQuery === '' || assign.teacherName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGroups = studentGroups.filter(group =>
    searchQuery === '' || group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredStaff = staffHierarchy.filter(staff =>
    searchQuery === '' || 
    `${staff.firstName} ${staff.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    staff.position.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Render functions
  const renderDepartmentItem = ({ item: dept }: { item: Department }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle}>{dept.name}</Text>
          <Text style={styles.itemSubtitle}>{dept.description}</Text>
          <View style={styles.itemMeta}>
            <Text style={styles.itemMetaText}>Head: {dept.headOfDepartment}</Text>
            <Text style={styles.itemMetaText}>Teachers: {dept.teacherCount}</Text>
            <Text style={styles.itemMetaText}>Students: {dept.studentCount}</Text>
          </View>
        </View>
        <View style={[styles.statusIndicator, { 
          backgroundColor: dept.isActive ? LightTheme.Success : LightTheme.Error 
        }]} />
      </View>
      
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{dept.subjects.length}</Text>
          <Text style={styles.statLabel}>Subjects</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {dept.budget ? `$${(dept.budget / 1000).toFixed(0)}K` : 'N/A'}
          </Text>
          <Text style={styles.statLabel}>Budget</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{dept.establishedYear}</Text>
          <Text style={styles.statLabel}>Est.</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{dept.subDepartments.length}</Text>
          <Text style={styles.statLabel}>Sub-depts</Text>
        </View>
      </View>

      <View style={styles.itemActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEditDepartment(dept)}
        >
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.viewButton]}
          onPress={() => Alert.alert('View Details', `Detailed view for ${dept.name}`)}
        >
          <Text style={styles.actionButtonText}>View Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderClassItem = ({ item: cls }: { item: ClassStructure }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle}>{cls.name}</Text>
          <Text style={styles.itemSubtitle}>Class Teacher: {cls.classTeacherName}</Text>
          <Text style={styles.itemMetaText}>Academic Year: {cls.academicYear}</Text>
        </View>
        <View style={[styles.statusIndicator, { 
          backgroundColor: cls.isActive ? LightTheme.Success : LightTheme.Error 
        }]} />
      </View>
      
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{cls.currentEnrollment}/{cls.maxCapacity}</Text>
          <Text style={styles.statLabel}>Enrollment</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{cls.subjects.length}</Text>
          <Text style={styles.statLabel}>Subjects</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{cls.room || 'TBA'}</Text>
          <Text style={styles.statLabel}>Room</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {Math.round((cls.currentEnrollment / cls.maxCapacity) * 100)}%
          </Text>
          <Text style={styles.statLabel}>Capacity</Text>
        </View>
      </View>

      <View style={styles.itemActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEditClass(cls)}
        >
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.scheduleButton]}
          onPress={() => Alert.alert('Schedule', `View schedule for ${cls.name}`)}
        >
          <Text style={styles.actionButtonText}>Schedule</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderAssignmentItem = ({ item: assign }: { item: TeacherAssignment }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle}>{assign.teacherName}</Text>
          <Text style={styles.itemSubtitle}>{assign.departmentName}</Text>
          <Text style={styles.itemMetaText}>
            Qualification: {assign.qualification} • Experience: {assign.experience} years
          </Text>
        </View>
        <View style={styles.workloadIndicator}>
          <Text style={styles.workloadText}>
            {assign.workload}/{assign.maxWorkload}h
          </Text>
          <View style={styles.workloadBar}>
            <View style={[styles.workloadFill, {
              width: `${(assign.workload / assign.maxWorkload) * 100}%`,
              backgroundColor: assign.workload > assign.maxWorkload * 0.9 ? LightTheme.Error : LightTheme.Success
            }]} />
          </View>
        </View>
      </View>
      
      <View style={styles.assignmentDetails}>
        <Text style={styles.assignmentLabel}>Subjects:</Text>
        <Text style={styles.assignmentValue}>{assign.subjects.join(', ')}</Text>
        <Text style={styles.assignmentLabel}>Classes ({assign.classes.length}):</Text>
        {assign.classes.map((cls, index) => (
          <Text key={index} style={styles.classAssignment}>
            • {cls.className} - {cls.subject} ({cls.weeklyHours}h/week)
            {cls.role === 'class_teacher' && ' [Class Teacher]'}
          </Text>
        ))}
      </View>

      <View style={styles.itemActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => Alert.alert('Edit Assignment', `Edit assignment for ${assign.teacherName}`)}
        >
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.optimizeButton]}
          onPress={() => Alert.alert('Optimize', `Optimize workload for ${assign.teacherName}`)}
        >
          <Text style={styles.actionButtonText}>Optimize</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderGroupItem = ({ item: group }: { item: StudentGroup }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle}>{group.name}</Text>
          <Text style={styles.itemSubtitle}>{group.description}</Text>
          <Text style={styles.itemMetaText}>Supervisor: {group.supervisorName}</Text>
        </View>
        <View style={[styles.groupTypeTag, { backgroundColor: getGroupTypeColor(group.type) }]}>
          <Text style={styles.groupTypeText}>{group.type.toUpperCase()}</Text>
        </View>
      </View>
      
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {group.studentIds.length}
            {group.maxMembers && `/${group.maxMembers}`}
          </Text>
          <Text style={styles.statLabel}>Members</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {group.meetingSchedule ? 'Scheduled' : 'Flexible'}
          </Text>
          <Text style={styles.statLabel}>Meetings</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {new Date(group.createdAt).getFullYear()}
          </Text>
          <Text style={styles.statLabel}>Created</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {group.isActive ? 'Active' : 'Inactive'}
          </Text>
          <Text style={styles.statLabel}>Status</Text>
        </View>
      </View>

      {group.meetingSchedule && (
        <Text style={styles.scheduleText}>📅 {group.meetingSchedule}</Text>
      )}

      <View style={styles.itemActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => Alert.alert('Edit Group', `Edit ${group.name}`)}
        >
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.membersButton]}
          onPress={() => Alert.alert('Members', `Manage members for ${group.name}`)}
        >
          <Text style={styles.actionButtonText}>Members</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStaffItem = ({ item: staff }: { item: StaffHierarchy }) => (
    <View style={[styles.itemCard, { marginLeft: staff.level * 20 }]}>
      <View style={styles.itemHeader}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle}>
            {staff.firstName} {staff.lastName}
          </Text>
          <Text style={styles.itemSubtitle}>{staff.position}</Text>
          <Text style={styles.itemMetaText}>
            {staff.department} • Employee ID: {staff.employeeId}
          </Text>
          {staff.managerName && (
            <Text style={styles.managerText}>Reports to: {staff.managerName}</Text>
          )}
        </View>
        <View style={styles.hierarchyLevel}>
          <Text style={styles.hierarchyLevelText}>L{staff.level}</Text>
        </View>
      </View>
      
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{staff.directReports.length}</Text>
          <Text style={styles.statLabel}>Reports</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{staff.responsibilities.length}</Text>
          <Text style={styles.statLabel}>Duties</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{staff.level}</Text>
          <Text style={styles.statLabel}>Level</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {staff.isActive ? 'Active' : 'Inactive'}
          </Text>
          <Text style={styles.statLabel}>Status</Text>
        </View>
      </View>

      <View style={styles.responsibilitiesContainer}>
        <Text style={styles.responsibilitiesTitle}>Key Responsibilities:</Text>
        {staff.responsibilities.slice(0, 2).map((resp, index) => (
          <Text key={index} style={styles.responsibilityText}>• {resp}</Text>
        ))}
        {staff.responsibilities.length > 2 && (
          <Text style={styles.responsibilityText}>
            ... and {staff.responsibilities.length - 2} more
          </Text>
        )}
      </View>

      <View style={styles.itemActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => Alert.alert('Edit Staff', `Edit ${staff.firstName} ${staff.lastName}`)}
        >
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.orgChartButton]}
          onPress={() => Alert.alert('Org Chart', 'View organizational chart')}
        >
          <Text style={styles.actionButtonText}>Org Chart</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Helper functions
  const getGroupTypeColor = (type: string) => {
    switch (type) {
      case 'class': return LightTheme.Primary;
      case 'house': return LightTheme.Warning;
      case 'club': return LightTheme.Success;
      case 'activity': return LightTheme.Info;
      case 'academic': return LightTheme.Error;
      default: return LightTheme.OnSurfaceVariant;
    }
  };

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
        <Text style={styles.headerTitle}>Organization Management</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            if (activeTab === 'departments') handleCreateDepartment();
            else if (activeTab === 'classes') handleCreateClass();
            else Alert.alert('Add Item', `Add new ${activeTab.slice(0, -1)}`);
          }}
        >
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {['departments', 'classes', 'assignments', 'groups', 'hierarchy'].map((tab) => (
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

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={`Search ${activeTab}...`}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={LightTheme.OnSurfaceVariant}
        />
      </View>

      {/* Optimization Actions */}
      {activeTab === 'assignments' && (
        <View style={styles.optimizationContainer}>
          <TouchableOpacity
            style={styles.optimizeAllButton}
            onPress={handleOptimizeAssignments}
          >
            <Text style={styles.optimizeAllButtonText}>⚡ Optimize All Assignments</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {activeTab === 'departments' && (
          <FlatList
            data={filteredDepartments}
            keyExtractor={(item) => item.id}
            renderItem={renderDepartmentItem}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}

        {activeTab === 'classes' && (
          <FlatList
            data={filteredClasses}
            keyExtractor={(item) => item.id}
            renderItem={renderClassItem}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}

        {activeTab === 'assignments' && (
          <FlatList
            data={filteredAssignments}
            keyExtractor={(item) => item.id}
            renderItem={renderAssignmentItem}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}

        {activeTab === 'groups' && (
          <FlatList
            data={filteredGroups}
            keyExtractor={(item) => item.id}
            renderItem={renderGroupItem}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}

        {activeTab === 'hierarchy' && (
          <FlatList
            data={filteredStaff}
            keyExtractor={(item) => item.id}
            renderItem={renderStaffItem}
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
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    backgroundColor: LightTheme.Surface,
  },
  searchInput: {
    ...Typography.bodyMedium,
    backgroundColor: LightTheme.Background,
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    borderRadius: BorderRadius.SM,
    borderWidth: 1,
    borderColor: LightTheme.Outline,
    color: LightTheme.OnSurface,
  },
  optimizationContainer: {
    backgroundColor: LightTheme.primaryContainer,
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
  },
  optimizeAllButton: {
    backgroundColor: LightTheme.Warning,
    paddingHorizontal: Spacing.LG,
    paddingVertical: Spacing.SM,
    borderRadius: BorderRadius.SM,
    alignItems: 'center',
  },
  optimizeAllButtonText: {
    ...Typography.bodyMedium,
    color: LightTheme.Surface,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  itemCard: {
    backgroundColor: LightTheme.Surface,
    marginHorizontal: Spacing.MD,
    marginVertical: Spacing.XS,
    padding: Spacing.MD,
    borderRadius: BorderRadius.SM,
    borderWidth: 1,
    borderColor: LightTheme.Outline,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.SM,
  },
  itemInfo: {
    flex: 1,
    marginRight: Spacing.SM,
  },
  itemTitle: {
    ...Typography.bodyMedium,
    color: LightTheme.OnSurface,
    fontWeight: '600',
    marginBottom: Spacing.XS / 2,
  },
  itemSubtitle: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.XS / 2,
  },
  itemMeta: {
    marginTop: Spacing.XS,
  },
  itemMetaText: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: 2,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statsGrid: {
    flexDirection: 'row',
    marginBottom: Spacing.SM,
    gap: Spacing.SM,
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
  itemActions: {
    flexDirection: 'row',
    gap: Spacing.SM,
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
  scheduleButton: {
    backgroundColor: LightTheme.Success,
  },
  optimizeButton: {
    backgroundColor: LightTheme.Warning,
  },
  membersButton: {
    backgroundColor: LightTheme.Success,
  },
  orgChartButton: {
    backgroundColor: LightTheme.Primary,
  },
  actionButtonText: {
    ...Typography.bodySmall,
    color: LightTheme.Surface,
    fontWeight: '500',
  },
  workloadIndicator: {
    alignItems: 'flex-end',
  },
  workloadText: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurface,
    fontWeight: '600',
    marginBottom: Spacing.XS / 2,
  },
  workloadBar: {
    width: 60,
    height: 4,
    backgroundColor: LightTheme.Outline,
    borderRadius: 2,
    overflow: 'hidden',
  },
  workloadFill: {
    height: '100%',
  },
  assignmentDetails: {
    marginBottom: Spacing.SM,
  },
  assignmentLabel: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurface,
    fontWeight: '600',
    marginTop: Spacing.XS,
    marginBottom: Spacing.XS / 2,
  },
  assignmentValue: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
  },
  classAssignment: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: 2,
  },
  groupTypeTag: {
    paddingHorizontal: Spacing.XS,
    paddingVertical: 2,
    borderRadius: BorderRadius.XS,
    alignSelf: 'flex-start',
  },
  groupTypeText: {
    ...Typography.bodySmall,
    color: LightTheme.Surface,
    fontWeight: '500',
  },
  scheduleText: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.SM,
    fontStyle: 'italic',
  },
  hierarchyLevel: {
    backgroundColor: LightTheme.Primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hierarchyLevelText: {
    ...Typography.bodySmall,
    color: LightTheme.Surface,
    fontWeight: '600',
  },
  managerText: {
    ...Typography.bodySmall,
    color: LightTheme.Primary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  responsibilitiesContainer: {
    backgroundColor: LightTheme.Background,
    padding: Spacing.SM,
    borderRadius: BorderRadius.XS,
    marginBottom: Spacing.SM,
  },
  responsibilitiesTitle: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurface,
    fontWeight: '600',
    marginBottom: Spacing.XS,
  },
  responsibilityText: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: 2,
  },
  separator: {
    height: 1,
    backgroundColor: LightTheme.Outline,
    marginHorizontal: Spacing.MD,
  },
});

export default OrganizationManagementScreen;