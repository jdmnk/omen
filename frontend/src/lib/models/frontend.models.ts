// Frontend-only types that are not shared with the backend
// These types are specific to frontend logic and UI components

export type Interval = "1m" | "1w" | "1d" | "6h" | "1h" | "max";

export type Position = {
  id: string;
  amount: number;
  avgPrice: number;
  tokenId: string;
  totalBought: number;
  realizedPnl: number;
  user: string;
};

export type OrderBookLevel = {
  price: string;
  size: string;
};

export type OrderBookResponse = {
  market: string;
  asset_id: string;
  timestamp: string;
  hash: string;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  min_order_size: string;
  tick_size: string;
  neg_risk: boolean;
};

export type OrderBookViewModel = {
  sortedBids: OrderBookLevel[];
  sortedAsks: OrderBookLevel[];
  bestBid: number;
  bestAsk: number;
  spread: number;
  midpointPrice: number;
};

export type OrderBookQueryResult = OrderBookResponse & OrderBookViewModel;

export type UserConditionStats = {
  conditionId: string;
  slug?: string | null;
  title?: string | null;
  icon?: string | null;
  volume: number;
  notional: number;
  netHoldingsByOutcome: Record<string, number>;
  totalHoldings: number;
};

export type UserHoldingsSummary = {
  proxyWallet: string;
  name?: string | null;
  pseudonym?: string | null;
  profileImage?: string | null;
  totalVolume: number;
  totalNotional: number;
  totalHoldings: number;
  markets: UserConditionStats[];
};
