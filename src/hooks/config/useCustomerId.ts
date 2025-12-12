/**
 * Customer ID Hook
 * Returns the current customer ID from config or environment
 */

import { DEFAULT_CUSTOMER_ID } from '../../config/defaultConfig';

/**
 * Get the current customer ID
 * In production, this would come from authentication/context
 * For now, returns the default customer ID from config
 */
export function useCustomerId(): string {
  // TODO: In production, get from auth context or customer config
  // const { customerId } = useAuth();
  // return customerId;
  
  return DEFAULT_CUSTOMER_ID;
}
