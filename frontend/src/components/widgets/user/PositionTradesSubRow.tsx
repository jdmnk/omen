"use client";

import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import {
  formatCompactCurrency,
  formatNumber,
  formatRelativeTime,
} from "@/lib/ui/format.utils";
import type { PositionActivityLookup } from "./userActivity.types";

type PositionTradesSubRowProps = {
  marketTitle: string | null;
  activityState?: PositionActivityLookup[string];
};

export function PositionTradesSubRow({
  marketTitle,
  activityState,
}: PositionTradesSubRowProps) {
  if (!activityState) {
    return (
      <div className="ml-7 rounded-md border border-dashed border-brand-stroke/60 px-4 py-2 text-[11px] text-muted-foreground">
        Select a position to show its trade activity.
      </div>
    );
  }

  if (activityState.isLoading) {
    return (
      <div className="ml-7 flex items-center gap-2 rounded-md border border-dashed border-brand-stroke/60 px-4 py-2 text-[11px] text-muted-foreground">
        <Spinner size="sm" /> Loading trades for {marketTitle || "position"}...
      </div>
    );
  }

  if (activityState.isError) {
    return (
      <div className="ml-7 rounded-md border border-dashed border-destructive/40 px-4 py-2 text-[11px] text-destructive">
        Unable to load trade history for this position.
      </div>
    );
  }

  const trades = activityState.trades ?? [];

  if (trades.length === 0) {
    return (
      <div className="ml-7 rounded-md border border-dashed border-brand-stroke/60 px-4 py-2 text-[11px] text-muted-foreground">
        No trades found for this position.
      </div>
    );
  }

  return (
    <div className="ml-7 rounded-md border border-brand-stroke/70 bg-brand-background/40 px-3 py-2 text-[11px]">
      <div className="mb-1 flex items-center justify-between uppercase tracking-wide text-muted-foreground">
        <span className="font-semibold">Trade Activity</span>
        <span className="text-[10px]">
          Showing {Math.min(trades.length, 20)} of {trades.length}
        </span>
      </div>
      <div className="flex flex-col divide-y divide-brand-stroke/30">
        {trades.slice(0, 20).map((trade) => {
          const notional =
            trade.notional ?? (trade.size ?? 0) * (trade.price ?? 0);
          const priceCents =
            trade.price !== undefined && trade.price !== null
              ? `${formatNumber(trade.price * 100, 1)}¢`
              : "-";
          const sizeDisplay =
            trade.size !== undefined && trade.size !== null
              ? formatNumber(trade.size, trade.size >= 1 ? 0 : 2)
              : "-";
          const timestamp = trade.timestamp
            ? formatRelativeTime(trade.timestamp)
            : "-";
          const isBuy = (trade.side ?? "").toUpperCase() === "BUY";

          return (
            <div
              key={`${trade.transactionHash}-${trade.timestamp}`}
              className="flex flex-wrap items-center gap-3 py-1 text-[11px]"
            >
              <span className="text-muted-foreground">{timestamp}</span>
              <span
                className={cn(
                  "font-semibold",
                  isBuy ? "text-outcome-yes" : "text-outcome-no"
                )}
              >
                {trade.side?.toUpperCase()} {trade.outcome}
              </span>
              <span className="text-foreground">
                {sizeDisplay} @ {priceCents}
              </span>
              <span className="ml-auto font-semibold text-foreground">
                {formatCompactCurrency(notional)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
