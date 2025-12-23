# Translation Template

## Widget Translation Structure

### English (`src/locales/en/dashboard.json`)

```json
{
  "widgets": {
    "{widgetKey}": {
      "title": "Widget Title",
      "subtitle": "Brief description of the widget",
      "states": {
        "loading": "Loading...",
        "empty": "No items to display",
        "error": "Failed to load data",
        "offline": "Available when online"
      },
      "actions": {
        "viewAll": "View All",
        "retry": "Try Again",
        "refresh": "Refresh",
        "create": "Add New"
      },
      "labels": {
        "count_one": "{{count}} item",
        "count_other": "{{count}} items",
        "updated": "Updated {{time}}"
      }
    }
  }
}
```

### Hindi (`src/locales/hi/dashboard.json`)

```json
{
  "widgets": {
    "{widgetKey}": {
      "title": "विजेट शीर्षक",
      "subtitle": "विजेट का संक्षिप्त विवरण",
      "states": {
        "loading": "लोड हो रहा है...",
        "empty": "प्रदर्शित करने के लिए कोई आइटम नहीं",
        "error": "डेटा लोड करने में विफल",
        "offline": "ऑनलाइन होने पर उपलब्ध"
      },
      "actions": {
        "viewAll": "सभी देखें",
        "retry": "पुनः प्रयास करें",
        "refresh": "रीफ्रेश करें",
        "create": "नया जोड़ें"
      },
      "labels": {
        "count_one": "{{count}} आइटम",
        "count_other": "{{count}} आइटम",
        "updated": "{{time}} को अपडेट किया गया"
      }
    }
  }
}
```

## Common Widget Translations

### Schedule Widgets
| English | Hindi |
|---------|-------|
| Today's Schedule | आज का शेड्यूल |
| Upcoming Classes | आगामी कक्षाएं |
| No classes today | आज कोई कक्षा नहीं |
| Live Now | अभी लाइव |
| Starting Soon | जल्द शुरू हो रहा है |

### Assignment Widgets
| English | Hindi |
|---------|-------|
| Pending Assignments | लंबित असाइनमेंट |
| Due Today | आज देय |
| Overdue | अतिदेय |
| Submit | जमा करें |
| View Details | विवरण देखें |

### Progress Widgets
| English | Hindi |
|---------|-------|
| Your Progress | आपकी प्रगति |
| Weekly Summary | साप्ताहिक सारांश |
| Completed | पूर्ण |
| In Progress | प्रगति में |
| Not Started | शुरू नहीं हुआ |

### Parent Widgets
| English | Hindi |
|---------|-------|
| Child Overview | बच्चे का अवलोकन |
| Attendance | उपस्थिति |
| Fee Summary | शुल्क सारांश |
| Performance | प्रदर्शन |
| Messages | संदेश |

### Admin Widgets
| English | Hindi |
|---------|-------|
| Dashboard | डैशबोर्ड |
| User Statistics | उपयोगकर्ता आंकड़े |
| Revenue | राजस्व |
| Active Users | सक्रिय उपयोगकर्ता |
| System Health | सिस्टम स्थिति |

## Usage Patterns

### Basic Translation
```typescript
const { t } = useTranslation("dashboard");

// Simple key
<Text>{t("widgets.myWidget.title")}</Text>

// With default value (fallback)
<Text>{t("widgets.myWidget.title", { defaultValue: "My Widget" })}</Text>
```

### Interpolation
```typescript
// With variables
<Text>{t("widgets.myWidget.labels.count", { count: items.length })}</Text>
// Output: "5 items" or "5 आइटम"

// With time
<Text>{t("widgets.myWidget.labels.updated", { time: "2 hours ago" })}</Text>
// Output: "Updated 2 hours ago" or "2 hours ago को अपडेट किया गया"
```

### Pluralization
```typescript
// i18next handles pluralization automatically
<Text>{t("widgets.myWidget.labels.count", { count: 1 })}</Text>
// Output: "1 item"

<Text>{t("widgets.myWidget.labels.count", { count: 5 })}</Text>
// Output: "5 items"
```

### Namespace Prefixing
```typescript
// Access other namespaces
<Text>{t("common:actions.retry")}</Text>
<Text>{t("common:status.loading")}</Text>

// Full path from root
<Text>{t("dashboard:widgets.myWidget.title")}</Text>
```

## Adding to Existing Files

When adding a new widget, merge into existing `dashboard.json`:

```json
{
  "widgets": {
    "existingWidget": { ... },

    // ADD YOUR NEW WIDGET HERE
    "newWidget": {
      "title": "...",
      "subtitle": "...",
      "states": { ... },
      "actions": { ... }
    }
  }
}
```

## Widget Key Naming

| Widget ID | Translation Key |
|-----------|-----------------|
| `schedule.today` | `todaySchedule` |
| `progress.weekly` | `weeklyProgress` |
| `parent.childOverview` | `childOverview` |
| `admin.userStats` | `userStats` |

**Pattern:** Convert widget ID to camelCase for translation key.

## Common UI Translations Reference

### Common Namespace (`src/locales/en/common.json`)

```json
{
  "actions": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "retry": "Try Again",
    "refresh": "Refresh",
    "viewAll": "View All",
    "close": "Close",
    "confirm": "Confirm",
    "back": "Back"
  },
  "status": {
    "loading": "Loading...",
    "saving": "Saving...",
    "success": "Success",
    "error": "Error",
    "offline": "You are offline"
  },
  "time": {
    "today": "Today",
    "yesterday": "Yesterday",
    "tomorrow": "Tomorrow",
    "now": "Now",
    "ago": "ago"
  }
}
```

### Hindi Common (`src/locales/hi/common.json`)

```json
{
  "actions": {
    "save": "सहेजें",
    "cancel": "रद्द करें",
    "delete": "हटाएं",
    "edit": "संपादित करें",
    "retry": "पुनः प्रयास करें",
    "refresh": "रीफ्रेश करें",
    "viewAll": "सभी देखें",
    "close": "बंद करें",
    "confirm": "पुष्टि करें",
    "back": "वापस"
  },
  "status": {
    "loading": "लोड हो रहा है...",
    "saving": "सहेजा जा रहा है...",
    "success": "सफल",
    "error": "त्रुटि",
    "offline": "आप ऑफलाइन हैं"
  },
  "time": {
    "today": "आज",
    "yesterday": "कल",
    "tomorrow": "कल",
    "now": "अभी",
    "ago": "पहले"
  }
}
```
