"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { UserPosition } from "../../../../lib/models/api.models";
import { DATA_API_HOST } from "../../../../lib/api.const";

const PAGE_SIZE = 50;

export function useUserPositionsInfiniteQuery(userId: string) {
  return useInfiniteQuery<UserPosition[], Error>({
    queryKey: ["user-positions-infinite", userId],
    queryFn: async ({ pageParam = 0 }) => {
      const url = new URL(`${DATA_API_HOST}/positions`);
      url.searchParams.set("user", userId);
      url.searchParams.set("sizeThreshold", "1");
      url.searchParams.set("sortBy", "CURRENT");
      url.searchParams.set("sortDirection", "DESC");
      url.searchParams.set("limit", PAGE_SIZE.toString());
      url.searchParams.set(
        "offset",
        ((pageParam as number) * PAGE_SIZE).toString()
      );

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Failed to fetch positions: ${response.statusText}`);
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
