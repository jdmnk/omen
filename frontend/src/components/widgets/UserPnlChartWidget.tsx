"use client";

import { useState } from "react";
import { UserPnlInterval } from "@/lib/queries/user-pnl.query";
import { useUserPnlWithMarkersQuery } from "@/lib/queries/user-pnl-markers.query";
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

export function UserPnlChartWidget({ userId }: { userId: string }) {
  const [interval, setInterval] = useState<UserPnlInterval>("1w");
  const isMounted = useIsMounted();
  const { data, isLoading, error } = useUserPnlWithMarkersQuery(
    userId,
    interval,
    500
  );

  const chartData =
    data?.points.map((item) => ({
      time: item.t,
      value: item.p,
    })) || [];

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

      {/* Interval Selector */}
      <div className="flex items-center justify-end gap-2 mb-2 px-2 mt-2">
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
          analyticsMarkers={data?.markers || []}
          isLoading={isLoading}
          error={error}
        />
      </div>
    </Card>
  );
}
