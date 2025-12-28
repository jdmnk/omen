"use client";

import { useQuery } from "@tanstack/react-query";
import { getBaseUrl } from "@/lib/api.const";
import { UserPublicProfile } from "@/lib/models/api.models";

export function useUserDataQuery(address: string, enabled: boolean = true) {
  return useQuery<UserPublicProfile>({
    queryKey: ["user-data", address],
    queryFn: async () => {
      const url = new URL(`${getBaseUrl()}/profiles/public-profile`);
      url.searchParams.set("address", address);

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Failed to fetch user data: ${response.statusText}`);
      }
      const data = (await response.json()) as UserPublicProfile;
      return data;
    },
    enabled: enabled && address.trim().length > 0,
    staleTime: 300000, // 5 minutes
  });
}
