# Frontend

Next.js app for Omen. It contains the market analytics interface, user profiles, watchlists, charts, order books, Top Movers, and share-card UI.

## Local Development

```bash
cp .env.example .env
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

If the port is already in use:

```bash
pnpm dev -- --port 3001
```

The frontend expects the backend API at `NEXT_PUBLIC_API_URL`.

## Main Flows

- Use the header search to find either markets or wallets.
- Use the home page Top Movers widget to jump into active markets.
- Add markets and users to local watchlists from their detail pages.
- On user pages, click a position row or checkbox to expand trade details and add that market to the selected chart area.

## Scripts

```bash
pnpm lint
pnpm type-check
pnpm build
pnpm type-gen
```

`pnpm type-gen` reads the backend OpenAPI schema and updates generated frontend API types.

## Environment

Set `NEXT_PUBLIC_API_URL` to the backend URL. For local Docker development this is usually:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

`NEXT_PUBLIC_SITE_URL` is used for absolute app URLs and local metadata generation.
