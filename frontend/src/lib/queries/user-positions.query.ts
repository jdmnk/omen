"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchUserPositions } from "./fetch/fetch-user-positions";
import { UserPosition } from "../models/api.models";

export function useUserPositionsQuery(userId: string) {
  return useQuery<UserPosition[]>({
    queryKey: ["user-positions", userId],
    queryFn: () => fetchUserPositions(userId),
    staleTime: 60000, // 1 minute
  });
}
