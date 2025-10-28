"use client";

import { Market } from "@/lib/models/api.models";
import {
  PriceHistoryPoint,
  usePriceHistoryQuery,
} from "@/lib/queries/price-history.query";
import { PriceChart } from "./PriceChart";

const deduplicateTimeStamps = (data: PriceHistoryPoint[]) => {
  const uniqueTimeStamps = [
    ...new Map(data.map((item) => [item.t, item])).values(),
  ];
  return uniqueTimeStamps;
};

export function PriceChartWidget({ market }: { market: Market }) {
  const { data, isLoading, error } = usePriceHistoryQuery(market.token1, "1w");

  console.log("data", data);
  const deduplicatedChartData = deduplicateTimeStamps(data?.history || []);
  const chartData =
    deduplicatedChartData.map((item) => ({
      time: item.t,
      value: item.p,
    })) || [];

  return <PriceChart data={chartData} isLoading={isLoading} error={error} />;
}
