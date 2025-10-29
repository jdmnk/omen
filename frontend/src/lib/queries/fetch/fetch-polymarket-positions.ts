import { DATA_API_HOST } from "@/lib/api";
import { UserPosition } from "@/lib/models/api.models";

export async function fetchPolymarketPositions(
  userId: string
): Promise<UserPosition[]> {
  const limit = 500;
  let offset = 0;
  let allPositions = [];
  while (true) {
    const url = new URL(`${DATA_API_HOST}/positions`);
    url.searchParams.set("user", userId);
    url.searchParams.set("sizeThreshold", "1");
    url.searchParams.set("sortBy", "CURRENT");
    url.searchParams.set("sortDirection", "DESC");
    url.searchParams.set("limit", limit.toString());
    url.searchParams.set("offset", offset.toString());
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Failed to fetch positions: ${response.statusText}`);
    }
    const data = await response.json();
    allPositions.push(...data);
    if (data.length < limit) break;
    offset += limit;
  }
  return allPositions;
}
