Here is your **complete production-grade offline specification**, ready to place into:

```
docs/OFFLINE_SUPPORT_SPEC.md
```

---

```md
# 📴 OFFLINE_SUPPORT_SPEC.md  
### Offline-First Architecture for Mansuhi Multi-Tenant, Config-Driven App

This document defines the **offline architecture**, **rules**, and **implementation strategy** for all features of the Mansuhi platform.

It ensures the app continues to work when:

- The network is slow
- The network is unstable
- The device is fully offline
- Supabase is temporarily unavailable

It also defines **caching**, **queueing**, **local storage**, and **fallback rules** for all dynamic UI.

---

# 1. 🎯 Goals

### Core goals
- App must never crash when offline.
- UI must load using **cached config + cached queries**.
- Dashboard + navigation should show **last known good state**.
- Mutations (actions) should fail gracefully with a clear message.
- Screens that require the internet should degrade gracefully.
- User must be able to continue core study flows offline:
  - Notes  
  - Saved resources  
  - Downloaded PDFs/videos  
  - Cached dashboard data  
- Minimal friction between online/offline transitions.

### Non-goals for MVP (future possible):
- Full offline queue for all actions
- Offline collaborative features
- Local-only doubts creation, resolved later
- Full bidirectional sync

We start with a **baseline offline system** and grow per feature as needed.

---

# 2. 📦 Libraries Used

Already available in your project:

### Required
- `@react-native-async-storage/async-storage`
- `@react-native-community/netinfo`
- `@tanstack/react-query`

### Optional future enhancements
- `expo-file-system`  
- SQLite (via `expo-sqlite` or WatermelonDB)  
- Redux Offline

Your architecture will use React Query + AsyncStorage for caching.

---

# 3. 🧱 Offline System Architecture Overview

```

┌───────────────────────────┐
│  NetInfo (isOnline flag)  │
└───────────────┬───────────┘
│
provides connectivity state
│
┌───────────────▼────────────────┐
│      React Query Cache          │
│ (data persists across offline)  │
└───────────────┬────────────────┘
│
cached data if offline
│
┌───────────────▼────────────────┐
│      Config Store (Zustand)     │
│ (uses SAFE_MODE_CONFIG when     │
│  remote fetch fails)            │
└────────────────────────────────┘

```

Combined result:
- **Config loads even without internet**
- **Screens load previously fetched data**
- **Widgets show cached content**
- **Mutations warn the user instead of failing silently**

---

# 4. 🌐 Network Detection (NetInfo)

Create a small store:

```

src/offline/networkStore.ts

````

With:

```ts
type NetworkState = {
  isOnline: boolean;
  lastChangedAt: number;
};
````

Expose:

* `useNetworkStatus()` → `isOnline`
* `NetworkProvider` → wraps the app

This allows:

* queries to skip fetching when offline
* UI badges or banners (“Offline Mode”)

---

# 5. 🗃 Caching Strategy

### 5.1 Config caching (very important)

Your config system already has SAFE_MODE_CONFIG.

Add:

* Cache **last successful CustomerConfig** in AsyncStorage:

  * `cached_customer_config_<customerId>`
* On launch:

  1. Try load from Supabase
  2. If fails → load cached
  3. If both fail → use SAFE_MODE_CONFIG

This ensures:

* Navigation tabs still show
* Dashboard still loads
* Theme still displays
  Even when offline.

---

### 5.2 React Query caching

Every data hook (study, doubts, schedule, etc.) should include:

```ts
const { isOnline } = useNetworkStatus();

useQuery(["...", params], fetchFn, {
  enabled: isOnline || hasCachedData,
  staleTime: 1000 * 60 * 60,   // 1 hour for offline-friendly behavior
  retry: isOnline ? 2 : 0,     // no retries offline
});
```

This guarantees:

* When offline → show cached data
* When online → refresh data
* No infinite retry loops

---

### 5.3 Local cache expiration

Cache expiration rules:

* Config → no expiration (until replaced)
* Dashboard → 1–6 hours allowable stale
* Study library → up to 24 hours
* Notes → local forever
* Downloads → local forever

---

# 6. 🧩 Offline Degradation Rules (what works/what doesn’t)

### 6.1 Screens that must always work offline

* Dashboard (cached layout + cached widget data)
* Notes & Highlights
* Saved/Downloaded PDF viewer
* Student Profile (except network-only parts)
* Settings
* Study Library (metadata cached)

### 6.2 Screens that may partially work offline

* Assignments:

  * List loads from cache
  * Submission may fail with offline warning
* Tests:

  * List loads from cache
  * Test attempts not allowed offline
* Doubts:

  * List loads from cache
  * Creating new doubt not allowed offline

### 6.3 Screens that do NOT work offline

* Live classes
* Real-time group rooms
* AI Tutor chat
* Progress analytics (requires real-time data)

But they must show **offline friendly UI**:

```
"You are offline. This feature requires an internet connection."
[Retry]
```

---

# 7. 💾 Persistent Storage (AsyncStorage)

Use AsyncStorage for:

* last-known `customer_config`
* cached translations (from i18n spec)
* cached study metadata
* cached dashboard widget data
* user-selected language
* offline flags (debugging)

Not for:

* Large PDF/video files → use `expo-file-system`

---

# 8. 📥 Download Manager (Files/PDF/Video)

### Required behavior:

* Store files in `FileSystem.documentDirectory`
* Track entries in a table:

```
downloads/
  <fileId>.pdf
  <fileId>.mp4
```

### Metadata stored in AsyncStorage or Supabase:

* fileId
* fileName
* fileSize
* type: pdf/video
* localPath
* lastUpdated

### File availability:

| Status                     | Shown when                        |
| -------------------------- | --------------------------------- |
| Downloaded                 | Always                            |
| Online but not downloaded  | Download button                   |
| Offline and not downloaded | Greyed-out, “Connect to download” |

---

# 9. 📤 Mutation Strategy (offline actions)

### MVP (Phase 8–9):

* No queueing
* If offline → show toast:

  ```
  "You're offline. Please reconnect to perform this action."
  ```

### Future (Phase 11+ optional):

* Action queue:

  * store pending actions
  * replay them when online
  * mark resolved or failed
* Good for:

  * createDoubt
  * submitAssignment
  * updateNotes

A queue module would live in:

```
src/offline/queue/
```

---

# 10. 🔁 Online/Offline Transitions

### When going offline:

* Show small banner: “You’re offline”
* Prevent navigation to network-only screens
* Disable online-only widgets
* Cache current dashboard state

### When coming back online:

* Remove banner
* Trigger background fetch for:

  * updated config
  * updated dashboard data
  * updated library index
* Attempt retries on failed network requests (React Query will handle)

---

# 11. 🧪 Testing Offline Support

### 11.1 Unit tests

* NetworkStore behavior
* Config fallback logic
* Cached config load
* i18n offline-fallback

### 11.2 Integration tests

* Dashboard renders with cached widgets
* Navigation tabs from cached config
* Study library metadata offline

### 11.3 E2E tests

* Turn device offline → open app → dashboard loads from cache
* Submit a mutation offline → error toast
* Try to open Live Class → shows offline-block screen

### 11.4 Load/chaos tests

* Disable Supabase → SAFE_MODE_CONFIG applied
* Remove network → no crash

---

# 12. 🧭 Offline-Friendly UI Guidelines

### Always show:

* Cached content clearly labeled (e.g. small grey text “Cached data”)
* Disabled buttons for online-only actions

### Always avoid:

* Infinite spinners
* Error screens without recovery

### Widgets should use:

* cached data
* skeleton if no cache and offline
* usual UI if online

---

# 13. 🧱 Local Caching Responsibilities Per Feature

| Feature       | What to cache                    | What to disable offline |
| ------------- | -------------------------------- | ----------------------- |
| Dashboard     | widget data                      | AI recommendations      |
| Doubts        | recent doubts list               | creating doubt          |
| Study Library | course/chapter/resource metadata | fetching new content    |
| Notes         | everything                       | —                       |
| Tests         | test list                        | attempting test         |
| Assignments   | list                             | submission              |
| Profile       | basic info                       | editing profile         |
| Progress      | cached charts                    | fresh analysis          |
| Peer Network  | —                                | entire feature          |

---

# 14. 🧩 Config-Driven Offline Behavior

Offline states are controlled by:

* Widget metadata (e.g., `requiresOnline: true`)
* Navigation metadata (e.g., `onlineOnly: true`)
* Feature metadata (feature requires internet)
* Global flags (SAFE_MODE)

Widgets/screens should check:

```ts
if (!isOnline && metadata.requiresOnline) {
  return <OfflineBlockedView />;
}
```

---

# 15. 🏁 Summary

This offline architecture ensures:

* **Zero crashes** when offline
* **Dashboard + navigation always load** (cached config)
* **Widgets gracefully degrade**
* **Screens behave predictably**
* **Mutations fail cleanly**
* **Downloads work offline**
* **Language persists without Internet**
* **Future offline queueing is possible**

The app now supports a **real offline-first baseline**, allowing you to expand feature-by-feature.
