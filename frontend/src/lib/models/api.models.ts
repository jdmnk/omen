// Re-export all generated types
export * from "./api.models.generated";

// Re-export frontend-only types
export * from "./frontend.models";

// Additional convenience types
export type MarketEvent = {
  id: string;
  slug: string;
  title: string;
  [key: string]: any;
};
