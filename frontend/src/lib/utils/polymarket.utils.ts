import { POLYMARKET_URL } from "@/lib/api.const";

export function getPolymarketEventUrl(slug?: string | null) {
  if (!slug) {
    return `${POLYMARKET_URL}/event`;
  }
  return `${POLYMARKET_URL}/event/${slug}`;
}

