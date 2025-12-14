# AI & Automation Widget Development Guide

This guide explains how to create AI-powered widgets and automation integrations for the EdTech platform. It covers the complete flow from database configuration to mobile app implementation.

---

## 🚀 Quick Start: AI Widget Creation Checklist

### Phase 1: Define AI Feature in Database

```sql
-- 1. Add to ai_feature_definitions (global catalog)
INSERT INTO ai_feature_definitions (
  feature_id, name, name_hi, description, category, capability_class,
  icon, default_output_mode, default_tools_policy, default_max_tokens,
  default_temperature, min_role_level, requires_consent, is_active
) VALUES (
  'ai_my_feature',
  'My AI Feature',
  'मेरी AI सुविधा',
  'Description of what this AI feature does',
  'tutoring',  -- tutoring | assessment | content | analytics
  'SAFE_GUIDED_CHAT',  -- capability class
  'robot',
  'TEXT',
  'TOOLS_DISABLED',
  1000,
  0.7,
  1,
  true,
  true
);

-- 2. Enable for customer (optional - can do via Platform Studio)
INSERT INTO customer_ai_features (
  customer_id, feature_id, enabled_roles, enabled_profiles, is_enabled
) VALUES (
  'your-customer-id',
  'ai_my_feature',
  ARRAY['student', 'teacher'],
  ARRAY['kid', 'teen', 'adult'],
  true
);
```

### Phase 2: Create Widget Component

Create `src/components/widgets/ai/MyAIWidget.tsx`:

```tsx
import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { useTranslation } from "react-i18next";
import { AppText } from "../../../ui/components/AppText";
import { useAI } from "../../../hooks/useAI";
import { useAIPermission } from "../../../hooks/useAIPermission";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const FEATURE_ID = "ai_my_feature";

export const MyAIWidget: React.FC<WidgetProps> = ({ config, onNavigate, userId, role }) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation("dashboard");
  
  // 1. Check AI permission
  const { hasAccess, isLoading: permLoading } = useAIPermission(FEATURE_ID);
  
  // 2. Use AI hook for interactions
  const { sendMessage, isLoading, error } = useAI({
    featureId: FEATURE_ID,
    userId,
    role,
  });

  // 3. Permission check
  if (permLoading) {
    return <ActivityIndicator color={colors.primary} />;
  }

  if (!hasAccess) {
    return (
      <View style={[styles.locked, { backgroundColor: colors.surfaceVariant }]}>
        <Icon name="lock" size={24} color={colors.onSurfaceVariant} />
        <AppText style={{ color: colors.onSurfaceVariant }}>
          {t("widgets.ai.locked")}
        </AppText>
      </View>
    );
  }

  // 4. Render AI widget
  return (
    <View style={styles.container}>
      {/* Your AI widget UI */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  locked: { padding: 20, alignItems: "center", gap: 8 },
});
```

### Phase 3: Register Widget

Add to `src/config/widgetRegistry.ts`:

```typescript
"ai.my-feature": {
  component: MyAIWidget,
  metadata: {
    id: "ai.my-feature",
    titleKey: "dashboard:widgets.myAIFeature.title",
    category: "ai",
    featureId: "ai_my_feature",
    roles: ["student", "teacher"],
    requiresOnline: true,
    dataPolicy: { maxQueries: 2, staleTimeMs: 0 },
  },
},
```

### Phase 4: Platform Studio Registration

Add to `platform-studio/src/config/widgetRegistry.ts`:

```typescript
"ai.my-feature": {
  id: "ai.my-feature",
  name: "My AI Feature",
  category: "ai",
  icon: "robot",
  allowedRoles: ["student", "teacher"],
},
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AI & AUTOMATION SYSTEM                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Mobile App                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                     │
│  │ AI Widget   │───▶│ useAI Hook  │───▶│ AI Gateway  │                     │
│  │             │    │             │    │ Service     │                     │
│  └─────────────┘    └─────────────┘    └──────┬──────┘                     │
│                                               │                             │
│  ┌─────────────┐    ┌─────────────┐          │                             │
│  │ Automation  │───▶│ Webhook     │          │                             │
│  │ Widget      │    │ Trigger     │          │                             │
│  └─────────────┘    └─────────────┘          │                             │
│                                               ▼                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  Supabase Edge Function (ai-gateway)                                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │ Config   │ │ Safety   │ │ Budget   │ │ Kill     │ │ Provider │         │
│  │ Resolver │ │ Check    │ │ Check    │ │ Switch   │ │ Executor │         │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘         │
│                                               │                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  External Services                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                       │
│  │ Gemini   │ │ OpenAI   │ │ n8n      │ │ Custom   │                       │
│  │ API      │ │ API      │ │ Webhooks │ │ MCP      │                       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘                       │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  Platform Studio (Admin)                                                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│  │ Features │ │ Providers│ │ Models   │ │ Prompts  │ │Automations│         │
│  │ Config   │ │ Config   │ │ Config   │ │ Config   │ │ Config   │         │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Widget Categories

### AI Widgets (`category: "ai"`)

| Widget ID | Purpose | Capability Class |
|-----------|---------|------------------|
| `ai.tutor-chat` | Interactive AI tutoring | SAFE_GUIDED_CHAT |
| `ai.doubt-solver` | Solve student doubts | GENERAL_CHAT |
| `ai.quiz-generator` | Generate practice quizzes | STRUCTURED_EXTRACTION |
| `ai.summary` | Summarize content | SUMMARIZATION |
| `ai.flashcards` | Generate flashcards | STRUCTURED_EXTRACTION |
| `ai.essay-feedback` | Essay writing feedback | GENERAL_CHAT |

### Automation Widgets (`category: "automation"`)

| Widget ID | Purpose | Trigger Type |
|-----------|---------|--------------|
| `automation.n8n-test` | Test n8n webhooks | manual |
| `automation.workflow-status` | Show workflow status | event |
| `automation.scheduled-tasks` | Display scheduled automations | schedule |
| `automation.notifications` | Automation notifications | webhook |

---

## Step-by-Step: Creating an AI Widget

### Step 1: Define AI Feature in Database

First, add your AI feature to the global catalog:

```sql
-- Add to ai_feature_definitions (global catalog)
INSERT INTO ai_feature_definitions (
  feature_id, name, name_hi, description, category, capability_class,
  icon, default_output_mode, default_tools_policy, default_max_tokens,
  default_temperature, min_role_level, requires_consent, is_active
) VALUES (
  'ai_doubt_solver',
  'AI Doubt Solver',
  'AI संदेह समाधानकर्ता',
  'Helps students solve doubts with AI assistance',
  'tutoring',
  'GENERAL_CHAT',
  'help-circle',
  'TEXT',
  'TOOLS_DISABLED',
  1024,
  0.7,
  1,
  true,
  true
);
```

Or use Platform Studio: **AI → Features → Add Feature**

### Step 2: Create the AI Widget Component

Location: `src/components/widgets/ai/DoubtSolverWidget.tsx`

```tsx
import React, { useState, useCallback } from "react";
import { View, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useTranslation } from "react-i18next";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { AppText } from "../../../ui/components/AppText";
import { useAI } from "../../../hooks/useAI";
import { useAIFeatureAccess } from "../../../hooks/useAIPermission";

const FEATURE_ID = "ai_doubt_solver";

export const DoubtSolverWidget: React.FC<WidgetProps> = ({ config, userId, role }) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("dashboard");
  
  // 1. Check AI feature access (permission + feature enabled + kill switch)
  const { canAccess, isLoading: accessLoading, accessDeniedReason } = useAIFeatureAccess(FEATURE_ID);
  
  // 2. Use AI hook for interactions
  const { complete, loading, error, hasPermission, isDisabled } = useAI({
    featureId: FEATURE_ID,
    userId,
    role,
  });

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);

  const handleAsk = useCallback(async () => {
    if (!question.trim() || isDisabled) return;
    
    const result = await complete(question);
    if (result) {
      setAnswer(result);
    }
  }, [question, complete, isDisabled]);

  // Loading state
  if (accessLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  // Access denied state
  if (!canAccess) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.surfaceVariant }]}>
        <Icon name="lock" size={32} color={colors.onSurfaceVariant} />
        <AppText style={{ color: colors.onSurfaceVariant, marginTop: 8, textAlign: "center" }}>
          {accessDeniedReason || t("widgets.ai.locked")}
        </AppText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Question Input */}
      <View style={[styles.inputRow, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}>
        <TextInput
          style={[styles.input, { color: colors.onSurface }]}
          placeholder={t("widgets.doubtSolver.placeholder", { defaultValue: "Ask your doubt..." })}
          placeholderTextColor={colors.onSurfaceVariant}
          value={question}
          onChangeText={setQuestion}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: colors.primary, borderRadius: borderRadius.small }]}
          onPress={handleAsk}
          disabled={loading || !question.trim()}
        >
          {loading ? (
            <ActivityIndicator color={colors.onPrimary} size="small" />
          ) : (
            <Icon name="send" size={18} color={colors.onPrimary} />
          )}
        </TouchableOpacity>
      </View>

      {/* Error */}
      {error && (
        <View style={[styles.errorBox, { backgroundColor: `${colors.error}15` }]}>
          <Icon name="alert-circle" size={16} color={colors.error} />
          <AppText style={{ color: colors.error, marginLeft: 8, flex: 1 }}>
            {error.message}
          </AppText>
        </View>
      )}

      {/* Answer */}
      {answer && (
        <View style={[styles.answerBox, { backgroundColor: colors.surfaceVariant, borderRadius: borderRadius.medium }]}>
          <Icon name="robot" size={18} color={colors.primary} />
          <AppText style={{ color: colors.onSurface, marginLeft: 8, flex: 1 }}>
            {answer}
          </AppText>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, gap: 12 },
  centered: { justifyContent: "center", alignItems: "center", padding: 20 },
  inputRow: { flexDirection: "row", alignItems: "flex-end", padding: 8 },
  input: { flex: 1, fontSize: 14, maxHeight: 80, paddingHorizontal: 8 },
  sendBtn: { padding: 10, marginLeft: 8 },
  errorBox: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 8 },
  answerBox: { flexDirection: "row", alignItems: "flex-start", padding: 12 },
});
```

### Step 3: Register Widget

Add to `src/config/widgetRegistry.ts`:

```typescript
import { DoubtSolverWidget } from "../components/widgets/ai/DoubtSolverWidget";

"ai.doubt-solver": {
  component: DoubtSolverWidget,
  metadata: {
    id: "ai.doubt-solver",
    titleKey: "dashboard:widgets.doubtSolver.title",
    category: "ai",
    featureId: "ai_doubt_solver",
    roles: ["student"],
    requiresOnline: true,
    dataPolicy: { maxQueries: 0, staleTimeMs: 0 },
  },
},
```

Add to `platform-studio/src/config/widgetRegistry.ts`:

```typescript
"ai.doubt-solver": {
  id: "ai.doubt-solver",
  name: "AI Doubt Solver",
  category: "ai",
  icon: "help-circle",
  allowedRoles: ["student"],
},
```

---

## Step-by-Step: Creating an Automation Widget

### Step 1: Define Automation in Database

```sql
INSERT INTO automation_definitions (
  automation_id, name, name_hi, description, category, icon,
  trigger_type, trigger_config, steps, risk_level, requires_approval, is_active
) VALUES (
  'homework_reminder',
  'Homework Reminder',
  'होमवर्क रिमाइंडर',
  'Sends reminder notifications for pending homework',
  'notifications',
  'bell-ring',
  'schedule',
  '{"cron": "0 18 * * *"}',
  '[{"step_id": "notify", "action_type": "webhook", "action_config": {"url": "https://your-n8n.cloud/webhook/homework-reminder", "method": "POST"}}]',
  'low',
  false,
  true
);
```

Or use Platform Studio: **AI → Automations → Create Automation**

### Step 2: Create Automation Widget

Location: `src/components/widgets/automation/HomeworkReminderWidget.tsx`

```tsx
import React, { useState, useCallback, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useTranslation } from "react-i18next";
import type { WidgetProps } from "../../../types/widget.types";
import { useAppTheme } from "../../../theme/useAppTheme";
import { AppText } from "../../../ui/components/AppText";
import { getSupabaseClient } from "../../../lib/supabaseClient";
import { useCanTriggerAutomation } from "../../../hooks/useAIPermission";

const AUTOMATION_ID = "homework_reminder";

export const HomeworkReminderWidget: React.FC<WidgetProps> = ({ config, userId }) => {
  const { colors, borderRadius } = useAppTheme();
  const { t } = useTranslation("dashboard");
  const canTrigger = useCanTriggerAutomation();

  const [automation, setAutomation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [lastResult, setLastResult] = useState<{ success: boolean; message: string } | null>(null);

  // Fetch automation config
  useEffect(() => {
    const fetchAutomation = async () => {
      try {
        const { data } = await getSupabaseClient()
          .from("automation_definitions")
          .select("*")
          .eq("automation_id", AUTOMATION_ID)
          .eq("is_active", true)
          .single();
        setAutomation(data);
      } catch (err) {
        console.warn("[HomeworkReminderWidget] Failed to fetch automation:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAutomation();
  }, []);

  // Trigger automation manually
  const handleTrigger = useCallback(async () => {
    if (!automation || !canTrigger) return;
    
    setTriggering(true);
    setLastResult(null);

    try {
      const webhookStep = automation.steps?.find((s: any) => s.action_type === "webhook");
      if (!webhookStep?.action_config?.url) {
        throw new Error("No webhook URL configured");
      }

      const res = await fetch(webhookStep.action_config.url, {
        method: webhookStep.action_config.method || "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          automation_id: AUTOMATION_ID,
          user_id: userId,
          triggered_at: new Date().toISOString(),
          manual: true,
        }),
      });

      setLastResult({
        success: res.ok,
        message: res.ok ? "Reminder sent!" : `Failed: ${res.status}`,
      });
    } catch (err) {
      setLastResult({
        success: false,
        message: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setTriggering(false);
    }
  }, [automation, userId, canTrigger]);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!automation) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Icon name="alert-circle-outline" size={24} color={colors.onSurfaceVariant} />
        <AppText style={{ color: colors.onSurfaceVariant }}>Automation not configured</AppText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon name={automation.icon || "bell-ring"} size={24} color={colors.primary} />
        <AppText variant="title" style={{ color: colors.onSurface, marginLeft: 8 }}>
          {automation.name}
        </AppText>
      </View>

      {automation.description && (
        <AppText style={{ color: colors.onSurfaceVariant, marginBottom: 12 }}>
          {automation.description}
        </AppText>
      )}

      <TouchableOpacity
        style={[styles.triggerBtn, { backgroundColor: colors.primary, borderRadius: borderRadius.medium }]}
        onPress={handleTrigger}
        disabled={triggering || !canTrigger}
      >
        {triggering ? (
          <ActivityIndicator color={colors.onPrimary} size="small" />
        ) : (
          <>
            <Icon name="play" size={18} color={colors.onPrimary} />
            <AppText style={{ color: colors.onPrimary, marginLeft: 8, fontWeight: "600" }}>
              {canTrigger ? "Trigger Now" : "No Permission"}
            </AppText>
          </>
        )}
      </TouchableOpacity>

      {lastResult && (
        <View style={[styles.resultBox, { backgroundColor: lastResult.success ? `${colors.primary}15` : `${colors.error}15` }]}>
          <Icon
            name={lastResult.success ? "check-circle" : "alert-circle"}
            size={16}
            color={lastResult.success ? colors.primary : colors.error}
          />
          <AppText style={{ color: lastResult.success ? colors.primary : colors.error, marginLeft: 8 }}>
            {lastResult.message}
          </AppText>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 4 },
  centered: { justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  triggerBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 14 },
  resultBox: { flexDirection: "row", alignItems: "center", padding: 12, borderRadius: 8, marginTop: 12 },
});
```

---

## AI Hooks Reference

### useAI Hook

Main hook for AI interactions with loading/error state management.

```typescript
import { useAI } from "../hooks/useAI";

const { 
  complete,           // (text: string) => Promise<string | null>
  chatWithHistory,    // (messages: AIMessage[]) => Promise<string | null>
  generateStructured, // <T>(prompt: string, schemaId?: string) => Promise<T | null>
  reset,              // () => void - Reset state
  loading,            // boolean
  error,              // AIGatewayError | null
  response,           // AIExecuteResponse | null
  traceId,            // string | null - For debugging
  hasPermission,      // boolean
  isDisabled,         // boolean - True if no permission or feature disabled
} = useAI({
  featureId: "ai_tutor",      // Required: AI feature ID
  widgetId: "ai.tutor-chat",  // Optional: Widget ID for audit
  audienceProfile: "teen",    // Optional: kid | teen | adult | coaching
  role: "student",            // Optional: User role
});

// Simple completion
const answer = await complete("What is photosynthesis?");

// Chat with history
const response = await chatWithHistory([
  { role: "user", content: "Hello" },
  { role: "assistant", content: "Hi! How can I help?" },
  { role: "user", content: "Explain gravity" },
]);

// Generate structured JSON
const quiz = await generateStructured<QuizData>("Generate a 5-question quiz on biology");
```

### useAIPermission Hook

Check AI-specific permissions.

```typescript
import { 
  useAIFeatureAccess,
  useCanUseAIChat,
  useCanTriggerAutomation,
  useAIPermissions,
} from "../hooks/useAIPermission";

// Comprehensive access check for a feature
const { 
  canAccess,           // boolean - Can user access this feature?
  feature,             // ResolvedAIFeature | undefined
  hasPermission,       // boolean - Has required permission?
  isFeatureEnabled,    // boolean - Is feature enabled for customer?
  isBlocked,           // boolean - Is kill switch active?
  accessDeniedReason,  // string | null - Why access denied
  isLoading,           // boolean
} = useAIFeatureAccess("ai_tutor", "teen");

// Simple permission checks
const canChat = useCanUseAIChat();
const canTrigger = useCanTriggerAutomation();

// Get all AI permissions
const { 
  canChat, 
  canSummarize, 
  canUseCopilot, 
  canUseTools,
  canTriggerAutomation,
  canViewConfig,
  canManageConfig,
} = useAIPermissions();
```

### useAIConfig Hook

Access AI configuration for current user.

```typescript
import { 
  useAIConfig,
  useAIFeatures,
  useAIFeature,
  useMCPTools,
  useAutomations,
  useAIBlockStatus,
} from "../hooks/useAIConfig";

// Full AI config
const { 
  config,
  features,
  providers,
  models,
  tools,
  automations,
  routingRules,
  budgets,
  killSwitches,
  isLoading,
} = useAIConfig();

// Just features
const { features, isLoading } = useAIFeatures();

// Single feature
const { feature, isEnabled, isLoading } = useAIFeature("ai_tutor");

// MCP tools
const { tools, isLoading } = useMCPTools();

// Automations
const { automations, isLoading } = useAutomations();

// Kill switch status
const { isBlocked, reason, isLoading } = useAIBlockStatus("ai_tutor");
```

---

## Database Schema Reference

### AI Tables Overview

| Table | Purpose |
|-------|---------|
| `ai_feature_definitions` | Global AI feature catalog |
| `customer_ai_features` | Per-customer feature enablement |
| `ai_provider_definitions` | AI provider catalog (Gemini, OpenAI, etc.) |
| `customer_ai_providers` | Per-customer provider config |
| `ai_model_definitions` | AI model catalog |
| `customer_ai_models` | Per-customer model config |
| `mcp_tool_definitions` | MCP tool catalog |
| `customer_mcp_tools` | Per-customer tool enablement |
| `automation_definitions` | Automation workflow catalog |
| `customer_automations` | Per-customer automation config |
| `prompt_definitions` | System prompt templates |
| `customer_prompts` | Per-customer prompt overrides |
| `audience_profile_definitions` | Audience profiles (kid, teen, adult) |
| `customer_ai_routing_rules` | Model routing rules |
| `customer_ai_budgets` | Usage budgets |
| `ai_kill_switches` | Emergency kill switches |
| `ai_audit_logs` | AI usage audit trail |

### Key Types

```typescript
// Capability classes for AI features
type CapabilityClass = 
  | 'SAFE_GUIDED_CHAT'      // Restricted chat for kids
  | 'GENERAL_CHAT'          // Standard chat
  | 'DEEP_REASONING'        // Complex reasoning tasks
  | 'SUMMARIZATION'         // Content summarization
  | 'STRUCTURED_EXTRACTION' // JSON output
  | 'CLASSIFICATION'        // Classification tasks
  | 'MULTIMODAL_VISION'     // Image understanding
  | 'EMBEDDINGS';           // Vector embeddings

// Audience profiles
type AudienceProfile = 'kid' | 'teen' | 'adult' | 'coaching';

// Automation trigger types
type TriggerType = 'event' | 'schedule' | 'manual' | 'condition' | 'webhook';

// Risk levels
type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
```

---

## Platform Studio AI Configuration

### Managing AI Features

1. Navigate to **AI → Features**
2. View global feature catalog
3. Enable/disable features per customer
4. Configure roles and audience profiles
5. Override default settings (max tokens, temperature)

### Managing Automations

1. Navigate to **AI → Automations**
2. Create new automation definitions
3. Configure trigger type and steps
4. Set webhook URLs for n8n integration
5. Enable per-customer with role restrictions

### Managing Kill Switches

1. Navigate to **AI → Kill Switches**
2. Toggle global AI kill switch
3. Disable specific features/providers/models
4. Set auto-reactivation time
5. Add reason for audit trail

---

## Safety & Budget Integration

### Budget Checks

AI requests automatically check budgets:

```typescript
// Budget is checked in AI Gateway
// If over budget, request is denied or degraded based on action_on_limit

// Budget types:
// - tenant: Overall customer budget
// - feature: Per-feature budget
// - user: Per-user budget
// - model: Per-model budget
```

### Kill Switch Integration

```typescript
// Check if AI is blocked before making requests
const { isBlocked, reason } = useAIBlockStatus("ai_tutor");

if (isBlocked) {
  // Show user-friendly message
  return <AIBlockedMessage reason={reason} />;
}
```

### Safety Moderation

AI Gateway automatically:
1. Checks content against safety policies
2. Applies audience-appropriate filters
3. Blocks forbidden topics for kids
4. Logs safety flags in audit

---

## Testing AI Widgets

### Manual Testing

1. Add widget to screen via Platform Studio
2. Test with different roles (student, teacher)
3. Test with different audience profiles
4. Test error states (no API key, network error)
5. Test kill switch behavior

### Checklist

- [ ] Widget shows loading state
- [ ] Widget shows locked state when no permission
- [ ] Widget shows error state on failure
- [ ] AI responses are appropriate for audience
- [ ] Budget limits are respected
- [ ] Kill switch disables widget
- [ ] Audit logs are created

---

## Complete Example: AITutorChatWidget

See `src/components/widgets/ai/AITutorChatWidget.tsx` for a complete implementation with:
- API key management (for testing)
- Chat history
- Loading/error states
- Settings modal
- Gemini API integration

## Complete Example: N8nTestWidget

See `src/components/widgets/automation/N8nTestWidget.tsx` for a complete implementation with:
- Database config fetching
- Webhook triggering
- Response display
- Fallback handling

---

## Troubleshooting

### "AI feature not available"
- Check `customer_ai_features` has entry for customer + feature
- Check `is_enabled = true`
- Check user role is in `enabled_roles`
- Check audience profile is in `enabled_profiles`

### "Kill switch active"
- Check `ai_kill_switches` table
- Look for global, feature, or provider kill switches
- Check `auto_reactivate_at` if temporary

### "Budget exceeded"
- Check `customer_ai_budgets` table
- Review `current_daily_spend` vs `daily_limit_usd`
- Check `action_on_limit` setting

### Webhook not triggering
- Verify webhook URL in `automation_definitions.steps`
- Check n8n workflow is active
- Test webhook URL directly with curl
- Check network connectivity
