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
  condition_id: string;
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
  endDate: string;
};

export type MarketResponse = {
  market: Market;
};

/*
{
  "proxyWallet": "0x56687bf447db6ffa42ffe2204a05edaa20f55839",
  "asset": "<string>",
  "conditionId": "0xdd22472e552920b8438158ea7238bfadfa4f736aa4cee91a6b86c39ead110917",
  "size": 123,
  "avgPrice": 123,
  "initialValue": 123,
  "currentValue": 123,
  "cashPnl": 123,
  "percentPnl": 123,
  "totalBought": 123,
  "realizedPnl": 123,
  "percentRealizedPnl": 123,
  "curPrice": 123,
  "redeemable": true,
  "mergeable": true,
  "title": "<string>",
  "slug": "<string>",
  "icon": "<string>",
  "eventSlug": "<string>",
  "outcome": "<string>",
  "outcomeIndex": 123,
  "oppositeOutcome": "<string>",
  "oppositeAsset": "<string>",
  "endDate": "<string>",
  "negativeRisk": true
  }
*/

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
  title: string;
  slug: string;
  icon: string;
  eventSlug: string;
  outcome: string;
  outcomeIndex: number;
  oppositeOutcome: string;
  oppositeAsset: string;
  endDate: string;
  negativeRisk: boolean;
};

/*
https://docs.polymarket.com/api-reference/core/get-trades-for-a-user-or-markets

trade:
{
  "proxyWallet": "0x56687bf447db6ffa42ffe2204a05edaa20f55839",
  "side": "BUY",
  "asset": "<string>",
  "conditionId": "0xdd22472e552920b8438158ea7238bfadfa4f736aa4cee91a6b86c39ead110917",
  "size": 123,
  "price": 123,
  "timestamp": 123,
  "title": "<string>",
  "slug": "<string>",
  "icon": "<string>",
  "eventSlug": "<string>",
  "outcome": "<string>",
  "outcomeIndex": 123,
  "name": "<string>",
  "pseudonym": "<string>",
  "bio": "<string>",
  "profileImage": "<string>",
  "profileImageOptimized": "<string>",
  "transactionHash": "<string>"
}
*/

export type Trade = {
  proxyWallet: string;
  side: string;
  asset: string;
  conditionId: string;
  size: number;
  price: number;
  timestamp: number;
  title: string;
  slug: string;
  icon: string;
  eventSlug: string;
  outcome: string;
  outcomeIndex: number;
  name: string;
  pseudonym: string;
  bio: string;
  profileImage: string;
  profileImageOptimized: string;
  transactionHash: string;
};

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

export type UserTradesGroup = {
  proxyWallet: string;
  name?: string | null;
  pseudonym?: string | null;
  profileImage?: string | null;
  totalVolume: number;
  totalNotional: number;
  totalUsdVolume: number;
  trades: Trade[];
};

/*
https://docs.polymarket.com/api-reference/core/get-top-holders-for-markets

Response:
[
  {
    "token": "<string>",
    "holders": [
      {
        "proxyWallet": "0x56687bf447db6ffa42ffe2204a05edaa20f55839",
        "bio": "<string>",
        "asset": "<string>",
        "pseudonym": "<string>",
        "amount": 123,
        "displayUsernamePublic": true,
        "outcomeIndex": 123,
        "name": "<string>",
        "profileImage": "<string>",
        "profileImageOptimized": "<string>"
      }
    ]
  }
]
*/

export type MarketHolder = {
  proxyWallet: string;
  bio?: string;
  asset: string;
  pseudonym?: string;
  amount: number;
  displayUsernamePublic: boolean;
  outcomeIndex: number;
  name?: string;
  profileImage?: string;
  profileImageOptimized?: string;
};

export type MarketHoldersResponse = Array<{
  token: string;
  holders: MarketHolder[];
}>;
