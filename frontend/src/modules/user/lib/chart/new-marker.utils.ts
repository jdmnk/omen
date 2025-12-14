import { ProcessedActivity } from "@/lib/models/frontend.models";
import { SeriesMarker, Time } from "lightweight-charts";

// ============ MARKER SIZE CONFIG ============
// Tune these values to adjust marker appearance
const MARKER_CONFIG = {
  // Base size multiplier (scales all markers uniformly)
  scale: 1.0,
  // Size for uniform markers (when trades are similar)
  uniform: 1.75,
  // Min/max range for variable sizing
  min: 1.5,
  max: 3,
  // Ratio threshold: if max/min < this, use uniform sizing
  similarityThreshold: 3,
};
// ============================================

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

  // Work with chronological trades only (copy array to avoid mutating original)
  const trades = [...activity].sort((a, b) => a.timestamp - b.timestamp);

  let current: ProcessedActivity | null = null;

  for (const entry of trades) {
    if (entry.type !== "TRADE") {
      merged.push(entry);
      continue;
    }
    if (!current) {
      current = { ...entry };
      continue;
    }

    // const isSamePrice = true; //entry.price === current.price;
    const isPriceWithinPct =
      Math.abs((entry.price ?? 0) - (current.price ?? 0)) <=
      (current.price ?? 0) * 0.2; // 20 pct
    const isSameSide = entry.side === current.side;
    const isCloseEnough = entry.timestamp - current.timestamp <= maxGap;

    if (isPriceWithinPct && isSameSide && isCloseEnough) {
      // Merge rule satisfied -> accumulate size and calculate weighted averages
      const currentSize = current.size ?? 0;
      const entrySize = entry.size ?? 0;
      const totalSize = currentSize + entrySize;

      // Weighted average price: larger trades have more influence
      const currentPrice = current.price ?? 0;
      const entryPrice = entry.price ?? 0;
      current.price =
        totalSize > 0
          ? (currentSize * currentPrice + entrySize * entryPrice) / totalSize
          : entryPrice;

      // Weighted average timestamp: represents the "center of mass" of the trades
      const currentTimestamp = current.timestamp;
      const entryTimestamp = entry.timestamp;
      current.timestamp =
        totalSize > 0
          ? Math.round(
              (currentSize * currentTimestamp + entrySize * entryTimestamp) /
                totalSize
            )
          : entryTimestamp;

      current.size = totalSize;
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
  const { scale, uniform, min, max, similarityThreshold } = MARKER_CONFIG;

  const sizes = entries
    // .filter((e) => e.type === "TRADE")
    .map((e) => e.size || 1);

  if (sizes.length === 0) {
    return () => uniform * scale;
  }

  const minSize = Math.min(...sizes);
  const maxSize = Math.max(...sizes);

  // Handle edge case where all trades are equal
  if (minSize === maxSize) {
    return () => uniform * scale;
  }

  // If max is less than threshold, sizes are similar enough - use uniform sizing
  // This prevents 514 vs 515 from showing as vastly different markers
  const ratio = maxSize / minSize;
  if (ratio < similarityThreshold) {
    return () => uniform * scale;
  }

  // Use logarithmic scaling for better visual representation of large ranges
  // This compresses extreme differences while still showing meaningful variation
  const logMin = Math.log(minSize);
  const logMax = Math.log(maxSize);
  const logRange = logMax - logMin;
  const sizeRange = max - min;

  return (raw: number) => {
    const logValue = Math.log(Math.max(raw, 1));
    const normalized = (logValue - logMin) / logRange; // 0 to 1
    return (min + normalized * sizeRange) * scale;
  };
}

// Extended marker type that includes the execution price for accurate positioning
export type MarkerWithPrice = SeriesMarker<Time> & {
  /** Execution price (0-100 scale for percentage display) */
  value?: number;
};

export function getMarkersForMarketChart(
  activity: ProcessedActivity[],
  maxBars: number,
  barDurationMs: number
): MarkerWithPrice[] {
  // Step 1: merge consecutive trades based on price, side, time gap
  const merged = mergeConsecutiveTrades(activity, maxBars, barDurationMs);

  // Step 2: size scaling relative to merged data
  const scale = createMarkerSizeScaler(merged);

  // Step 3: convert to chart markers with execution price
  return merged.map((entry) => {
    const isBuy = entry.side === "BUY";
    const color =
      entry.type === "TRADE" ? (isBuy ? "#35CE8D" : "#F2545B") : "#acacac";

    return {
      time: entry.timestamp as Time,
      position: isBuy ? "belowBar" : "aboveBar",
      color,
      shape: "circle",
      text: " ",
      size: scale(entry.size ?? 1),
      // Include execution price (convert 0-1 to 0-100 for percentage display)
      value: entry.price != null ? entry.price * 100 : undefined,
    } as MarkerWithPrice;
  });
}

export function getMarkersForShareChart(
  activity: ProcessedActivity[],
  maxBars: number,
  barDurationMs: number
): MarkerWithPrice[] {
  let merged: ProcessedActivity[] = activity;
  if (maxBars > 0) {
    // Step 1: merge consecutive trades based on price, side, time gap
    merged = mergeConsecutiveTrades(activity, maxBars, barDurationMs);
  }

  // Step 2: size scaling relative to merged data
  const scale = createMarkerSizeScaler(merged);

  // Step 3: convert to chart markers with execution price
  return merged.map((entry) => {
    const isBuy = entry.side === "BUY";
    const color =
      entry.type === "TRADE" ? (isBuy ? "#35CE8D" : "#F2545B") : "#acacac";

    return {
      time: entry.timestamp as Time,
      position: "inBar",
      color,
      shape: "circle",
      size: scale(entry.size ?? 1),
      text: " ",
      // Include execution price (convert 0-1 to 0-100 for percentage display)
      value: entry.price != null ? entry.price * 100 : undefined,
    } as MarkerWithPrice;
  });
}
