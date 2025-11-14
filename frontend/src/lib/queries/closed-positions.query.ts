"use client";

import { useQuery } from "@tanstack/react-query";
import { ClosedPosition } from "../models/frontend.models";
import { DATA_API_HOST } from "../api.const";

export function useClosedPositionsQuery(userId: string, limit: number = 50) {
  return useQuery<ClosedPosition[]>({
    queryKey: ["closed-positions", userId, limit],
    queryFn: async () => {
      const url = new URL(`${DATA_API_HOST}/closed-positions`);
      url.searchParams.set("user", userId);
      url.searchParams.set("limit", limit.toString());
      url.searchParams.set("sortBy", "REALIZEDPNL");
      url.searchParams.set("sortDirection", "DESC");
      url.searchParams.set("offset", "0");

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(
          `Failed to fetch closed positions: ${response.statusText}`
        );
      }

      const data = await response.json();
      return data;
    },
    staleTime: 60000, // 1 minute
  });
}
