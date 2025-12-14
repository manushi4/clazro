/**
 * Material Design 3 Color System
 * Light Theme Color Palette
 */

export const LightTheme = {
  // Primary colors
  Primary: '#6750A4',
  OnPrimary: '#FFFFFF',
  PrimaryContainer: '#EADDFF',
  OnPrimaryContainer: '#21005D',

  // Secondary colors
  Secondary: '#625B71',
  OnSecondary: '#FFFFFF',
  SecondaryContainer: '#E8DEF8',
  OnSecondaryContainer: '#1D192B',

  // Tertiary colors
  Tertiary: '#7D5260',
  OnTertiary: '#FFFFFF',
  TertiaryContainer: '#FFD8E4',
  OnTertiaryContainer: '#31111D',

  // Error colors
  Error: '#B3261E',
  OnError: '#FFFFFF',
  ErrorContainer: '#F9DEDC',
  OnErrorContainer: '#410E0B',

  // Surface colors
  Surface: '#FFFBFE',
  OnSurface: '#1C1B1F',
  SurfaceVariant: '#E7E0EC',
  OnSurfaceVariant: '#49454F',

  // Outline
  Outline: '#79747E',
  OutlineVariant: '#CAC4D0',

  // Background
  Background: '#FFFBFE',
  OnBackground: '#1C1B1F',

  // Additional colors
  Shadow: '#000000',
  Scrim: '#000000',
  InverseSurface: '#313033',
  InverseOnSurface: '#F4EFF4',
  InversePrimary: '#D0BCFF',

  // Success (custom)
  Success: '#4CAF50',
  OnSuccess: '#FFFFFF',
  SuccessContainer: '#E8F5E9',
  OnSuccessContainer: '#1B5E20',

  // Warning (custom)
  Warning: '#FF9800',
  OnWarning: '#000000',
  WarningContainer: '#FFF3E0',
  OnWarningContainer: '#E65100',

  // Info (custom)
  Info: '#2196F3',
  OnInfo: '#FFFFFF',
  InfoContainer: '#E3F2FD',
  OnInfoContainer: '#0D47A1',
};

// Primary color shades for backward compatibility
export const PrimaryColors = {
  Primary50: '#F3E5F5',
  Primary100: '#E1BEE7',
  Primary200: '#CE93D8',
  Primary300: '#BA68C8',
  Primary400: '#AB47BC',
  Primary500: '#6750A4', // Main primary color
  Primary600: '#8E24AA',
  Primary700: '#7B1FA2',
  Primary800: '#6A1B9A',
  Primary900: '#4A148C',
};

export const DarkTheme = {
  // Primary colors
  Primary: '#D0BCFF',
  OnPrimary: '#381E72',
  PrimaryContainer: '#4F378B',
  OnPrimaryContainer: '#EADDFF',

  // Secondary colors
  Secondary: '#CCC2DC',
  OnSecondary: '#332D41',
  SecondaryContainer: '#4A4458',
  OnSecondaryContainer: '#E8DEF8',

  // Tertiary colors
  Tertiary: '#EFB8C8',
  OnTertiary: '#492532',
  TertiaryContainer: '#633B48',
  OnTertiaryContainer: '#FFD8E4',

  // Error colors
  Error: '#F2B8B5',
  OnError: '#601410',
  ErrorContainer: '#8C1D18',
  OnErrorContainer: '#F9DEDC',

  // Surface colors
  Surface: '#1C1B1F',
  OnSurface: '#E6E1E5',
  SurfaceVariant: '#49454F',
  OnSurfaceVariant: '#CAC4D0',

  // Outline
  Outline: '#938F99',
  OutlineVariant: '#49454F',

  // Background
  Background: '#1C1B1F',
  OnBackground: '#E6E1E5',

  // Additional colors
  Shadow: '#000000',
  Scrim: '#000000',
  InverseSurface: '#E6E1E5',
  InverseOnSurface: '#313033',
  InversePrimary: '#6750A4',

  // Success (custom)
  Success: '#81C784',
  OnSuccess: '#1B5E20',
  SuccessContainer: '#2E7D32',
  OnSuccessContainer: '#C8E6C9',

  // Warning (custom)
  Warning: '#FFB74D',
  OnWarning: '#E65100',
  WarningContainer: '#F57C00',
  OnWarningContainer: '#FFE0B2',

  // Info (custom)
  Info: '#64B5F6',
  OnInfo: '#0D47A1',
  InfoContainer: '#1976D2',
  OnInfoContainer: '#BBDEFB',
};

// Semantic color mapping
export const SemanticColors = {
  // Status colors
  status: {
    active: LightTheme.Success,
    inactive: LightTheme.SurfaceVariant,
    pending: LightTheme.Warning,
    error: LightTheme.Error,
    completed: LightTheme.Info,
  },

  // Priority colors
  priority: {
    high: LightTheme.Error,
    medium: LightTheme.Warning,
    low: LightTheme.Info,
  },

  // Assignment status
  assignment: {
    submitted: LightTheme.Success,
    pending: LightTheme.Warning,
    overdue: LightTheme.Error,
    graded: LightTheme.Info,
  },

  // Direct color shortcuts for backward compatibility
  Success: LightTheme.Success,
  SuccessDark: LightTheme.OnSuccessContainer, warning: LightTheme.Warning,
  WarningDark: LightTheme.OnWarningContainer, info: LightTheme.Info,
  InfoDark: LightTheme.OnInfoContainer, error: LightTheme.Error,
  ErrorDark: LightTheme.OnErrorContainer,
};

// Role-based types
export type RoleType = 'student' | 'teacher' | 'parent' | 'admin';

// Role-based color mapping
export const getRoleColors = (role: string) => {
  switch (role.toLowerCase()) {
    case 'student':
      return {
        Primary: '#2196F3',
        OnPrimary: '#FFFFFF',
        PrimaryContainer: '#E3F2FD',
        OnPrimaryContainer: '#0D47A1',
      };
    case 'teacher':
      return {
        Primary: '#4CAF50',
        OnPrimary: '#FFFFFF',
        PrimaryContainer: '#E8F5E9',
        OnPrimaryContainer: '#1B5E20',
      };
    case 'parent':
      return {
        Primary: '#FF9800',
        OnPrimary: '#000000',
        PrimaryContainer: '#FFF3E0',
        OnPrimaryContainer: '#E65100',
      };
    case 'admin':
      return {
        Primary: '#9C27B0',
        OnPrimary: '#FFFFFF',
        PrimaryContainer: '#F3E5F5',
        OnPrimaryContainer: '#4A148C',
      };
    default:
      return LightTheme;
  }
};

export default LightTheme;
