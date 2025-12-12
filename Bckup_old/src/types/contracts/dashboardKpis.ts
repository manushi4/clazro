/**
 * Dashboard KPIs Data Contract - Sprint 1
 *
 * Purpose: Lock query interface for admin dashboard metrics
 * - Stable contract prevents breaking changes
 * - Query keys for React Query caching
 * - TypeScript types for type safety
 */

import { z } from 'zod';

/**
 * Dashboard KPI Metrics
 */
export interface DashboardKpisContract {
  activeUsers: number;
  mtdRevenue: number;
  openTickets: number;
  attendanceRate: number;
  timestamp: string;
}

/**
 * Zod Schema for validation
 */
export const DashboardKpisSchema = z.object({
  activeUsers: z.number().int().min(0),
  mtdRevenue: z.number().min(0),
  openTickets: z.number().int().min(0),
  attendanceRate: z.number().min(0).max(100),
  timestamp: z.string().datetime(),
});

/**
 * Query Keys for React Query
 */
export const dashboardKpisQueryKeys = {
  all: ['dashboard', 'kpis'] as const,
  current: () => [...dashboardKpisQueryKeys.all, 'current'] as const,
  historical: (days: number) =>
    [...dashboardKpisQueryKeys.all, 'historical', days] as const,
} as const;

/**
 * Stale Time Configuration
 * - Current KPIs: 30 seconds (real-time feel)
 * - Historical: 5 minutes (less frequent updates)
 */
export const dashboardKpisStaleTime = {
  current: 30 * 1000,
  historical: 5 * 60 * 1000,
} as const;

/**
 * Placeholder data to prevent layout shift
 */
export const dashboardKpisPlaceholder: DashboardKpisContract = {
  activeUsers: 0,
  mtdRevenue: 0,
  openTickets: 0,
  attendanceRate: 0,
  timestamp: new Date().toISOString(),
};
