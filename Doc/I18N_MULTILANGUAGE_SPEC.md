# 🌐 I18N_MULTILANGUAGE_SPEC.md
### Multi-Language (i18n) Architecture for the Mansuhi Config-Driven Multi-Tenant App

This specification defines how **internationalization (i18n)** works across the entire platform.

---

## 🚀 Quick Reference: Adding Localization to a Widget

### Step 1: Determine Content Type

| Content Type | Where to Store | How to Access |
|--------------|----------------|---------------|
| Static UI text (labels, buttons, headers) | Translation files (`src/locales/`) | `t("key")` |
| Dynamic content (from API/database) | Database columns (`_en`, `_hi`) | `getLocalizedField(item, 'field')` |

### Step 2: Add Static Translations

**English** (`src/locales/en/dashboard.json`):
```json
{
  "widgets": {
    "myWidget": {
      "title": "My Widget",
      "states": { "empty": "No items", "loading": "Loading..." }
    }
  }
}
```

**Hindi** (`src/locales/hi/dashboard.json`):
```json
{
  "widgets": {
    "myWidget": {
      "title": "मेरा विजेट",
      "states": { "empty": "कोई आइटम नहीं", "loading": "लोड हो रहा है..." }
    }
  }
}
```

### Step 3: Use in Widget

```tsx
import { useTranslation } from "react-i18next";
import { getLocalizedField } from "../../../utils/getLocalizedField";

const { t } = useTranslation("dashboard");

// Static UI text
<AppText>{t("widgets.myWidget.title")}</AppText>

// Dynamic content from database
<AppText>{getLocalizedField(item, 'title')}</AppText>
```

### Step 4: Database Content (if needed)

```sql
-- Table with localized columns
CREATE TABLE my_content (
  title_en TEXT NOT NULL,
  title_hi TEXT,
  -- ...
);
```

---

It supports:
- Multi-tenant (per-customer) language defaults  
- Multi-role (student/teacher/parent/admin) language overrides  
- Config-driven UI (widgets/tabs/screens)  
- Offline-enhanced operation  
- Dynamic, runtime language switching  
- Support for future server-provided translations

This is the **final, canonical spec** for implementing i18n in Mansuhi.

---

# 1. 🎯 Goals & Requirements

### Core goals
- No hardcoded user-facing text anywhere in the app.
- Default language selectable per customer (e.g., Hindi for School A).
- User-selectable language override (stored locally + server sync).
- 100% compatible with:
  - dynamic widgets  
  - dynamic navigation  
  - feature gating  
  - dynamic themes  
  - offline support  
- Ability to load new languages without an app update.
- Fallback rules:
  - missing keys → fallback language  
  - missing namespace → fallback language  
  - network unavailable → offline-cached translations  

### Required features
- `i18next` + `react-i18next` for runtime translation.
- Resource bundling for baseline languages (e.g., English + Hindi).
- Runtime resource loading (future): from Supabase via storage.
- Namespace organization per feature/module.

---

# 2. 📦 Libraries & Dependencies

We already have:

```

"i18next": "^25.x"
"react-i18next": "^16.x"

```

Optionally recommended:
```

@react-native-async-storage/async-storage   (cache locale & resources)
@react-native-community/netinfo            (detect offline)

```

---

# 3. 📚 Folder Structure & Location of Translation Files

The entire translation system lives under:

```

src/i18n/
src/locales/

```

### Folder layout

```

src/
i18n/
index.ts
languageDetector.ts       (optional)
persistLanguage.ts
types.ts
locales/
en/
common.json
dashboard.json
study.json
doubts.json
progress.json
profile.json
admin.json
hi/
common.json
dashboard.json
study.json
doubts.json
progress.json
profile.json
admin.json

````

Additional languages simply add another folder under `src/locales/`.

---

# 4. 🧱 i18n Initialization (src/i18n/index.ts)

This is where i18next is initialized.

**Requirements:**

- Use `initReactI18next`.
- Load local JSON by default.
- Set fallback language = `en`.
- Use namespaces (`common`, `dashboard`, etc.).
- Support runtime switching.
- Load stored language from AsyncStorage.

### Example structure (not exact code)

```ts
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as en from "../locales/en";
import * as hi from "../locales/hi";
import { loadPersistedLanguage } from "./persistLanguage";

const resources = {
  en,
  hi,
};

await i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: "v4",
    resources,
    lng: await loadPersistedLanguage(),
    fallbackLng: "en",
    ns: ["common", "dashboard", "study", "doubts", "progress", "profile", "admin"],
    defaultNS: "common",
    interpolation: { escapeValue: false },
  });

export default i18n;
````

---

# 5. 🪴 Namespaces (per feature/module)

Each major area of the app receives its own namespace:

| Namespace   | Used By                                    |
| ----------- | ------------------------------------------ |
| `common`    | Buttons, errors, alerts, shared components |
| `dashboard` | Student dashboard + widgets                |
| `study`     | Library, resources, assignments, tests     |
| `doubts`    | Ask, detail, sessions                      |
| `progress`  | Analytics & gamification                   |
| `profile`   | User profile, settings                     |
| `admin`     | Admin console screens                      |

### Why namespaces?

* Keeps translations modular.
* Stops gigantic JSON files.
* Matches the feature-based folder structure.
* Supports lazy-loading in future phases.

---

# 6. 🌍 Language Selection (Runtime Switching)

The user's current language comes from:

1. **User profile** in Supabase (optional future)
2. **Customer default** from `customer_themes` table
3. **Locally persisted value** in `AsyncStorage`
4. **Fallback:** English

### Hook for language switching

```
useLanguage(): { language, setLanguage }
```

Where `setLanguage(lng: string)`:

* updates i18n (`i18n.changeLanguage(lng)`)
* persists in AsyncStorage
* optional: writes to Supabase (`user_profiles.language`)

---

# 7. 🧩 Using i18n Inside Components (Widgets, Screens, Navigation)

### General rule:

**No hardcoded strings in any screen, widget, tab, tile, or button.**

### Example (widget):

```tsx
const { t } = useTranslation("dashboard");

<Text>{t("today_classes.title")}</Text>
```

### Example (navigation tab label):

```tsx
label: t("common:tabs.home")
```

### Dynamic widget titles:

Widget metadata **MUST** reference a translation key, not plain text:

```ts
metadata: {
  titleKey: "dashboard:widgets.todaySchedule.title",
  descriptionKey: "dashboard:widgets.todaySchedule.description",
}
```

---

# 8. 🗃 Multi-Tenant Language Defaults

Per-customer default language is stored in `customer_themes`:

| Field              | Description            |
| ------------------ | ---------------------- |
| `default_language` | e.g., `"en"` or `"hi"` |

This is loaded inside `CustomerConfigService` when building the `CustomerConfig`.

### Flow:

1. App loads `CustomerConfig`.
2. Extract `default_language`.
3. If user hasn’t chosen a language yet, use this as initial language.

---

# 8.5 🏷️ Customer Text Overrides (White-Label)

**NEW** - Per-customer text overrides for white-labeling.

Stored in `customer_branding.text_overrides` (JSONB):

```json
{
  "welcome_title": "Welcome to ABC Academy",
  "ai_tutor_name": "Ask Guru",
  "doubt_section": "Get Help",
  "submit_button": "Send",
  "tab_home": "Dashboard"
}
```

### Integration with i18n:

```typescript
function useText(key: string): string {
  const { t } = useTranslation();
  const { branding } = useCustomerBranding();
  
  // Branding override takes priority
  if (branding.textOverrides?.[key]) {
    return branding.textOverrides[key];
  }
  return t(key);
}
```

### Priority Order:
1. `customer_branding.text_overrides` (highest)
2. i18n translation for selected language
3. i18n fallback language (English)

---

# 9. 🚫 Offline Behavior (Baseline)

Translations must continue working when offline.

### Strategy:

* Bundle default English + one additional language (Hindi) in the app.
* Cache user-selected language in AsyncStorage.
* Cache remote translation files (if any) in AsyncStorage.
* If offline and key missing in selected language → fallback to English.

### React Query Integration:

If you ever load remote translations:

* Use `staleTime: Infinity`
* Retry = false when offline

---

# 10. 📦 Localized Content from Database (API-Driven)

For dynamic content (assignments, classes, subjects, etc.), we use **database columns** with language suffixes instead of translation keys.

### 10.1 Why Database Localization?

| Approach | Use Case |
|----------|----------|
| Translation keys (`t()`) | Static UI text, labels, buttons |
| Database columns (`title_en`, `title_hi`) | Dynamic content from API |

### 10.2 Database Column Convention

All content tables use language-suffixed columns:

```sql
-- subjects table
title_en        TEXT NOT NULL,
title_hi        TEXT,
description_en  TEXT,
description_hi  TEXT,

-- assignments table
title_en        TEXT NOT NULL,
title_hi        TEXT,
instructions_en TEXT,
instructions_hi TEXT,
```

### 10.3 Helper Function for Localized Fields

```typescript
// src/utils/getLocalizedField.ts
import i18n from '../i18n';

/**
 * Get localized field from an object with language-suffixed properties
 * @param item - Object with fields like title_en, title_hi
 * @param field - Base field name (e.g., 'title', 'description')
 * @param fallbackLang - Fallback language if current not available
 */
export function getLocalizedField<T extends Record<string, any>>(
  item: T,
  field: string,
  fallbackLang: string = 'en'
): string {
  const currentLang = i18n.language || 'en';
  const langField = `${field}_${currentLang}`;
  const fallbackField = `${field}_${fallbackLang}`;
  
  return item[langField] || item[fallbackField] || '';
}

// Usage in widgets:
const title = getLocalizedField(assignment, 'title');
const description = getLocalizedField(subject, 'description');
```

### 10.4 React Query Integration

```typescript
// Invalidate queries when language changes
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import i18n from '../i18n';

export function useLanguageChangeInvalidation() {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const handleLanguageChange = () => {
      // Invalidate content queries to re-render with new language
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      queryClient.invalidateQueries({ queryKey: ['doubts'] });
      queryClient.invalidateQueries({ queryKey: ['quick-actions'] });
    };
    
    i18n.on('languageChanged', handleLanguageChange);
    return () => i18n.off('languageChanged', handleLanguageChange);
  }, [queryClient]);
}
```

### 10.5 Widget Example with Localized Content

```tsx
import { getLocalizedField } from '../../../utils/getLocalizedField';

export const AssignmentsWidget: React.FC<WidgetProps> = ({ config }) => {
  const { t } = useTranslation('dashboard');
  const { data: assignments } = useAssignmentsQuery();
  
  return (
    <View>
      {/* Static UI text - use t() */}
      <AppText>{t('widgets.assignments.title')}</AppText>
      
      {/* Dynamic content - use getLocalizedField() */}
      {assignments?.map(item => (
        <View key={item.id}>
          <AppText>{getLocalizedField(item, 'title')}</AppText>
          <AppText>{getLocalizedField(item.subject, 'title')}</AppText>
        </View>
      ))}
    </View>
  );
};
```

### 10.6 Supported Languages

| Code | Language | Status |
|------|----------|--------|
| `en` | English | Primary (required) |
| `hi` | Hindi | Secondary |
| `ta` | Tamil | Future |
| `te` | Telugu | Future |
| `mr` | Marathi | Future |

Adding a new language:
1. Add column suffix to content tables (`title_ta`, etc.)
2. Add locale folder `src/locales/ta/`
3. Add to i18n resources
4. Update `getLocalizedField` fallback chain if needed

---

# 11. 📦 Optional: Remote Translations (Future Phase)

We can later allow translations to come from Supabase:

```
supabase.storage
  - locales/
      en/common.json
      hi/dashboard.json
      ...
```

Flow:

* Check remote version via a hash file.
* Download only changed files.
* Store in AsyncStorage.
* Override local resources at runtime.

Not required for MVP, but architecturally supported.

---

# 12. 🔧 Implementation Rules

These are **mandatory** for all developers:

### 🛑 Do NOT:

* Hardcode text in JSX.
* Hardcode widget titles/descriptions.
* Hardcode navigation labels.
* Hardcode buttons like “Submit”, “Retry”, “Next”.

### ✅ DO:

* Always use `useTranslation(...)`.
* Always use translation keys in configs.
* Add new keys to **both** `en` and `hi` (or keep hi empty).
* Validate translation keys with contract tests:

  * missing keys
  * extra unused keys

---

# 13. 🧪 Testing Strategy

### Unit:

* i18n initialization works.
* `setLanguage` persists and switches language.

### Contract:

* All namespaces have matching keys.
* No missing keys referenced by widgets/navigation/screens.

### Integration:

* Dashboard loads with translated text.
* Navigation shows translated labels.

### Offline:

* Change to a different language → restart app offline → correct text still loads.

---

# 14. 📋 Example Translation Keys

### common.json

```json
{
  "tabs": {
    "home": "Home",
    "study": "Study",
    "ask": "Ask",
    "progress": "Progress",
    "profile": "Profile"
  },
  "actions": {
    "submit": "Submit",
    "retry": "Retry",
    "cancel": "Cancel"
  }
}
```

### dashboard.json

```json
{
  "widgets": {
    "todaySchedule": {
      "title": "Today's Classes",
      "empty": "No classes today"
    }
  }
}
```

---

# 15. 🧭 Summary

This i18n system provides:

* Multi-tenant language defaults
* User-level language override
* Fully dynamic configuration
* Offline support
* Widget + navigation + screen locality
* Clear namespace boundaries
* Future remote translation support

Translation is now a **first-class citizen** in the Mansuhi platform.

```
This spec is the single source of truth for all future i18n integration.
```

```
End of I18N_MULTILANGUAGE_SPEC.md
```

---

