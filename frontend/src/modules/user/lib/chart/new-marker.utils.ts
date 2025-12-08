import { Position, ProcessedActivity } from "@/lib/models/frontend.models";
import { formatPrice } from "@/lib/ui/format.utils";
import { SeriesMarker, Time } from "lightweight-charts";

/**
 * Merge consecutive TRADE entries that:
 * 1) have the same price
 * 2) have the same side (BUY or SELL)
 * 3) occur within `maxBars` worth of time
 *
 * barDurationMs tells us how long one chart bar is.
 */
export function mergeConsecutiveTrades(
  activity: ProcessedActivity[],
  maxBars: number,
  barDurationMs: number
) {
  const merged: ProcessedActivity[] = [];
  const maxGap = maxBars * barDurationMs;

  // Work with chronological trades only
  const trades = activity
    .filter((e) => e.type === "TRADE")
    .sort((a, b) => a.timestamp - b.timestamp);

  let current: ProcessedActivity | null = null;

  for (const entry of trades) {
    if (!current) {
      current = { ...entry };
      continue;
    }

    const isSamePrice = entry.price === current.price;
    const isSameSide = entry.side === current.side;
    const isCloseEnough = entry.timestamp - current.timestamp <= maxGap;

    if (isSamePrice && isSameSide && isCloseEnough) {
      // Merge rule satisfied -> accumulate size and update timestamp and price
      current.size = (current.size ?? 0) + (entry.size ?? 0);
      current.timestamp = entry.timestamp;
      current.price = entry.price;
      continue;
    }

    // Not mergeable -> push previous and start new cluster
    merged.push(current);
    current = { ...entry };
  }

  if (current) merged.push(current);

  return merged;
}

export function createMarkerSizeScaler(entries: ProcessedActivity[]) {
  const sizes = entries
    .filter((e) => e.type === "TRADE")
    .map((e) => e.size || 1);

  const minSize = Math.min(...sizes);
  const maxSize = Math.max(...sizes);

  // Handle edge case where all trades are equal
  if (minSize === maxSize) {
    return () => 1.5; // uniform medium size
  }

  return (raw: number) => {
    const normalized = (raw - minSize) / (maxSize - minSize); // 0 to 1
    return 1 + normalized * 2; // scale to 1 to 3
  };
}

export function getMarkers(
  activity: ProcessedActivity[],
  maxBars: number,
  barDurationMs: number
) {
  // Step 1: merge consecutive trades based on price, side, time gap
  const merged = mergeConsecutiveTrades(activity, maxBars, barDurationMs);

  // Step 2: size scaling relative to merged data
  const scale = createMarkerSizeScaler(merged);

  // Step 3: convert to chart markers
  return merged.map((entry) => {
    const isBuy = entry.side === "BUY";

    return {
      time: entry.timestamp as Time,
      position: isBuy ? "belowBar" : "aboveBar",
      color: isBuy ? "#22c55e" : "#ef4444",
      shape: "circle",
      text: formatPrice(entry.price, { maximumFractionDigits: 1 }),
      size: scale(entry.size ?? 1),
    } as SeriesMarker<Time>;
  });
}
