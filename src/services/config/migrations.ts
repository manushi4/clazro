import type { WidgetLayoutItem } from "../../types/widget.types";
import { getWidgetEntry } from "../../config/widgetRegistry";
import { addBreadcrumb } from "../../error/sentry";

export function migrateDashboardLayout(items: WidgetLayoutItem[]) {
  let changed = false;
  const migrated: WidgetLayoutItem[] = [];

  items.forEach((item, idx) => {
    const entry = getWidgetEntry(item.widgetId);

    // If widget missing entirely, skip it
    if (!entry) {
      changed = true;
      addBreadcrumb({
        category: "widget",
        message: "widget_missing_skipped",
        level: "warning",
        data: { widgetId: item.widgetId },
      });
      return;
    }

    // If deprecated with replacement, swap
    let widgetId = item.widgetId;
    if (entry.metadata.deprecated && entry.metadata.replacementId) {
      const replacement = getWidgetEntry(entry.metadata.replacementId);
      if (replacement) {
        widgetId = replacement.metadata.id;
        changed = true;
        addBreadcrumb({
          category: "widget",
          message: "widget_replaced_migration",
          level: "info",
          data: { from: item.widgetId, to: widgetId },
        });
      }
    }

    migrated.push({
      ...item,
      widgetId,
      orderIndex: migrated.length,
    });
  });

  return { layout: migrated, changed };
}
