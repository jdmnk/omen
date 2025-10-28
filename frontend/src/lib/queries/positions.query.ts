import { useQuery } from "@tanstack/react-query";
import { getBaseUrl } from "../api";
import { Position } from "../models/api.models";

export function usePositionsQuery(clobTokenIds: string[]) {
  return useQuery<Position[]>({
    queryKey: ["positions", clobTokenIds],
    queryFn: async () => {
      // craft the query string
      const queryString = clobTokenIds
        .map((tokenId) => `clob_tokens=${tokenId}`)
        .join("&");
      const res = await fetch(
        `${getBaseUrl()}/markets/positions?${queryString}`
      );
      return res.json();
    },
  });
}
