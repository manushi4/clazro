# Repository Guidelines

## Project Structure & Module Organization
- Entry points live in `index.js` / `index.android.js`, with the app bootstrapped from `App.tsx`.
- Core code sits in `src/`: `screens/` (UI flows), `features/` (domain logic), `components/` and `ui/` (shared building blocks), `navigation/`, `stores/` (Zustand), `services/` (API/Supabase/Stream), `config/`, `theme/`, `i18n/`, `utils/`, `analytics/`, `offline/`, and `validation/`.
- Platform assets and Gradle files are under `android/`; automation lives in `scripts/`; product docs and captures are in `Doc/` and `screenshot/`.
- Environment scaffolding is in `.env.example`; backend helpers live in `supabase/`.

## Build, Test, and Development Commands
- `npm start` to launch Metro; `npm run start:reset` to clear the cache.
- `npm run android:dev` (or `android:fast`) installs a dev build on an emulator/device; `npm run android:prod` targets the prod flavor; `npm run android:build` assembles the debug APK; `npm run android:clean*` clears Gradle outputs and caches.
- `npm run lint` / `npm run lint:fix` for ESLint; `npm run typecheck` for TypeScript; `npm run validate` runs both.
- `npm test` executes Jest suites. Run commands from the repo root with Node >=18.

## Coding Style & Naming Conventions
- TypeScript + React Native with `@react-native/eslint-config` and Prettier 2.8 defaults (2-space indent, semicolons, single quotes).
- Components and screens use PascalCase filenames/exports (e.g., `ProfileScreen.tsx`); hooks, stores, and utilities use camelCase (e.g., `useAuthStore.ts`).
- Co-locate feature code in `src/features/<feature>` and reuse primitives from `components/` or `ui/`; avoid sprawling “misc” modules.
- Prefer functional components with hooks and centralized styling in `theme/`; keep side effects in services or dedicated hooks.

## Testing Guidelines
- Jest powers unit/snapshot tests. Place specs as `<name>.test.ts[x]` or in `__tests__/` beside the code.
- Mock React Native modules and external clients (Supabase, Stream, Notifee) to keep tests deterministic.
- Cover state reducers/stores, validation, and navigation guards for new features; add regression tests with each bug fix.
- Run `npm test` and `npm run validate` before submitting; note any flaky cases in the PR.

## Commit & Pull Request Guidelines
- History shows mixed WIP commits and conventional messages (`feat(scope): summary`); prefer the conventional form and avoid `WIP` once pushed.
- Keep commits focused and imperative; one logical change per commit.
- PRs should include a clear summary, linked issue/ticket, test results, and screenshots or recordings for UI changes; flag perf/offline impacts when relevant.
- Document new env vars (e.g., Supabase keys) and update `.env.example` when introducing them.

## Security & Configuration Tips
- Copy `.env.example` to your local env file and fill `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, and `EXPO_PUBLIC_DEMO_CUSTOMER_ID`; never commit secrets.
- Run Android builds from trusted machines only; use `npm run android:clean-cache` if artifacts might include sensitive data.
- Avoid logging credentials or PII; scrub debug logs before release builds and prefer vetted storage (`supabase/`, async-storage) over ad-hoc files.
