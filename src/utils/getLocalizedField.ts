/**
 * Localized Field Helper
 * 
 * Gets the appropriate localized field from an object based on current language.
 * Used for API-driven content that has language-suffixed columns (e.g., title_en, title_hi).
 * 
 * @example
 * // For an assignment with { title_en: "Math Quiz", title_hi: "गणित प्रश्नोत्तरी" }
 * const title = getLocalizedField(assignment, 'title'); // Returns based on current language
 */

import i18n from '../i18n';

/**
 * Get localized field from an object with language-suffixed properties
 * @param item - Object with fields like title_en, title_hi
 * @param field - Base field name (e.g., 'title', 'description')
 * @param fallbackLang - Fallback language if current not available (default: 'en')
 * @returns The localized string value
 */
export function getLocalizedField<T extends Record<string, any>>(
  item: T | null | undefined,
  field: string,
  fallbackLang: string = 'en'
): string {
  if (!item) return '';
  
  const currentLang = i18n.language?.split('-')[0] || 'en'; // Handle 'en-US' -> 'en'
  const langField = `${field}_${currentLang}`;
  const fallbackField = `${field}_${fallbackLang}`;
  
  // Try current language first, then fallback
  const value = item[langField] || item[fallbackField];
  return typeof value === 'string' ? value : '';
}

/**
 * Get multiple localized fields from an object
 * @param item - Object with localized fields
 * @param fields - Array of base field names
 * @returns Object with localized values
 */
export function getLocalizedFields<T extends Record<string, any>>(
  item: T | null | undefined,
  fields: string[]
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const field of fields) {
    result[field] = getLocalizedField(item, field);
  }
  return result;
}

/**
 * Check if a localized field exists for current language
 * @param item - Object with localized fields
 * @param field - Base field name
 * @returns True if field exists for current language
 */
export function hasLocalizedField<T extends Record<string, any>>(
  item: T | null | undefined,
  field: string
): boolean {
  if (!item) return false;
  const currentLang = i18n.language?.split('-')[0] || 'en';
  const langField = `${field}_${currentLang}`;
  return !!item[langField];
}
