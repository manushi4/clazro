/**
 * Drawer Configuration Query Hook
 * Fetches drawer config and menu items for current user's role
 */

import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '../../lib/supabaseClient';
import { useCustomerId } from '../config/useCustomerId';
import { useDemoRoleStore } from '../../stores/demoRoleStore';
import {
  DrawerConfig,
  DrawerMenuItem,
  DrawerConfigData,
  DEFAULT_DRAWER_CONFIG,
} from '../../types/drawer.types';

/**
 * Fetches drawer configuration and menu items
 */
export function useDrawerConfigQuery() {
  const customerId = useCustomerId();
  const role = useDemoRoleStore((state) => state.role);

  // Debug logging
  console.log('[useDrawerConfigQuery] Params:', { customerId, role });

  return useQuery({
    queryKey: ['drawer-config', customerId, role],
    queryFn: async (): Promise<DrawerConfigData> => {
      if (!customerId || !role) {
        throw new Error('Missing customer ID or role');
      }

      const supabase = getSupabaseClient();

      // Fetch drawer config
      const { data: configData, error: configError } = await supabase
        .from('drawer_config')
        .select('*')
        .eq('customer_id', customerId)
        .eq('role', role)
        .single();

      // PGRST116 = no rows found, which is OK (use defaults)
      if (configError && configError.code !== 'PGRST116') {
        throw configError;
      }

      // Fetch menu items
      const { data: menuData, error: menuError } = await supabase
        .from('drawer_menu_items')
        .select('*')
        .eq('customer_id', customerId)
        .eq('role', role)
        .eq('enabled', true)
        .order('order_index', { ascending: true });

      if (menuError) {
        throw menuError;
      }

      // Return config with defaults if not found
      const config: DrawerConfig = configData || {
        id: '',
        customer_id: customerId,
        role,
        ...DEFAULT_DRAWER_CONFIG,
      };

      return {
        config,
        menuItems: (menuData as DrawerMenuItem[]) || [],
      };
    },
    enabled: !!customerId && !!role,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
  });
}

/**
 * Hook to check if drawer is enabled for current role
 */
export function useDrawerEnabled(): boolean {
  const { data } = useDrawerConfigQuery();
  return data?.config?.enabled ?? true;
}

/**
 * Hook to get drawer position
 */
export function useDrawerPosition(): 'left' | 'right' {
  const { data } = useDrawerConfigQuery();
  return data?.config?.position ?? 'left';
}
