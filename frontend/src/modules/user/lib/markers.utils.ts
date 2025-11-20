import type { MarketActivityEntry } from "@/lib/models/frontend.models";
import type { SeriesMarker, Time } from "lightweight-charts";

const BUY_COLOR = "#22c55e";
const SELL_COLOR = "#ef4444";
const DEFAULT_BUCKET_SECONDS = 60;

function bucketTimestamp(timestamp: number, bucketSeconds?: number) {
  const size =
    bucketSeconds && bucketSeconds > 0 ? bucketSeconds : DEFAULT_BUCKET_SECONDS;
  return Math.floor(timestamp / size) * size;
}

export function buildGroupedTradeMarkers(
  entries: MarketActivityEntry[] = [],
  bucketSeconds?: number
): SeriesMarker<Time>[] {
  const groups = new Map<
    string,
    { marker: SeriesMarker<Time>; count: number }
  >();

  entries.forEach((entry) => {
    if ((entry.type ?? "").toUpperCase() !== "TRADE") return;
    if (entry.price === null || entry.price === undefined) return;
    if (!Number.isFinite(entry.timestamp)) return;

    const side = (entry.side ?? "").toUpperCase();
    const isBuy = side === "BUY";
    const priceInCents = Math.round(entry.price * 100);
    const priceLabel = `${priceInCents}¢`;
    const bucketedTime = bucketTimestamp(entry.timestamp, bucketSeconds);
    const key = `${side || "TRADE"}-${priceInCents}-${bucketedTime}`;

    const marker: SeriesMarker<Time> = {
      id: `trade-${key}`,
      time: bucketedTime as Time,
      position: isBuy ? "belowBar" : "aboveBar",
      color: isBuy ? BUY_COLOR : SELL_COLOR,
      shape: "circle",
      text: priceLabel,
    };

    const existing = groups.get(key);
    if (existing) {
      existing.count += 1;
      return;
    }

    groups.set(key, { marker, count: 1 });
  });

  return Array.from(groups.values()).map(({ marker, count }) => ({
    ...marker,
    text:
      count > 1 && marker.text ? `${marker.text} (${count})` : marker.text,
  }));
}
