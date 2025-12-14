/**
 * Color Helper Functions
 * Manipulate colors with alpha, lighten, darken
 *
 * Usage:
 * alpha('#2563EB', 0.5) // Returns rgba(37, 99, 235, 0.5)
 * lighten('#2563EB', 20) // Lighten by 20%
 * darken('#2563EB', 20) // Darken by 20%
 */

/**
 * Convert hex to RGBA with alpha
 */
export const alpha = (hex: string, opacity: number): string => {
  // Remove # if present
  hex = hex.replace('#', '');

  // Convert hex to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

/**
 * Lighten a hex color by percentage
 */
export const lighten = (hex: string, amount: number): string => {
  hex = hex.replace('#', '');

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  const newR = Math.min(255, Math.floor(r + (255 - r) * (amount / 100)));
  const newG = Math.min(255, Math.floor(g + (255 - g) * (amount / 100)));
  const newB = Math.min(255, Math.floor(b + (255 - b) * (amount / 100)));

  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
};

/**
 * Darken a hex color by percentage
 */
export const darken = (hex: string, amount: number): string => {
  hex = hex.replace('#', '');

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  const newR = Math.max(0, Math.floor(r * (1 - amount / 100)));
  const newG = Math.max(0, Math.floor(g * (1 - amount / 100)));
  const newB = Math.max(0, Math.floor(b * (1 - amount / 100)));

  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
};

/**
 * Check if color is light or dark
 */
export const isLight = (hex: string): boolean => {
  hex = hex.replace('#', '');

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5;
};

/**
 * Get contrasting color (black or white)
 */
export const getContrast = (hex: string): string => {
  return isLight(hex) ? '#000000' : '#FFFFFF';
};
