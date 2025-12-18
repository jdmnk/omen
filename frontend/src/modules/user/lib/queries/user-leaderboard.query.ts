"use client";

import { useQuery } from "@tanstack/react-query";
import { DATA_API_HOST } from "@/lib/api.const";

export type UserLeaderboardInfo = {
  rank: string;
  proxyWallet: string;
  userName: string;
  xUsername?: string | null;
  verifiedBadge: boolean;
  vol: number;
  pnl: number;
  profileImage?: string;
};

export function useUserLeaderboardQuery(userId: string) {
  return useQuery<UserLeaderboardInfo | null>({
    queryKey: ["user-leaderboard", userId],
    queryFn: async () => {
      const url = new URL(`${DATA_API_HOST}/v1/leaderboard`);
      url.searchParams.set("timePeriod", "all");
      url.searchParams.set("orderBy", "VOL");
      url.searchParams.set("limit", "1");
      url.searchParams.set("offset", "0");
      url.searchParams.set("category", "overall");
      url.searchParams.set("user", userId);

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Failed to fetch leaderboard info: ${response.statusText}`);
      }
      const data = (await response.json()) as UserLeaderboardInfo[];
      return data.length > 0 ? data[0] : null;
    },
    enabled: userId.trim().length > 0,
    staleTime: 300000, // 5 minutes
  });
}

