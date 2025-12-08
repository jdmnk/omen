import { Interval } from "@/lib/models/frontend.models";
import {
  PriceHistoryPoint,
  usePriceHistoryQuery,
} from "@/lib/queries/price-history.query";
import { INTERVAL_FIDELITY } from "./chart.const";
import { useMemo } from "react";

function dedupeHistory(points: PriceHistoryPoint[] = []) {
  return [...new Map(points.map((item) => [item.t, item])).values()];
}

export function useChartData(
  tokenId?: string | null,
  interval: Interval = "1w"
) {
  const fidelityMinutes = INTERVAL_FIDELITY[interval] ?? 3600;
  const fidelitySeconds = fidelityMinutes * 60;
  const enabled = Boolean(tokenId);
  const query = usePriceHistoryQuery(tokenId || "", interval, fidelityMinutes, {
    enabled,
  });
  const chartData = useMemo(
    () =>
      dedupeHistory(query.data?.history).map((point) => ({
        time: point.t,
        value: point.p * 100,
      })),
    [query.data?.history]
  );
  return { ...query, chartData, fidelitySeconds };
}
