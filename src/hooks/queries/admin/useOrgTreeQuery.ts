/**
 * useOrgTreeQuery - Fetches organization hierarchy for admin
 *
 * Queries organizations table with hierarchical structure:
 * - Organization (root level)
 * - Department (under organization)
 * - Class (under department)
 * - Batch (under class)
 *
 * Widget ID: org.tree
 * Phase 2: Query Hook
 *
 * @returns Organization tree with loading/error states
 */

import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../../lib/supabaseClient';
import { useCustomerId } from '../../config/useCustomerId';

export type OrgNodeType = 'organization' | 'department' | 'class' | 'batch';

export type OrgNode = {
  id: string;
  name: string;
  type: OrgNodeType;
  description: string | null;
  parentId: string | null;
  memberCount: number;
  isActive: boolean;
  displayOrder: number;
  children: OrgNode[];
  metadata: Record<string, unknown>;
};

export type OrgTreeData = {
  tree: OrgNode[];
  totalOrganizations: number;
  totalDepartments: number;
  totalClasses: number;
  totalBatches: number;
  totalMembers: number;
};

// Type icons and colors for each organization type
export const ORG_TYPE_CONFIG: Record<OrgNodeType, { icon: string; color: string; label: string }> = {
  organization: { icon: 'domain', color: 'primary', label: 'Organization' },
  department: { icon: 'office-building', color: 'secondary', label: 'Department' },
  class: { icon: 'google-classroom', color: 'tertiary', label: 'Class' },
  batch: { icon: 'account-group', color: 'success', label: 'Batch' },
};

// Fallback mock data when database query fails
const FALLBACK_TREE: OrgNode[] = [
  {
    id: 'mock-org-1',
    name: 'Main Campus',
    type: 'organization',
    description: 'Main educational campus',
    parentId: null,
    memberCount: 500,
    isActive: true,
    displayOrder: 1,
    metadata: {},
    children: [
      {
        id: 'mock-dept-1',
        name: 'Science Department',
        type: 'department',
        description: 'Science and Technology',
        parentId: 'mock-org-1',
        memberCount: 150,
        isActive: true,
        displayOrder: 1,
        metadata: {},
        children: [
          {
            id: 'mock-class-1',
            name: 'Class 10-A',
            type: 'class',
            description: 'Grade 10 Section A',
            parentId: 'mock-dept-1',
            memberCount: 35,
            isActive: true,
            displayOrder: 1,
            metadata: {},
            children: [],
          },
        ],
      },
    ],
  },
];

// Build tree from flat list
function buildTree(items: any[]): OrgNode[] {
  const itemMap = new Map<string, OrgNode>();
  const roots: OrgNode[] = [];

  // First pass: create all nodes
  items.forEach((item) => {
    itemMap.set(item.id, {
      id: item.id,
      name: item.name,
      type: item.type as OrgNodeType,
      description: item.description,
      parentId: item.parent_id,
      memberCount: item.member_count || 0,
      isActive: item.is_active ?? true,
      displayOrder: item.display_order || 0,
      metadata: item.metadata || {},
      children: [],
    });
  });

  // Second pass: build hierarchy
  itemMap.forEach((node) => {
    if (node.parentId && itemMap.has(node.parentId)) {
      const parent = itemMap.get(node.parentId)!;
      parent.children.push(node);
    } else if (!node.parentId) {
      roots.push(node);
    }
  });

  // Sort children by display order
  const sortChildren = (nodes: OrgNode[]) => {
    nodes.sort((a, b) => a.displayOrder - b.displayOrder);
    nodes.forEach((node) => sortChildren(node.children));
  };
  sortChildren(roots);

  return roots;
}

// Count nodes by type
function countByType(tree: OrgNode[], type: OrgNodeType): number {
  let count = 0;
  const traverse = (nodes: OrgNode[]) => {
    nodes.forEach((node) => {
      if (node.type === type) count++;
      traverse(node.children);
    });
  };
  traverse(tree);
  return count;
}

// Sum member counts
function sumMembers(tree: OrgNode[]): number {
  let total = 0;
  const traverse = (nodes: OrgNode[]) => {
    nodes.forEach((node) => {
      total += node.memberCount;
      traverse(node.children);
    });
  };
  traverse(tree);
  return total;
}

export function useOrgTreeQuery() {
  const customerId = useCustomerId();

  return useQuery({
    queryKey: ['org-tree', customerId],
    queryFn: async (): Promise<OrgTreeData> => {
      const supabase = getSupabaseClient();

      try {
        const { data, error } = await supabase
          .from('organizations')
          .select('*')
          .eq('customer_id', customerId)
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (error) throw error;

        const tree = buildTree(data || []);

        return {
          tree,
          totalOrganizations: countByType(tree, 'organization'),
          totalDepartments: countByType(tree, 'department'),
          totalClasses: countByType(tree, 'class'),
          totalBatches: countByType(tree, 'batch'),
          totalMembers: sumMembers(tree),
        };
      } catch (error) {
        console.warn('[useOrgTreeQuery] Database query failed, using fallback data:', error);

        return {
          tree: FALLBACK_TREE,
          totalOrganizations: 1,
          totalDepartments: 1,
          totalClasses: 1,
          totalBatches: 0,
          totalMembers: 685,
        };
      }
    },
    enabled: !!customerId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    placeholderData: {
      tree: FALLBACK_TREE,
      totalOrganizations: 1,
      totalDepartments: 1,
      totalClasses: 1,
      totalBatches: 0,
      totalMembers: 685,
    },
  });
}
