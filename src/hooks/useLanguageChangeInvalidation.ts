/**
 * Language Change Invalidation Hook
 * 
 * Invalidates content queries when language changes so widgets
 * re-render with localized content in the new language.
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import i18n from '../i18n';

/**
 * Hook to invalidate content queries when language changes
 * Should be called once in AppContent or a top-level component
 */
export function useLanguageChangeInvalidation() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      console.log(`[i18n] Language changed to: ${lng}, invalidating content queries`);
      
      // Invalidate all content queries that have localized fields
      // This causes widgets to re-render with the new language
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['tests'] });
      queryClient.invalidateQueries({ queryKey: ['quick-actions'] });
      queryClient.invalidateQueries({ queryKey: ['doubts'] });
    };

    i18n.on('languageChanged', handleLanguageChange);
    
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [queryClient]);
}
