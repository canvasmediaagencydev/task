# Repository Guidelines

## Project Structure & Module Organization
The Next.js App Router lives in `app/`, and route-specific server actions are colocated in `app/actions` for discoverable mutations. Reusable UI (Kanban boards, dialogs, primitives) belongs in `components/`, while shared clients, auth helpers, and types live in `lib/`. Keep public assets under `public/`, Vitest specs beside their targets (e.g., `components/__tests__/kanban-column.test.tsx`), and repo-level configs such as `next.config.ts`, `tsconfig.json`, and Tailwind in the root. Supabase schema types ship in `database.types.ts`; import `Database`/`Json` from there when instantiating clients to avoid drifting definitions.

## Build, Test, and Development Commands
- `npm run dev`: start the Next 16 dev server with hot reload on `http://localhost:3000`.
- `npm run build`: compile the production bundle; run before proposing changes to catch type or routing issues.
- `npm run start`: serve the latest build for smoke-testing production parity.
- `npm run lint`: run the Next.js + Core Web Vitals ESLint config; resolve warnings before committing.
- `npx vitest run`: execute the unit/UI suite; prefer `npx vitest watch` while iterating.

## Coding Style & Naming Conventions
Write modern TypeScript/React 19 function components with 2-space indentation and Tailwind utility-first styling. Keep file names kebab-case (e.g., `task-dialog.tsx`), avoid `any`, and keep Server Components free of browser-only APIs. Rely on ESLint/Prettier via `npm run lint`, compose new components from existing primitives, and reference the shared Supabase types from `database.types.ts` rather than redefining shapes inline.

## Testing Guidelines
Specs use Vitest + React Testing Library, named `*.test.tsx`, and should cover drag-and-drop flows, Supabase mutations, and conditional UI. Mock Supabase clients through helpers in `lib/`, document fixtures, and target ≥80% coverage on new modules. Use `npx vitest run` before commit; `watch` mode is encouraged during development.

## Commit & Pull Request Guidelines
Use imperative commit messages (Conventional Commits optional) such as `Add kanban column badge`. For PRs, include a summary paragraph, before/after screenshots or recordings for UI changes, and a checklist of commands run (`npm run lint`, `npm run build`, `npx vitest run`). Rebase on `main`, wait for CI to pass, and highlight any migrations or security-impacting changes. Link related issues and validate Supabase auth flows locally when relevant.

## Security & Configuration Tips
Store secrets in `.env.local`; never commit Supabase keys. The app expects `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Middleware and `AuthProvider` depend on authenticated cookies, so verify login flows locally. Redact Supabase project IDs or user-identifying data from shared logs.
