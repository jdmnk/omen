"use client";

import { useState } from "react";
import { Interval, Market } from "@/lib/models/api.models";
import {
  PriceHistoryPoint,
  usePriceHistoryQuery,
} from "@/lib/queries/price-history.query";
import { PriceChart } from "./PriceChart";
import {
  autoFormatDuration,
  formatCompactNumber,
  formatNumber,
} from "@/lib/ui/format.utils";

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
  const [interval, setInterval] = useState<Interval>("max");
  const { data, isLoading, error } = usePriceHistoryQuery(
    market.token1,
    interval,
    INTERVAL_FIDELITY[interval]
  );

  const deduplicatedChartData = deduplicateTimeStamps(data?.history || []);
  const chartData =
    deduplicatedChartData.map((item) => ({
      time: item.t,
      value: item.p * 100,
    })) || [];

  const outcomes = market.outcomes.split(",");
  const outcomePrices = market.outcomePrices.split(",");
  const timeDelta = market.endDate
    ? new Date(market.endDate).getTime() - Date.now()
    : 0;

  const spread = Math.abs(market.bestAsk - market.bestBid) * 100;

  return (
    <div className="relative w-full flex flex-col border rounded-lg pb-2">
      <div className="text-sm bg-muted px-4 py-2 rounded-t-lg border-b font-bold">
        {market.question}
      </div>
      <div className="flex justify-between items-center mb-4 text-sm px-4 py-2 border-b">
        <div className="text-outcome-yes">
          {outcomes[0].toLowerCase()}:{" "}
          <span className="font-bold">
            {formatNumber(Number(outcomePrices[0]) * 100)}%
          </span>
        </div>
        <div className="text-outcome-no">
          {outcomes[1].toLowerCase()}:{" "}
          <span className="font-bold">
            {formatNumber(Number(outcomePrices[1]) * 100)}%
          </span>
        </div>
        <div>
          s: <span className="font-bold">{formatNumber(spread)}</span>
        </div>
        <div>
          oi:{" "}
          <span className="font-bold">
            {formatCompactNumber(market.liquidity)}
          </span>
        </div>
        <div>
          vol:{" "}
          <span className="font-bold">
            {formatCompactNumber(market.volume)}
          </span>
        </div>
        {timeDelta > 0 && (
          <div>
            ends:{" "}
            <span className="font-bold">
              {/* {autoFormatDuration(timeDelta)} ( */}
              {new Date(market.endDate).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      {/* Interval Selector */}
      <div className="flex items-center gap-1 mb-3 px-2 justify-end">
        {INTERVALS.map((int) => (
          <button
            key={int}
            onClick={() => setInterval(int)}
            disabled={isLoading}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
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
