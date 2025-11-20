"use client";

import { useQuery } from "@tanstack/react-query";
import { UserValue } from "../../../../lib/models/frontend.models";
import { DATA_API_HOST } from "../../../../lib/api.const";

export function useUserValueQuery(userId: string) {
  return useQuery<UserValue[]>({
    queryKey: ["user-value", userId],
    queryFn: async () => {
      const url = new URL(`${DATA_API_HOST}/value`);
      url.searchParams.set("user", userId);

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`Failed to fetch user value: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    },
    staleTime: 60000, // 1 minute
  });
}
