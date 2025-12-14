/**
 * UserManagementScreen - Phase 37.1: Comprehensive User Administration
 * Multi-role user management system with bulk operations, role-based access control,
 * advanced search capabilities, and security management
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
  Switch,
  Dimensions,
} from 'react-native';

// Import theme and styling
import { LightTheme } from '../../theme/colors';
import { Typography } from '../../theme/typography';
import { Spacing, BorderRadius } from '../../theme/spacing';

const { width } = Dimensions.get('window');

// Type definitions for User Management System
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  role: UserRole;
  department?: string;
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  lastLogin?: string;
  createdAt: string;
  profileImage?: string;
  permissions: Permission[];
  parentId?: string; // For students
  childrenIds?: string[]; // For parents
  employeeId?: string; // For staff/teachers
  grade?: string; // For students
  subjects?: string[]; // For teachers
  isVerified: boolean;
  requiresMfa: boolean;
}

interface UserRole {
  id: string;
  name: string;
  displayName: string;
  description: string;
  permissions: Permission[];
  isCustom: boolean;
  createdAt: string;
  createdBy: string;
}

interface Permission {
  id: string;
  name: string;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'manage';
  conditions?: PermissionCondition[];
}

interface PermissionCondition {
  field: string;
  operator: 'equals' | 'in' | 'greater_than' | 'less_than';
  value: any;
}

interface BulkOperation {
  id: string;
  type: 'import' | 'export' | 'update' | 'delete' | 'activate' | 'deactivate';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalUsers: number;
  processedUsers: number;
  errors: BulkOperationError[];
  createdAt: string;
  completedAt?: string;
  createdBy: string;
}

interface BulkOperationError {
  userEmail: string;
  error: string;
  rowNumber?: number;
}

interface SearchFilter {
  role?: string;
  department?: string;
  status?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  hasPermission?: string;
  isVerified?: boolean;
  requiresMfa?: boolean;
}

interface AuditLogEntry {
  id: string;
  timestamp: string;
  eventType: 'login' | 'logout' | 'user_created' | 'user_updated' | 'user_deleted' | 'role_changed' | 
             'permission_changed' | 'password_reset' | 'mfa_enabled' | 'mfa_disabled' | 'security_violation' |
             'bulk_operation' | 'data_export' | 'system_config' | 'audit_access';
  userId: string;
  userEmail: string;
  adminId?: string;
  adminEmail?: string;
  description: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  location?: string;
  outcome: 'success' | 'failure' | 'blocked';
}

interface AuditFilter {
  eventType?: string;
  userId?: string;
  severity?: string;
  outcome?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  ipAddress?: string;
}

interface UserManagementScreenProps {
  adminId: string;
  onNavigate: (screen: string) => void;
}

const UserManagementScreen: React.FC<UserManagementScreenProps> = ({
  adminId,
  onNavigate,
}) => {
  // State management
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'bulk' | 'audit'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [bulkOperations, setBulkOperations] = useState<BulkOperation[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [auditFilters, setAuditFilters] = useState<AuditFilter>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilters, setSearchFilters] = useState<SearchFilter>({});
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showUserModal, setShowUserModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  // Initialize data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load users with comprehensive data
      const usersData: User[] = [
        {
          id: 'usr_001',
          firstName: 'Jennifer',
          lastName: 'Anderson',
          email: 'jennifer.anderson@school.edu',
          phoneNumber: '+1-555-0123',
          role: {
            id: 'role_admin',
            name: 'admin',
            displayName: 'System Administrator',
            description: 'Full system access with user management capabilities',
            permissions: [],
            isCustom: false,
            createdAt: '2024-01-15T08:00:00Z',
            createdBy: 'system',
          },
          department: 'Administration',
          status: 'active',
          lastLogin: '2024-12-03T10:30:00Z',
          createdAt: '2024-01-15T08:00:00Z',
          permissions: [],
          employeeId: 'EMP001',
          isVerified: true,
          requiresMfa: true,
        },
        {
          id: 'usr_002',
          firstName: 'Dr. Michael',
          lastName: 'Thompson',
          email: 'michael.thompson@school.edu',
          phoneNumber: '+1-555-0124',
          role: {
            id: 'role_teacher',
            name: 'teacher',
            displayName: 'Teacher',
            description: 'Teaching capabilities with class management',
            permissions: [],
            isCustom: false,
            createdAt: '2024-01-15T08:00:00Z',
            createdBy: 'system',
          },
          department: 'Mathematics',
          status: 'active',
          lastLogin: '2024-12-03T09:15:00Z',
          createdAt: '2024-02-01T08:00:00Z',
          permissions: [],
          employeeId: 'EMP002',
          subjects: ['Algebra', 'Calculus', 'Statistics'],
          isVerified: true,
          requiresMfa: false,
        },
        {
          id: 'usr_003',
          firstName: 'Sarah',
          lastName: 'Johnson',
          email: 'sarah.johnson@parent.com',
          phoneNumber: '+1-555-0125',
          role: {
            id: 'role_parent',
            name: 'parent',
            displayName: 'Parent',
            description: 'Parent access with child monitoring capabilities',
            permissions: [],
            isCustom: false,
            createdAt: '2024-01-15T08:00:00Z',
            createdBy: 'system',
          },
          status: 'active',
          lastLogin: '2024-12-02T19:45:00Z',
          createdAt: '2024-03-01T08:00:00Z',
          permissions: [],
          childrenIds: ['usr_005', 'usr_006'],
          isVerified: true,
          requiresMfa: false,
        },
        {
          id: 'usr_004',
          firstName: 'Emily',
          lastName: 'Davis',
          email: 'emily.davis@student.edu',
          role: {
            id: 'role_student',
            name: 'student',
            displayName: 'Student',
            description: 'Student access with learning capabilities',
            permissions: [],
            isCustom: false,
            createdAt: '2024-01-15T08:00:00Z',
            createdBy: 'system',
          },
          status: 'active',
          lastLogin: '2024-12-03T08:30:00Z',
          createdAt: '2024-03-15T08:00:00Z',
          permissions: [],
          parentId: 'usr_003',
          grade: '10th Grade',
          isVerified: false,
          requiresMfa: false,
        },
        {
          id: 'usr_005',
          firstName: 'James',
          lastName: 'Wilson',
          email: 'james.wilson@student.edu',
          role: {
            id: 'role_student',
            name: 'student',
            displayName: 'Student',
            description: 'Student access with learning capabilities',
            permissions: [],
            isCustom: false,
            createdAt: '2024-01-15T08:00:00Z',
            createdBy: 'system',
          },
          status: 'pending',
          createdAt: '2024-11-01T08:00:00Z',
          permissions: [],
          parentId: 'usr_003',
          grade: '8th Grade',
          isVerified: false,
          requiresMfa: false,
        },
      ];

      // Load roles data
      const rolesData: UserRole[] = [
        {
          id: 'role_admin',
          name: 'admin',
          displayName: 'System Administrator',
          description: 'Full system access with user management capabilities',
          permissions: [
            { id: 'perm_001', name: 'user_management', resource: 'users', action: 'manage' },
            { id: 'perm_002', name: 'system_settings', resource: 'system', action: 'manage' },
            { id: 'perm_003', name: 'analytics_access', resource: 'analytics', action: 'read' },
          ],
          isCustom: false,
          createdAt: '2024-01-15T08:00:00Z',
          createdBy: 'system',
        },
        {
          id: 'role_teacher',
          name: 'teacher',
          displayName: 'Teacher',
          description: 'Teaching capabilities with class management',
          permissions: [
            { id: 'perm_004', name: 'class_management', resource: 'classes', action: 'manage' },
            { id: 'perm_005', name: 'student_grades', resource: 'grades', action: 'update' },
            { id: 'perm_006', name: 'assignment_creation', resource: 'assignments', action: 'create' },
          ],
          isCustom: false,
          createdAt: '2024-01-15T08:00:00Z',
          createdBy: 'system',
        },
        {
          id: 'role_custom_001',
          name: 'department_head',
          displayName: 'Department Head',
          description: 'Enhanced teacher role with department management',
          permissions: [
            { id: 'perm_004', name: 'class_management', resource: 'classes', action: 'manage' },
            { id: 'perm_005', name: 'student_grades', resource: 'grades', action: 'update' },
            { id: 'perm_007', name: 'teacher_supervision', resource: 'teachers', action: 'read' },
            { id: 'perm_008', name: 'department_analytics', resource: 'department_analytics', action: 'read' },
          ],
          isCustom: true,
          createdAt: '2024-06-01T08:00:00Z',
          createdBy: 'usr_001',
        },
      ];

      // Load bulk operations data
      const bulkOpsData: BulkOperation[] = [
        {
          id: 'bulk_001',
          type: 'import',
          status: 'completed',
          totalUsers: 150,
          processedUsers: 147,
          errors: [
            { userEmail: 'invalid@email', error: 'Invalid email format', rowNumber: 23 },
            { userEmail: 'duplicate@school.edu', error: 'User already exists', rowNumber: 89 },
            { userEmail: 'missing@data.com', error: 'Required field missing: firstName', rowNumber: 134 },
          ],
          createdAt: '2024-11-15T10:00:00Z',
          completedAt: '2024-11-15T10:15:00Z',
          createdBy: adminId,
        },
        {
          id: 'bulk_002',
          type: 'update',
          status: 'processing',
          totalUsers: 50,
          processedUsers: 32,
          errors: [],
          createdAt: '2024-12-03T14:30:00Z',
          createdBy: adminId,
        },
      ];

      // Load audit logs data
      const auditLogsData: AuditLogEntry[] = [
        {
          id: 'audit_001',
          timestamp: '2024-12-03T10:35:22Z',
          eventType: 'login',
          userId: 'usr_001',
          userEmail: 'jennifer.anderson@school.edu',
          description: 'Successful admin login',
          details: { loginMethod: 'password_mfa', deviceType: 'desktop' },
          ipAddress: '192.168.1.45',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          severity: 'low',
          location: 'New York, NY',
          outcome: 'success'
        },
        {
          id: 'audit_002',
          timestamp: '2024-12-03T10:30:15Z',
          eventType: 'security_violation',
          userId: 'usr_007',
          userEmail: 'unknown@suspicious.com',
          description: 'Multiple failed login attempts detected',
          details: { attempts: 5, timeWindow: '10 minutes', blocked: true },
          ipAddress: '203.45.67.89',
          userAgent: 'curl/7.68.0',
          severity: 'critical',
          location: 'Unknown, CN',
          outcome: 'blocked'
        },
        {
          id: 'audit_003',
          timestamp: '2024-12-03T09:45:30Z',
          eventType: 'user_updated',
          userId: 'usr_002',
          userEmail: 'michael.thompson@school.edu',
          adminId: 'usr_001',
          adminEmail: 'jennifer.anderson@school.edu',
          description: 'User profile updated - MFA requirement changed',
          details: { changes: { requiresMfa: { from: false, to: true } }, reason: 'security_policy_update' },
          ipAddress: '192.168.1.45',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          severity: 'medium',
          location: 'New York, NY',
          outcome: 'success'
        },
        {
          id: 'audit_004',
          timestamp: '2024-12-03T08:20:45Z',
          eventType: 'bulk_operation',
          userId: 'bulk_system',
          userEmail: 'system@school.edu',
          adminId: 'usr_001',
          adminEmail: 'jennifer.anderson@school.edu',
          description: 'Bulk user activation operation completed',
          details: { operation: 'activate', totalUsers: 25, successCount: 23, errorCount: 2 },
          ipAddress: '192.168.1.45',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          severity: 'medium',
          location: 'New York, NY',
          outcome: 'success'
        },
        {
          id: 'audit_005',
          timestamp: '2024-12-02T23:15:12Z',
          eventType: 'data_export',
          userId: 'usr_001',
          userEmail: 'jennifer.anderson@school.edu',
          description: 'User data exported for compliance audit',
          details: { format: 'CSV', recordCount: 1247, dataTypes: ['users', 'audit_logs', 'permissions'] },
          ipAddress: '192.168.1.45',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          severity: 'high',
          location: 'New York, NY',
          outcome: 'success'
        },
        {
          id: 'audit_006',
          timestamp: '2024-12-02T19:50:33Z',
          eventType: 'role_changed',
          userId: 'usr_008',
          userEmail: 'temp.contractor@school.edu',
          adminId: 'usr_001',
          adminEmail: 'jennifer.anderson@school.edu',
          description: 'User role changed from Teacher to Guest',
          details: { 
            oldRole: { name: 'teacher', permissions: 15 }, 
            newRole: { name: 'guest', permissions: 3 },
            reason: 'contract_ended'
          },
          ipAddress: '192.168.1.45',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          severity: 'medium',
          location: 'New York, NY',
          outcome: 'success'
        },
        {
          id: 'audit_007',
          timestamp: '2024-12-02T16:30:44Z',
          eventType: 'mfa_enabled',
          userId: 'usr_002',
          userEmail: 'michael.thompson@school.edu',
          description: 'Multi-factor authentication enabled',
          details: { method: 'authenticator_app', backupCodes: 8 },
          ipAddress: '10.0.1.23',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          severity: 'low',
          location: 'Boston, MA',
          outcome: 'success'
        },
        {
          id: 'audit_008',
          timestamp: '2024-12-02T14:22:11Z',
          eventType: 'password_reset',
          userId: 'usr_009',
          userEmail: 'student.forgot@school.edu',
          description: 'Password reset initiated via email',
          details: { method: 'email_link', tokenExpiry: '24 hours', successful: true },
          ipAddress: '172.16.0.105',
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X)',
          severity: 'low',
          location: 'Chicago, IL',
          outcome: 'success'
        }
      ];

      setUsers(usersData);
      setRoles(rolesData);
      setBulkOperations(bulkOpsData);
      setAuditLogs(auditLogsData);
    } catch (error) {
      Alert.alert('error', 'Failed to load user management data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Filter users based on search and filters
  const filteredUsers = users.filter((user) => {
    const matchesSearch = searchQuery === '' || 
      user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = !searchFilters.role || user.role.name === searchFilters.role;
    const matchesDepartment = !searchFilters.department || user.department === searchFilters.department;
    const matchesStatus = !searchFilters.status || user.status === searchFilters.status;
    const matchesVerified = searchFilters.isVerified === undefined || user.isVerified === searchFilters.isVerified;

    return matchesSearch && matchesRole && matchesDepartment && matchesStatus && matchesVerified;
  });

  // User management actions
  const handleCreateUser = () => {
    setSelectedUser(null);
    setShowUserModal(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleDeleteUser = (userId: string) => {
    Alert.alert(
      'Delete User',
      'Are you sure you want to delete this user? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setUsers(users.filter(u => u.id !== userId));
            Alert.alert('success', 'User deleted successfully');
          }
        }
      ]
    );
  };

  const handleToggleUserStatus = (userId: string) => {
    setUsers(users.map(user => {
      if (user.id === userId) {
        const newStatus = user.status === 'active' ? 'inactive' : 'active';
        return { ...user, status: newStatus };
      }
      return user;
    }));
  };

  const handleBulkAction = (action: 'activate' | 'deactivate' | 'delete' | 'export') => {
    if (selectedUsers.length === 0) {
      Alert.alert('No Selection', 'Please select users to perform bulk actions');
      return;
    }

    Alert.alert(
      'Bulk Action',
      `Are you sure you want to ${action} ${selectedUsers.length} selected users?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            // Create bulk operation record
            const newBulkOp: BulkOperation = {
              id: `bulk_${Date.now()}`,
              type: action as any,
              status: 'processing',
              totalUsers: selectedUsers.length,
              processedUsers: 0,
              errors: [],
              createdAt: new Date().toISOString(),
              createdBy: adminId,
            };
            setBulkOperations([newBulkOp, ...bulkOperations]);
            setSelectedUsers([]);
            Alert.alert('success', `Bulk ${action} operation started`);
          }
        }
      ]
    );
  };

  // Role management actions
  const handleCreateRole = () => {
    setSelectedRole(null);
    setShowRoleModal(true);
  };

  const handleEditRole = (role: UserRole) => {
    setSelectedRole(role);
    setShowRoleModal(true);
  };

  const handleDeleteRole = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (role && !role.isCustom) {
      Alert.alert('Cannot Delete', 'System roles cannot be deleted');
      return;
    }

    Alert.alert(
      'Delete Role',
      'Are you sure you want to delete this role?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setRoles(roles.filter(r => r.id !== roleId));
            Alert.alert('success', 'Role deleted successfully');
          }
        }
      ]
    );
  };

  // Render user item
  const renderUserItem = ({ item: user }: { item: User }) => (
    <View style={styles.userCard}>
      <View style={styles.userHeader}>
        <View style={styles.userInfo}>
          <View style={[styles.avatar, { backgroundColor: getStatusColor(user.status) }]}>
            <Text style={styles.avatarText}>
              {user.firstName[0]}{user.lastName[0]}
            </Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>
              {user.firstName} {user.lastName}
            </Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            <View style={styles.userMeta}>
              <View style={[styles.roleTag, { backgroundColor: getRoleColor(user.role.name) }]}>
                <Text style={styles.roleTagText}>{user.role.displayName}</Text>
              </View>
              <View style={[styles.statusTag, { backgroundColor: getStatusColor(user.status) }]}>
                <Text style={styles.statusTagText}>{user.status.toUpperCase()}</Text>
              </View>
            </View>
          </View>
        </View>
        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => {
            if (selectedUsers.includes(user.id)) {
              setSelectedUsers(selectedUsers.filter(id => id !== user.id));
            } else {
              setSelectedUsers([...selectedUsers, user.id]);
            }
          }}
        >
          <View style={[
            styles.checkbox,
            selectedUsers.includes(user.id) && styles.checkboxSelected
          ]}>
            {selectedUsers.includes(user.id) && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </View>
        </TouchableOpacity>
      </View>
      
      <View style={styles.userStats}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Department</Text>
          <Text style={styles.statValue}>{user.department || 'N/A'}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Last Login</Text>
          <Text style={styles.statValue}>
            {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>MFA</Text>
          <Text style={styles.statValue}>{user.requiresMfa ? 'Required' : 'Optional'}</Text>
        </View>
      </View>

      <View style={styles.userActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEditUser(user)}
        >
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.statusButton]}
          onPress={() => handleToggleUserStatus(user.id)}
        >
          <Text style={styles.actionButtonText}>
            {user.status === 'active' ? 'Deactivate' : 'Activate'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteUser(user.id)}
        >
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render role item
  const renderRoleItem = ({ item: role }: { item: UserRole }) => (
    <View style={styles.roleCard}>
      <View style={styles.roleHeader}>
        <View style={styles.roleInfo}>
          <Text style={styles.roleName}>{role.displayName}</Text>
          <Text style={styles.roleDescription}>{role.description}</Text>
          <View style={styles.roleMeta}>
            <View style={[styles.roleTypeTag, { 
              backgroundColor: role.isCustom ? LightTheme.Warning : LightTheme.Success 
            }]}>
              <Text style={styles.roleTypeText}>
                {role.isCustom ? 'Custom Role' : 'System Role'}
              </Text>
            </View>
            <Text style={styles.permissionCount}>
              {role.permissions.length} permissions
            </Text>
          </View>
        </View>
      </View>
      
      <View style={styles.roleActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEditRole(role)}
        >
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        {role.isCustom && (
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteRole(role.id)}
          >
            <Text style={styles.actionButtonText}>Delete</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // Render bulk operation item
  const renderBulkOperationItem = ({ item: operation }: { item: BulkOperation }) => (
    <View style={styles.bulkCard}>
      <View style={styles.bulkHeader}>
        <Text style={styles.bulkType}>
          {operation.type.charAt(0).toUpperCase() + operation.type.slice(1)} Operation
        </Text>
        <View style={[styles.bulkStatusTag, { 
          backgroundColor: getBulkStatusColor(operation.status) 
        }]}>
          <Text style={styles.bulkStatusText}>{operation.status.toUpperCase()}</Text>
        </View>
      </View>
      
      <View style={styles.bulkProgress}>
        <Text style={styles.bulkProgressText}>
          Progress: {operation.processedUsers}/{operation.totalUsers}
        </Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, {
            width: `${(operation.processedUsers / operation.totalUsers) * 100}%`
          }]} />
        </View>
      </View>

      {operation.errors.length > 0 && (
        <View style={styles.bulkErrors}>
          <Text style={styles.bulkErrorsTitle}>Errors ({operation.errors.length}):</Text>
          {operation.errors.slice(0, 3).map((error, index) => (
            <Text key={index} style={styles.bulkErrorText}>
              • {error.userEmail}: {error.error}
            </Text>
          ))}
          {operation.errors.length > 3 && (
            <Text style={styles.bulkErrorText}>
              ... and {operation.errors.length - 3} more errors
            </Text>
          )}
        </View>
      )}

      <Text style={styles.bulkTimestamp}>
        Started: {new Date(operation.createdAt).toLocaleString()}
        {operation.completedAt && (
          <Text> • Completed: {new Date(operation.completedAt).toLocaleString()}</Text>
        )}
      </Text>
    </View>
  );

  // Render audit log entry
  const renderAuditLogEntry = ({ item: entry }: { item: AuditLogEntry }) => (
    <View style={styles.auditLogItem}>
      <View style={styles.auditLogHeader}>
        <View style={styles.auditLogEvent}>
          <Text style={styles.auditEventType}>
            {getEventTypeDisplay(entry.eventType)}
          </Text>
          <View style={[styles.auditSeverityTag, { 
            backgroundColor: getSeverityColor(entry.severity) 
          }]}>
            <Text style={styles.auditSeverityText}>{entry.severity.toUpperCase()}</Text>
          </View>
        </View>
        <View style={[styles.auditOutcomeTag, { 
          backgroundColor: getOutcomeColor(entry.outcome) 
        }]}>
          <Text style={styles.auditOutcomeText}>{entry.outcome.toUpperCase()}</Text>
        </View>
      </View>
      
      <Text style={styles.auditDescription}>{entry.description}</Text>
      
      <View style={styles.auditDetails}>
        <View style={styles.auditDetailRow}>
          <Text style={styles.auditDetailLabel}>User:</Text>
          <Text style={styles.auditDetailValue}>{entry.userEmail}</Text>
        </View>
        {entry.adminEmail && (
          <View style={styles.auditDetailRow}>
            <Text style={styles.auditDetailLabel}>Admin:</Text>
            <Text style={styles.auditDetailValue}>{entry.adminEmail}</Text>
          </View>
        )}
        <View style={styles.auditDetailRow}>
          <Text style={styles.auditDetailLabel}>IP Address:</Text>
          <Text style={styles.auditDetailValue}>{entry.ipAddress}</Text>
        </View>
        {entry.location && (
          <View style={styles.auditDetailRow}>
            <Text style={styles.auditDetailLabel}>Location:</Text>
            <Text style={styles.auditDetailValue}>{entry.location}</Text>
          </View>
        )}
        <View style={styles.auditDetailRow}>
          <Text style={styles.auditDetailLabel}>Timestamp:</Text>
          <Text style={styles.auditDetailValue}>
            {new Date(entry.timestamp).toLocaleString()}
          </Text>
        </View>
      </View>

      {Object.keys(entry.details).length > 0 && (
        <TouchableOpacity
          style={styles.auditDetailsToggle}
          onPress={() => {
            Alert.alert(
              'Audit Details',
              JSON.stringify(entry.details, null, 2),
              [{ text: 'Close', style: 'default' }]
            );
          }}
        >
          <Text style={styles.auditDetailsToggleText}>View Technical Details</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Render Security Audit Log
  const renderSecurityAuditLog = () => {
    // Filter audit logs based on current filters
    const filteredAuditLogs = auditLogs.filter((entry) => {
      const matchesEventType = !auditFilters.eventType || entry.eventType === auditFilters.eventType;
      const matchesSeverity = !auditFilters.severity || entry.severity === auditFilters.severity;
      const matchesOutcome = !auditFilters.outcome || entry.outcome === auditFilters.outcome;
      const matchesUser = !auditFilters.userId || entry.userId === auditFilters.userId;
      const matchesIP = !auditFilters.ipAddress || entry.ipAddress.includes(auditFilters.ipAddress);
      
      let matchesDateRange = true;
      if (auditFilters.dateRange) {
        const entryDate = new Date(entry.timestamp);
        const startDate = new Date(auditFilters.dateRange.start);
        const endDate = new Date(auditFilters.dateRange.end);
        matchesDateRange = entryDate >= startDate && entryDate <= endDate;
      }

      return matchesEventType && matchesSeverity && matchesOutcome && matchesUser && matchesIP && matchesDateRange;
    });

    return (
      <>
        <View style={styles.auditHeader}>
          <Text style={styles.sectionTitle}>Security Audit Log</Text>
          <Text style={styles.auditSubtitle}>
            Real-time security monitoring and compliance tracking
          </Text>
        </View>

        {/* Audit Statistics */}
        <View style={styles.auditStatsContainer}>
          <View style={styles.auditStatCard}>
            <Text style={styles.auditStatNumber}>
              {auditLogs.filter(log => log.severity === 'critical').length}
            </Text>
            <Text style={styles.auditStatLabel}>Critical Events</Text>
          </View>
          <View style={styles.auditStatCard}>
            <Text style={styles.auditStatNumber}>
              {auditLogs.filter(log => log.outcome === 'blocked').length}
            </Text>
            <Text style={styles.auditStatLabel}>Blocked Attempts</Text>
          </View>
          <View style={styles.auditStatCard}>
            <Text style={styles.auditStatNumber}>
              {auditLogs.filter(log => log.eventType === 'login').length}
            </Text>
            <Text style={styles.auditStatLabel}>Login Events</Text>
          </View>
          <View style={styles.auditStatCard}>
            <Text style={styles.auditStatNumber}>
              {new Set(auditLogs.map(log => log.ipAddress)).size}
            </Text>
            <Text style={styles.auditStatLabel}>Unique IPs</Text>
          </View>
        </View>

        {/* Audit Filters */}
        <View style={styles.auditFiltersContainer}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => {
              setShowFilterModal(true);
            }}
          >
            <Text style={styles.filterButtonText}>🔍 Filter Events</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => {
              Alert.alert('Export Data', 'Audit log export functionality ready!');
            }}
          >
            <Text style={styles.filterButtonText}>📊 Export Audit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => {
              Alert.alert('Real-time Alerts', 'Security alert configuration available!');
            }}
          >
            <Text style={styles.filterButtonText}>🚨 Configure Alerts</Text>
          </TouchableOpacity>
        </View>

        {/* Security Compliance Summary */}
        <View style={styles.complianceSummary}>
          <Text style={styles.complianceTitle}>Security Compliance Status</Text>
          <View style={styles.complianceItems}>
            <View style={styles.complianceItem}>
              <Text style={styles.complianceCheck}>✅</Text>
              <Text style={styles.complianceText}>Audit logging enabled and operational</Text>
            </View>
            <View style={styles.complianceItem}>
              <Text style={styles.complianceCheck}>✅</Text>
              <Text style={styles.complianceText}>Failed login attempt monitoring active</Text>
            </View>
            <View style={styles.complianceItem}>
              <Text style={styles.complianceCheck}>✅</Text>
              <Text style={styles.complianceText}>User activity tracking comprehensive</Text>
            </View>
            <View style={styles.complianceItem}>
              <Text style={styles.complianceCheck}>✅</Text>
              <Text style={styles.complianceText}>Administrative action logging complete</Text>
            </View>
            <View style={styles.complianceItem}>
              <Text style={styles.complianceCheck}>⚠️</Text>
              <Text style={styles.complianceText}>
                {auditLogs.filter(log => log.severity === 'critical').length} critical events require review
              </Text>
            </View>
          </View>
        </View>

        {/* Audit Log List */}
        <FlatList
          data={filteredAuditLogs}
          renderItem={renderAuditLogEntry}
          keyExtractor={(item) => item.id}
          style={styles.auditLogList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No audit log entries found</Text>
              <Text style={styles.emptyStateSubtext}>
                Try adjusting your filters or check back later
              </Text>
            </View>
          }
        />
      </>
    );
  };

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return LightTheme.Success;
      case 'inactive': return LightTheme.OnSurfaceVariant;
      case 'pending': return LightTheme.Warning;
      case 'suspended': return LightTheme.Error;
      default: return LightTheme.OnSurfaceVariant;
    }
  };

  const getRoleColor = (roleName: string) => {
    switch (roleName) {
      case 'admin': return LightTheme.Error;
      case 'teacher': return LightTheme.Success;
      case 'parent': return LightTheme.Primary;
      case 'student': return LightTheme.Info;
      default: return LightTheme.OnSurfaceVariant;
    }
  };

  const getBulkStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return LightTheme.Success;
      case 'processing': return LightTheme.Warning;
      case 'failed': return LightTheme.Error;
      default: return LightTheme.OnSurfaceVariant;
    }
  };

  const getEventTypeDisplay = (eventType: string) => {
    const eventTypeMap = {
      'login': '🔐 Login',
      'logout': '🚪 Logout',
      'user_created': '👤 User Created',
      'user_updated': '✏️ User Updated',
      'user_deleted': '🗑️ User Deleted',
      'role_changed': '🔄 Role Changed',
      'permission_changed': '🔑 Permission Changed',
      'password_reset': '🔓 Password Reset',
      'mfa_enabled': '🔒 MFA Enabled',
      'mfa_disabled': '🔓 MFA Disabled',
      'security_violation': '⚠️ Security Violation',
      'bulk_operation': '📊 Bulk Operation',
      'data_export': '📤 Data Export',
      'system_config': '⚙️ System Config',
      'audit_access': '📋 Audit Access'
    };
    return eventTypeMap[eventType] || `📝 ${eventType.replace('_', ' ').toUpperCase()}`;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#D32F2F';
      case 'high': return '#F57C00';
      case 'medium': return '#FBC02D';
      case 'low': return LightTheme.Success;
      default: return LightTheme.OnSurfaceVariant;
    }
  };

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'success': return LightTheme.Success;
      case 'failure': return LightTheme.Error;
      case 'blocked': return '#D32F2F';
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
        <Text style={styles.headerTitle}>User Management</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleCreateUser}
        >
          <Text style={styles.addButtonText}>+ Add User</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {['users', 'roles', 'bulk', 'audit'].map((tab) => (
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
      {activeTab === 'users' && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={LightTheme.OnSurfaceVariant}
          />
          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterButtonText}>🔍 Filters</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Bulk Actions */}
      {activeTab === 'users' && selectedUsers.length > 0 && (
        <View style={styles.bulkActionsContainer}>
          <Text style={styles.bulkActionsTitle}>
            {selectedUsers.length} users selected
          </Text>
          <View style={styles.bulkActions}>
            <TouchableOpacity
              style={[styles.bulkActionButton, styles.activateButton]}
              onPress={() => handleBulkAction('activate')}
            >
              <Text style={styles.bulkActionText}>Activate</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.bulkActionButton, styles.deactivateButton]}
              onPress={() => handleBulkAction('deactivate')}
            >
              <Text style={styles.bulkActionText}>Deactivate</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.bulkActionButton, styles.exportButton]}
              onPress={() => handleBulkAction('export')}
            >
              <Text style={styles.bulkActionText}>Export</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.bulkActionButton, styles.deleteButton]}
              onPress={() => handleBulkAction('delete')}
            >
              <Text style={styles.bulkActionText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Content based on active tab */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {activeTab === 'users' && (
          <>
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{users.length}</Text>
                <Text style={styles.statLabel}>Total Users</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>
                  {users.filter(u => u.status === 'active').length}
                </Text>
                <Text style={styles.statLabel}>Active Users</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>
                  {users.filter(u => u.status === 'pending').length}
                </Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>
                  {users.filter(u => u.requiresMfa).length}
                </Text>
                <Text style={styles.statLabel}>MFA Enabled</Text>
              </View>
            </View>

            <FlatList
              data={filteredUsers}
              keyExtractor={(item) => item.id}
              renderItem={renderUserItem}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </>
        )}

        {activeTab === 'roles' && (
          <>
            <View style={styles.roleHeader}>
              <Text style={styles.sectionTitle}>Role Management</Text>
              <TouchableOpacity
                style={styles.addRoleButton}
                onPress={handleCreateRole}
              >
                <Text style={styles.addRoleButtonText}>+ Create Role</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={roles}
              keyExtractor={(item) => item.id}
              renderItem={renderRoleItem}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </>
        )}

        {activeTab === 'bulk' && (
          <>
            <View style={styles.bulkHeader}>
              <Text style={styles.sectionTitle}>Bulk Operations</Text>
              <TouchableOpacity
                style={styles.bulkImportButton}
                onPress={() => setShowBulkModal(true)}
              >
                <Text style={styles.bulkImportButtonText}>📁 Import Users</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={bulkOperations}
              keyExtractor={(item) => item.id}
              renderItem={renderBulkOperationItem}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </>
        )}

        {activeTab === 'audit' && (
          <View style={styles.auditContainer}>
            {renderSecurityAuditLog()}
          </View>
        )}
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Advanced Filter Options</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Event Type Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Event Type</Text>
                <View style={styles.filterOptions}>
                  {['login', 'logout', 'password_change', 'role_change', 'failed_login', 'account_locked'].map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.filterOption,
                        auditFilters.eventType === type && styles.selectedFilterOption
                      ]}
                      onPress={() => setAuditFilters({...auditFilters, eventType: type})}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        auditFilters.eventType === type && styles.selectedFilterOptionText
                      ]}>
                        {type.replace('_', ' ').toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* User Role Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>User Role</Text>
                <View style={styles.filterOptions}>
                  {['admin', 'teacher', 'student', 'parent'].map((role) => (
                    <TouchableOpacity
                      key={role}
                      style={[
                        styles.filterOption,
                        auditFilters.userRole === role && styles.selectedFilterOption
                      ]}
                      onPress={() => setAuditFilters({...auditFilters, userRole: role})}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        auditFilters.userRole === role && styles.selectedFilterOptionText
                      ]}>
                        {role.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Outcome Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Outcome</Text>
                <View style={styles.filterOptions}>
                  {['success', 'failure', 'blocked'].map((outcome) => (
                    <TouchableOpacity
                      key={outcome}
                      style={[
                        styles.filterOption,
                        auditFilters.outcome === outcome && styles.selectedFilterOption
                      ]}
                      onPress={() => setAuditFilters({...auditFilters, outcome: outcome})}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        auditFilters.outcome === outcome && styles.selectedFilterOptionText
                      ]}>
                        {outcome.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.clearFiltersButton}
                onPress={() => {
                  setAuditFilters({});
                  setShowFilterModal(false);
                }}
              >
                <Text style={styles.clearFiltersButtonText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyFiltersButton}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={styles.applyFiltersButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingVertical: Spacing.MD,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: LightTheme.Primary,
  },
  tabText: {
    ...Typography.bodyMedium,
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
  filterButton: {
    backgroundColor: LightTheme.Primary,
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    borderRadius: BorderRadius.SM,
  },
  filterButtonText: {
    ...Typography.bodyMedium,
    color: LightTheme.Surface,
    fontWeight: '500',
  },
  bulkActionsContainer: {
    backgroundColor: LightTheme.primaryContainer,
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    borderBottomWidth: 1,
    borderBottomColor: LightTheme.Outline,
  },
  bulkActionsTitle: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurface,
    fontWeight: '600',
    marginBottom: Spacing.XS,
  },
  bulkActions: {
    flexDirection: 'row',
    gap: Spacing.SM,
  },
  bulkActionButton: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.XS,
  },
  activateButton: {
    backgroundColor: LightTheme.Success,
  },
  deactivateButton: {
    backgroundColor: LightTheme.Warning,
  },
  exportButton: {
    backgroundColor: LightTheme.Info,
  },
  bulkActionText: {
    ...Typography.bodySmall,
    color: LightTheme.Surface,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    gap: Spacing.SM,
  },
  statCard: {
    flex: 1,
    backgroundColor: LightTheme.Surface,
    padding: Spacing.MD,
    borderRadius: BorderRadius.SM,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: LightTheme.Outline,
  },
  statNumber: {
    ...Typography.headlineMedium,
    color: LightTheme.Primary,
    fontWeight: '700',
  },
  statLabel: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
    marginTop: Spacing.XS,
  },
  userCard: {
    backgroundColor: LightTheme.Surface,
    marginHorizontal: Spacing.MD,
    marginVertical: Spacing.XS,
    padding: Spacing.MD,
    borderRadius: BorderRadius.SM,
    borderWidth: 1,
    borderColor: LightTheme.Outline,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.SM,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.MD,
  },
  avatarText: {
    ...Typography.bodySmall,
    color: LightTheme.Surface,
    fontWeight: '600',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    ...Typography.bodyMedium,
    color: LightTheme.OnSurface,
    fontWeight: '600',
    marginBottom: Spacing.XS / 2,
  },
  userEmail: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.XS,
  },
  userMeta: {
    flexDirection: 'row',
    gap: Spacing.XS,
  },
  roleTag: {
    paddingHorizontal: Spacing.XS,
    paddingVertical: 2,
    borderRadius: BorderRadius.XS,
  },
  roleTagText: {
    ...Typography.bodySmall,
    color: LightTheme.Surface,
    fontWeight: '500',
  },
  statusTag: {
    paddingHorizontal: Spacing.XS,
    paddingVertical: 2,
    borderRadius: BorderRadius.XS,
  },
  statusTagText: {
    ...Typography.bodySmall,
    color: LightTheme.Surface,
    fontWeight: '500',
  },
  selectButton: {
    padding: Spacing.XS,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: LightTheme.Outline,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: LightTheme.Primary,
    borderColor: LightTheme.Primary,
  },
  checkmark: {
    ...Typography.bodySmall,
    color: LightTheme.Surface,
    fontWeight: '600',
  },
  userStats: {
    flexDirection: 'row',
    marginBottom: Spacing.SM,
    gap: Spacing.MD,
  },
  statItem: {
    flex: 1,
  },
  statValue: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurface,
    fontWeight: '500',
  },
  userActions: {
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
  statusButton: {
    backgroundColor: LightTheme.Warning,
  },
  deleteButton: {
    backgroundColor: LightTheme.Error,
  },
  actionButtonText: {
    ...Typography.bodySmall,
    color: LightTheme.Surface,
    fontWeight: '500',
  },
  roleCard: {
    backgroundColor: LightTheme.Surface,
    marginHorizontal: Spacing.MD,
    marginVertical: Spacing.XS,
    padding: Spacing.MD,
    borderRadius: BorderRadius.SM,
    borderWidth: 1,
    borderColor: LightTheme.Outline,
  },
  roleHeader: {
    marginBottom: Spacing.SM,
  },
  roleInfo: {
    marginBottom: Spacing.SM,
  },
  roleName: {
    ...Typography.bodyMedium,
    color: LightTheme.OnSurface,
    fontWeight: '600',
    marginBottom: Spacing.XS / 2,
  },
  roleDescription: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
    marginBottom: Spacing.XS,
  },
  roleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roleTypeTag: {
    paddingHorizontal: Spacing.XS,
    paddingVertical: 2,
    borderRadius: BorderRadius.XS,
  },
  roleTypeText: {
    ...Typography.bodySmall,
    color: LightTheme.Surface,
    fontWeight: '500',
  },
  permissionCount: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
    fontWeight: '500',
  },
  roleActions: {
    flexDirection: 'row',
    gap: Spacing.SM,
  },
  bulkCard: {
    backgroundColor: LightTheme.Surface,
    marginHorizontal: Spacing.MD,
    marginVertical: Spacing.XS,
    padding: Spacing.MD,
    borderRadius: BorderRadius.SM,
    borderWidth: 1,
    borderColor: LightTheme.Outline,
  },
  bulkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.SM,
  },
  bulkType: {
    ...Typography.bodyMedium,
    color: LightTheme.OnSurface,
    fontWeight: '600',
  },
  bulkStatusTag: {
    paddingHorizontal: Spacing.XS,
    paddingVertical: 2,
    borderRadius: BorderRadius.XS,
  },
  bulkStatusText: {
    ...Typography.bodySmall,
    color: LightTheme.Surface,
    fontWeight: '500',
  },
  bulkProgress: {
    marginBottom: Spacing.SM,
  },
  bulkProgressText: {
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
  bulkErrors: {
    backgroundColor: LightTheme.errorContainer,
    padding: Spacing.SM,
    borderRadius: BorderRadius.XS,
    marginBottom: Spacing.SM,
  },
  bulkErrorsTitle: {
    ...Typography.bodySmall,
    color: LightTheme.Error,
    fontWeight: '600',
    marginBottom: Spacing.XS,
  },
  bulkErrorText: {
    ...Typography.bodySmall,
    color: LightTheme.Error,
    marginBottom: 2,
  },
  bulkTimestamp: {
    ...Typography.bodySmall,
    color: LightTheme.OnSurfaceVariant,
  },
  sectionTitle: {
    ...Typography.headlineSmall,
    color: LightTheme.OnSurface,
    fontWeight: '600',
  },
  addRoleButton: {
    backgroundColor: LightTheme.Success,
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
  },
  addRoleButtonText: {
    ...Typography.bodyMedium,
    color: LightTheme.Surface,
    fontWeight: '600',
  },
  bulkImportButton: {
    backgroundColor: LightTheme.Info,
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.SM,
  },
  bulkImportButtonText: {
    ...Typography.bodyMedium,
    color: LightTheme.Surface,
    fontWeight: '600',
  },
  auditContainer: {
    padding: Spacing.MD,
  },
  auditHeader: {
    marginBottom: Spacing.LG,
  },
  auditSubtitle: {
    ...Typography.bodyMedium,
    color: LightTheme.OnSurfaceVariant,
    marginTop: Spacing.SM,
  },
  auditStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.LG,
    flexWrap: 'wrap',
  },
  auditStatCard: {
    backgroundColor: LightTheme.Surface,
    padding: Spacing.MD,
    borderRadius: BorderRadius.MD,
    alignItems: 'center',
    minWidth: '22%',
    marginBottom: Spacing.SM,
    borderWidth: 1,
    borderColor: LightTheme.Outline,
  },
  auditStatNumber: {
    ...Typography.headlineMedium,
    color: LightTheme.Primary,
    fontWeight: 'bold',
  },
  auditStatLabel: {
    ...Typography.labelSmall,
    color: LightTheme.OnSurfaceVariant,
    textAlign: 'center',
    marginTop: Spacing.XS,
  },
  auditFiltersContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.LG,
    flexWrap: 'wrap',
  },
  filterButton: {
    backgroundColor: LightTheme.primaryContainer,
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    borderRadius: BorderRadius.MD,
    marginRight: Spacing.SM,
    marginBottom: Spacing.SM,
  },
  filterButtonText: {
    ...Typography.labelMedium,
    color: LightTheme.OnPrimaryContainer,
    fontWeight: '500',
  },
  complianceSummary: {
    backgroundColor: LightTheme.Surface,
    padding: Spacing.LG,
    borderRadius: BorderRadius.MD,
    marginBottom: Spacing.LG,
    borderWidth: 1,
    borderColor: LightTheme.Outline,
  },
  complianceTitle: {
    ...Typography.titleMedium,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.MD,
    fontWeight: '600',
  },
  complianceItems: {
    gap: Spacing.SM,
  },
  complianceItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  complianceCheck: {
    fontSize: 16,
    marginRight: Spacing.SM,
  },
  complianceText: {
    ...Typography.bodyMedium,
    color: LightTheme.OnSurface,
    flex: 1,
  },
  auditLogList: {
    flex: 1,
  },
  auditLogItem: {
    backgroundColor: LightTheme.Surface,
    padding: Spacing.LG,
    borderRadius: BorderRadius.MD,
    marginBottom: Spacing.MD,
    borderWidth: 1,
    borderColor: LightTheme.Outline,
  },
  auditLogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.MD,
  },
  auditLogEvent: {
    flex: 1,
  },
  auditEventType: {
    ...Typography.titleSmall,
    color: LightTheme.OnSurface,
    fontWeight: '600',
    marginBottom: Spacing.XS,
  },
  auditSeverityTag: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: 2,
    borderRadius: BorderRadius.SM,
    alignSelf: 'flex-start',
  },
  auditSeverityText: {
    ...Typography.labelSmall,
    color: 'white',
    fontWeight: 'bold',
    fontSize: 10,
  },
  auditOutcomeTag: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: 2,
    borderRadius: BorderRadius.SM,
  },
  auditOutcomeText: {
    ...Typography.labelSmall,
    color: 'white',
    fontWeight: 'bold',
    fontSize: 10,
  },
  auditDescription: {
    ...Typography.bodyMedium,
    color: LightTheme.OnSurface,
    marginBottom: Spacing.MD,
  },
  auditDetails: {
    gap: Spacing.XS,
    marginBottom: Spacing.SM,
  },
  auditDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  auditDetailLabel: {
    ...Typography.labelMedium,
    color: LightTheme.OnSurfaceVariant,
    fontWeight: '500',
  },
  auditDetailValue: {
    ...Typography.labelMedium,
    color: LightTheme.OnSurface,
    flex: 1,
    textAlign: 'right',
  },
  auditDetailsToggle: {
    backgroundColor: LightTheme.primaryContainer,
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    borderRadius: BorderRadius.SM,
    alignSelf: 'flex-start',
  },
  auditDetailsToggleText: {
    ...Typography.labelMedium,
    color: LightTheme.OnPrimaryContainer,
    fontWeight: '500',
  },
  separator: {
    height: 1,
    backgroundColor: LightTheme.Outline,
    marginHorizontal: Spacing.MD,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.MD,
  },
  modalContent: {
    backgroundColor: LightTheme.Surface,
    borderRadius: BorderRadius.LG,
    width: '100%',
    maxHeight: '80%',
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.LG,
    borderBottomWidth: 1,
    borderBottomColor: LightTheme.Outline,
  },
  modalTitle: {
    ...Typography.headlineSmall,
    color: LightTheme.OnSurface,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    padding: Spacing.SM,
  },
  modalCloseText: {
    ...Typography.headlineMedium,
    color: LightTheme.OnSurfaceVariant,
  },
  modalBody: {
    padding: Spacing.LG,
  },
  filterSection: {
    marginBottom: Spacing.XL,
  },
  filterLabel: {
    ...Typography.titleMedium,
    color: LightTheme.OnSurface,
    fontWeight: 'bold',
    marginBottom: Spacing.MD,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.SM,
  },
  filterOption: {
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    borderRadius: BorderRadius.MD,
    borderWidth: 1,
    borderColor: LightTheme.Outline,
    backgroundColor: LightTheme.Surface,
  },
  selectedFilterOption: {
    backgroundColor: LightTheme.primaryContainer,
    borderColor: LightTheme.Primary,
  },
  filterOptionText: {
    ...Typography.labelMedium,
    color: LightTheme.OnSurface,
  },
  selectedFilterOptionText: {
    color: LightTheme.OnPrimaryContainer,
    fontWeight: 'bold',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.LG,
    borderTopWidth: 1,
    borderTopColor: LightTheme.Outline,
    gap: Spacing.MD,
  },
  clearFiltersButton: {
    flex: 1,
    paddingVertical: Spacing.MD,
    borderRadius: BorderRadius.MD,
    borderWidth: 1,
    borderColor: LightTheme.Error,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  clearFiltersButtonText: {
    ...Typography.labelLarge,
    color: LightTheme.Error,
    fontWeight: 'bold',
  },
  applyFiltersButton: {
    flex: 1,
    paddingVertical: Spacing.MD,
    borderRadius: BorderRadius.MD,
    backgroundColor: LightTheme.Primary,
    alignItems: 'center',
  },
  applyFiltersButtonText: {
    ...Typography.labelLarge,
    color: LightTheme.OnPrimary,
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default UserManagementScreen;