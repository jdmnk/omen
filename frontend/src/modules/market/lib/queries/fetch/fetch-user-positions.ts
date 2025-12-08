import { DATA_API_HOST } from "@/lib/api.const";
import { OpenPosition } from "@/lib/models/api.models";

export async function fetchUserPositions(
  userId: string,
  count: number = 500,
  limit: number = 500
): Promise<OpenPosition[]> {
  let offset = 0;
  const allPositions = [];
  while (allPositions.length < count) {
    const remaining = count - allPositions.length;
    const requestLimit = Math.min(remaining, limit);
    const url = new URL(`${DATA_API_HOST}/positions`);
    url.searchParams.set("user", userId);
    url.searchParams.set("sizeThreshold", "1");
    url.searchParams.set("sortBy", "CURRENT");
    url.searchParams.set("sortDirection", "DESC");
    url.searchParams.set("limit", requestLimit.toString());
    url.searchParams.set("offset", offset.toString());
    const response = await fetch(url.toString());
    if (!response.ok) {
      const error = new Error(
        `Failed to fetch positions: ${response.status} ${response.statusText}`
      ) as Error & { status?: number };
      (error as any).status = response.status;
      throw error;
    }
    const data = await response.json();
    allPositions.push(...data);
    if (data.length < requestLimit) break;
    offset += requestLimit;
    if (allPositions.length >= count) break;
  }
  return allPositions.slice(0, count);
}
