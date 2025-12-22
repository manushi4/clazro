/**
 * useCreateOrganization - Create Organization Entity Mutation Hook
 *
 * Provides mutation for creating organization entities:
 * - Organization (root level)
 * - Department (under organization)
 * - Class (under department)
 * - Batch (under class)
 *
 * Widget ID: org.quick-create
 * Phase 2: Mutation Hook
 *
 * RLS Policy: organizations_customer_access uses USING (true) WITH CHECK (true)
 * which allows all operations without blocking.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabaseClient } from '../../../lib/supabaseClient';
import { addBreadcrumb, captureException } from '../../../error/errorReporting';
import { useCustomerId } from '../../config/useCustomerId';

// =============================================================================
// TYPES
// =============================================================================

export type OrgEntityType = 'organization' | 'department' | 'class' | 'batch';

export type CreateOrganizationInput = {
  name: string;
  type: OrgEntityType;
  description?: string;
  parentId?: string | null;
  memberCount?: number;
  displayOrder?: number;
  isActive?: boolean;
  metadata?: Record<string, unknown>;
};

export type CreateOrganizationResult = {
  success: boolean;
  message: string;
  entityId?: string;
  entity?: {
    id: string;
    name: string;
    type: OrgEntityType;
    parentId: string | null;
    isActive: boolean;
  };
  error?: string;
};

// Type hierarchy validation
const TYPE_HIERARCHY: Record<OrgEntityType, OrgEntityType | null> = {
  organization: null,
  department: 'organization',
  class: 'department',
  batch: 'class',
};

// =============================================================================
// CREATE ORGANIZATION FUNCTION
// =============================================================================

async function createOrganization(
  customerId: string,
  input: CreateOrganizationInput
): Promise<CreateOrganizationResult> {
  const supabase = getSupabaseClient();

  addBreadcrumb({
    category: 'admin',
    message: 'Create organization entity started',
    level: 'info',
    data: { name: input.name, type: input.type },
  });

  try {
    // Validate required fields
    if (!input.name || !input.type) {
      return {
        success: false,
        message: 'Name and type are required',
        error: 'VALIDATION_ERROR',
      };
    }

    // Validate type hierarchy
    const requiredParentType = TYPE_HIERARCHY[input.type];
    if (requiredParentType && !input.parentId) {
      return {
        success: false,
        message: `${input.type} requires a parent ${requiredParentType}`,
        error: 'PARENT_REQUIRED',
      };
    }

    // If parent is provided, validate parent type
    if (input.parentId) {
      const { data: parent, error: parentError } = await supabase
        .from('organizations')
        .select('id, type')
        .eq('id', input.parentId)
        .eq('customer_id', customerId)
        .single();

      if (parentError || !parent) {
        return {
          success: false,
          message: 'Parent entity not found',
          error: 'PARENT_NOT_FOUND',
        };
      }

      if (requiredParentType && parent.type !== requiredParentType) {
        return {
          success: false,
          message: `${input.type} must be under a ${requiredParentType}, not ${parent.type}`,
          error: 'INVALID_PARENT_TYPE',
        };
      }
    }

    // Check for duplicate name under same parent
    const { data: existing, error: checkError } = await supabase
      .from('organizations')
      .select('id')
      .eq('customer_id', customerId)
      .eq('name', input.name)
      .eq('type', input.type)
      .eq('parent_id', input.parentId || null)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existing) {
      return {
        success: false,
        message: `A ${input.type} with this name already exists`,
        error: 'DUPLICATE_NAME',
      };
    }

    // Get next display order
    let displayOrder = input.displayOrder;
    if (displayOrder === undefined) {
      const { data: maxOrder } = await supabase
        .from('organizations')
        .select('display_order')
        .eq('customer_id', customerId)
        .eq('type', input.type)
        .order('display_order', { ascending: false })
        .limit(1)
        .single();

      displayOrder = (maxOrder?.display_order || 0) + 1;
    }

    // Create organization entity
    const { data: newEntity, error: createError } = await supabase
      .from('organizations')
      .insert({
        customer_id: customerId,
        name: input.name,
        type: input.type,
        description: input.description || null,
        parent_id: input.parentId || null,
        member_count: input.memberCount || 0,
        display_order: displayOrder,
        is_active: input.isActive !== false,
        metadata: input.metadata || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (createError) throw createError;

    addBreadcrumb({
      category: 'admin',
      message: 'Organization entity created successfully',
      level: 'info',
      data: { entityId: newEntity.id, name: input.name, type: input.type },
    });

    return {
      success: true,
      message: `${input.type} "${input.name}" created successfully`,
      entityId: newEntity.id,
      entity: {
        id: newEntity.id,
        name: newEntity.name,
        type: newEntity.type,
        parentId: newEntity.parent_id,
        isActive: newEntity.is_active,
      },
    };
  } catch (error: any) {
    captureException(error, {
      tags: { action: 'create_organization' },
      extra: { customerId, name: input.name, type: input.type },
    });

    return {
      success: false,
      message: error.message || 'Failed to create organization entity',
      error: error.code || 'UNKNOWN_ERROR',
    };
  }
}

// =============================================================================
// HOOK
// =============================================================================

export function useCreateOrganization() {
  const queryClient = useQueryClient();
  const customerId = useCustomerId();

  return useMutation({
    mutationFn: (input: CreateOrganizationInput) =>
      createOrganization(customerId || '', input),
    onSuccess: (result) => {
      if (result.success) {
        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: ['org-tree'] });
        queryClient.invalidateQueries({ queryKey: ['class-list'] });
        queryClient.invalidateQueries({ queryKey: ['organizations'] });
      }
    },
    onError: (error: Error) => {
      addBreadcrumb({
        category: 'admin',
        message: 'Create organization entity failed',
        level: 'error',
        data: { error: error.message },
      });
    },
  });
}
