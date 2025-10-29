import { getBaseUrl } from "@/lib/api";
import { UserTradesGroup } from "@/lib/models/api.models";

export async function fetchMarketTradesAnalytics(
  conditionId: string
): Promise<UserTradesGroup[]> {
  const base = getBaseUrl();
  const res = await fetch(
    `${base}/markets/trades/analytics?condition_id=${encodeURIComponent(
      conditionId
    )}`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch trades analytics");
  }

  return res.json();
}
