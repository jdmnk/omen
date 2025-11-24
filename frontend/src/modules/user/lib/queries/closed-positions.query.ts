"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { ClosedPosition } from "@/lib/models/frontend.models";
import { DATA_API_HOST } from "@/lib/api.const";

const PAGE_SIZE = 50;

/**
 * Available sorting options for closed positions:
 * - REALIZEDPNL: Sort by realized profit/loss
 * - TITLE: Sort by market title
 * - PRICE: Sort by current price
 * - AVGPRICE: Sort by average price
 * - TIMESTAMP: Sort by closing timestamp (latest first when DESC)
 */
export type ClosedPositionSortBy =
  | "REALIZEDPNL"
  | "TITLE"
  | "PRICE"
  | "AVGPRICE"
  | "TIMESTAMP";

export function useClosedPositionsInfiniteQuery(
  userId: string,
  sortBy: ClosedPositionSortBy = "TIMESTAMP"
) {
  return useInfiniteQuery<ClosedPosition[], Error>({
    queryKey: ["closed-positions-infinite", userId, sortBy],
    queryFn: async ({ pageParam = 0 }) => {
      const url = new URL(`${DATA_API_HOST}/closed-positions`);
      url.searchParams.set("user", userId);
      url.searchParams.set("limit", PAGE_SIZE.toString());
      url.searchParams.set("sortBy", sortBy);
      url.searchParams.set("sortDirection", "DESC");
      url.searchParams.set(
        "offset",
        ((pageParam as number) * PAGE_SIZE).toString()
      );

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(
          `Failed to fetch closed positions: ${response.statusText}`
        );
      }

      const data = await response.json();
      return data;
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return allPages.length;
    },
    initialPageParam: 0,
    staleTime: 60000, // 1 minute
  });
}

export async function fetchClosedPositionsByMarkets(
  userId: string,
  markets: string[],
  sortBy: ClosedPositionSortBy = "TIMESTAMP",
  limit: number = 200
): Promise<ClosedPosition[]> {
  if (!userId || markets.length === 0) return [];

  const url = new URL(`${DATA_API_HOST}/closed-positions`);
  url.searchParams.set("user", userId);
  url.searchParams.set("limit", limit.toString());
  url.searchParams.set("sortBy", sortBy);
  url.searchParams.set("sortDirection", "DESC");
  markets.forEach((marketId) => url.searchParams.append("market", marketId));

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Failed to fetch closed positions: ${response.statusText}`);
  }
  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

export function useClosedPositionsByMarketsQuery(
  userId: string,
  markets: string[],
  sortBy: ClosedPositionSortBy = "TIMESTAMP",
  limit?: number
) {
  return useQuery<ClosedPosition[], Error>({
    queryKey: [
      "closed-positions-by-market",
      userId,
      [...markets].sort(),
      sortBy,
      limit,
    ],
    queryFn: () =>
      fetchClosedPositionsByMarkets(userId, markets, sortBy, limit ?? 200),
    enabled: Boolean(userId && markets.length > 0),
    staleTime: 60000,
  });
}
