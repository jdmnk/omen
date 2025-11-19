"use client";

import { useMemo, useState } from "react";
import type { Time } from "lightweight-charts";
import { Card } from "@/components/ui/card";
import { useIsMounted } from "@/lib/hooks/use-is-mounted";
import { useUserPnlQuery, UserPnlInterval } from "@/lib/queries/user-pnl.query";
import { useUserPositionsInfiniteQuery } from "@/lib/queries/user-positions.query";
import { useClosedPositionsInfiniteQuery } from "@/lib/queries/closed-positions.query";
import { formatCompactCurrency } from "@/lib/ui/format.utils";
import { cn } from "@/lib/utils";
import type { UserPosition, ClosedPosition } from "@/lib/models/frontend.models";
import { UserPnlChartV2, type PositionMarker } from "./UserPnlChartV2";

const INTERVALS: UserPnlInterval[] = ["12h", "1d", "1w", "1m", "max"];

const INTERVAL_LABELS: Record<UserPnlInterval, string> = {
  "12h": "12H",
  "1d": "1D",
  "1w": "1W",
  "1m": "1M",
  max: "MAX",
};

function toChartTime(value?: number | string | null): Time | null {
  if (value === undefined || value === null) return null;
  if (typeof value === "number") {
    return (value > 1_000_000_000_000
      ? Math.floor(value / 1000)
      : Math.floor(value)) as Time;
  }
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return null;
  return Math.floor(parsed / 1000) as Time;
}

function getPositionOpenedAt(position: UserPosition): number | string | null {
  if (position.timestamp) return position.timestamp;
  if (position.openedAt) return position.openedAt;
  return null;
}

function flattenInfiniteResult<T>(pages?: T[][]): T[] {
  if (!pages) return [];
  return pages.flatMap((page) => page);
}

export function UserPnlChartWidgetV2({ userId }: { userId: string }) {
  const [interval, setInterval] = useState<UserPnlInterval>("1w");
  const isMounted = useIsMounted();

  const {
    data: pnlPoints,
    isLoading: isPnlLoading,
    error: pnlError,
  } = useUserPnlQuery(userId, interval);

  const {
    data: openPositionsData,
    isLoading: openPositionsLoading,
  } = useUserPositionsInfiniteQuery(userId);

  const {
    data: closedPositionsData,
    isLoading: closedPositionsLoading,
  } = useClosedPositionsInfiniteQuery(userId, "TIMESTAMP");

  const chartData =
    pnlPoints?.map((point) => ({
      time: point.t,
      value: point.p,
    })) ?? [];

  const currentPnl =
    pnlPoints && pnlPoints.length > 0 ? pnlPoints[pnlPoints.length - 1].p : 0;
  const isPositive = currentPnl >= 0;

  const openPositions = useMemo(
    () => flattenInfiniteResult<UserPosition>(openPositionsData?.pages),
    [openPositionsData?.pages]
  );

  const closedPositions = useMemo(
    () => flattenInfiniteResult<ClosedPosition>(closedPositionsData?.pages),
    [closedPositionsData?.pages]
  );

  const positionMarkers = useMemo<PositionMarker[]>(() => {
    const markers: PositionMarker[] = [];

    openPositions.forEach((position, index) => {
      const timestamp = toChartTime(getPositionOpenedAt(position));
      if (!timestamp) return;

      markers.push({
        id: `open-${position.conditionId}-${position.outcomeIndex}-${index}`,
        time: timestamp,
        position: "belowBar",
        color: "#38bdf8",
        shape: "arrowUp",
        text: "O",
      });
    });

    closedPositions.forEach((position, index) => {
      const timestamp = toChartTime(position.timestamp);
      if (!timestamp) return;

      markers.push({
        id: `closed-${position.conditionId}-${position.outcomeIndex}-${index}`,
        time: timestamp,
        position: "aboveBar",
        color: position.realizedPnl >= 0 ? "#22c55e" : "#ef4444",
        shape: "arrowDown",
        text: "C",
      });
    });

    markers.sort((a, b) => {
      const aTime = typeof a.time === "number" ? a.time : Number(a.time);
      const bTime = typeof b.time === "number" ? b.time : Number(b.time);
      return aTime - bTime;
    });

    return markers;
  }, [openPositions, closedPositions]);

  if (!isMounted) {
    return null;
  }

  return (
    <Card className="relative flex h-full w-full flex-col pb-2">
      <div className="flex items-center justify-between gap-2 border-b border-brand-stroke bg-brand-background px-3 py-2 text-xs font-bold">
        <span className="flex flex-1 items-center gap-2">
          <span>PnL History</span>
          <span className="text-muted-foreground font-normal">
            Current:
            <span
              className={cn(
                "ml-1 font-bold",
                isPositive ? "text-outcome-yes" : "text-outcome-no"
              )}
            >
              {formatCompactCurrency(currentPnl)}
            </span>
          </span>
        </span>
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

      <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-sky-400" />
            Open position
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Closed (profit)
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-red-400" />
            Closed (loss)
          </span>
        </div>
        <div className="text-xs text-muted-foreground">
          {openPositionsLoading || closedPositionsLoading
            ? "Loading position markers…"
            : `Tracking ${openPositions.length} open & ${closedPositions.length} closed`}
        </div>
      </div>

      <div className="flex-1 min-h-0 w-full">
        <UserPnlChartV2
          data={chartData}
          markers={positionMarkers}
          isLoading={isPnlLoading}
          error={pnlError}
        />
      </div>
    </Card>
  );
}
