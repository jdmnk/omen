# Subgraphs

Graph Protocol mappings used by Omen to index Polymarket activity.

## Structure

- `pnl-subgraph/` indexes events used to calculate position PnL and average prices.
- `common/` contains shared constants and AssemblyScript utilities.
- `abis/` contains contract ABIs used by the mappings.

## Setup

Install dependencies from this directory:

```bash
pnpm install
```

Generate network-specific constants:

```bash
pnpm prepare
```

## Graph CLI

For hosted deployments, authenticate with The Graph:

```bash
graph auth <api-key>
```

For local development, use the Graph CLI inside the subgraph package:

```bash
cd pnl-subgraph
graph codegen
graph build
```

## Environment

Start from `.env.example` for any deploy-specific values. Do not commit Graph access tokens.
