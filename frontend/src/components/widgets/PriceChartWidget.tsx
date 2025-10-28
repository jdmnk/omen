"use client";

import { useState } from "react";
import { Interval, Market } from "@/lib/models/api.models";
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
  const [interval, setInterval] = useState<Interval>("1w");
  const { data, isLoading, error } = usePriceHistoryQuery(
    market.token1,
    interval
  );

  const deduplicatedChartData = deduplicateTimeStamps(data?.history || []);
  const chartData =
    deduplicatedChartData.map((item) => ({
      time: item.t,
      value: item.p,
    })) || [];

  return (
    <PriceChart
      data={chartData}
      interval={interval}
      onIntervalChange={setInterval}
      isLoading={isLoading}
      error={error}
    />
  );
}
