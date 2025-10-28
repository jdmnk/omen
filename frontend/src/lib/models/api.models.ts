export type Position = {
  id: string | number;
  amount: number | string;
  avgPrice: number | string;
  outcome?: string;
  side?: string;
  createdAt?: string;
};

export type Market = {
  question: string;
  description: string;
  icon: string;
  token1: string;
  token2: string;
};

export type MarketResponse = {
  market: Market;
  positions: Position[];
};
