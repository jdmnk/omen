import { POLYMARKET_CLOB_URL } from "@/lib/api";

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

export async function fetchOrderbook(
  tokenId: string
): Promise<OrderBookResponse> {
  const url = new URL(`${POLYMARKET_CLOB_URL}/book`);
  url.searchParams.set("token_id", tokenId);

  const response = await fetch(url.toString(), { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Failed to fetch orderbook: ${response.statusText}`);
  }

  return response.json();
}
