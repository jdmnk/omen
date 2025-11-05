import { getBaseUrl } from "@/lib/api";
import { TopHolder } from "@/lib/models/api.models";

export async function fetchTopHoldersWithWalletInfo(
  conditionId: string,
  minBalance: number = 1,
  limit: number = 500
): Promise<TopHolder[]> {
  const base = getBaseUrl();
  const url = new URL(`${base}/markets/top-holders/with-wallet-info`);
  url.searchParams.set("condition_id", conditionId);
  url.searchParams.set("min_balance", minBalance.toString());
  url.searchParams.set("limit", limit.toString());

  const res = await fetch(url.toString(), { cache: "no-store" });

  if (!res.ok) {
    throw new Error("Failed to fetch top holders with wallet info");
  }

  return res.json();
}

