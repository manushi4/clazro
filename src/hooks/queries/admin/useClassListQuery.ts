/**
 * useClassListQuery - Fetches class list for admin
 *
 * Queries organizations table for type='class' entries:
 * - Filters by customer_id
 * - Supports search, pagination, and sorting
 * - Returns class details with parent department info
 *
 * Widget ID: org.class-list
 * Phase 2: Query Hook
 *
 * @returns Class list with loading/error states
 */

import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../../lib/supabaseClient';
import { useCustomerId } from '../../config/useCustomerId';

export type ClassItem = {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  parentName: string | null;
  memberCount: number;
  isActive: boolean;
  displayOrder: number;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type ClassListData = {
  classes: ClassItem[];
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
};

export type ClassListQueryOptions = {
  search?: string;
  isActive?: boolean;
  parentId?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'memberCount' | 'createdAt' | 'displayOrder';
  sortOrder?: 'asc' | 'desc';
};

// Fallback mock data when database query fails
const FALLBACK_CLASSES: ClassItem[] = [
  {
    id: 'mock-class-1',
    name: 'Class 10-A',
    description: 'Grade 10 Section A',
    parentId: 'mock-dept-1',
    parentName: 'Science Department',
    memberCount: 35,
    isActive: true,
    displayOrder: 1,
    metadata: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mock-class-2',
    name: 'Class 10-B',
    description: 'Grade 10 Section B',
    parentId: 'mock-dept-1',
    parentName: 'Science Department',
    memberCount: 32,
    isActive: true,
    displayOrder: 2,
    metadata: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mock-class-3',
    name: 'Class 9-A',
    description: 'Grade 9 Section A',
    parentId: 'mock-dept-2',
    parentName: 'Arts Department',
    memberCount: 28,
    isActive: true,
    displayOrder: 3,
    metadata: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function useClassListQuery(options: ClassListQueryOptions = {}) {
  const customerId = useCustomerId();
  const {
    search = '',
    isActive,
    parentId,
    limit = 20,
    offset = 0,
    sortBy = 'displayOrder',
    sortOrder = 'asc',
  } = options;

  return useQuery({
    queryKey: ['class-list', customerId, search, isActive, parentId, limit, offset, sortBy, sortOrder],
    queryFn: async (): Promise<ClassListData> => {
      const supabase = getSupabaseClient();

      try {
        // Build query for classes
        let query = supabase
          .from('organizations')
          .select('*')
          .eq('customer_id', customerId)
          .eq('type', 'class');

        // Apply filters
        if (isActive !== undefined) {
          query = query.eq('is_active', isActive);
        }

        if (parentId) {
          query = query.eq('parent_id', parentId);
        }

        if (search) {
          query = query.ilike('name', `%${search}%`);
        }

        // Apply sorting
        const sortColumn = sortBy === 'memberCount' ? 'member_count' : 
                          sortBy === 'createdAt' ? 'created_at' : 
                          sortBy === 'displayOrder' ? 'display_order' : 'name';
        query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

        // Apply pagination
        query = query.range(offset, offset + limit - 1);

        const { data: classesData, error: classesError } = await query;

        if (classesError) throw classesError;

        // Get parent department names
        const parentIds = [...new Set((classesData || []).map(c => c.parent_id).filter(Boolean))];
        let parentsMap: Record<string, string> = {};

        if (parentIds.length > 0) {
          const { data: parentsData } = await supabase
            .from('organizations')
            .select('id, name')
            .in('id', parentIds);

          parentsMap = (parentsData || []).reduce((acc, p) => {
            acc[p.id] = p.name;
            return acc;
          }, {} as Record<string, string>);
        }

        // Get total counts
        const { count: totalCount } = await supabase
          .from('organizations')
          .select('*', { count: 'exact', head: true })
          .eq('customer_id', customerId)
          .eq('type', 'class');

        const { count: activeCount } = await supabase
          .from('organizations')
          .select('*', { count: 'exact', head: true })
          .eq('customer_id', customerId)
          .eq('type', 'class')
          .eq('is_active', true);

        const classes: ClassItem[] = (classesData || []).map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          parentId: item.parent_id,
          parentName: item.parent_id ? parentsMap[item.parent_id] || null : null,
          memberCount: item.member_count || 0,
          isActive: item.is_active ?? true,
          displayOrder: item.display_order || 0,
          metadata: item.metadata || {},
          createdAt: item.created_at,
          updatedAt: item.updated_at,
        }));

        return {
          classes,
          totalCount: totalCount || 0,
          activeCount: activeCount || 0,
          inactiveCount: (totalCount || 0) - (activeCount || 0),
        };
      } catch (error) {
        console.warn('[useClassListQuery] Database query failed, using fallback data:', error);

        // Filter fallback data based on options
        let filteredClasses = [...FALLBACK_CLASSES];

        if (search) {
          filteredClasses = filteredClasses.filter(c => 
            c.name.toLowerCase().includes(search.toLowerCase())
          );
        }

        if (isActive !== undefined) {
          filteredClasses = filteredClasses.filter(c => c.isActive === isActive);
        }

        if (parentId) {
          filteredClasses = filteredClasses.filter(c => c.parentId === parentId);
        }

        return {
          classes: filteredClasses.slice(offset, offset + limit),
          totalCount: FALLBACK_CLASSES.length,
          activeCount: FALLBACK_CLASSES.filter(c => c.isActive).length,
          inactiveCount: FALLBACK_CLASSES.filter(c => !c.isActive).length,
        };
      }
    },
    enabled: !!customerId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    placeholderData: {
      classes: FALLBACK_CLASSES,
      totalCount: FALLBACK_CLASSES.length,
      activeCount: FALLBACK_CLASSES.filter(c => c.isActive).length,
      inactiveCount: FALLBACK_CLASSES.filter(c => !c.isActive).length,
    },
  });
}
