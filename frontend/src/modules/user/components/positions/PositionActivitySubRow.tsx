"use client";

import { useEffect, useState } from "react";

import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import {
  formatCompactCurrency,
  formatPrice,
  formatNumber,
  formatRelativeTime,
} from "@/lib/ui/format.utils";
import type { PositionActivityLookup } from "../../userActivity.types";

type PositionActivitySubRowProps = {
  marketTitle: string | null;
  activityState?: PositionActivityLookup[string];
};

const PAGE_SIZE = 20;

export function PositionActivitySubRow({
  marketTitle,
  activityState,
}: PositionActivitySubRowProps) {
  const [page, setPage] = useState(1);
  const entries = activityState?.entries ?? [];
  const totalPages = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [activityState]);

  useEffect(() => {
    setPage((prev) => Math.min(Math.max(prev, 1), totalPages));
  }, [totalPages]);

  if (!activityState) {
    return (
      <div className="ml-7 rounded-md border border-dashed border-brand-stroke/60 px-4 py-2 text-[11px] text-muted-foreground">
        Select a position to show its activity.
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

  if (entries.length === 0) {
    return (
      <div className="ml-7 rounded-md border border-dashed border-brand-stroke/60 px-4 py-2 text-[11px] text-muted-foreground">
        No activity found for this position.
      </div>
    );
  }

  const startIndex = (page - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, entries.length);
  const pageEntries = entries.slice(startIndex, endIndex);

  return (
    <div className="md:ml-7 rounded-md border border-brand-stroke px-3 py-2 text-[11px]">
      <div className="mb-1 flex items-center justify-between uppercase tracking-wide text-muted-foreground">
        <span className="font-semibold">Position Activity</span>
        <span className="text-[10px]">
          Showing {entries.length === 0 ? 0 : startIndex + 1}-{endIndex} of{" "}
          {entries.length}
        </span>
      </div>
      <div className="flex flex-col divide-y divide-brand-stroke/30">
        {pageEntries.map((entry, idx) => {
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
              ? formatPrice(entry.price, { maximumFractionDigits: 1 })
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
              <span className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground bg-brand-highlight/20">
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
      {totalPages > 1 ? (
        <div className="mt-2 flex items-center justify-center gap-1 text-[10px] flex-wrap">
          {Array.from({ length: totalPages }, (_, pageIdx) => pageIdx + 1).map(
            (pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                onClick={() => setPage(pageNumber)}
                aria-current={pageNumber === page ? "page" : undefined}
                className={cn(
                  "h-6 min-w-[26px] rounded border px-2 font-semibold transition-colors cursor-pointer",
                  pageNumber === page
                    ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
                    : "border-transparent text-muted-foreground hover:border-brand-stroke hover:bg-brand-background/70"
                )}
              >
                {pageNumber}
              </button>
            )
          )}
        </div>
      ) : null}
    </div>
  );
}
