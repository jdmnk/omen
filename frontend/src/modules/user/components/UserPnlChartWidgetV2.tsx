"use client";

import { useCallback, useState } from "react";
import { Card } from "@/components/ui/card";
import { useIsMounted } from "@/lib/hooks/use-is-mounted";
import {
  useUserPnlQuery,
  UserPnlInterval,
} from "@/modules/user/lib/queries/user-pnl.query";
import { formatCurrency } from "@/lib/ui/format.utils";
import { getPnlColorClass } from "@/lib/ui/color.utils";
import { cn } from "@/lib/utils";
import { UserPnlChartV2 } from "./charts/UserPnlChartV2";

const INTERVALS: UserPnlInterval[] = ["12h", "1d", "1w", "1m", "max"];

const INTERVAL_LABELS: Record<UserPnlInterval, string> = {
  "12h": "12H",
  "1d": "1D",
  "1w": "1W",
  "1m": "1M",
  max: "ALL",
};

const INTERVAL_DISPLAY_LABELS: Record<UserPnlInterval, string> = {
  "12h": "12 Hours",
  "1d": "24 Hours",
  "1w": "7 Days",
  "1m": "30 Days",
  max: "All-Time",
};

type UserPnlChartWidgetV2Props = {
  userId: string;
};

export function UserPnlChartWidgetV2({ userId }: UserPnlChartWidgetV2Props) {
  const [interval, setInterval] = useState<UserPnlInterval>("1m");
  const [hoveredValue, setHoveredValue] = useState<number | null>(null);
  const isMounted = useIsMounted();

  const {
    data: pnlPoints,
    isLoading: isPnlLoading,
    error: pnlError,
  } = useUserPnlQuery(userId, interval);

  const chartData =
    pnlPoints?.map((point) => ({
      time: point.t,
      value: point.p,
    })) ?? [];

  const currentPnl =
    pnlPoints && pnlPoints.length > 0 ? pnlPoints[pnlPoints.length - 1].p : 0;

  const displayValue = hoveredValue ?? currentPnl;

  const handleCrosshairMove = useCallback((value: number | null) => {
    setHoveredValue(value);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <Card className="relative flex h-full w-full flex-col">
      <div className="flex items-start justify-between px-4 pt-4 pb-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted-foreground">Profit/Loss</span>
          <span
            className={cn(
              "text-2xl font-semibold",
              getPnlColorClass(displayValue)
            )}
          >
            {formatCurrency(displayValue)}
          </span>
          <span className="text-xs text-muted-foreground">
            {INTERVAL_DISPLAY_LABELS[interval]}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {INTERVALS.map((int) => (
            <button
              key={int}
              onClick={() => setInterval(int)}
              disabled={isPnlLoading}
              className={cn(
                "px-2.5 py-0.5 text-[11px] rounded border border-brand-stroke transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                interval === int
                  ? "bg-brand-highlight text-secondary-foreground"
                  : "text-brand-foreground hover:bg-brand-highlight/50"
              )}
            >
              {INTERVAL_LABELS[int]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 w-full px-3 pb-3">
        <UserPnlChartV2
          data={chartData}
          isLoading={isPnlLoading}
          error={pnlError}
          onCrosshairMove={handleCrosshairMove}
        />
      </div>
    </Card>
  );
}
