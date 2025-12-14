import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { getFeatureRegistry } from "../../config/featureRegistry";
import { getWidgetRegistry } from "../../config/widgetRegistry";
import { AppText } from "../../ui/components/AppText";
import { AppButton } from "../../ui/components/AppButton";
import { AppInput } from "../../ui/components/AppInput";

type Customer = { id: string; name: string; slug: string; status: string };
type ToggleRow = { feature_id: string; enabled: boolean };
type TabRow = {
  tab_id: string;
  label: string;
  order_index: number;
  enabled: boolean;
  required_permissions: string[];
};
type LayoutRow = {
  widget_id: string;
  order_index: number;
  enabled: boolean;
};

export const AdminPanel: React.FC = () => {
  const adminFunctionUrl = process.env.ADMIN_FUNCTION_URL;
  const adminDisabled = !adminFunctionUrl;
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [featureToggles, setFeatureToggles] = useState<Record<string, boolean>>({});
  const [tabs, setTabs] = useState<TabRow[]>([]);
  const [layout, setLayout] = useState<LayoutRow[]>([]);
  const [theme, setTheme] = useState({ primary_color: "#2D6CF6", secondary_color: "#F4B400", surface_color: "#FFFFFF" });
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [newCustomer, setNewCustomer] = useState({ name: "", slug: "" });

  useEffect(() => {
    if (!adminFunctionUrl) return;
    fetch(`${adminFunctionUrl}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.ADMIN_JWT || ""}` },
      body: JSON.stringify({ action: "customers.list" }),
    })
      .then((res) => res.json())
      .then((res) => {
        setCustomers(res.customers ?? []);
        if (res.customers && res.customers.length > 0) setSelectedCustomer(res.customers[0].id);
      })
      .catch((err) => console.error(err));
  }, [adminFunctionUrl]);

  useEffect(() => {
    if (!adminFunctionUrl || !selectedCustomer) return;
    const authHeader = { Authorization: `Bearer ${process.env.ADMIN_JWT || ""}` };
    // Features
    fetch(adminFunctionUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader },
      body: JSON.stringify({ action: "features.get", customer_id: selectedCustomer }),
    })
      .then((r) => r.json())
      .then((res) => {
        const map: Record<string, boolean> = {};
        res.features?.forEach((row: ToggleRow) => (map[row.feature_id] = row.enabled));
        getFeatureRegistry().forEach((f) => {
          if (map[f.id] === undefined) map[f.id] = f.defaultEnabled;
        });
        setFeatureToggles(map);
      });
    // Tabs
    fetch(adminFunctionUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader },
      body: JSON.stringify({ action: "navigation.get", customer_id: selectedCustomer, role: "student" }),
    })
      .then((r) => r.json())
      .then((res) => setTabs(res.tabs ?? []));
    // Layout
    fetch(adminFunctionUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader },
      body: JSON.stringify({ action: "dashboard.get", customer_id: selectedCustomer, role: "student" }),
    })
      .then((r) => r.json())
      .then((res) => setLayout(res.layout ?? []));
    // Theme
    fetch(adminFunctionUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader },
      body: JSON.stringify({ action: "theme.get", customer_id: selectedCustomer }),
    })
      .then((r) => r.json())
      .then((res) => {
        if (res.theme) setTheme(res.theme);
      });
    // Audit logs
    fetch(adminFunctionUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader },
      body: JSON.stringify({ action: "audit", customer_id: selectedCustomer }),
    })
      .then((r) => r.json())
      .then((res) => setAuditLogs(res.logs ?? []));
  }, [adminFunctionUrl, selectedCustomer]);

  const saveFeatures = async () => {
    if (!adminFunctionUrl || !selectedCustomer) return;
    const rows = Object.entries(featureToggles).map(([feature_id, enabled]) => ({
      customer_id: selectedCustomer,
      feature_id,
      enabled,
      overridden: true,
    }));
    await fetch(adminFunctionUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.ADMIN_JWT || ""}` },
      body: JSON.stringify({ action: "features", customer_id: selectedCustomer, toggles: rows }),
    });
  };

  const saveTabs = async () => {
    if (!adminFunctionUrl || !selectedCustomer) return;
    const rows = tabs.map((t, idx) => ({
      customer_id: selectedCustomer,
      role: "student",
      tab_id: t.tab_id,
      label: t.label,
      icon: null,
      initial_route: t.label,
      order_index: idx,
      enabled: t.enabled,
      required_permissions: t.required_permissions ?? [],
    }));
    await fetch(adminFunctionUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.ADMIN_JWT || ""}` },
      body: JSON.stringify({ action: "navigation", customer_id: selectedCustomer, role: "student", tabs: rows }),
    });
  };

  const saveLayout = async () => {
    if (!adminFunctionUrl || !selectedCustomer) return;
    const rows = layout.map((l, idx) => ({
      customer_id: selectedCustomer,
      role: "student",
      widget_id: l.widget_id,
      order_index: idx,
      enabled: l.enabled,
    }));
    await fetch(adminFunctionUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.ADMIN_JWT || ""}` },
      body: JSON.stringify({ action: "dashboard", customer_id: selectedCustomer, role: "student", layout: rows }),
    });
  };

  const saveTheme = async () => {
    if (!adminFunctionUrl || !selectedCustomer) return;
    await fetch(adminFunctionUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.ADMIN_JWT || ""}` },
      body: JSON.stringify({ action: "theme", customer_id: selectedCustomer, theme }),
    });
  };

  const createCustomer = async () => {
    if (!adminFunctionUrl || !newCustomer.name || !newCustomer.slug) return;
    await fetch(adminFunctionUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.ADMIN_JWT || ""}` },
      body: JSON.stringify({ action: "customers.create", name: newCustomer.name, slug: newCustomer.slug }),
    });
  };

  const widgets = Object.values(getWidgetRegistry());

  return (
    <ScrollView contentContainerStyle={styles.container} accessibilityLabel="Admin Panel">
      <AppText variant="heading" style={styles.heading}>Admin Panel (dev)</AppText>
      {adminDisabled && (
        <AppText style={styles.warning}>
          Admin disabled: service-role key not set. Set SUPABASE_SERVICE_ROLE_KEY (dev only).
        </AppText>
      )}

      <View style={styles.section}>
        <AppText variant="title" style={styles.title}>Customers</AppText>
        <View style={styles.row}>
          <AppInput
            placeholder="Name"
            style={styles.input}
            value={newCustomer.name}
            onChangeText={(t) => setNewCustomer((p) => ({ ...p, name: t }))}
          />
          <AppInput
            placeholder="Slug"
            style={styles.input}
            value={newCustomer.slug}
            onChangeText={(t) => setNewCustomer((p) => ({ ...p, slug: t }))}
          />
          <AppButton label="Create" onPress={createCustomer} />
        </View>
        {customers.map((c) => (
          <AppText
            key={c.id}
            style={[styles.item, selectedCustomer === c.id && styles.selected]}
            onPress={() => setSelectedCustomer(c.id)}
          >
            {c.name} ({c.slug})
          </AppText>
        ))}
      </View>

      <View style={styles.section}>
        <AppText variant="title" style={styles.title}>Feature Toggles</AppText>
        {Object.entries(featureToggles).map(([id, enabled]) => (
          <View key={id} style={styles.row}>
            <AppText style={styles.item}>{id}</AppText>
            <AppButton
              label={enabled ? "Disable" : "Enable"}
              onPress={() => setFeatureToggles((p) => ({ ...p, [id]: !enabled }))}
            />
          </View>
        ))}
        <AppButton label="Save Features" onPress={saveFeatures} />
      </View>

      <View style={styles.section}>
        <AppText variant="title" style={styles.title}>Navigation (student)</AppText>
        {tabs.map((tab, idx) => (
          <View key={tab.tab_id} style={styles.row}>
            <AppText style={styles.item}>
              {tab.tab_id} ({tab.label})
            </AppText>
            <AppButton
              label="Up"
              onPress={() => {
                if (idx === 0) return;
                const copy = [...tabs];
                [copy[idx - 1], copy[idx]] = [copy[idx], copy[idx - 1]];
                setTabs(copy);
              }}
            />
            <AppButton
              label="Down"
              onPress={() => {
                if (idx === tabs.length - 1) return;
                const copy = [...tabs];
                [copy[idx + 1], copy[idx]] = [copy[idx], copy[idx + 1]];
                setTabs(copy);
              }}
            />
            <AppButton
              label={tab.enabled ? "Disable" : "Enable"}
              onPress={() => {
                const copy = [...tabs];
                copy[idx] = { ...copy[idx], enabled: !tab.enabled };
                setTabs(copy);
              }}
            />
          </View>
        ))}
        <AppButton label="Save Navigation" onPress={saveTabs} />
      </View>

      <View style={styles.section}>
        <AppText variant="title" style={styles.title}>Dashboard Layout (student)</AppText>
        {layout.map((w, idx) => (
          <View key={w.widget_id} style={styles.row}>
            <AppText style={styles.item}>
              {w.order_index}. {w.widget_id}
            </AppText>
            <AppButton
              label="Up"
              onPress={() => {
                if (idx === 0) return;
                const copy = [...layout];
                [copy[idx - 1], copy[idx]] = [copy[idx], copy[idx - 1]];
                setLayout(copy.map((row, i) => ({ ...row, order_index: i })));
              }}
            />
            <AppButton
              label="Down"
              onPress={() => {
                if (idx === layout.length - 1) return;
                const copy = [...layout];
                [copy[idx + 1], copy[idx]] = [copy[idx], copy[idx + 1]];
                setLayout(copy.map((row, i) => ({ ...row, order_index: i })));
              }}
            />
            <AppButton
              label={w.enabled ? "Disable" : "Enable"}
              onPress={() => {
                const copy = [...layout];
                copy[idx] = { ...copy[idx], enabled: !w.enabled };
                setLayout(copy);
              }}
            />
          </View>
        ))}
        <AppButton label="Save Layout" onPress={saveLayout} />
      </View>

      <View style={styles.section}>
        <AppText variant="title" style={styles.title}>Theme</AppText>
        <View style={styles.row}>
          <AppText style={styles.item}>Primary</AppText>
          <AppInput
            style={styles.input}
            value={theme.primary_color}
            onChangeText={(t) => setTheme((p) => ({ ...p, primary_color: t }))}
          />
        </View>
        <View style={styles.row}>
          <AppText style={styles.item}>Secondary</AppText>
          <AppInput
            style={styles.input}
            value={theme.secondary_color}
            onChangeText={(t) => setTheme((p) => ({ ...p, secondary_color: t }))}
          />
        </View>
        <View style={styles.row}>
          <AppText style={styles.item}>Surface</AppText>
          <AppInput
            style={styles.input}
            value={theme.surface_color}
            onChangeText={(t) => setTheme((p) => ({ ...p, surface_color: t }))}
          />
        </View>
        <AppButton label="Save Theme" onPress={saveTheme} />
      </View>

      <View style={styles.section}>
        <AppText variant="title" style={styles.title}>Audit Log</AppText>
        {auditLogs.map((log) => (
          <AppText key={log.id} style={styles.item}>
            {log.config_type} @ {log.changed_at}
          </AppText>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
    flexGrow: 1,
  },
  heading: {
    fontSize: 20,
    fontWeight: "700",
  },
  section: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  item: {
    fontSize: 14,
  },
  selected: {
    fontWeight: "700",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 100,
  },
  warning: {
    color: "#b91c1c",
    fontWeight: "600",
  },
});
