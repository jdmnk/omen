import { DATA_API_HOST } from "@/lib/api";

export async function fetchMarketRecentTrades(
  conditionId: string,
  minAmount?: number
) {
  const url = new URL(`${DATA_API_HOST}/trades`);
  url.searchParams.set("market", conditionId);
  url.searchParams.set("limit", "50"); // max 10000!
  url.searchParams.set("offset", "0");
  url.searchParams.set("filterType", "CASH");
  url.searchParams.set("filterAmount", (minAmount || 10).toString());
  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`Failed to fetch trades: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}
