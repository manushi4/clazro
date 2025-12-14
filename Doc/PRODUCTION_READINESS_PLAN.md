# PRODUCTION_READINESS_PLAN

## 1) Configuration & Contracts
- [x] Nav contracts: `node scripts/checkNavContractsFromDb.js` (Supabase dev) – **OK**
- [x] Widget contracts: `node scripts/checkWidgetContracts.js` – **OK**
- [ ] Add contract checks to CI (run on PR)
- [ ] Studio validation: block missing screenId/widgetId before publish (future)

## 2) Backend Wiring (Student scope)
- Assignments: Supabase-first service/hooks; list/detail/submit screens live
- Schedule: Supabase-first with view fallback
- Notes: Supabase read/write (class_notes) with fallback
- Tests: Supabase-first list/detail; fallback to view/mock
- Doubts: Supabase-first service/hooks
- AI Tutor: RPC `ask_ai_tutor` fallback to ai_conversations; **needs real AI responses**
- Study Library/Resource Viewer: Supabase detail + signed URLs; downloads retry expired URLs
- Downloads: Supabase storage signing + retry on 403; local cache
- Peer Network: Supabase view + fallback
- Badges: Supabase view + fallback
- Streaks: Supabase view + fallback; Home uses live data
- Gamification stats: Supabase view feeds Progress counts (partial)

## 3) Offline/Error/Analytics
- Offline: NetworkProvider + OfflineBanner; useOfflineQuery on core hooks; refresh announcements
- Error: AppError/useHandleError; WidgetErrorBoundary on dashboard; Screen boundaries
- Downloads: retry signed URL on 403; TODO add user-facing error toast
- Analytics: screen_view + feature_usage on key screens (Home/Study/Ask/Progress/Assignments/Schedule/Tests/Notes/Library/Viewer/Downloads/Peer/Badges/Streak)
- Sentry: wired, needs DSN for prod

## 4) Accessibility & Polish (in progress)
- HitSlop/labels added: Home, Study (subjects, quick links), Ask (filter/camera/gallery), Downloads refresh, etc.
- TODO: add hitSlop/labels to Library items, Resource Viewer buttons, Peer/Badges refresh/join buttons
- Contrast: TODO quick dark/light scan for tabs/headers/chips
- Large text/RTL: TODO quick sanity on key screens

## 5) Theming & i18n
- Init i18n at startup; en/hi strings present; new strings mostly covered (check Library/Viewer/Peer/Badges additions)
- Dark/light theme works; tab bar contrast check pending

## 6) Environment & Safety
- Env: SUPABASE_URL / SUPABASE_ANON_KEY in `.env`
- Use dev schema/project for tests; avoid main schema
- Safe-mode config available; feature flags to disable dynamic nav/dashboard if needed

## 7) Testing Plan (mobile device + CI)
### CI
- `npx tsc --noEmit`
- `node scripts/checkNavContractsFromDb.js`
- `node scripts/checkWidgetContracts.js`

### Manual Device Checklist (Android/iOS)
1) Config load & navigation
   - App loads config without crash (online)
   - Tabs/screens from config appear; nav between Home/Study/Ask/Progress/Profile works
2) Offline/online transitions
   - Turn on airplane mode after first load; screens render cached data
   - Refresh shows offline messages and does not crash
3) Theme
   - Switch device to dark mode; verify surfaces, tab bar, cards, chips have readable contrast
4) Language
   - Switch to Hindi; verify key screens (Home/Study/Ask/Progress/Assignments/Tests/Notes/Library/Viewer/Downloads) show translated labels
5) Core flows
   - Assignments: list -> detail -> submit (no crash)
   - Schedule: list loads
   - Tests: center -> attempt/review (load data)
   - Notes: add note, list updates
   - Study Library: search/filter, open resource viewer; download retry works if URL expires
   - Downloads: refresh, open/remove download
   - Ask: submit quick doubt; refresh loads doubts list
   - AI Tutor: ask question; receives response or graceful fallback
   - Peer Network: peers/groups load; refresh works; join button doesn’t crash
   - Badges: list loads; refresh works
   - Streaks: values show on Home; refresh chip works
6) Error/announcements
   - Trigger refresh; hear/accessibility announcement
   - Simulate download failure (bad URL) -> expect toast/alert (TODO to add toast)
   - AI failure shows alert

## 8) Remaining TODO to hit “production-ready”
- AI Tutor: integrate real answer backend if available (replace stub)
- A11y: finish hitSlop/labels on Library/Viewer/Peer/Badges; dark/light contrast scan; large-text/RTL sanity
- Downloads: add user-facing toast on failure
- CI: add contract checks to pipeline

## 9) Go/No-Go Criteria
- All checks in sections 1, 3, 4, 5, 7 pass
- No critical crashes in manual device checklist
- Nav/widget contract checks green
- i18n and theme verified on device (light/dark, en/hi)

## 10) Quick Start for QA on device
- Set `.env` with SUPABASE_URL/SUPABASE_ANON_KEY
- Run app: `npm start` (Metro) -> launch on device
- Walk through Manual Device Checklist above
