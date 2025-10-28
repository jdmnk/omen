"use client";

import { useState } from "react";
import { Interval, Market } from "@/lib/models/api.models";
import {
  PriceHistoryPoint,
  usePriceHistoryQuery,
} from "@/lib/queries/price-history.query";
import { PriceChart } from "./PriceChart";

const INTERVALS: Interval[] = ["1h", "6h", "1d", "1w", "1m", "max"];

const INTERVAL_LABELS: Record<Interval, string> = {
  "1h": "1H",
  "6h": "6H",
  "1d": "1D",
  "1w": "1W",
  "1m": "1M",
  max: "MAX",
};

const INTERVAL_FIDELITY: Record<Interval, number> = {
  "1h": 1, // 1 minute
  "6h": 5, // 5 minutes
  "1d": 15, // 15 minutes
  "1w": 60, // 1 hour
  "1m": 240, // 4 hours
  max: 1440, // 1 day
};

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
    interval,
    INTERVAL_FIDELITY[interval]
  );

  const deduplicatedChartData = deduplicateTimeStamps(data?.history || []);
  const chartData =
    deduplicatedChartData.map((item) => ({
      time: item.t,
      value: item.p,
    })) || [];

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Interval Selector */}
      <div className="flex items-center gap-1 mb-3 px-2">
        {INTERVALS.map((int) => (
          <button
            key={int}
            onClick={() => setInterval(int)}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              interval === int
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {INTERVAL_LABELS[int]}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="flex-1 w-full">
        <PriceChart data={chartData} isLoading={isLoading} error={error} />
      </div>
    </div>
  );
}
