import type { MarketActivityEntry } from "@/lib/models/frontend.models";
import type { SeriesMarker, Time } from "lightweight-charts";

const BUY_COLOR = "#22c55e";
const SELL_COLOR = "#ef4444";
const DEFAULT_BUCKET_SECONDS = 60;
const DEFAULT_NEARBY_BUCKETS = 5;

function bucketTimestamp(timestamp: number, bucketSeconds?: number) {
  const size =
    bucketSeconds && bucketSeconds > 0 ? bucketSeconds : DEFAULT_BUCKET_SECONDS;
  return Math.floor(timestamp / size) * size;
}

export function buildGroupedTradeMarkers(
  entries: MarketActivityEntry[] = [],
  bucketSeconds?: number,
  nearbyBuckets?: number
): SeriesMarker<Time>[] {
  const bucketSize =
    bucketSeconds && bucketSeconds > 0 ? bucketSeconds : DEFAULT_BUCKET_SECONDS;
  const range = Math.max(0, nearbyBuckets ?? DEFAULT_NEARBY_BUCKETS);

  const groups = new Map<
    string,
    Map<number, { marker: SeriesMarker<Time>; count: number }>
  >();

  entries.forEach((entry) => {
    if ((entry.type ?? "").toUpperCase() !== "TRADE") return;
    if (entry.price === null || entry.price === undefined) return;
    if (!Number.isFinite(entry.timestamp)) return;

    const side = (entry.side ?? "").toUpperCase();
    const isBuy = side === "BUY";
    const priceInCents = Math.round(entry.price * 100);
    const priceLabel = `${priceInCents}¢`;
    const bucketedTime = bucketTimestamp(entry.timestamp, bucketSize);
    const bucketIndex = Math.floor(bucketedTime / bucketSize);
    const priceSideKey = `${side || "TRADE"}-${priceInCents}`;

    const marker: SeriesMarker<Time> = {
      id: `trade-${priceSideKey}-${bucketedTime}`,
      time: bucketedTime as Time,
      position: isBuy ? "belowBar" : "aboveBar",
      color: isBuy ? BUY_COLOR : SELL_COLOR,
      shape: "circle",
      text: priceLabel,
    };

    const bucketMap =
      groups.get(priceSideKey) ??
      new Map<number, { marker: SeriesMarker<Time>; count: number }>();

    let existingGroup:
      | { marker: SeriesMarker<Time>; count: number }
      | undefined;

    for (let offset = 0; offset <= range; offset++) {
      const forwardIndex = bucketIndex + offset;
      const backwardIndex = bucketIndex - offset;
      if (bucketMap.has(forwardIndex)) {
        existingGroup = bucketMap.get(forwardIndex);
        break;
      }
      if (offset !== 0 && bucketMap.has(backwardIndex)) {
        existingGroup = bucketMap.get(backwardIndex);
        break;
      }
    }

    if (existingGroup) {
      existingGroup.count += 1;
    } else {
      bucketMap.set(bucketIndex, { marker, count: 1 });
      groups.set(priceSideKey, bucketMap);
    }
  });

  return Array.from(groups.values()).flatMap((bucketMap) =>
    Array.from(bucketMap.values()).map(({ marker, count }) => ({
      ...marker,
      text: count > 1 && marker.text ? `${marker.text}` : marker.text,
    }))
  );
}
