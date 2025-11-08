// Re-export generated API types
export * from "./api.models.generated";

// Re-export frontend-only models
export * from "./frontend.models";

// Convenience aliases for backward compatibility
import type { TopHolderSchema as TopHolderGenerated } from "./api.models.generated";

export type {
  Market,
  Event,
  Trade,
  TopHolderSchema,
  MarketSearchResponse as MarketResponse,
} from "./api.models.generated";

export type TopHolder = TopHolderGenerated;

// UserPosition is a frontend-specific Position model, different from backend Position (graph model)
export type UserPosition = {
  proxyWallet: string;
  asset: string;
  conditionId: string;
  size: number;
  avgPrice: number;
  initialValue: number;
  currentValue: number;
  cashPnl: number;
  percentPnl: number;
  totalBought: number;
  realizedPnl: number;
  percentRealizedPnl: number;
  curPrice: number;
  redeemable: boolean;
  mergeable: boolean;
  title: string | null;
  slug: string | null;
  icon: string | null;
  eventSlug: string | null;
  outcome: string | null;
  outcomeIndex: number | null;
  oppositeOutcome: string | null;
  oppositeAsset: string | null;
  endDate: string | null;
  negativeRisk: boolean;
};

export type MarketHoldersResponse = {
  token: string;
  holders: TopHolder[];
};
