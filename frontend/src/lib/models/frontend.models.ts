// Frontend-only types that are not shared with the backend
// These types are specific to frontend logic and UI components

export type Interval = "1m" | "1w" | "1d" | "6h" | "1h" | "max";

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

// UserPosition is a frontend-specific Position model, different from backend Position (graph model)
export type OpenPosition = {
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

export type ClosedPosition = {
  proxyWallet: string;
  asset: string;
  conditionId: string;
  avgPrice: number;
  totalBought: number;
  realizedPnl: number;
  curPrice: number;
  timestamp: number;
  title: string;
  slug: string;
  icon: string;
  eventSlug: string;
  outcome: string;
  outcomeIndex: number;
  oppositeOutcome: string;
  oppositeAsset: string;
  endDate: string;
};

export type Position = OpenPosition | ClosedPosition;

export type UserTraded = {
  user: string;
  traded: number;
};

export type UserValue = {
  user: string;
  value: number;
};

export type Activity = {
  type: string;
  timestamp: number;
  conditionId?: string;
  asset?: string;
  side?: string;
  size?: number;
  price?: number;
  usdcSize?: number;
  outcome?: string;
  outcomeIndex?: number;
  title?: string;
  slug?: string;
  eventSlug?: string;
  transactionHash?: string;
};

// extends Activity but with additional data for e.g. charts and share card
export type ProcessedActivity = Activity & {
  cumExposure?: number; // total cumulative exposure
  countActivities?: number; // if we have grouped trades, this is the number of trades
};
