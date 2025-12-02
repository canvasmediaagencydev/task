# Repository Guidelines

## Project Structure & Module Organization
- `app/` hosts the App Router entry points (dashboard, auth flows) plus server actions under `app/actions`, so colocate data mutations with the routes that call them.
- `components/` contains reusable UI (Kanban, charts, dialogs) and the `components/ui/` primitives; prefer composing from these before adding new Tailwind-heavy files.
- `lib/` stores shared logic (Supabase clients, auth context, formatting helpers) and is the right place for any cross-route TypeScript types.
- Assets live in `public/`, while configuration (Next, Tailwind, ESLint, tsconfig path aliases like `@/*`) sits at the repo root.

## Build, Test, and Development Commands
- `npm run dev` — launches the Next 16 dev server with hot reload at http://localhost:3000.
- `npm run build` — generates the production bundle; run before opening a PR to verify type safety and route integrity.
- `npm run start` — serves the last build; use for smoke-testing production settings.
- `npm run lint` — executes ESLint with the Next.js + Core Web Vitals config; this is the current CI gate, so resolve all warnings locally.

## Coding Style & Naming Conventions
- Write modern TypeScript/React 19 function components; keep files in kebab-case (`task-dialog.tsx`) and group feature-specific code under matching folders.
- Follow the existing 2-space indentation, Tailwind utility-first styling, and keep Server Components free of browser-only APIs.
- Import shared modules through the `@/` alias, and let ESLint/TypeScript strict mode guide null checks rather than `any` casts.

## Testing Guidelines
- Automated tests are not yet committed, but new work should add Vitest + React Testing Library specs alongside the feature (`components/__tests__/kanban-column.test.tsx`).
- Name specs with `.test.tsx` and cover drag-and-drop interactions, Supabase mutations, and conditional rendering paths.
- Run fast suites with `npx vitest run` (or `npx vitest watch` while iterating) and document any required Supabase mocks; keep coverage above 80% for new modules.

## Commit & Pull Request Guidelines
- History currently uses plain imperative messages (e.g., `Initial commit from Create Next App`); keep that tone or adopt Conventional Commits if it clarifies scope (`feat: add tasks calendar`).
- Each PR should include: a short summary paragraph, screenshots or recordings for UI changes, a list of commands run (`npm run lint`, `npm run build`), and links to related issues.
- Rebase on main before opening the PR, ensure CI passes, and flag any migrations/security-impacting work for an extra reviewer.

## Security & Configuration Tips
- Store secrets in `.env.local` and never commit Supabase keys; the code expects `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to be defined.
- Middleware and the `AuthProvider` rely on authenticated cookies, so validate auth flows locally before merging.
- When sharing logs or stack traces, redact user-identifying data and Supabase project IDs.
