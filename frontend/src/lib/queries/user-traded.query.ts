"use client";

import { useQuery } from "@tanstack/react-query";
import { UserTraded } from "../models/frontend.models";
import { DATA_API_HOST } from "../api.const";

export function useUserTradedQuery(userId: string) {
  return useQuery<UserTraded>({
    queryKey: ["user-traded", userId],
    queryFn: async () => {
      const url = new URL(`${DATA_API_HOST}/traded`);
      url.searchParams.set("user", userId);

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`Failed to fetch user traded: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    },
    staleTime: 300000, // 5 minutes
  });
}

