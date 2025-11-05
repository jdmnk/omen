import { getBaseUrl } from "@/lib/api";
import { TopHolder } from "@/lib/models/api.models";

export async function fetchTopHoldersWithWalletInfo(
  conditionId: string,
  token1: string,
  token2: string
): Promise<TopHolder[]> {
  const base = getBaseUrl();
  const url = new URL(`${base}/markets/top-holders/with-wallet-info`);
  url.searchParams.set("condition_id", conditionId);
  url.searchParams.set("token1", token1);
  url.searchParams.set("token2", token2);

  const res = await fetch(url.toString(), { cache: "no-store" });

  if (!res.ok) {
    throw new Error("Failed to fetch top holders with wallet info");
  }

  return res.json();
}
