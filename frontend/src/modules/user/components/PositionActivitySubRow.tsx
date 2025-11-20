"use client";

import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import {
  formatCompactCurrency,
  formatNumber,
  formatRelativeTime,
} from "@/lib/ui/format.utils";
import type { PositionActivityLookup } from "../userActivity.types";

type PositionActivitySubRowProps = {
  marketTitle: string | null;
  activityState?: PositionActivityLookup[string];
};

export function PositionActivitySubRow({
  marketTitle,
  activityState,
}: PositionActivitySubRowProps) {
  if (!activityState) {
    return (
      <div className="ml-7 rounded-md border border-dashed border-brand-stroke/60 px-4 py-2 text-[11px] text-muted-foreground">
        Select a position to show its recent activity.
      </div>
    );
  }

  if (activityState.isLoading) {
    return (
      <div className="ml-7 flex items-center gap-2 rounded-md border border-dashed border-brand-stroke/60 px-4 py-2 text-[11px] text-muted-foreground">
        <Spinner size="sm" /> Loading activity for {marketTitle || "position"}
        ...
      </div>
    );
  }

  if (activityState.isError) {
    return (
      <div className="ml-7 rounded-md border border-dashed border-destructive/40 px-4 py-2 text-[11px] text-destructive">
        Unable to load activity for this position.
      </div>
    );
  }

  const entries = activityState.entries ?? [];

  if (entries.length === 0) {
    return (
      <div className="ml-7 rounded-md border border-dashed border-brand-stroke/60 px-4 py-2 text-[11px] text-muted-foreground">
        No activity found for this position.
      </div>
    );
  }

  return (
    <div className="ml-7 rounded-md border border-brand-stroke/70 bg-brand-background/40 px-3 py-2 text-[11px]">
      <div className="mb-1 flex items-center justify-between uppercase tracking-wide text-muted-foreground">
        <span className="font-semibold">Recent Activity</span>
        <span className="text-[10px]">
          Showing {Math.min(entries.length, 20)} of {entries.length}
        </span>
      </div>
      <div className="flex flex-col divide-y divide-brand-stroke/30">
        {entries.slice(0, 20).map((entry, idx) => {
          const timestamp = entry.timestamp
            ? formatRelativeTime(entry.timestamp)
            : "-";
          const isTrade = entry.type === "TRADE";
          const typeLabel = entry.type || "ACTIVITY";
          const primaryLabel = isTrade
            ? `${(entry.side ?? "").toUpperCase()} ${
                entry.outcome ?? ""
              }`.trim()
            : entry.outcome ?? entry.eventSlug ?? entry.slug ?? "";
          const sizeDisplay =
            entry.size !== undefined && entry.size !== null
              ? formatNumber(entry.size, entry.size >= 1 ? 0 : 2)
              : null;
          const priceDisplay =
            entry.price !== undefined && entry.price !== null
              ? `${formatNumber(entry.price * 100, 1)}¢`
              : null;
          const notional =
            entry.usdcSize ??
            (entry.size !== undefined &&
            entry.price !== undefined &&
            entry.size !== null &&
            entry.price !== null
              ? entry.size * entry.price
              : null);

          return (
            <div
              key={`${entry.transactionHash ?? "activity"}-${
                entry.timestamp
              }-${idx}`}
              className="flex flex-wrap items-center gap-3 py-1 text-[11px]"
            >
              <span className="text-muted-foreground">{timestamp}</span>
              <span className="rounded-full bg-brand-background/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {typeLabel}
              </span>
              {primaryLabel && (
                <span
                  className={cn(
                    "font-semibold",
                    isTrade
                      ? entry.side?.toUpperCase() === "BUY"
                        ? "text-outcome-yes"
                        : "text-outcome-no"
                      : "text-foreground"
                  )}
                >
                  {primaryLabel}
                </span>
              )}
              {isTrade && sizeDisplay && priceDisplay ? (
                <span className="text-foreground">
                  {sizeDisplay} @ {priceDisplay}
                </span>
              ) : null}
              {notional !== null && notional !== undefined ? (
                <span className="ml-auto font-semibold text-foreground">
                  {formatCompactCurrency(notional)}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
