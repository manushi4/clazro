// Font family options
export type FontFamily = "Inter" | "System Default" | "Roboto" | "Poppins" | "Open Sans";

// Border radius presets
export type BorderRadiusPreset = "none" | "small" | "medium" | "large" | "custom";

// Elevation/Shadow levels
export type ElevationLevel = "none" | "low" | "medium" | "high";

// Component style types
export type ButtonStyle = "filled" | "outlined" | "tonal" | "text";
export type CardStyle = "elevated" | "outlined" | "flat";
export type InputStyle = "outlined" | "filled";
export type ChipStyle = "filled" | "outlined";

// Theme preset names
export type ThemePreset = 
  | "modern_blue" 
  | "classic_gray" 
  | "vibrant" 
  | "minimal" 
  | "dark_pro" 
  | "soft_pastel" 
  | "corporate" 
  | "custom";

export type ThemeConfig = {
  id?: string;
  customer_id: string;
  // Light Mode Colors
  primary_color: string;
  secondary_color: string;
  accent_color?: string;
  background_color: string;
  surface_color: string;
  text_color: string;
  text_secondary_color?: string;
  error_color?: string;
  success_color?: string;
  warning_color?: string;
  // Dark Mode Colors
  primary_color_dark?: string;
  secondary_color_dark?: string;
  accent_color_dark?: string;
  background_color_dark?: string;
  surface_color_dark?: string;
  text_color_dark?: string;
  text_secondary_color_dark?: string;
  error_color_dark?: string;
  success_color_dark?: string;
  warning_color_dark?: string;
  // Dark Mode Settings
  dark_mode_enabled?: boolean;
  // Typography
  font_family?: FontFamily;
  font_scale?: number; // 0.8 to 1.5
  // Border Radius
  border_radius_small?: number;
  border_radius_medium?: number;
  border_radius_large?: number;
  roundness: number; // Legacy - maps to border_radius_medium
  // Elevation/Shadows
  card_elevation?: ElevationLevel;
  button_elevation?: ElevationLevel;
  // Component Styles
  button_style?: ButtonStyle;
  card_style?: CardStyle;
  input_style?: InputStyle;
  chip_style?: ChipStyle;
  // Theme Preset
  theme_preset?: ThemePreset;
  // Status
  status: "active" | "draft";
};

// Font family options for UI
export const FONT_FAMILIES: { value: FontFamily; label: string }[] = [
  { value: "Inter", label: "Inter" },
  { value: "System Default", label: "System Default" },
  { value: "Roboto", label: "Roboto" },
  { value: "Poppins", label: "Poppins" },
  { value: "Open Sans", label: "Open Sans" },
];

// Border radius presets
export const BORDER_RADIUS_PRESETS: { value: BorderRadiusPreset; small: number; medium: number; large: number }[] = [
  { value: "none", small: 0, medium: 0, large: 0 },
  { value: "small", small: 2, medium: 4, large: 8 },
  { value: "medium", small: 4, medium: 8, large: 16 },
  { value: "large", small: 8, medium: 16, large: 24 },
];

// Elevation options for UI
export const ELEVATION_OPTIONS: { value: ElevationLevel; label: string; shadow: string }[] = [
  { value: "none", label: "None", shadow: "none" },
  { value: "low", label: "Low", shadow: "0 1px 2px rgba(0,0,0,0.05)" },
  { value: "medium", label: "Medium", shadow: "0 4px 6px rgba(0,0,0,0.1)" },
  { value: "high", label: "High", shadow: "0 10px 15px rgba(0,0,0,0.15)" },
];

// Component style options for UI
export const BUTTON_STYLE_OPTIONS: { value: ButtonStyle; label: string; description: string }[] = [
  { value: "filled", label: "Filled", description: "Solid background color" },
  { value: "outlined", label: "Outlined", description: "Border with transparent background" },
  { value: "tonal", label: "Tonal", description: "Subtle background tint" },
  { value: "text", label: "Text", description: "Text only, no background" },
];

export const CARD_STYLE_OPTIONS: { value: CardStyle; label: string; description: string }[] = [
  { value: "elevated", label: "Elevated", description: "Shadow for depth" },
  { value: "outlined", label: "Outlined", description: "Border, no shadow" },
  { value: "flat", label: "Flat", description: "No border or shadow" },
];

export const INPUT_STYLE_OPTIONS: { value: InputStyle; label: string; description: string }[] = [
  { value: "outlined", label: "Outlined", description: "Border around input" },
  { value: "filled", label: "Filled", description: "Background fill" },
];

export const CHIP_STYLE_OPTIONS: { value: ChipStyle; label: string; description: string }[] = [
  { value: "filled", label: "Filled", description: "Solid background" },
  { value: "outlined", label: "Outlined", description: "Border only" },
];

// Theme presets with full configurations
export type ThemePresetConfig = Omit<ThemeConfig, "customer_id" | "id" | "status">;

export const THEME_PRESETS: { value: ThemePreset; label: string; description: string; config: ThemePresetConfig }[] = [
  {
    value: "modern_blue",
    label: "Modern Blue",
    description: "Clean and professional",
    config: {
      primary_color: "#2563EB",
      secondary_color: "#60A5FA",
      accent_color: "#3B82F6",
      background_color: "#F8FAFC",
      surface_color: "#FFFFFF",
      text_color: "#0F172A",
      text_secondary_color: "#475569",
      error_color: "#DC2626",
      success_color: "#16A34A",
      warning_color: "#D97706",
      font_family: "Inter",
      font_scale: 1,
      border_radius_small: 4,
      border_radius_medium: 8,
      border_radius_large: 16,
      roundness: 8,
      card_elevation: "low",
      button_elevation: "none",
      button_style: "filled",
      card_style: "elevated",
      input_style: "outlined",
      chip_style: "filled",
      theme_preset: "modern_blue",
    },
  },
  {
    value: "classic_gray",
    label: "Classic Gray",
    description: "Professional and minimal",
    config: {
      primary_color: "#475569",
      secondary_color: "#94A3B8",
      accent_color: "#64748B",
      background_color: "#F1F5F9",
      surface_color: "#FFFFFF",
      text_color: "#1E293B",
      text_secondary_color: "#64748B",
      error_color: "#EF4444",
      success_color: "#22C55E",
      warning_color: "#F59E0B",
      font_family: "Inter",
      font_scale: 1,
      border_radius_small: 2,
      border_radius_medium: 4,
      border_radius_large: 8,
      roundness: 4,
      card_elevation: "none",
      button_elevation: "none",
      button_style: "outlined",
      card_style: "outlined",
      input_style: "outlined",
      chip_style: "outlined",
      theme_preset: "classic_gray",
    },
  },
  {
    value: "vibrant",
    label: "Vibrant",
    description: "Bold and colorful",
    config: {
      primary_color: "#7C3AED",
      secondary_color: "#A78BFA",
      accent_color: "#8B5CF6",
      background_color: "#FAF5FF",
      surface_color: "#FFFFFF",
      text_color: "#1E1B4B",
      text_secondary_color: "#6366F1",
      error_color: "#E11D48",
      success_color: "#059669",
      warning_color: "#EA580C",
      font_family: "Poppins",
      font_scale: 1,
      border_radius_small: 8,
      border_radius_medium: 12,
      border_radius_large: 20,
      roundness: 12,
      card_elevation: "medium",
      button_elevation: "low",
      button_style: "filled",
      card_style: "elevated",
      input_style: "filled",
      chip_style: "filled",
      theme_preset: "vibrant",
    },
  },
  {
    value: "minimal",
    label: "Minimal",
    description: "Ultra clean and simple",
    config: {
      primary_color: "#64748B",
      secondary_color: "#CBD5E1",
      accent_color: "#94A3B8",
      background_color: "#FFFFFF",
      surface_color: "#F8FAFC",
      text_color: "#334155",
      text_secondary_color: "#94A3B8",
      error_color: "#F87171",
      success_color: "#4ADE80",
      warning_color: "#FBBF24",
      font_family: "System Default",
      font_scale: 1,
      border_radius_small: 0,
      border_radius_medium: 0,
      border_radius_large: 4,
      roundness: 0,
      card_elevation: "none",
      button_elevation: "none",
      button_style: "text",
      card_style: "flat",
      input_style: "outlined",
      chip_style: "outlined",
      theme_preset: "minimal",
    },
  },
  {
    value: "soft_pastel",
    label: "Soft Pastel",
    description: "Light and gentle",
    config: {
      primary_color: "#EC4899",
      secondary_color: "#F9A8D4",
      accent_color: "#F472B6",
      background_color: "#FDF2F8",
      surface_color: "#FFFFFF",
      text_color: "#831843",
      text_secondary_color: "#BE185D",
      error_color: "#F43F5E",
      success_color: "#34D399",
      warning_color: "#FBBF24",
      font_family: "Poppins",
      font_scale: 1,
      border_radius_small: 8,
      border_radius_medium: 16,
      border_radius_large: 24,
      roundness: 16,
      card_elevation: "low",
      button_elevation: "none",
      button_style: "filled",
      card_style: "flat",
      input_style: "filled",
      chip_style: "filled",
      theme_preset: "soft_pastel",
    },
  },
  {
    value: "corporate",
    label: "Corporate",
    description: "Business professional",
    config: {
      primary_color: "#0F172A",
      secondary_color: "#334155",
      accent_color: "#1E40AF",
      background_color: "#F8FAFC",
      surface_color: "#FFFFFF",
      text_color: "#0F172A",
      text_secondary_color: "#475569",
      error_color: "#B91C1C",
      success_color: "#15803D",
      warning_color: "#B45309",
      font_family: "Inter",
      font_scale: 1,
      border_radius_small: 2,
      border_radius_medium: 4,
      border_radius_large: 8,
      roundness: 4,
      card_elevation: "low",
      button_elevation: "none",
      button_style: "filled",
      card_style: "outlined",
      input_style: "outlined",
      chip_style: "filled",
      theme_preset: "corporate",
    },
  },
];

export const DEFAULT_THEME: Omit<ThemeConfig, "customer_id"> = {
  // Light Mode Colors
  primary_color: "#6750A4",
  secondary_color: "#958DA5",
  accent_color: "#7C4DFF",
  background_color: "#FFFBFE",
  surface_color: "#FFFFFF",
  text_color: "#1C1B1F",
  text_secondary_color: "#49454F",
  error_color: "#B3261E",
  success_color: "#2E7D32",
  warning_color: "#ED6C02",
  // Dark Mode Colors
  primary_color_dark: "#D0BCFF",
  secondary_color_dark: "#CCC2DC",
  accent_color_dark: "#BB86FC",
  background_color_dark: "#1C1B1F",
  surface_color_dark: "#1C1B1F",
  text_color_dark: "#E6E1E5",
  text_secondary_color_dark: "#CAC4D0",
  error_color_dark: "#F2B8B5",
  success_color_dark: "#81C784",
  warning_color_dark: "#FFB74D",
  // Dark Mode Settings
  dark_mode_enabled: true,
  // Typography
  font_family: "Inter",
  font_scale: 1,
  // Border Radius
  border_radius_small: 4,
  border_radius_medium: 8,
  border_radius_large: 16,
  roundness: 12,
  // Elevation
  card_elevation: "low",
  button_elevation: "none",
  // Component Styles
  button_style: "filled",
  card_style: "elevated",
  input_style: "outlined",
  chip_style: "filled",
  // Preset
  theme_preset: "custom",
  // Status
  status: "active",
};
