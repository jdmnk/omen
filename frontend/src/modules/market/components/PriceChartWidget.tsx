"use client";

import { useState } from "react";
import { Interval, Market } from "@/lib/models/api.models";
import {
  PriceHistoryPoint,
  usePriceHistoryQuery,
} from "@/lib/queries/price-history.query";
import { useOrderbookQuery } from "../lib/queries/orderbook.query";
import { PriceChart } from "./PriceChart";
import { formatCompactNumber, formatNumber } from "@/lib/ui/format.utils";
import { cn } from "@/lib/utils";
import { Card } from "../../../components/ui/card";
import { WatchlistButton } from "./WatchlistButton";
import { useIsMounted } from "@/lib/hooks/use-is-mounted";

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
  const isMounted = useIsMounted();
  const { data, isLoading, error } = usePriceHistoryQuery(
    market.token1,
    interval,
    INTERVAL_FIDELITY[interval]
  );

  // Fetch orderbook to get live spread
  const { data: orderbookData } = useOrderbookQuery(market.token1);

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

  // Use spread from orderbook if available, otherwise fallback to market data
  const spread = orderbookData?.spread
    ? orderbookData.spread * 100
    : Math.abs(market.bestAsk - market.bestBid) * 100;

  // prevent SSR iossues with locales below
  if (!isMounted) {
    return null;
  }

  return (
    <Card className="relative w-full h-full flex flex-col pb-2">
      <div className="text-xs bg-brand-background px-3 py-2 rounded-t-brand border-b border-brand-stroke font-bold flex items-center justify-between gap-2">
        <span className="flex-1 truncate">{market.question}</span>
        <WatchlistButton
          slug={market.slug}
          conditionId={market.conditionId}
          title={market.question}
        />
      </div>
      <div className="flex items-center gap-12 mb-4 text-xs px-3 py-2 border-b border-brand-stroke bg-brand-background">
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
            className={cn(
              "px-2.5 py-0.5 text-xs rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
              "border border-brand-stroke",
              interval === int
                ? "bg-brand-highlight text-secondary-foreground"
                : "bg-brand-background text-brand-foreground hover:bg-brand-highlight/50"
            )}
          >
            {INTERVAL_LABELS[int]}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="flex-1 w-full min-h-0">
        <PriceChart data={chartData} isLoading={isLoading} error={error} />
      </div>
    </Card>
  );
}
