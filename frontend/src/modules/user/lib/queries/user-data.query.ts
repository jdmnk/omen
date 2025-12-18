"use client";

import { useQuery } from "@tanstack/react-query";

export type UserProfileData = {
  id?: string;
  createdAt?: string;
  proxyWallet?: string;
  profileImage?: string;
  displayUsernamePublic?: boolean;
  bio?: string | null;
  pseudonym?: string | null;
  name?: string | null;
  users?: Array<{
    id?: string;
    creator?: boolean;
    mod?: boolean;
  }>;
  xUsername?: string | null;
  verifiedBadge?: boolean;
};

export function useUserDataQuery(
  address: string,
  enabled: boolean = true
) {
  return useQuery<UserProfileData>({
    queryKey: ["user-data", address],
    queryFn: async () => {
      const url = new URL(
        "https://polymarket.com/api/profile/userData"
      );
      url.searchParams.set("address", address);

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Failed to fetch user data: ${response.statusText}`);
      }
      const data = (await response.json()) as UserProfileData;
      return data;
    },
    enabled: enabled && address.trim().length > 0,
    staleTime: 300000, // 5 minutes
  });
}


