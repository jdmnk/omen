"use client";

import { useState, useMemo } from "react";
import { useUserPnlQuery, UserPnlInterval } from "@/lib/queries/user-pnl.query";
import { useRecentTradesQuery } from "@/lib/queries/recent-trades.query";
import { UserPnlChart } from "./UserPnlChart";
import { formatCompactCurrency, formatAddress } from "@/lib/ui/format.utils";
import { cn } from "@/lib/utils";
import { Card } from "../ui/card";
import { useIsMounted } from "@/lib/hooks/use-is-mounted";

const INTERVALS: UserPnlInterval[] = ["12h", "1d", "1w", "1m", "max"];

const INTERVAL_LABELS: Record<UserPnlInterval, string> = {
  "12h": "12H",
  "1d": "1D",
  "1w": "1W",
  "1m": "1M",
  max: "MAX",
};

// Map interval to trade limit (fetch enough trades to cover the time period)
const INTERVAL_TRADE_LIMITS: Record<UserPnlInterval, number> = {
  "12h": 200,
  "1d": 300,
  "1w": 500,
  "1m": 1000,
  max: 2000,
};

export function UserPnlChartWidget({ userId }: { userId: string }) {
  const [interval, setInterval] = useState<UserPnlInterval>("1m");
  const isMounted = useIsMounted();
  const { data, isLoading, error } = useUserPnlQuery(userId, interval);

  // Fetch trades for the selected interval
  const tradeLimit = INTERVAL_TRADE_LIMITS[interval];
  const { data: tradesData } = useRecentTradesQuery(
    undefined,
    undefined,
    userId,
    tradeLimit
  );

  const chartData =
    data?.map((item) => ({
      time: item.t,
      value: item.p,
    })) || [];

  // Filter trades to only those within the chart time range
  const filteredTrades = useMemo(() => {
    if (!tradesData || !data || data.length === 0) return [];

    const minTime = data[0].t;
    const maxTime = data[data.length - 1].t;

    return tradesData.filter((trade) => {
      return trade.timestamp >= minTime && trade.timestamp <= maxTime;
    });
  }, [tradesData, data]);

  const currentPnl = data && data.length > 0 ? data[data.length - 1].p : 0;
  const isPositive = currentPnl >= 0;

  if (!isMounted) {
    return null;
  }

  return (
    <Card className="relative w-full h-full flex flex-col pb-2">
      <div className="text-xs bg-brand-background px-3 py-2 rounded-t-brand border-b border-brand-stroke font-bold flex items-center justify-between gap-2">
        <span className="flex-1">PnL History - {formatAddress(userId)}</span>
      </div>
      <div className="flex items-center gap-6 mb-4 text-xs px-3 py-2 border-b border-brand-stroke bg-brand-background">
        <div>
          <span className="text-muted-foreground">Current PnL: </span>
          <span
            className={cn(
              "font-bold",
              isPositive ? "text-outcome-yes" : "text-outcome-no"
            )}
          >
            {formatCompactCurrency(currentPnl)}
          </span>
        </div>
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
        <UserPnlChart
          data={chartData}
          trades={filteredTrades}
          isLoading={isLoading}
          error={error}
        />
      </div>
    </Card>
  );
}
