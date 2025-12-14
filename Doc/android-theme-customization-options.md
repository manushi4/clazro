# Android App Theme Customization — Complete Options List (Material 3 + Compose Classic + Glass)

Use this document as a blueprint for your **Theme Settings** and your internal **design tokens**.  
Recommendation: implement **Theme Profiles** (style systems) first, then enable/disable relevant options per profile.

---

## A) Theme Profiles (Style System Switch)

### Theme Style
- Material 3 (Dynamic / Material You)
- Material 3 (Brand)
- Compose Classic (Flat)
- Compose Classic (Outlined)
- Glass (Light)
- Glass (Dark)
- AMOLED Minimal
- High Contrast (Accessibility)

### Mode & Presets
- Light/Dark/System
- Theme Presets (1‑tap packs): Classic Indigo, Violet Night, Minimal Gray, Mint Glass, etc.
- Reset to default: per-style / global

---

## 1) Color System (Advanced)

### Core colors
- Primary
- Secondary
- Tertiary / Accent 2
- Background
- Surface
- Surface Variant
- Text (On Background/On Surface)
- Text Secondary
- Outline / Divider
- Border (separate from outline)
- Scrim (modal dim)
- Link color
- Disabled colors (text + container)
- Inverse colors (optional): inverseSurface / inverseOnSurface

### Semantic / feedback colors
- Success
- Warning
- Error
- Info
- “On” versions: onSuccess/onWarning/onError/onInfo (for text/icons on badges)

### State colors
- Pressed
- Focus
- Selected
- Hover (optional)
- Ripple color
- Ripple strength: Subtle / Normal / Strong

### Palettes & effects
- Color source:
  - Dynamic (wallpaper)
  - Brand palette
  - Custom palette (manual pickers)
- Tonal palette strength (Material 3): Soft / Standard / Vivid
- Gradients (optional):
  - Primary gradient On/Off
  - Background gradient On/Off
  - Gradient intensity slider

---

## 2) Dark Mode & Contrast
- Dark mode behavior: Light / Dark / System
- AMOLED black mode (true black backgrounds)
- High contrast mode
- Reduce transparency (especially for Glass)
- Color‑blind friendly palette toggle

---

## 3) Typography
- Font family:
  - Inter
  - System font
  - Optional additional fonts
- Font scale slider (app‑level)
- Line height preset: Compact / Default / Comfortable
- Letter spacing preset
- Font weight preference: Regular / Medium / Semibold
- Tabular numbers (aligned digits) On/Off
- Monospace for codes/IDs On/Off

---

## 4) Layout & Density (Spacing System)
- Density: Compact / Default / Spacious
- Global spacing scale (e.g., 0.85x – 1.25x)
- Content max width (tablets): Off / 600dp / 840dp / Custom
- Layout style:
  - List / Cards / Compact list
  - Grid columns (tablets): Auto / 2 / 3 / 4
- Screen padding preset: Tight / Normal / Wide

---

## 5) Shapes (Radius + Corner Style)
- Global radius: Small / Medium / Large (or slider)
- Per‑component radius:
  - Buttons
  - Cards
  - Inputs
  - Bottom sheets / dialogs
- Corner style (if supported): Rounded / Squircle
- Border thickness: Thin / Normal / Thick

---

## 6) Elevation, Surfaces & Shadows
- Elevation level: None / Low / Medium / High
- Shadow style: Soft / Crisp
- Tonal elevation (Material 3 surface tint): On/Off
- Surface style:
  - Flat
  - Elevated
  - Outlined
- Surface tint strength slider
- Divider visibility: On/Off

---

## 7) Component Style Options (UI Controls)

### Buttons
- Button style: Filled / Tonal / Outlined / Text
- Button height: Small / Medium / Large
- Button radius override (optional)

### Inputs
- Input style: Filled / Outlined
- Focus indicator thickness
- Error style: Subtle / Strong

### Navigation
- Bottom navigation:
  - Labels always / Selected only / No labels
  - Icon size: S / M / L
- Top bar:
  - Center title / Left title
  - Large app bar On/Off
- Tabs style: Underline / Pill / Segmented

### Lists & Cards
- Card style: Flat / Elevated / Outlined
- List separators: Show/Hide
- Row height: Compact / Standard / Relaxed

### Chips / Badges
- Chip style: Filled / Outlined
- Chip radius: Normal / Pill
- Badge style: Dot / Count / Label

---

## 8) Iconography & Imagery
- Icon style: Outline / Filled / Rounded
- Icon size: Small / Medium / Large
- Illustration style (if you have): Minimal / Colorful / Mono
- Avatar shape: Circle / Rounded square
- Image rounding: Off / Subtle / Strong

---

## 9) Motion & Interaction
- Animation intensity: Off / Reduced / Normal
- Transition style: Fade / Slide / Scale
- Ripple:
  - On/Off
  - Strength: Subtle / Normal / Strong
- Haptics:
  - On/Off
  - Intensity: Low / Medium / High (if supported)
- Parallax / depth motion (mainly Glass): On/Off

---

# Glassmorphism‑Specific Options (enabled only in Glass profile)

## 10) Glass Controls
- Blur strength: Off / Low / Medium / High
- Blur radius slider (advanced)
- Glass opacity: 8% / 12% / 16% / 20% (or slider)
- Glass tint:
  - Auto
  - Primary‑tinted
  - Neutral
  - Custom tint color
- Border highlight: On/Off
- Border highlight strength slider
- Noise / grain: Off / Subtle / Strong
- Glow:
  - Off / Soft / Medium
  - Glow strength slider
- Background mode:
  - Solid
  - Gradient
  - Wallpaper image
- Reduce transparency (accessibility) toggle

---

# Material 3‑Specific Options (enabled only in Material profile)

## 11) Material You / M3 Controls
- Dynamic color (Android 12+): On/Off
- Brand fallback palette
- Tonal palette strength: Soft / Standard / Vivid
- Tonal elevation On/Off
- “Strict M3” toggle (use defaults vs customized components)

---

# Compose Classic‑Specific Options (enabled only in Classic profile)

## 12) Classic Controls
- Flat vs Outlined vs Minimal
- Border system prominence: Low / Medium / High
- Shadows default: Off / Low
- Density emphasis: compact-first

---

## 13) Accessibility (works across all profiles)
- High contrast mode
- Large touch targets On/Off
- Text size boost shortcut: +10% / +20%
- Focus indicators: On/Off + thickness
- Reduce motion On/Off
- Reduce transparency On/Off
- Color‑blind safe mode On/Off

---

## 14) Recommended Presets to Ship
- Material 3 Dynamic (System)
- Material 3 Brand (Your tokens)
- Classic Flat (Minimal)
- Classic Outlined (Productivity)
- Glass Light (Soft blur)
- Glass Dark (Neon blur)
- AMOLED Minimal
- High Contrast

---

## 15) Suggested Settings Screen Structure (UX)

### Appearance
- Theme Style
- Light/Dark/System
- Preset

### Customize
- Colors (disabled when Dynamic is ON)
- Typography
- Shape & Radius
- Layout & Density
- Elevation / Borders
- Icons
- Motion
- Glass (only when Glass selected)

### Accessibility
- Contrast
- Large touch targets
- Reduce motion
- Reduce transparency
