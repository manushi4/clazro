 Here is the **next core brick**, written clearly, deeply, and ready for real production use.

---

# 📄 `docs/DATA_SYNC_CONSISTENCY_SPEC.md`

### Data Sync, Consistency Guarantees & Freshness Rules for Mansuhi

```md
# 🔁 DATA_SYNC_CONSISTENCY_SPEC.md
### Data Sync, Freshness Guarantees, and Consistency Model for Mansuhi

This document defines **how data moves between device ↔ Supabase**,  
what consistency guarantees we aim for,  
and how offline caching, React Query, and synchronization work together.

It is essential for:

- A stable student/teacher experience  
- Efficient low-network operation  
- Predictable UI under offline, retry, and stale-state conditions  
- Avoiding double actions (e.g., assignment submit twice)  
- Multi-device correctness  

---

# 1. 🎯 Objectives

1. Ensure **fresh**, **correct**, and **stable** data across all features.  
2. Avoid UI errors caused by stale or missing data.  
3. Enable **smooth offline usage** with caching.  
4. Avoid unnecessary backend load.  
5. Provide predictable data freshness rules per feature.  
6. Guarantee safe merging when data changes.  
7. Allow app to scale to thousands of students across many institutions.

We do this using:

- React Query
- AsyncStorage
- NetInfo
- Supabase Realtime (optional future)
- DB-side consistency rules

---

# 2. 🧱 The Sync Architecture

```

┌──────────────────────────┐
│ Supabase Database & RPCs │
└───────────────┬──────────┘
│
Network (online/offline)
│
┌───────────────▼──────────┐
│ React Query (cache layer) │
│ + staleTime / cacheTime   │
└───────────────┬──────────┘
│
AsyncStorage (local)
│
┌───────────────▼──────────┐
│ UI / Widgets / Screens    │
└───────────────────────────┘

```

React Query = primary data engine  
AsyncStorage = fallback/offline cache  
NetInfo = network awareness  
Supabase = auth, queries, mutations  

---

# 3. 🔗 Consistency Levels

Each feature in the app has one of 3 consistency levels:

---

## 3.1 Level 1 — Strong-ish Consistency  
Needs **fresh** data within seconds-minutes.

Used for:
- Tests (attempts, scores)
- Progress analytics
- Live class details
- AI tutor session metadata
- Teacher dashboards

Settings:

```

staleTime: 10–60 seconds
refetchOnWindowFocus: true
refetchOnReconnect: true
retry: 2

```

UI behaviour:
- Show loader on revisit  
- Always attempt a fetch if online  
- If offline → show stale data + “offline” badge

---

## 3.2 Level 2 — Eventual Consistency  
Fresh within minutes/hours.

Used for:
- Dashboard stats (counts, summaries)
- Assignments list
- Study library metadata
- Doubts list
- Class feed items
- Notes metadata
- Content metadata (chapters, resources)

Settings:

```

staleTime: 5–30 minutes
refetchOnWindowFocus: false
refetchOnReconnect: true
retry: 1

```

UI behaviour:
- Show cached data instantly  
- Update silently in background  
- If offline → cached data + small “offline” banner  

---

## 3.3 Level 3 — Local-First Consistency  
Data is owned locally first.

Used for:
- Notes (content)
- Downloads
- Saved media

Settings:

```

network fetch: optional
local storage: primary
background sync: optional

````

UI behaviour:
- Always load from local  
- Sync when online  
- Conflict resolution rules apply  

---

# 4. 🗃 React Query Standards

Every data hook must follow common patterns:

```ts
const { data, error, isFetching, isStale } = useQuery(..., {
  staleTime: X,
  cacheTime: 1000 * 60 * 60 * 24,  // 24h
  retry: network.isOnline ? 1 : 0,
  enabled: network.isOnline || hasCachedData,
});
````

Key rules:

### Rule 1: **Never fetch when offline** unless stale data exists.

### Rule 2: **Always read from cache first**.

### Rule 3: **Loading indicators appear only when necessary**.

### Rule 4: **Retry behaviour must be controlled** to avoid loops.

---

# 5. 🔄 Background Sync Rules

A background sync is triggered when:

1. App comes into the foreground
2. Network becomes online
3. User manually refreshes a screen
4. Config changes detected in `config_change_events`

Background sync updates:

* Dashboard widgets
* Study library metadata
* Doubts inbox
* Assignments list
* Progress snapshots

Background sync **does not**:

* Overwrite local user-owned data (notes)
* Re-trigger expensive operations (unless needed)

---

# 6. 🔁 Conflict Resolution

### 6.1 Single-User-owned Data

E.g. notes, highlights, saved PDF markers

Rule: **Last-writer-wins**

Behavior:

* Local changes cached immediately
* Server update sent when online
* If conflict detected:

  * Server version wins (for now)
  * Future: mergeable deltas

### 6.2 Multi-Owner Data

E.g.:

* Doubts (students + teachers)
* Assignments (teacher sets, student submits)
* Progress analytics

Behavior:

* Use server timestamp as truth
* Client only submits intent, not state
* No overwriting complex structures client-side

---

# 7. 🔐 Preventing Double Submissions

Many mobile apps accidentally double-submit actions.
To prevent this:

On any mutation (create doubt, submit assignment, start test):

### Rule:

**Lock the mutation until it finishes.**

Implement:

```ts
const mutation = useMutation(..., {
  onMutate: () => setIsSubmitting(true),
  onSettled: () => setIsSubmitting(false)
});
```

Button becomes disabled:

```tsx
<AppButton disabled={isSubmitting}>
  Submit
</AppButton>
```

Guarding against:

* double taps
* accidental offline queueing
* retry storms

---

# 8. 🌐 Sync Behavior Under Offline Mode

When offline:

### UI must:

* Show cached data
* Show offline badge/banner
* Prevent actions requiring internet
* Provide “retry” when connection restored
* Not break layout or throw

### Queries must:

* Use cached data
* Not retry
* Not throw errors
* Not refetch

### Mutations must:

* Fail immediately:

  ```
  “You're offline. Please reconnect.”
  ```
* Never enter retry loops

Matches **OFFLINE_SUPPORT_SPEC.md**.

---

# 9. 🧪 Data Freshness UI Standards

Widgets/screens must visually indicate data state:

### Fresh:

* Normal state

### Stale:

* Subtle grey text: “Last updated X minutes ago”

### Offline:

* “Offline — showing cached data”

### Error fetching:

* Fallback block with “Retry”

---

# 10. ⚙️ Per-Feature Sync Behavior Table

| Feature               | Consistency | Source                | Notes                           |
| --------------------- | ----------- | --------------------- | ------------------------------- |
| Dashboard widgets     | Eventual    | Query + cache         | Safe-mode fallback              |
| Today schedule        | Strong-ish  | Query                 | Needs fresh                     |
| Study library         | Eventual    | Query + cache         | Prefetch on background sync     |
| Resource viewer       | Strong-ish  | Query                 | Resource metadata cached        |
| Assignments           | Eventual    | Query + cache         | Submission = strong             |
| Assignment submission | Strong-ish  | Mutation              | Disable offline                 |
| Tests list            | Eventual    | Query                 | Attempt = strong                |
| Test attempts         | Strong-ish  | Mutation              | No offline support              |
| Doubts list           | Eventual    | Query + cache         | Inbox should degrade gracefully |
| Doubt creation        | Strong-ish  | Mutation              | No offline support              |
| Progress & analytics  | Strong-ish  | RPC                   | Expensive: limit refresh        |
| Profile               | Eventual    | Query                 | Minimal data                    |
| Downloads             | Local-first | Local                 | Server sync optional            |
| Notes                 | Local-first | Local + optional sync | Full offline support            |

---

# 11. 🔬 Observability & Monitoring

Important metrics:

* Query success rate
* Mutation failure rate
* Offline actions attempted
* Fresh/Stale/Offline ratio per widget
* Config update frequency

Errors logged:

* data_fetch_failed
* data_stale_too_long
* mutation_failed
* offline_action_blocked
* sync_conflict

Enable features like:

* Sentry performance tracing
* Supabase telemetry pipeline for data sync

---

# 12. 🏁 Summary

The Mansuhi data sync system guarantees:

* Safe, predictable data behavior
* Strong consistency where needed
* Eventual consistency where efficient
* Local-first for critical offline features
* No crashes when offline
* No double submissions
* Easy debugging
* Future scalability

This spec ensures that as app grows, **data remains reliable**, even across many customers, configurations, and real-world network conditions.

```
End of DATA_SYNC_CONSISTENCY_SPEC.md
```

---
