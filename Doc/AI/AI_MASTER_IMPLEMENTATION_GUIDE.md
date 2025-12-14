# AI Master Implementation Guide

> This guide provides a step-by-step implementation roadmap for the AI & Automation system.
> It references all other AI documentation and provides the execution order.

---

## 0. Current State (What Already Exists)

### 0.1 Existing AI Tables in Supabase

| Table | Rows | RLS | Purpose |
|-------|------|-----|---------|
| `ai_insights` | 5 | No | Parent AI insights (performance, attendance, recommendations) |
| `ai_predictions` | 5 | No | Student performance predictions |
| `ai_recommendations` | 6 | Yes | Study/practice recommendations |
| `ai_alerts` | 6 | Yes | Academic/attendance/behavior alerts |

### 0.2 Existing AI Permission

| Permission Code | Name | Category |
|-----------------|------|----------|
| `ai.tutor.use` | Use AI Tutor | premium |

### 0.3 Existing AI Widgets in Mobile App (`src/config/widgetRegistry.ts`)

| Widget ID | Component | Feature ID | Status |
|-----------|-----------|------------|--------|
| `ai.recommendations` | RecommendationsWidget | `ai.tutor` | ✅ Implemented |
| `parent.ai-insights-preview` | AIInsightsPreviewWidget | `parent.ai-insights` | ✅ Implemented |
| `parent.ai-predictions` | ParentAIPredictionsWidget | `parent.ai-predictions` | ✅ Implemented |
| `parent.ai-recommendations` | ParentAIRecommendationsWidget | `parent.ai-recommendations` | ✅ Implemented |
| `parent.ai-alerts` | ParentAIAlertsWidget | `parent.ai-alerts` | ✅ Implemented |

### 0.4 Platform Studio Widget Registry (Additional)

| Widget ID | Status | Notes |
|-----------|--------|-------|
| `ai.tutor-chat` | Registry only | Component not yet implemented |
| `ai.summary` | Registry only | Component not yet implemented |
| `ai.practice` | Registry only | Component not yet implemented |

---

## 1. Prerequisites

### 1.1 Existing System Requirements

Before implementing AI features, ensure these exist:

| Component | Status | File Reference |
|-----------|--------|----------------|
| Supabase Client | ✅ Exists | `src/lib/supabaseClient.ts` |
| Permission System | ✅ Exists | `src/hooks/usePermissions.ts` |
| Widget Registry | ✅ Exists | `src/config/widgetRegistry.ts` |
| Config Service | ✅ Exists | `src/services/config/configService.ts` |
| Platform Studio | ✅ Exists | `platform-studio/` |
| Analytics Events | ✅ Exists | `analytics_events` table |
| AI Content Tables | ✅ Exists | `ai_insights`, `ai_predictions`, `ai_recommendations`, `ai_alerts` |
| AI Permission | ✅ Exists | `ai.tutor.use` in `permissions` table |

### 1.2 AI Widgets Already Implemented

**Mobile App (`src/config/widgetRegistry.ts`):**
- `ai.recommendations` - Student AI recommendations
- `parent.ai-insights-preview` - Parent AI insights
- `parent.ai-predictions` - Parent AI predictions
- `parent.ai-recommendations` - Parent AI recommendations  
- `parent.ai-alerts` - Parent AI alerts

**Platform Studio (`platform-studio/src/config/widgetRegistry.ts`):**
- `ai.tutor-chat`, `ai.recommendations`, `ai.summary`, `ai.practice`
- `parent.ai-insights-preview`, `parent.ai-predictions`, `parent.ai-recommendations`, `parent.ai-alerts`

---

## 2. Implementation Phases

### Phase 1: Database Foundation (Week 1)

**Goal**: Create AI Registry tables in Supabase (following widget pattern for full flexibility)

**Already Exists:**
- ✅ `ai_insights` - Parent AI insights
- ✅ `ai_predictions` - Student predictions
- ✅ `ai_recommendations` - Study recommendations
- ✅ `ai_alerts` - Academic alerts
- ✅ `ai.tutor.use` permission

**To Create (Definition Tables - Global Catalog):**
1. `ai_feature_definitions` - Global AI feature catalog
2. `ai_provider_definitions` - Provider catalog (OpenAI, Anthropic, etc.)
3. `ai_model_definitions` - Model catalog
4. `mcp_tool_definitions` - MCP tool catalog
5. `automation_definitions` - Automation catalog
6. `prompt_definitions` - Prompt templates
7. `audience_profile_definitions` - Age-based profiles

**To Create (Assignment Tables - Per-Customer):**
8. `customer_ai_features` - Per-customer AI feature assignments
9. `customer_ai_providers` - Per-customer provider config
10. `customer_ai_models` - Per-customer model assignments
11. `customer_mcp_tools` - Per-customer MCP tools
12. `customer_automations` - Per-customer automations
13. `customer_prompts` - Per-customer prompt overrides
14. `customer_audience_profiles` - Per-customer profile overrides

**To Create (Supporting Tables):**
15. `customer_ai_routing_rules` - Model routing rules
16. `customer_ai_budgets` - Usage budgets
17. `ai_kill_switches` - Emergency shutoff
18. `ai_audit_logs` - Comprehensive audit trail

**To Add (Permissions):**
- `ai.chat.use`, `ai.summary.use`, `ai.copilot.use`, `ai.tools.use`
- `ai.automation.trigger`, `ai.config.view`, `ai.config.manage`
- `ai.budget.view`, `ai.audit.view`, `ai.killswitch.manage`

**Reference**: `Doc/AI/AI_IMPLEMENTATION_APPENDIX.md` Section 2

**Validation**:
```sql
-- Check existing AI tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE 'ai_%';

-- Check existing AI permissions
SELECT * FROM permissions WHERE category = 'ai' OR permission_code LIKE 'ai.%';
```

---

### Phase 2: TypeScript Types (Week 1)

**Goal**: Create type definitions for AI system

**Steps**:
1. Create `src/types/ai.types.ts` with all AI types
2. Export types from `src/types/index.ts`

**Reference**: `Doc/AI/AI_IMPLEMENTATION_APPENDIX.md` Section 3

**Files to Create**:
```
src/types/ai.types.ts          ← TO CREATE
```

**Files Already Exist**:
```
src/types/widget.types.ts      ← Pattern reference
src/types/permission.types.ts  ← Has Role type
```

---

### Phase 3: RPC Functions (Week 1)

**Goal**: Create Supabase RPC functions for AI operations

**Steps**:
1. Create `get_ai_config` function
2. Create `check_ai_permission` function
3. Create `log_ai_execution` function
4. Create `get_ai_routing` function
5. Create `is_ai_blocked` function
6. Create `activate_ai_kill_switch` function
7. Create `get_ai_usage_stats` function
8. Create `get_audience_profile` function

**Reference**: `Doc/AI/AI_IMPLEMENTATION_APPENDIX.md` Section 5

---

### Phase 4: Service Layer (Week 2)

**Goal**: Create AI services following existing patterns

**Steps**:
1. Create `src/services/ai/aiConfigService.ts`
2. Create `src/services/ai/aiExecuteService.ts`
3. Create `src/services/ai/aiAuditService.ts`

**Pattern Reference**: `src/services/config/configService.ts`

**Files to Create**:
```
src/services/ai/aiConfigService.ts    ← TO CREATE
src/services/ai/aiExecuteService.ts   ← TO CREATE
src/services/ai/aiAuditService.ts     ← TO CREATE
src/services/ai/index.ts              ← TO CREATE
```

**Existing Pattern Files**:
```
src/services/config/configService.ts         ← Pattern reference
src/services/config/customerConfigService.ts ← Pattern reference
```

---

### Phase 5: React Hooks (Week 2)

**Goal**: Create hooks for AI features

**Steps**:
1. Create `src/hooks/useAIPermission.ts`
2. Create `src/hooks/useAIConfig.ts`
3. Create `src/hooks/queries/useAIExecuteQuery.ts`

**Pattern Reference**: `src/hooks/usePermissions.ts`

**Files to Create**:
```
src/hooks/useAIPermission.ts              ← TO CREATE
src/hooks/useAIConfig.ts                  ← TO CREATE
src/hooks/queries/useAIExecuteQuery.ts    ← TO CREATE
```

**Existing Pattern Files**:
```
src/hooks/usePermissions.ts               ← Pattern reference
src/hooks/queries/useUserPermissionsQuery.ts ← Pattern reference
```

---

### Phase 6: AI Gateway Backend (Week 2-3)

**Goal**: Implement AI Gateway service

**Options**:
- Supabase Edge Function
- Separate Node.js/Deno service
- Serverless function (AWS Lambda, Vercel)

**Components**:
1. Request validation
2. Permission checking (call `check_ai_permission`)
3. Kill switch checking (call `is_ai_blocked`)
4. Routing logic (call `get_ai_routing`)
5. Provider adapters (OpenAI, Anthropic, etc.)
6. Fallback logic
7. Response normalization
8. Audit logging (call `log_ai_execution`)

**Reference**: `Doc/AI/AI Abstraction Layer & API Contracts`

---

### Phase 7: Platform Studio UI (Week 3-4)

**Goal**: Add AI configuration pages to Platform Studio

**Steps**:
1. Add AI menu items to sidebar
2. Create AI Features page (`/studio/ai/features`)
3. Create Routing Rules page (`/studio/ai/routing`)
4. Create Prompts Editor page (`/studio/ai/prompts`)
5. Create Audience Profiles page (`/studio/ai/profiles`)
6. Create Budgets page (`/studio/ai/budgets`)
7. Create Kill Switches page (`/studio/ai/kill-switches`)
8. Create Audit Logs page (`/studio/ai/audit`)

**Pattern Reference**: `platform-studio/src/app/studio/theme/page.tsx`

**Reference**: `Doc/AI/Platform Studio Extensions Guide`

---

### Phase 8: Mobile App Integration (Week 4)

**Goal**: Connect AI widgets to new backend

**Steps**:
1. Update AI widgets to use new `aiExecuteService`
2. Add permission checks using `useAIPermission`
3. Add kill switch fallback UI
4. Add budget exceeded UI
5. Add loading and error states

**Existing AI Widget Files**:
```
src/components/widgets/dashboard/RecommendationsWidget.tsx
src/components/widgets/parent/AIInsightsPreviewWidget.tsx
src/components/widgets/parent/ParentAIPredictionsWidget.tsx
src/components/widgets/parent/ParentAIRecommendationsWidget.tsx
src/components/widgets/parent/ParentAIAlertsWidget.tsx
```

**Files to Create (if needed)**:
```
src/components/widgets/ai/AITutorChatWidget.tsx    ← TO CREATE
src/components/widgets/ai/AISummaryWidget.tsx      ← TO CREATE
src/components/widgets/ai/AIPracticeWidget.tsx     ← TO CREATE
```

---

### Phase 9: Observability (Week 4-5)

**Goal**: Set up monitoring and dashboards

**Steps**:
1. Create AI usage dashboard in Platform Studio
2. Set up cost alerts
3. Set up safety alerts
4. Create audit log viewer

**Reference**: `Doc/AI/Observability, Analytics & Cost Controls`

---

### Phase 10: Testing & Validation (Week 5)

**Goal**: Validate all AI features

**Tests**:
1. Permission denial tests
2. Kill switch tests
3. Budget limit tests
4. Fallback tests
5. Safety filter tests
6. Audience profile tests

**Reference**: `Doc/AI/Testing, Evaluation & Regression Guide`

---

## 3. Environment Setup

### 3.1 Required Environment Variables

```bash
# Add to .env.local
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

AI_GATEWAY_URL=https://your-gateway-url
AI_DEFAULT_PROVIDER=openai
AI_DEFAULT_MODEL=gpt-4o-mini
AI_REQUEST_TIMEOUT_MS=30000

AI_DEFAULT_DAILY_BUDGET_USD=10.00
AI_RATE_LIMIT_PER_MINUTE=60
```

---

## 4. Migration Order

Run migrations in this order:

```
1. ai_providers
2. ai_models
3. ai_audience_profiles
4. ai_use_cases
5. ai_routing_rules
6. ai_prompts
7. ai_budgets
8. ai_kill_switches
9. ai_audit_logs
10. ai_consents
11. permissions (INSERT AI permissions)
12. role_permissions (INSERT AI role mappings)
```

---

## 5. Documentation Index

| Guide | Purpose |
|-------|---------|
| `AI_IMPLEMENTATION_APPENDIX.md` | SQL schemas, TypeScript types, API specs, current state |
| `Ai & Automation Architecture Overview.txt` | High-level architecture |
| `AI Abstraction Layer & API Contracts` | API specifications |
| `Ai Permissions, Consent & Rbac` | Permission model |
| `Multi-Model Provider Strategy Guide` | Provider routing |
| `Platform Studio Extensions Guide` | Studio UI specs |
| `Child Safety, Parental Controls & Age Gating` | Safety rules |
| `Observability, Analytics & Cost Controls` | Monitoring |
| `Kill Switch, Rollback & Incident Response` | Emergency procedures |
| `DB_SCHEMA_REFERENCE.md` | Database schema (includes AI tables) |

---

## 6. Quick Reference Commands

### Check AI Tables Exist
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE 'ai_%';
```

### Check AI Permissions Exist
```sql
SELECT * FROM permissions WHERE category = 'ai';
```

### Test AI Permission Check
```sql
SELECT check_ai_permission('user123', 'customer-uuid', 'ai_chat', 'student', 'teen');
```

### Test Kill Switch
```sql
SELECT is_ai_blocked('customer-uuid', 'ai_chat', 'openai');
```

---

## 7. Success Criteria

### Already Complete:
- [x] AI content tables exist (`ai_insights`, `ai_predictions`, `ai_recommendations`, `ai_alerts`)
- [x] Basic AI permission exists (`ai.tutor.use`)
- [x] AI widgets implemented in mobile app (5 widgets)
- [x] AI widgets registered in Platform Studio (8 widgets)

### Phase 1 Complete When:
- [ ] All AI registry tables created (17+ tables)
- [ ] All AI permissions added (10 new codes)
- [ ] TypeScript types created (`src/types/ai.types.ts`)
- [ ] RPC functions created and tested

### Phase 2 Complete When:
- [ ] AI services created (`src/services/ai/*`)
- [ ] AI hooks created (`src/hooks/useAI*.ts`)
- [ ] AI Gateway deployed and responding

### Phase 3 Complete When:
- [ ] Platform Studio AI pages functional (`/studio/ai/*`)
- [ ] AI widgets connected to new backend
- [ ] Observability dashboards operational
- [ ] All tests passing

---

## 8. Current vs Planned Comparison

| Component | Current State | Planned State |
|-----------|---------------|---------------|
| AI Tables | 4 content tables | 4 content + 17 registry tables |
| AI Permissions | 1 (`ai.tutor.use`) | 11 total |
| AI Widgets | 5 implemented | 8+ with full backend |
| AI Services | None | 3 services |
| AI Hooks | None | 3 hooks |
| Platform Studio | No AI pages | 8 AI config pages |
| AI Gateway | None | Full abstraction layer |

---

This guide ensures systematic implementation of the AI system while maintaining consistency with the existing codebase architecture.
