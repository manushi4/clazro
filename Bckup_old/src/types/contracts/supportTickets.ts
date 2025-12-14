/**
 * Support Tickets Data Contract - Sprint 2
 *
 * Purpose: Lock query interface for support center
 * - Keyset pagination
 * - Realtime subscription support
 * - SLA tracking
 * - Filter definitions
 */

import { z } from 'zod';

/**
 * Ticket Status Types
 */
export type TicketStatus = 'open' | 'assigned' | 'in_progress' | 'resolved' | 'closed';

/**
 * Ticket Priority Types
 */
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

/**
 * Ticket Category Types
 */
export type TicketCategory =
  | 'technical'
  | 'billing'
  | 'academic'
  | 'attendance'
  | 'general'
  | 'complaint';

/**
 * Support Ticket List Item
 */
export interface SupportTicketListItem {
  id: string;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  created_by_id: string;
  created_by_name: string;
  assigned_to_id: string | null;
  assigned_to_name: string | null;
  created_at: string;
  updated_at: string;
  first_response_at: string | null;
  resolved_at: string | null;

  // SLA tracking
  sla_breach_at: string | null; // when SLA will breach
  is_sla_breached: boolean;
  time_to_first_response: number | null; // minutes
  time_to_resolution: number | null; // minutes
}

/**
 * Support Ticket Detail
 */
export interface SupportTicketDetail extends SupportTicketListItem {
  description: string;
  attachments: string[] | null;
  metadata: Record<string, any> | null;
  branch_id: string | null;
  branch_name: string | null;

  // Audit trail
  created_by_role: string;
  assigned_history: Array<{
    assigned_to_id: string;
    assigned_to_name: string;
    assigned_at: string;
  }>;
}

/**
 * Ticket List Filters
 */
export interface TicketListFilters {
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  assigned_to_id?: string;
  created_by_id?: string;
  branch_id?: string;
  search?: string;
  is_unassigned?: boolean;
  is_my_tickets?: boolean; // assigned to current admin
  is_sla_breach_risk?: boolean; // within 15 min of SLA breach
  limit: number;
  cursor?: string; // created_at for keyset
  cursor_id?: string; // id for keyset
}

/**
 * Ticket List Response
 */
export interface TicketListResponse {
  tickets: SupportTicketListItem[];
  nextCursor: {
    cursor: string;
    cursor_id: string;
  } | null;
  hasMore: boolean;
  totalCount?: number;
}

/**
 * Ticket Mutation Inputs
 */

export interface AssignTicketInput {
  ticket_id: string;
  assigned_to_id: string;
  admin_id: string;
  correlation_id?: string;
}

export interface EscalateTicketInput {
  ticket_id: string;
  reason: string;
  escalate_to_id: string;
  admin_id: string;
  correlation_id?: string;
}

export interface ResolveTicketInput {
  ticket_id: string;
  resolution_notes: string;
  admin_id: string;
  correlation_id?: string;
}

export interface ReopenTicketInput {
  ticket_id: string;
  reason: string;
  admin_id: string;
  correlation_id?: string;
}

/**
 * Ticket Stats
 */
export interface TicketStats {
  total_open: number;
  unassigned: number;
  my_tickets: number;
  sla_breach_risk: number; // within 15 min of breach
  avg_first_response_time: number; // minutes
  avg_resolution_time: number; // minutes
  sla_compliance_rate: number; // percentage
}

/**
 * Zod Schemas
 */

export const TicketStatusSchema = z.enum([
  'open',
  'assigned',
  'in_progress',
  'resolved',
  'closed',
]);

export const TicketPrioritySchema = z.enum(['low', 'medium', 'high', 'urgent']);

export const TicketCategorySchema = z.enum([
  'technical',
  'billing',
  'academic',
  'attendance',
  'general',
  'complaint',
]);

export const TicketListFiltersSchema = z.object({
  status: TicketStatusSchema.optional(),
  priority: TicketPrioritySchema.optional(),
  category: TicketCategorySchema.optional(),
  assigned_to_id: z.string().uuid().optional(),
  created_by_id: z.string().uuid().optional(),
  branch_id: z.string().uuid().optional(),
  search: z.string().optional(),
  is_unassigned: z.boolean().optional(),
  is_my_tickets: z.boolean().optional(),
  is_sla_breach_risk: z.boolean().optional(),
  limit: z.number().int().min(1).max(100),
  cursor: z.string().optional(),
  cursor_id: z.string().uuid().optional(),
});

/**
 * Query Keys
 */
export const ticketQueryKeys = {
  all: ['support_tickets'] as const,
  list: (filters: TicketListFilters) => [...ticketQueryKeys.all, 'list', filters] as const,
  detail: (id: string) => [...ticketQueryKeys.all, 'detail', id] as const,
  stats: () => [...ticketQueryKeys.all, 'stats'] as const,
  unassigned: () => [...ticketQueryKeys.all, 'unassigned'] as const,
} as const;

/**
 * Stale Time Configuration
 */
export const ticketStaleTime = {
  list: 30 * 1000, // 30 seconds (realtime via subscriptions)
  detail: 60 * 1000, // 1 minute
  stats: 60 * 1000, // 1 minute
} as const;

/**
 * SLA Configuration
 */
export const SLA_TARGETS = {
  first_response: {
    high: 15, // 15 minutes
    medium: 30, // 30 minutes
    low: 60, // 60 minutes
    urgent: 5, // 5 minutes
  },
  resolution: {
    high: 120, // 2 hours
    medium: 240, // 4 hours
    low: 480, // 8 hours
    urgent: 60, // 1 hour
  },
} as const;

/**
 * Placeholder data
 */
export const ticketListPlaceholder: TicketListResponse = {
  tickets: [],
  nextCursor: null,
  hasMore: false,
};
