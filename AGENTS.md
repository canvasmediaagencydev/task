# Repository Guidelines

## Project Structure & Module Organization
The Next.js App Router lives in `app/`, with feature routes colocated beside their server actions in `app/actions` to keep data mutations discoverable. Shared UI such as Kanban boards, dialogs, and primitives belongs in `components/` (use existing building blocks before adding new Tailwind-heavy layouts). Cross-route logic—Supabase clients, auth helpers, shared types—resides in `lib/`. Place Vitest specs near their targets (e.g., `components/__tests__/kanban-column.test.tsx`) and keep public assets under `public/`. Repo-level configs (`next.config.ts`, `tailwind.config.ts`, ESLint, tsconfig path aliases) stay at the root.

## Build, Test, and Development Commands
- `npm run dev`: boot the Next 16 dev server with hot reload on http://localhost:3000.
- `npm run build`: produce the production bundle; run before proposing changes to confirm types and route wiring.
- `npm run start`: serve the latest build for smoke-testing prod parity.
- `npm run lint`: execute the Next.js + Core Web Vitals ESLint config; resolve warnings before committing.
- `npx vitest run`: run the fast unit/UI suite; use `npx vitest watch` when iterating.

## Coding Style & Naming Conventions
Write modern TypeScript/React 19 function components with 2-space indentation and Tailwind utility-first styling. Keep files kebab-case (`task-dialog.tsx`) and co-locate feature-specific modules. Use the `@/` alias for shared imports, avoid `any`, and keep Server Components free of browser-only APIs. Run the formatter/lint rule set via `npm run lint` whenever code structure changes.

## Testing Guidelines
Specs should use Vitest + React Testing Library, named `*.test.tsx`, and cover drag-and-drop flows, Supabase mutations, and conditional UI. Mock Supabase clients via helpers in `lib/` rather than inline stubs, and document fixtures. Aim for ≥80% coverage on new modules and ensure `npx vitest run` passes before opening a PR.

## Commit & Pull Request Guidelines
Commits typically follow imperative phrasing (`Add calendar drag handles`); Conventional Commits are fine if they clarify scope. Every PR should include a summary paragraph, before/after screenshots or screen recordings for UI work, a checklist of commands run (`npm run lint`, `npm run build`, `npx vitest run`), and links to related issues. Rebase on `main`, wait for CI, and highlight any migrations or security-impacting changes for extra review.

## Security & Configuration Tips
Store secrets in `.env.local` and never commit Supabase keys; the app expects `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Middleware and the `AuthProvider` rely on authenticated cookies, so validate auth flows locally before merging. Redact Supabase project IDs or user-identifying data in shared logs.
