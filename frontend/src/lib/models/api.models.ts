import {
  TopHolder,
  TopHolderPnl,
  TopHolderWalletInfo,
} from "./api.models.generated";

// custom composite type
export type TopHolderAnalysis = TopHolder & TopHolderPnl & TopHolderWalletInfo;

// Re-export generated API types
export * from "./api.models.generated";

// Re-export frontend-only models
export * from "./frontend.models";
