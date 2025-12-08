import type { ProcessedActivity } from "@/lib/models/frontend.models";
import type { SeriesMarker, Time } from "lightweight-charts";
import { formatPrice } from "@/lib/ui/format.utils";

const BUY_COLOR = "#22c55e";
const SELL_COLOR = "#ef4444";
const DEFAULT_BUCKET_SECONDS = 60;
const DEFAULT_NEARBY_BUCKETS = 5;
const MIN_MARKER_SIZE = 1;
const MAX_MARKER_SIZE = 4;

function getMarkerSizeFromExposure(
  exposure: number,
  maxExposure: number
): number {
  if (!Number.isFinite(exposure) || exposure <= 0 || maxExposure <= 0) {
    return MIN_MARKER_SIZE;
  }
  const normalized = Math.min(1, exposure / maxExposure);
  const eased = Math.sqrt(normalized); // soften the jump between exposures
  return MIN_MARKER_SIZE + eased * (MAX_MARKER_SIZE - MIN_MARKER_SIZE);
}

function bucketTimestamp(timestamp: number, bucketSeconds?: number) {
  const size =
    bucketSeconds && bucketSeconds > 0 ? bucketSeconds : DEFAULT_BUCKET_SECONDS;
  return Math.floor(timestamp / size) * size;
}

export function getShareChartMarkers(
  entries: ProcessedActivity[] = [],
  bucketSeconds?: number,
  nearbyBuckets?: number
): SeriesMarker<Time>[] {
  const bucketSize =
    bucketSeconds && bucketSeconds > 0 ? bucketSeconds : DEFAULT_BUCKET_SECONDS;
  const range = Math.max(0, nearbyBuckets ?? DEFAULT_NEARBY_BUCKETS);
  let maxExposure = 0;

  const groups = new Map<
    string,
    Map<
      number,
      { marker: SeriesMarker<Time>; exposure: number; price: number | null }
    >
  >();

  entries.forEach((entry) => {
    if ((entry.type ?? "").toUpperCase() !== "TRADE") return;
    if (entry.price === null || entry.price === undefined) return;
    if (!Number.isFinite(entry.timestamp)) return;

    const side = (entry.side ?? "").toUpperCase();
    const isBuy = side === "BUY";
    const exposure = Math.abs(entry.cumExposure ?? 0);
    maxExposure = Math.max(maxExposure, exposure);

    const priceInCents = Math.round(entry.price * 100);
    const priceLabel = formatPrice(entry.price, { maximumFractionDigits: 0 });
    const bucketedTime = bucketTimestamp(entry.timestamp, bucketSize);
    const bucketIndex = Math.floor(bucketedTime / bucketSize);
    const priceSideKey = `${side || "TRADE"}-${priceInCents}`;

    const marker: SeriesMarker<Time> = {
      id: `trade-${priceSideKey}-${bucketedTime}`,
      time: bucketedTime as Time,
      position: "inBar", //isBuy ? "belowBar" : "aboveBar",
      color: isBuy ? BUY_COLOR : SELL_COLOR,
      shape: "circle",
      // text: priceLabel,
    };

    const bucketMap =
      groups.get(priceSideKey) ??
      new Map<
        number,
        { marker: SeriesMarker<Time>; exposure: number; price: number | null }
      >();

    let existingGroup:
      | { marker: SeriesMarker<Time>; exposure: number; price: number | null }
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
      existingGroup.exposure = Math.max(existingGroup.exposure, exposure);
      existingGroup.price = entry.price ?? existingGroup.price;
    } else {
      bucketMap.set(bucketIndex, {
        marker,
        exposure,
        price: entry.price ?? null,
      });
      groups.set(priceSideKey, bucketMap);
    }
  });

  const groupedMarkers = Array.from(groups.values()).flatMap((bucketMap) =>
    Array.from(bucketMap.values()).map(({ marker, exposure, price }) => ({
      marker,
      price,
      size: getMarkerSizeFromExposure(exposure, maxExposure),
    }))
  );

  const smallestSize = groupedMarkers.reduce(
    (min, grouped) => Math.min(min, grouped.size),
    Infinity
  );
  const sizeScale =
    smallestSize > 0 && Number.isFinite(smallestSize)
      ? MIN_MARKER_SIZE / smallestSize
      : 1;

  return groupedMarkers.map(({ marker, price, size }) => ({
    ...marker,
    // text:
    //   price !== null && price !== undefined
    //     ? formatPrice(price, { maximumFractionDigits: 0 })
    //     : marker.text,
    size: Math.max(MIN_MARKER_SIZE, size * sizeScale),
  }));
}
