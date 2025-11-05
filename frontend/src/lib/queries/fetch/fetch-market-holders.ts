import { DATA_API_HOST } from "@/lib/api";
import { MarketHoldersResponse } from "@/lib/models/api.models";

// Always returns only top 20 by outcome for some reason
export async function fetchMarketHolders(
  conditionId: string,
  limit: number = 100,
  minBalance: number = 1
): Promise<MarketHoldersResponse> {
  const url = new URL(`${DATA_API_HOST}/holders`);
  url.searchParams.set("market", conditionId);
  url.searchParams.set("limit", limit.toString());
  url.searchParams.set("minBalance", minBalance.toString());

  const response = await fetch(url.toString(), { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Failed to fetch holders: ${response.statusText}`);
  }

  return response.json();
}
