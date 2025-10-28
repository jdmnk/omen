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

export type Market = {
  question: string;
  description: string;
  icon: string;
  token1: string;
  token2: string;
  outcomes: string; // comma separated list of outcomes
  outcomePrices: string; // comma separated list of outcome prices
  liquidity: number;
  volume: number;
  volume24hr: number;
  volume1wk: number;
  volume1mo: number;
  volume1yr: number;
  negRisk: boolean;
  bestBid: number;
  bestAsk: number;
};

export type MarketResponse = {
  market: Market;
};
