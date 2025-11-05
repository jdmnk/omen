import { getBaseUrl } from "@/lib/api";
import { TopHolder } from "@/lib/models/api.models";

export async function fetchTopHoldersWithWalletInfo(
  conditionId: string
): Promise<TopHolder[]> {
  const base = getBaseUrl();
  const url = new URL(`${base}/markets/top-holders/with-wallet-info`);
  url.searchParams.set("condition_id", conditionId);

  const res = await fetch(url.toString(), { cache: "no-store" });

  if (!res.ok) {
    throw new Error("Failed to fetch top holders with wallet info");
  }

  return res.json();
}
