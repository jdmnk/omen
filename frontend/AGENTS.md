# Repository Guidelines

## Project Structure & Module Organization
This is a Next.js 15 App Router project. Page shells and route handlers live in `src/app`, shared UI and widgets live in `src/components`, and state/utilities sit in `src/lib`. Fonts are grouped in `src/font`, while static assets (icons, Open Graph images) live under `public`. Scripts for syncing backend contracts are in `scripts/`, notably `scripts/generate-types-from-openapi.js`. Treat feature work as vertical slices: co-locate helper hooks, queries, and styles next to the feature rather than creating broad shared modules.

## Build, Test, and Development Commands
- `pnpm dev`: Run the development server with Turbopack at `http://localhost:3000`.
- `pnpm build`: Production bundle; fails fast when a route, metadata tag, or env var is misconfigured.
- `pnpm start`: Serve the optimized build (works only after a successful build).
- `pnpm lint`: ESLint + Next rules; run before every push to catch accessibility and import issues.
- `pnpm type-check`: Strict TypeScript compile without emitting files; required for CI parity.
- `pnpm type-gen`: From the repo root, refresh TypeScript models from the backend via Poetry.

## Coding Style & Naming Conventions
Use TypeScript in strict mode, functional React components, and hooks for state. Indent with two spaces and favor early returns over deeply nested conditionals. Components are PascalCase (`TerminalLayout.tsx`), route segments are folder-based (`src/app/(marketing)/pricing`). Reference shared code through the `@/*` alias defined in `tsconfig.json`. Tailwind classes should be deterministic—group layout → spacing → color, and use `tailwind-merge` to de-dupe. Keep files under ~200 lines; split complex widgets into `Feature`, `FeatureContent`, etc.

## Testing Guidelines
Automated coverage is still light, so treat `pnpm lint` and `pnpm type-check` as mandatory gates alongside manual verification in `pnpm dev`. When adding tests, rely on React Testing Library + Vitest (preferred stack) and co-locate specs as `<Component>.test.tsx` next to the source. Aim to cover each component's primary interaction state plus at least one failure path. Document any missing tests in the PR checklist and include reproduction steps or recordings whenever you cannot automate a scenario yet.

## Commit & Pull Request Guidelines
Follow the existing Git history style: short, imperative, single-line subjects such as `add new cmds to readme`. Group related changes per commit. Every pull request needs: a concise summary, screenshots or clips for UI updates, explicit mention of scripts run (`pnpm lint`, `pnpm type-check`, etc.), and links to the related Linear/Jira ticket. Rebase over merge commits, ensure zero `pnpm lint` warnings, and request review before force-pushing.

## Security & Configuration Tips
Secrets belong in `.env.local`; only expose client-safe values prefixed with `NEXT_PUBLIC_`. Whenever you touch models shared with the backend, regenerate types (`pnpm type-gen`) to keep Zod schemas in sync. Avoid committing generated assets or large Open Graph exports—store them in the product design repo and import optimized versions into `public/`.
