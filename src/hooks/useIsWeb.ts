/**
 * useIsWeb Hook
 * Simple check for web platform
 */

import { Platform } from 'react-native';

/**
 * Returns true if running on web platform
 */
export const useIsWeb = (): boolean => {
  return Platform.OS === 'web';
};

/**
 * Static check for web platform (non-hook version)
 */
export const isWeb = Platform.OS === 'web';

export default useIsWeb;
