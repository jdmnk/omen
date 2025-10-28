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
};

export type MarketResponse = {
  market: Market;
  positions: Position[];
};
