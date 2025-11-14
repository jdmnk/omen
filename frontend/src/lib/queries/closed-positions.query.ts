"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { ClosedPosition } from "../models/frontend.models";
import { DATA_API_HOST } from "../api.const";

const PAGE_SIZE = 50;

export function useClosedPositionsInfiniteQuery(userId: string) {
  return useInfiniteQuery<ClosedPosition[], Error>({
    queryKey: ["closed-positions-infinite", userId],
    queryFn: async ({ pageParam = 0 }) => {
      const url = new URL(`${DATA_API_HOST}/closed-positions`);
      url.searchParams.set("user", userId);
      url.searchParams.set("limit", PAGE_SIZE.toString());
      url.searchParams.set("sortBy", "REALIZEDPNL");
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
