import { getBaseUrl } from "@/lib/api";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchTopHolders(conditionId: string): Promise<any[]> {
  const base = getBaseUrl();
  const res = await fetch(
    `${base}/markets/top-holders?condition_id=${encodeURIComponent(
      conditionId
    )}`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch top holders");
  }

  return res.json();
}
