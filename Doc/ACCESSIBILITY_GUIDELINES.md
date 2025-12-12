Here is the **final core brick** in your global foundational system, written with full production-level depth and standards.

---

# 📄 `docs/ACCESSIBILITY_GUIDELINES.md`

### Complete Accessibility, Inclusivity & Usability Standards for Mansuhi

````md
# ♿ ACCESSIBILITY_GUIDELINES.md
### Accessibility, Inclusivity & Universal Design Standards for Mansuhi

This document defines **how to build an inclusive, accessible educational experience** for all students, teachers, and parents — including those with:

- Low vision  
- Cognitive differences  
- Learning disabilities  
- Motor impairments  
- Older or low-end devices  
- Limited literacy  
- Limited network  

These guidelines are **mandatory** for every component, widget, and screen.

---

# 1. 🎯 Accessibility Objectives

1. Ensure **every screen** can be used with:
   - Screen readers
   - Larger font sizes
   - High contrast
   - Slow network
   - Low-end devices  
   
2. Ensure **all UI elements** remain usable when:
   - Scaled  
   - Translated  
   - In RTL languages  
   - In offline mode  
   - With animations disabled  

3. Match (or exceed) **WCAG 2.1 AA principles** *where practical* for mobile.

4. Provide a **consistent UX baseline** across all feature modules.

---

# 2. 🌍 Text, Typography & Readability

### 2.1 Font Scaling
All text MUST support dynamic font scaling:

```tsx
<AppText allowFontScaling>{t("label")}</AppText>
````

* Never fix font size via inline styles.
* Always use typography tokens.
* Titles must wrap correctly.
* Avoid clipping/truncation unless intentional with ellipsis.

### 2.2 Minimum Readable Size

* Body text ≥ **14sp**
* Labels ≥ **12sp**
* Prefer 16sp for commonly read text (assignments, study content).

### 2.3 Line Spacing

Set adequate line height:

* `1.3x – 1.5x` recommended

Helps readability for students.

---

# 3. 🎨 Color, Contrast & Visual Clarity

### 3.1 Contrast Ratios

Minimum required:

* Text vs background: **4.5:1**
* Large text: **3:1**
* Icons: **3:1**

### 3.2 Theme Engine Responsibility

* Ensure colors chosen in customer themes do NOT break core contrast rules.
* If customer-provided theme is low-contrast:

  * Use **auto-contrast correction** in theme engine
  * Or override text color with fallback `onSurface`

### 3.3 Never rely on color alone

Combine color + icons or indicators:

* Error: icon + color
* Success: checkmark + color
* Selected: border + color

---

# 4. 📏 Touch Targets & Interactions

### 4.1 Minimum size

* **44x44 dp** for all touchable UI.

Buttons, chips, list items must ensure enough padding.

### 4.2 No tiny icons as buttons

Avoid:

```
<Pressable>
  <Icon size={14} />
</Pressable>
```

Always wrap with padding.

### 4.3 Press Feedback

All interactive UI must provide:

* Ripple (Android)
* Opacity/surface effect (iOS)

---

# 5. 🧭 Layout, Spacing & Structure

### 5.1 Predictable structure

Avoid clutter — break into sections using:

* `<ScreenSection />`
* `<AppCard />`
* Proper spacing tokens

### 5.2 Responsive layout

Must handle:

* Long text from translations
* Larger font scaling
* Small screens (4.7”)
* Landscape orientation (if needed)

### 5.3 Avoid absolute positioning

Breaks under scaling.

---

# 6. 🗃 Screen Reader (VoiceOver/TalkBack) Support

### 6.1 Accessibility labels

Every actionable UI must have:

```tsx
accessibilityLabel="Submit doubt"
```

Better: use translation keys:

```tsx
accessibilityLabel={t("actions.submit")}
```

### 6.2 Important containers must be `accessible`

Example:

* Cards that act as buttons
* List items that open screens

### 6.3 Non-essential elements

Mark decorative icons as:

```tsx
accessible={false}
```

### 6.4 Announce important UI events:

* Success messages
* Errors
* Navigation events ("Opened Chapter 1")

---

# 7. 🔄 Motion & Animation Accessibility

### Rule:

**Animations must never be required to understand content.**

### 7.1 Reduced motion mode

Future enhancement:

* Detect system-level "reduce motion"
* Disable non-essential animations:

  * long transitions
  * auto-moving banners
  * sequence animations
  * shimmer skeletons (optional)

### 7.2 Animation Requirements

* < 300ms for most transitions
* Avoid repeated endless loops
* Avoid parallax or quick flashing

---

# 8. 🌐 Internationalization & Localization

Must support:

* Right-to-left layout (Arabic/Bengali future)
* Variable text lengths
* Mixed scripts (Hindi + English)
* Locale-specific formatting:

  * Dates
  * Times
  * Plurals

Integration with:

```
docs/I18N_MULTILANGUAGE_SPEC.md
```

---

# 9. 🌙 Dark Mode & High-Contrast Mode

* All components must look good in light and dark themes.
* High contrast variations selected automatically via MD3.
* No hardcoded colors — use theme tokens.

Widgets must adapt:

* background
* surface variants
* text colors
* icon colors

---

# 10. 📴 Offline Accessibility

When offline:

* Show clear labels:

  ```
  “Offline — some content may be unavailable.”
  ```
* Do not show blank screens.
* Ensure error states are readable and actionable.

Should integrate with:

```
docs/OFFLINE_SUPPORT_SPEC.md
```

---

# 11. 🧠 Cognitive Load Reduction

For learners with cognitive challenges:

### 11.1 Clarity

* Use simple sentence structures
* Avoid jargon
* Keep navigation intuitive

### 11.2 Chunking

* Use cards and sections
* Break long content into smaller blocks

### 11.3 Icons + Text

Avoid icon-only buttons unless universally understood.

### 11.4 Avoid distractions

Do not combine too many animations, colors, or badges.

---

# 12. 🔐 Accessibility in Forms

### Requirements:

* Clear input labels (not placeholders only)
* Visible error messages
* Descriptive helper text
* Large, tappable submit buttons
* Auto-focus disabled unless explicitly requested

### Validation:

* Show errors inline
* Do not rely only on color to indicate errors

---

# 13. 🧪 Accessibility Testing Plan

### 13.1 Manual Testing

* Increase font size to 200%
* Use Android TalkBack / iOS VoiceOver
* Switch between dark/light mode
* Disable internet
* Use the app with only keyboard (future)

### 13.2 Automated Testing

Integrate lint rules for:

* No raw `<Text>`
* Required accessibilityLabel for certain components
* RTL compatibility (mirror layout)

### 13.3 E2E Test Cases

* App usable with screen reader
* Tab navigation works when scaled
* Widgets not broken under font scaling

---

# 14. 🏁 Summary

The Mansuhi Accessibility Guidelines ensure:

* **Inclusive design** for all types of students
* A uniform, predictable UI structure
* Strong readability & clarity
* Compatibility with:

  * Theme engine
  * i18n
  * Offline mode
  * Dynamic widget system
* Resilience under scaling and multi-language usage
* Smooth screen reader experience

These guidelines MUST be followed for every component, widget, and screen.

```
End of ACCESSIBILITY_GUIDELINES.md
