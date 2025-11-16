import { useQuery } from "@tanstack/react-query";
import { getBaseUrl } from "@/lib/api.const";

export type PnlPoint = { t: number; p: number };
export type MarkerMarketInfo = {
  title?: string | null;
  outcome?: string | null;
  tradesCount?: number | null;
  totalSize?: number | null;
  avgPrice?: number | null;
  notional?: number | null;
  side?: string | null;
};

type BasePnlMarker = {
  t: number;
  markets?: MarkerMarketInfo[];
};

export type PnlMarker =
  | (BasePnlMarker & {
      kind: "swing";
      delta?: number;
      direction?: "up" | "down";
      severity?: "large" | "extreme";
    })
  | (BasePnlMarker & {
      kind: "trade_cluster";
      tradesCount?: number;
      notional?: number;
    });

export type PnlWithMarkersResponse = {
  points: PnlPoint[];
  markers: PnlMarker[];
};

export type UserPnlInterval = "12h" | "1d" | "1w" | "1m" | "max";

export function useUserPnlWithMarkersQuery(
  userAddress: string,
  interval: UserPnlInterval = "1m"
) {
  return useQuery<PnlWithMarkersResponse>({
    queryKey: ["user-pnl-with-markers", userAddress, interval],
    queryFn: async () => {
      const base = getBaseUrl();
      if (!base) {
        throw new Error("API base URL is not configured");
      }
      const url = new URL(`/users/${userAddress}/pnl-with-markers`, base);
      url.searchParams.set("interval", interval);
      // max_trades left default on backend unless we expose a control
      const res = await fetch(url.toString(), { cache: "no-cache" });
      if (!res.ok) throw new Error(`Failed to fetch PnL with markers: ${res.statusText}`);
      const data = (await res.json()) as PnlWithMarkersResponse;
      // Sort points asc and markers by time to be safe
      data.points.sort((a, b) => a.t - b.t);
      data.markers.sort((a, b) => a.t - b.t);
      return data;
    },
    staleTime: 60_000,
  });
}

