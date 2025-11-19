"use client";

import { useMemo, useState } from "react";
import type { Time, SeriesMarker } from "lightweight-charts";
import { Card } from "@/components/ui/card";
import { Interval } from "@/lib/models/frontend.models";
import {
  usePriceHistoryQuery,
  PriceHistoryPoint,
} from "@/lib/queries/price-history.query";
import type { PositionActivity } from "./userActivity.types";
import type { MarketActivityEntry } from "@/lib/models/frontend.models";
import { PositionPriceChart } from "./charts/PositionPriceChart";
import { formatCompactCurrency } from "@/lib/ui/format.utils";
import { getPositionKey } from "@/lib/utils/position.utils";
import { getPolymarketEventUrl } from "@/lib/utils/polymarket.utils";

const INTERVALS: Interval[] = ["1h", "6h", "1d", "1w", "1m", "max"];

const INTERVAL_LABELS: Record<Interval, string> = {
  "1h": "1H",
  "6h": "6H",
  "1d": "1D",
  "1w": "1W",
  "1m": "1M",
  max: "MAX",
};

const INTERVAL_FIDELITY: Record<Interval, number> = {
  "1h": 1,
  "6h": 5,
  "1d": 15,
  "1w": 60,
  "1m": 240,
  max: 1440,
};

function dedupeHistory(points: PriceHistoryPoint[] = []) {
  return [...new Map(points.map((item) => [item.t, item])).values()];
}

function useChartData(tokenId?: string | null, interval: Interval = "1w") {
  const fidelity = INTERVAL_FIDELITY[interval] ?? 3600;
  const enabled = Boolean(tokenId);
  const query = usePriceHistoryQuery(tokenId || "", interval, fidelity, {
    enabled,
  });
  const chartData = useMemo(
    () =>
      dedupeHistory(query.data?.history).map((point) => ({
        time: point.t,
        value: point.p * 100,
      })),
    [query.data?.history]
  );
  return { ...query, chartData };
}

function buildTradeMarkers(entries: MarketActivityEntry[] = []): SeriesMarker<Time>[] {
  return entries
    .map((entry, idx) => {
      if (entry.type !== "TRADE") return null;
      const timestamp = entry.timestamp;
      if (!timestamp) return null;
      const priceLabel =
        entry.price !== undefined && entry.price !== null
          ? `${Math.round(entry.price * 100)}¢`
          : "";
      const isBuy = (entry.side ?? "").toUpperCase() === "BUY";
      return {
        id: `trade-${entry.transactionHash ?? "activity"}-${idx}`,
        time: Math.floor(timestamp) as Time,
        position: isBuy ? "belowBar" : "aboveBar",
        color: isBuy ? "#22c55e" : "#ef4444",
        shape: "circle",
        text: priceLabel,
      } satisfies SeriesMarker<Time>;
    })
    .filter(Boolean) as SeriesMarker<Time>[];
}

function PositionChartCard({ activity }: { activity: PositionActivity }) {
  const [interval, setInterval] = useState<Interval>("max");
  const tokenId = activity.position.asset;
  const { chartData, isLoading, error } = useChartData(tokenId, interval);
  const markers = useMemo(
    () => buildTradeMarkers(activity.entries),
    [activity.entries]
  );
  const marketUrl = getPolymarketEventUrl(activity.position.slug ?? undefined);
  const positionValue =
    "currentValue" in activity.position
      ? activity.position.currentValue
      : activity.position.realizedPnl ?? activity.position.totalBought ?? 0;

  return (
    <Card className="flex h-72 flex-col gap-2 border border-brand-stroke/70 bg-brand-background/40 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <a
            href={marketUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block max-w-full truncate text-sm font-semibold text-foreground hover:underline"
          >
            {activity.position.title ?? activity.position.slug}
          </a>
          <p className="text-xs text-muted-foreground">
              {activity.position.outcome ?? "Outcome"} ·{" "}
            {formatCompactCurrency(positionValue)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {INTERVALS.map((int) => (
            <button
              key={int}
              onClick={() => setInterval(int)}
              className={`rounded border border-brand-stroke px-2 py-0.5 text-[11px] ${
                interval === int
                  ? "bg-brand-highlight text-secondary-foreground"
                  : "bg-brand-background text-brand-foreground hover:bg-brand-highlight/40"
              }`}
            >
              {INTERVAL_LABELS[int]}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1">
        {tokenId ? (
          <PositionPriceChart
            data={chartData}
            markers={markers}
            isLoading={isLoading}
            error={error}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            Missing market token for this position.
          </div>
        )}
      </div>
    </Card>
  );
}

export function UserSelectedMarketCharts({
  activities,
}: {
  activities: PositionActivity[];
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  if (!activities || activities.length === 0) {
    return null;
  }

  return (
    <Card className="flex flex-col border border-brand-stroke/80 bg-brand-background/60">
      <div className="flex items-center justify-between px-4 py-3 text-sm font-semibold">
        <span>Selected Market Charts ({activities.length})</span>
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="rounded border border-brand-stroke px-2 py-1 text-xs text-brand-foreground hover:bg-brand-highlight/30"
        >
          {isExpanded ? "Hide" : "Show"}
        </button>
      </div>
      {isExpanded ? (
        <div className="grid gap-4 border-t border-brand-stroke/60 px-4 pb-4 pt-3 md:grid-cols-2">
          {activities.map((activity) => (
            <PositionChartCard
              key={getPositionKey(activity.position)}
              activity={activity}
            />
          ))}
        </div>
      ) : (
        <div className="px-4 pb-4 text-xs text-muted-foreground">
          Charts hidden. Select positions above and click “Show” to review each
          market’s price action with your trades overlaid.
        </div>
      )}
    </Card>
  );
}
