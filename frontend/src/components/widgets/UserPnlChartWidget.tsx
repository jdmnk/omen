"use client";

import { useState, useMemo } from "react";
import { UserPnlInterval } from "@/lib/queries/user-pnl.query";
import { useUserPnlWithMarkersQuery } from "@/lib/queries/user-pnl-markers.query";
import { useClosedPositionsInfiniteQuery } from "@/lib/queries/closed-positions.query";
import { UserPnlChart } from "./UserPnlChart";
import { formatCompactCurrency } from "@/lib/ui/format.utils";
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

const MIN_SIZE_OPTIONS = [
  { value: 0, label: "All" },
  { value: 100, label: "$100+" },
  { value: 500, label: "$500+" },
  { value: 1000, label: "$1K+" },
  { value: 5000, label: "$5K+" },
];

export function UserPnlChartWidget({ userId }: { userId: string }) {
  const [interval, setInterval] = useState<UserPnlInterval>("1w");
  const [minSize, setMinSize] = useState<number>(500);
  const isMounted = useIsMounted();
  const { data, isLoading, error } = useUserPnlWithMarkersQuery(
    userId,
    interval
  );

  // Fetch closed positions
  const { data: closedPositionsData } = useClosedPositionsInfiniteQuery(userId);

  const chartData =
    data?.points.map((item) => ({
      time: item.t,
      value: item.p,
    })) || [];

  // Filter closed positions to only those within the chart time range and above minimum size
  const filteredClosedPositions = useMemo(() => {
    if (!closedPositionsData || !data || data.points.length === 0) return [];

    const allClosedPositions = closedPositionsData.pages.flat();
    const minTime = data.points[0].t;
    const maxTime = data.points[data.points.length - 1].t;

    return allClosedPositions.filter((position) => {
      const inTimeRange =
        position.timestamp >= minTime && position.timestamp <= maxTime;
      const meetsMinSize = Math.abs(position.realizedPnl) >= minSize;
      return inTimeRange && meetsMinSize;
    });
  }, [closedPositionsData, data, minSize]);

  const currentPnl =
    data && data.points.length > 0 ? data.points[data.points.length - 1].p : 0;
  const isPositive = currentPnl >= 0;

  if (!isMounted) {
    return null;
  }

  return (
    <Card className="relative w-full h-full flex flex-col pb-2">
      <div className="text-xs bg-brand-background px-3 py-2 rounded-t-brand border-b border-brand-stroke font-bold flex items-center justify-between gap-2">
        <span className="flex-1 flex">
          <span>PnL History</span>
          <span>
            <span className="ml-3 text-muted-foreground font-normal">
              Current:{" "}
            </span>
            <span
              className={cn(
                "font-bold",
                isPositive ? "text-outcome-yes" : "text-outcome-no"
              )}
            >
              {formatCompactCurrency(currentPnl)}
            </span>
          </span>
        </span>
      </div>

      {/* Controls Row */}
      <div className="flex items-center justify-between gap-2 mb-2 px-2 mt-2">
        {/* Min Size Filter */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground">Min Size:</span>
          {MIN_SIZE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setMinSize(option.value)}
              disabled={isLoading}
              className={cn(
                "px-2 py-0.5 text-xs rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
                "border border-brand-stroke",
                minSize === option.value
                  ? "bg-brand-highlight text-secondary-foreground"
                  : "bg-brand-background text-brand-foreground hover:bg-brand-highlight/50"
              )}
            >
              {option.label}
            </button>
          ))}
          <span className="text-xs text-muted-foreground ml-1">
            ({filteredClosedPositions.length} positions)
          </span>
        </div>

        {/* Interval Selector */}
        <div className="flex items-center gap-1">
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
      </div>

      {/* Chart */}
      <div className="flex-1 w-full min-h-0">
        <UserPnlChart
          data={chartData}
          closedPositions={filteredClosedPositions}
          analyticsMarkers={data?.markers || []}
          isLoading={isLoading}
          error={error}
        />
      </div>
    </Card>
  );
}
