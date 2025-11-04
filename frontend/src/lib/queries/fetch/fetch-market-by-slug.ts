import { getBaseUrl } from "@/lib/api";
import { MarketResponse } from "@/lib/models/api.models";

export async function fetchMarketBySlug(slug: string): Promise<MarketResponse> {
  const response = await fetch(
    `${getBaseUrl()}/markets/search-slug?slug=${slug}`,
    { cache: "no-store" }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch market: ${response.statusText}`);
  }

  const data = (await response.json()) as MarketResponse;
  return data;
}

