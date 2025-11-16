# Repository Guidelines

## Project Structure & Module Organization
This waitlist microsite is a Next.js 16 App Router app. Landing pages, API routes, and metadata live under `app/`; shared UI primitives live in `components/`, and `lib/` hosts small utilities such as waitlist submission helpers. Fonts are defined in `font/`, while hero images and favicons reside in `public/`. Because this project is intentionally lightweight, keep new sections self-contained: component, copy, and styles in the same folder, and only promote abstractions into `components/` when they are reused at least twice.

## Build, Test, and Development Commands
- `pnpm dev`: Start the dev server with HMR at `http://localhost:3000`.
- `pnpm build`: Production build; fails if env vars or metadata routes are misconfigured.
- `pnpm start`: Serve the built assets—use this before shipping to Vercel.
- `pnpm lint`: Runs ESLint + Next rules; required before opening a PR.
- `pnpm install --frozen-lockfile`: Keep lockfile updates intentional, especially because a `package-lock.json` is checked in for Vercel.

## Coding Style & Naming Conventions
Use TypeScript with strict mode and functional components. Components and files are PascalCase (`HeroSection.tsx`), hooks and helpers are camelCase, and folders stay kebab-case only when matching URL segments. Use Tailwind classes for layout, grouping them logically (layout → spacing → typography → effects) and rely on `tailwind-merge` when combining class sets. Reference workspace imports through the `@/*` alias, prefer server components for static sections, and only introduce client components when you need interactivity (forms, animations). Keep components under ~150 lines and extract copy constants into `lib/content.ts` when reused.

## Testing Guidelines
There is no automated test suite yet, so every change must be smoke-tested locally in both desktop and mobile breakpoints via browser devtools. Validate form submissions against the Google Sheets integration: run `pnpm dev`, submit the form with a test email, and confirm the entry through the linked spreadsheet (credentials stored outside the repo). When you introduce interactive logic, add React Testing Library specs under `components/__tests__/` and name files `<Component>.test.tsx`. Capture a short Loom or screenshot set for complex UI changes and attach it to the PR.

## Commit & Pull Request Guidelines
Follow the existing history style (`add new cmds to readme`). Scope each commit to one UX change or dependency update. Pull requests should include: a summary of user-visible changes, screenshots/video for UI tweaks, and the exact commands run (`pnpm lint`, `pnpm build`). Mention the relevant marketing task or campaign ID, and resist squashing unless reviewers request it—atomic commits simplify rollbacks.

## Security & Configuration Tips
Client-side env vars must be prefixed with `NEXT_PUBLIC_`; server-only secrets like Google API credentials belong in `.env.local` and should never be hardcoded. `credentials.json` is used for local testing only—store production OAuth secrets in the deployment platform. Sanitize any user-generated copy before rendering, and avoid shipping large media files into git; upload them to the marketing assets bucket and reference the CDN URL.
