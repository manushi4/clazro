/**
 * N8n Test Widget
 * Test widget for n8n webhook automation integration
 * Fetches automation config from automation_definitions table
 */

import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useTranslation } from "react-i18next";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { AppText } from "../../../ui/components/AppText";
import { getSupabaseClient } from "../../../lib/supabaseClient";

// Fallback URL if database fetch fails
const FALLBACK_WEBHOOK_URL =
  "https://singhaldeoli104.app.n8n.cloud/webhook-test/b4901961-478d-4451-9fc7-d26f6ddcc6f9";

type AutomationStep = {
  step_id: string;
  action_type: string;
  action_config: {
    url?: string;
    method?: string;
    headers?: Record<string, string>;
  };
};

type AutomationDefinition = {
  id: string;
  automation_id: string;
  name: string;
  description?: string;
  steps: AutomationStep[];
  is_active: boolean;
};

type WebhookResponse = {
  success: boolean;
  data?: unknown;
  error?: string;
  timestamp?: string;
};

export const N8nTestWidget: React.FC<WidgetProps> = ({ config }) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("dashboard");

  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<WebhookResponse | null>(null);
  const [testMessage, setTestMessage] = useState("Hello from EdTech App!");
  const [automation, setAutomation] = useState<AutomationDefinition | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);

  // Fetch automation definition from database
  useEffect(() => {
    const fetchAutomation = async () => {
      try {
        const { data, error } = await getSupabaseClient()
          .from("automation_definitions")
          .select("*")
          .eq("automation_id", "n8n_test_webhook")
          .eq("is_active", true)
          .single();

        if (error) {
          console.warn("[N8nTestWidget] Failed to fetch automation:", error.message);
        } else if (data) {
          console.log("[N8nTestWidget] Loaded automation:", data.name);
          setAutomation(data);
        }
      } catch (err) {
        console.warn("[N8nTestWidget] Error fetching automation:", err);
      } finally {
        setLoadingConfig(false);
      }
    };

    fetchAutomation();
  }, []);

  // Get webhook URL from automation steps or fallback
  const getWebhookUrl = useCallback((): string => {
    if (automation?.steps?.length) {
      const webhookStep = automation.steps.find(s => s.action_type === "webhook");
      if (webhookStep?.action_config?.url) {
        return webhookStep.action_config.url;
      }
    }
    return FALLBACK_WEBHOOK_URL;
  }, [automation]);

  // Trigger the n8n webhook
  const triggerWebhook = useCallback(async () => {
    setIsLoading(true);
    setResponse(null);

    const webhookUrl = getWebhookUrl();
    const payload = {
      source: "edtech-mobile-app",
      widget: "automation.n8n-test",
      automation_id: automation?.automation_id || "n8n_test_webhook",
      message: testMessage,
      timestamp: new Date().toISOString(),
      metadata: {
        platform: "react-native",
        version: "1.0.0",
        testMode: true,
        fromDatabase: !!automation,
      },
    };

    console.log("[N8nTestWidget] Triggering webhook:", webhookUrl);
    console.log("[N8nTestWidget] Payload:", JSON.stringify(payload, null, 2));

    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log("[N8nTestWidget] Response status:", res.status);
      const data = await res.json().catch(() => null);
      console.log("[N8nTestWidget] Response data:", data);

      setResponse({
        success: res.ok,
        data: data,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("[N8nTestWidget] Error:", error);
      setResponse({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
  }, [testMessage, automation, getWebhookUrl]);

  if (loadingConfig) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator color={colors.primary} />
        <AppText style={{ color: colors.onSurfaceVariant, marginTop: 8 }}>
          Loading automation config...
        </AppText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Icon name="webhook" size={24} color={colors.primary} />
          <AppText variant="title" style={[styles.title, { color: colors.onSurface }]}>
            {automation?.name || t("widgets.n8nTest.title", { defaultValue: "n8n Automation Test" })}
          </AppText>
        </View>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: response?.success
                ? `${colors.primary}20`
                : response?.error
                ? `${colors.error}20`
                : `${colors.outline}20`,
            },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: response?.success
                  ? colors.primary
                  : response?.error
                  ? colors.error
                  : colors.outline,
              },
            ]}
          />
          <AppText
            style={{
              fontSize: 11,
              color: response?.success
                ? colors.primary
                : response?.error
                ? colors.error
                : colors.outline,
            }}
          >
            {response?.success ? "Success" : response?.error ? "Failed" : "Ready"}
          </AppText>
        </View>
      </View>

      {/* Description */}
      {automation?.description && (
        <AppText style={[styles.description, { color: colors.onSurfaceVariant }]}>
          {automation.description}
        </AppText>
      )}

      {/* Message Input */}
      <View style={styles.inputSection}>
        <AppText style={[styles.label, { color: colors.onSurfaceVariant }]}>
          Test Message:
        </AppText>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.surfaceVariant,
              color: colors.onSurface,
              borderRadius: borderRadius.medium,
            },
          ]}
          value={testMessage}
          onChangeText={setTestMessage}
          placeholder="Enter test message..."
          placeholderTextColor={colors.onSurfaceVariant}
        />
      </View>

      {/* Trigger Button */}
      <TouchableOpacity
        style={[
          styles.triggerButton,
          {
            backgroundColor: isLoading ? colors.surfaceVariant : colors.primary,
            borderRadius: borderRadius.medium,
          },
        ]}
        onPress={triggerWebhook}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.onPrimary} size="small" />
        ) : (
          <>
            <Icon name="play-circle" size={20} color={colors.onPrimary} />
            <AppText style={[styles.buttonText, { color: colors.onPrimary }]}>
              Trigger Webhook
            </AppText>
          </>
        )}
      </TouchableOpacity>

      {/* Response Section */}
      {response && (
        <View
          style={[
            styles.responseSection,
            {
              backgroundColor: colors.surfaceVariant,
              borderRadius: borderRadius.medium,
            },
          ]}
        >
          <View style={styles.responseHeader}>
            <Icon
              name={response.success ? "check-circle" : "alert-circle"}
              size={16}
              color={response.success ? colors.primary : colors.error}
            />
            <AppText
              style={[
                styles.responseTitle,
                { color: response.success ? colors.primary : colors.error },
              ]}
            >
              {response.success ? "Webhook Triggered!" : "Error"}
            </AppText>
          </View>

          <ScrollView style={styles.responseBody} nestedScrollEnabled>
            <AppText style={[styles.responseText, { color: colors.onSurfaceVariant }]}>
              {response.error
                ? response.error
                : JSON.stringify(response.data, null, 2) || "No response data"}
            </AppText>
          </ScrollView>

          {response.timestamp && (
            <AppText style={[styles.timestamp, { color: colors.outline }]}>
              {new Date(response.timestamp).toLocaleTimeString()}
            </AppText>
          )}
        </View>
      )}

      {/* Info */}
      <View style={styles.infoSection}>
        <Icon name="information-outline" size={14} color={colors.outline} />
        <AppText style={[styles.infoText, { color: colors.outline }]}>
          {automation
            ? "Config loaded from database. Edit in Platform Studio → AI → Automations."
            : "Using fallback config. Add automation_definitions in database."}
        </AppText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 4,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
  },
  description: {
    fontSize: 12,
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  inputSection: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    marginBottom: 6,
  },
  input: {
    padding: 12,
    fontSize: 14,
  },
  triggerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    gap: 8,
    marginBottom: 12,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  responseSection: {
    padding: 12,
    marginBottom: 12,
  },
  responseHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  responseTitle: {
    fontSize: 13,
    fontWeight: "600",
  },
  responseBody: {
    maxHeight: 100,
  },
  responseText: {
    fontSize: 11,
    fontFamily: "monospace",
  },
  timestamp: {
    fontSize: 10,
    marginTop: 8,
    textAlign: "right",
  },
  infoSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginTop: "auto",
  },
  infoText: {
    fontSize: 11,
    flex: 1,
    lineHeight: 16,
  },
});
