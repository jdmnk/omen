# Frontend

Next.js app for Omen. It contains the market analytics interface, user profiles, watchlists, charts, order books, and share-card UI.

## Local Development

```bash
cp .env.example .env
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

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
