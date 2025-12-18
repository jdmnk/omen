"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { useIsMounted } from "@/lib/hooks/use-is-mounted";
import {
  useUserPnlQuery,
  UserPnlInterval,
} from "@/modules/user/lib/queries/user-pnl.query";
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

type UserPnlChartWidgetV2Props = {
  userId: string;
};

export function UserPnlChartWidgetV2({ userId }: UserPnlChartWidgetV2Props) {
  const [interval, setInterval] = useState<UserPnlInterval>("1w");
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

  if (!isMounted) {
    return null;
  }

  return (
    <Card className="relative flex h-full w-full flex-col pb-2">
      <div className="flex items-center justify-between gap-2 border-b border-brand-stroke bg-brand-background px-3 py-2 text-xs font-bold">
        <span>PnL History</span>
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
                  : "bg-brand-background text-brand-foreground hover:bg-brand-highlight/50"
              )}
            >
              {INTERVAL_LABELS[int]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 w-full">
        <UserPnlChartV2
          data={chartData}
          isLoading={isPnlLoading}
          error={pnlError}
        />
      </div>
    </Card>
  );
}
