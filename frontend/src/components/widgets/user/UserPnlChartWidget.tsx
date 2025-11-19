"use client";

import { useState, useMemo } from "react";
import { UserPnlInterval } from "@/lib/queries/user-pnl.query";
import { useUserPnlWithMarkersQuery } from "@/lib/queries/user-pnl-markers.query";
import { UserPnlChart } from "./UserPnlChart";
import { formatCompactCurrency } from "@/lib/ui/format.utils";
import { cn } from "@/lib/utils";
import { Card } from "../../ui/card";
import { useIsMounted } from "@/lib/hooks/use-is-mounted";

const INTERVALS: UserPnlInterval[] = ["12h", "1d", "1w", "1m", "max"];

const INTERVAL_LABELS: Record<UserPnlInterval, string> = {
  "12h": "12H",
  "1d": "1D",
  "1w": "1W",
  "1m": "1M",
  max: "MAX",
};

type MarkerVisibility = {
  positiveSwings: boolean;
  negativeSwings: boolean;
  tradeClusters: boolean;
};

export function UserPnlChartWidget({ userId }: { userId: string }) {
  const [interval, setInterval] = useState<UserPnlInterval>("1w");
  const [markerVisibility, setMarkerVisibility] = useState<MarkerVisibility>({
    positiveSwings: true,
    negativeSwings: true,
    tradeClusters: true,
  });
  const [minMarkerSizeInput, setMinMarkerSizeInput] = useState<string>("0");
  const minMarkerSize = Number(minMarkerSizeInput) || 0;
  const isMounted = useIsMounted();
  const { data, isLoading, error } = useUserPnlWithMarkersQuery(
    userId,
    interval
  );

  const chartData =
    data?.points.map((item) => ({
      time: item.t,
      value: item.p,
    })) || [];

  const currentPnl =
    data && data.points.length > 0 ? data.points[data.points.length - 1].p : 0;
  const isPositive = currentPnl >= 0;

  const filteredMarkers = useMemo(() => {
    if (!data?.markers) return [];
    return data.markers.filter((marker) => {
      if (marker.kind === "swing") {
        const delta = marker.delta ?? 0;
        if (delta >= 0 && !markerVisibility.positiveSwings) return false;
        if (delta < 0 && !markerVisibility.negativeSwings) return false;
        if (minMarkerSize && Math.abs(delta) < minMarkerSize) return false;
        return true;
      }
      if (marker.kind === "trade_cluster") {
        if (!markerVisibility.tradeClusters) return false;
        return Math.abs(marker.notional ?? 0) >= minMarkerSize;
      }
      return true;
    });
  }, [data?.markers, markerVisibility, minMarkerSize]);

  const toggleVisibility = (key: keyof MarkerVisibility) => {
    setMarkerVisibility((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

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

      {/* Controls */}
      <div className="flex gap-2 px-2 mt-2 mb-2 justify-between">
        {/* Marker Controls */}
        <div className="flex gap-2 flex-col">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Marker type: </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => toggleVisibility("positiveSwings")}
                className={cn(
                  "px-2 py-0.5 text-xs rounded border transition-colors",
                  markerVisibility.positiveSwings
                    ? "bg-brand-highlight text-secondary-foreground border-brand-highlight"
                    : "bg-brand-background text-brand-foreground border-brand-stroke hover:bg-brand-highlight/30"
                )}
              >
                Positive Swings
              </button>
              <button
                type="button"
                onClick={() => toggleVisibility("negativeSwings")}
                className={cn(
                  "px-2 py-0.5 text-xs rounded border transition-colors",
                  markerVisibility.negativeSwings
                    ? "bg-brand-highlight text-secondary-foreground border-brand-highlight"
                    : "bg-brand-background text-brand-foreground border-brand-stroke hover:bg-brand-highlight/30"
                )}
              >
                Negative Swings
              </button>
              <button
                type="button"
                onClick={() => toggleVisibility("tradeClusters")}
                className={cn(
                  "px-2 py-0.5 text-xs rounded border transition-colors",
                  markerVisibility.tradeClusters
                    ? "bg-brand-highlight text-secondary-foreground border-brand-highlight"
                    : "bg-brand-background text-brand-foreground border-brand-stroke hover:bg-brand-highlight/30"
                )}
              >
                Trade Clusters
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              Min marker size:
              <input
                type="number"
                min={0}
                value={minMarkerSizeInput}
                onChange={(e) => setMinMarkerSizeInput(e.target.value)}
                className="w-20 rounded border border-brand-stroke bg-transparent px-2 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-brand-highlight"
              />
            </label>
          </div>
        </div>

        {/* Interval Selector */}
        <div className="flex items-center gap-2 self-start">
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
      </div>

      {/* Chart */}
      <div className="flex-1 w-full min-h-0">
        <UserPnlChart
          data={chartData}
          analyticsMarkers={filteredMarkers}
          isLoading={isLoading}
          error={error}
        />
      </div>
    </Card>
  );
}
