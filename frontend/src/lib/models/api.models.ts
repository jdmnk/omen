// Re-export generated API types
export * from "./api.models.generated";

// Re-export frontend-only models
export * from "./frontend.models";

// Convenience aliases for backward compatibility
export type {
  Market,
  Event,
  Trade,
  MarketSearchResponse as MarketResponse,
} from "./api.models.generated";
