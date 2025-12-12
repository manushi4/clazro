/**
 * StaffDirectoryScreen
 * Lists all school staff members with contact information
 *
 * Features:
 * - Real-time staff data from Supabase
 * - Search by name or department
 * - Filter by department (8 departments)
 * - Display contact info (email, phone, office)
 * - Show office hours and location
 * - Quick actions (call, email)
 * - Staff bio and subjects taught
 * - Pull to refresh
 */

import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, Linking, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { BaseScreen } from '../../shared/components/BaseScreen';
import { Col, Row, T, Card, CardContent, Badge, Button } from '../../ui';
import { Colors, Spacing } from '../../theme/designSystem';
import { FilterDropdowns } from '../../components/common/FilterDropdowns';
import type { ParentStackParamList } from '../../types/navigation';
import { trackScreenView, trackAction } from '../../utils/navigationAnalytics';

type Props = NativeStackScreenProps<ParentStackParamList, 'StaffDirectory'>;

type DepartmentFilter = 'all' | 'Administration' | 'Mathematics' | 'Science' | 'English' | 'Social Studies' | 'Physical Education' | 'Arts' | 'Library' | 'Counseling';

interface StaffMember {
  id: string;
  email: string;
  full_name: string;
  role: string;
  phone: string | null;
  avatar_url: string | null;
  metadata: {
    department: string;
    position: string;
    subjects: string[] | null;
    office_location: string;
    office_hours: string;
    bio: string;
  }[] | null;
}

const StaffDirectoryScreen: React.FC<Props> = () => {
  const [departmentFilter, setDepartmentFilter] = useState<DepartmentFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Track screen view
  useEffect(() => {
    trackScreenView('StaffDirectory', { from: 'Dashboard' });
  }, []);

  // Fetch staff members
  const {
    data: staffMembers = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['staff_directory'],
    queryFn: async () => {
      console.log('🔍 [StaffDirectory] Fetching staff members');
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          role,
          phone,
          avatar_url,
          metadata:staff_metadata (
            department,
            position,
            subjects,
            office_location,
            office_hours,
            bio
          )
        `)
        .in('role', ['admin', 'teacher'])
        .order('full_name', { ascending: true });

      if (error) {
        console.error('❌ [StaffDirectory] Error:', error);
        throw error;
      }

      console.log('✅ [StaffDirectory] Loaded', data?.length || 0, 'staff members');
      return data as StaffMember[];
    },
    staleTime: 1000 * 60 * 10, // 10 minutes (staff data doesn't change often)
  });

  // Filter staff members
  const filteredStaff = useMemo(() => {
    let filtered = staffMembers;

    // Filter by department
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(
        staff => staff.metadata?.[0]?.department === departmentFilter
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        staff =>
          staff.full_name.toLowerCase().includes(query) ||
          staff.metadata?.[0]?.department?.toLowerCase().includes(query) ||
          staff.metadata?.[0]?.position?.toLowerCase().includes(query) ||
          staff.metadata?.[0]?.subjects?.some(s => s.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [staffMembers, departmentFilter, searchQuery]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = staffMembers.length;
    const teachers = staffMembers.filter(s => s.role === 'teacher').length;
    const admin = staffMembers.filter(s => s.role === 'admin').length;
    const departments = new Set(
      staffMembers.map(s => s.metadata?.[0]?.department).filter(Boolean)
    ).size;

    return { total, teachers, admin, departments };
  }, [staffMembers]);

  // Get department list for filter
  const departments = useMemo(() => {
    const depts = new Set(
      staffMembers.map(s => s.metadata?.[0]?.department).filter(Boolean)
    );
    return Array.from(depts).sort();
  }, [staffMembers]);

  // Get role badge color
  const getRoleBadgeVariant = (role: string): 'info' | 'success' | 'warning' => {
    if (role === 'admin') return 'info';
    if (role === 'teacher') return 'success';
    return 'warning';
  };

  // Handle phone call
  const handleCall = (phone: string | null, name: string) => {
    if (!phone) {
      Alert.alert('No Phone Number', `${name} does not have a phone number listed.`);
      return;
    }

    trackAction('call_staff', 'StaffDirectory', { staff_name: name });
    Linking.openURL(`tel:${phone}`);
  };

  // Handle email
  const handleEmail = (email: string, name: string) => {
    trackAction('email_staff', 'StaffDirectory', { staff_name: name });
    Linking.openURL(`mailto:${email}`);
  };

  return (
    <BaseScreen
      scrollable={true}
      loading={isLoading}
      error={error ? 'Failed to load staff directory' : null}
      empty={!isLoading && staffMembers.length === 0}
      emptyBody="No staff members found. The directory will be updated soon."
      onRetry={refetch}
    >
      <Col sx={{ p: 'md' }} gap="md">
        {/* Header & Stats Card */}
        <Card variant="elevated">
          <CardContent>
            <Row spaceBetween centerV style={{ marginBottom: Spacing.sm }}>
              <T variant="title" weight="bold">
                Staff Directory
              </T>
              <Badge variant="info" label={`${stats.total} members`} />
            </Row>

            {/* Stats Summary */}
            <Row spaceBetween style={{ marginTop: Spacing.md }}>
              <View style={styles.statBox}>
                <T variant="display" weight="bold" style={{ fontSize: 24, color: Colors.primary }}>
                  {stats.total}
                </T>
                <T variant="caption" color="textSecondary">Total</T>
              </View>

              <View style={styles.statBox}>
                <T variant="display" weight="bold" style={{ fontSize: 24, color: Colors.success }}>
                  {stats.teachers}
                </T>
                <T variant="caption" color="textSecondary">Teachers</T>
              </View>

              <View style={styles.statBox}>
                <T variant="display" weight="bold" style={{ fontSize: 24, color: Colors.warning }}>
                  {stats.admin}
                </T>
                <T variant="caption" color="textSecondary">Admin</T>
              </View>

              <View style={styles.statBox}>
                <T variant="display" weight="bold" style={{ fontSize: 24, color: Colors.primary }}>
                  {stats.departments}
                </T>
                <T variant="caption" color="textSecondary">Departments</T>
              </View>
            </Row>
          </CardContent>
        </Card>

        {/* Search Input */}
        <Card variant="outlined">
          <CardContent>
            <T variant="caption" color="textSecondary" style={{ marginBottom: Spacing.xs }}>
              Search staff
            </T>
            <View style={styles.searchContainer}>
              <T variant="body">🔍</T>
              <TextInput
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  trackAction('search_staff', 'StaffDirectory', { query: text });
                }}
                placeholder="Search by name, department, or subject..."
                style={styles.searchInput}
                placeholderTextColor={Colors.textTertiary}
              />
              {searchQuery && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <T variant="body">✖️</T>
                </TouchableOpacity>
              )}
            </View>
          </CardContent>
        </Card>

        {/* Filter by Department */}
        {/* Filters */}
        <FilterDropdowns
          filters={[
            {
              label: 'Department',
              value: departmentFilter,
              options: [
                { value: 'all', label: 'All' },
                { value: 'academic', label: 'Academic' },
                { value: 'administration', label: 'Administration' },
                { value: 'support', label: 'Support' },
              ],
              onChange: (value) => {
                setDepartmentFilter(value as DepartmentFilter);
                trackAction('filter_department', 'StaffDirectory', { department: value });
              },
            },
          ]}
          activeFilters={[
            departmentFilter !== 'all' && { label: departmentFilter.charAt(0).toUpperCase() + departmentFilter.slice(1), variant: 'info' as const },
          ].filter(Boolean) as any}
          onClearAll={() => {
            setDepartmentFilter('all');
            trackAction('clear_filters', 'StaffDirectory');
          }}
        />

        {/* Staff Members List */}
        <Col gap="sm">
          {filteredStaff.map(staff => (
            <Card key={staff.id} variant="elevated">
              <CardContent>
                {/* Header Row */}
                <Row spaceBetween centerV style={{ marginBottom: Spacing.sm }}>
                  <Col style={{ flex: 1 }}>
                    <T variant="body" weight="bold">
                      {staff.full_name}
                    </T>
                    <T variant="caption" color="textSecondary">
                      {staff.metadata?.[0]?.position || staff.role}
                    </T>
                  </Col>
                  <Badge
                    variant={getRoleBadgeVariant(staff.role)}
                    label={staff.role === 'teacher' ? '👨‍🏫 Teacher' : '👔 Admin'}
                  />
                </Row>

                {/* Department & Subjects */}
                {staff.metadata?.[0]?.department && (
                  <Row centerV style={{ marginBottom: Spacing.xs, gap: Spacing.xs }}>
                    <T variant="caption" color="primary" weight="semiBold">
                      📚 {staff.metadata[0].department}
                    </T>
                  </Row>
                )}

                {staff.metadata?.[0]?.subjects && staff.metadata[0].subjects.length > 0 && (
                  <Row style={{ flexWrap: 'wrap', gap: Spacing.xs, marginBottom: Spacing.sm }}>
                    {staff.metadata[0].subjects.map((subject, idx) => (
                      <Badge key={idx} variant="default" label={subject} />
                    ))}
                  </Row>
                )}

                {/* Bio */}
                {staff.metadata?.[0]?.bio && (
                  <T
                    variant="body"
                    color="textSecondary"
                    style={{ marginBottom: Spacing.sm }}
                    numberOfLines={2}
                  >
                    {staff.metadata[0].bio}
                  </T>
                )}

                {/* Contact Information */}
                <View style={styles.contactSection}>
                  {/* Email */}
                  <TouchableOpacity
                    onPress={() => handleEmail(staff.email, staff.full_name)}
                    style={styles.contactRow}
                  >
                    <T variant="caption">📧</T>
                    <T variant="caption" color="primary" style={{ flex: 1, marginLeft: Spacing.xs }}>
                      {staff.email}
                    </T>
                  </TouchableOpacity>

                  {/* Phone */}
                  {staff.phone && (
                    <TouchableOpacity
                      onPress={() => handleCall(staff.phone, staff.full_name)}
                      style={styles.contactRow}
                    >
                      <T variant="caption">📞</T>
                      <T variant="caption" color="primary" style={{ flex: 1, marginLeft: Spacing.xs }}>
                        {staff.phone}
                      </T>
                    </TouchableOpacity>
                  )}

                  {/* Office Location */}
                  {staff.metadata?.[0]?.office_location && (
                    <View style={styles.contactRow}>
                      <T variant="caption">🏢</T>
                      <T variant="caption" color="textSecondary" style={{ flex: 1, marginLeft: Spacing.xs }}>
                        {staff.metadata[0].office_location}
                      </T>
                    </View>
                  )}

                  {/* Office Hours */}
                  {staff.metadata?.[0]?.office_hours && (
                    <View style={styles.contactRow}>
                      <T variant="caption">🕒</T>
                      <T variant="caption" color="textSecondary" style={{ flex: 1, marginLeft: Spacing.xs }}>
                        {staff.metadata[0].office_hours}
                      </T>
                    </View>
                  )}
                </View>

                {/* Action Buttons */}
                <Row style={{ gap: Spacing.xs, marginTop: Spacing.sm }}>
                  <Button
                    variant="outline"
                    onPress={() => handleEmail(staff.email, staff.full_name)}
                    style={{ flex: 1 }}
                  >
                    ✉️ Email
                  </Button>
                  {staff.phone && (
                    <Button
                      variant="outline"
                      onPress={() => handleCall(staff.phone, staff.full_name)}
                      style={{ flex: 1 }}
                    >
                      📞 Call
                    </Button>
                  )}
                </Row>
              </CardContent>
            </Card>
          ))}
        </Col>

        {/* Empty State for Filters */}
        {filteredStaff.length === 0 && staffMembers.length > 0 && (
          <Card variant="outlined">
            <CardContent>
              <View style={{ alignItems: 'center', paddingVertical: Spacing.lg }}>
                <T variant="body" color="textSecondary" style={{ textAlign: 'center' }}>
                  No staff members match your filters
                </T>
                <Button
                  variant="outline"
                  onPress={() => {
                    setDepartmentFilter('all');
                    setSearchQuery('');
                  }}
                  style={{ marginTop: Spacing.md }}
                >
                  Clear Filters
                </Button>
              </View>
            </CardContent>
          </Card>
        )}
      </Col>
    </BaseScreen>
  );
};

const styles = StyleSheet.create({
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    padding: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    padding: Spacing.xs,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  contactSection: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
});

export default StaffDirectoryScreen;
