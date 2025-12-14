import { ProcessedActivity } from "@/lib/models/api.models";
import { isClosedPosition } from "../position.utils";
import { Position } from "@/lib/models/frontend.models";
import { isBuyTrade, isRedeem, isSellTrade } from "../activity-type.utils";

export function getAbsolutePnl(position: Position) {
  if (isClosedPosition(position)) {
    return position.realizedPnl;
  }
  return position.cashPnl;
}

export function getPercentPnl(position: Position) {
  if (isClosedPosition(position)) {
    return position.totalBought > 0
      ? (position.realizedPnl / position.totalBought) * 100
      : 0;
  }
  return position.percentPnl;
}

// Redemption price is 1 for winning positions (you get $1 per share)
const REDEMPTION_PRICE = 1;

function getEntriesVwap(entries: ProcessedActivity[], side: "BUY" | "SELL") {
  let totalSize = 0;
  let totalCost = 0;
  console.log("entries", entries);
  if (!entries || entries.length === 0) return null;

  const isSideMatch = side === "BUY" ? isBuyTrade : isSellTrade;

  for (const entry of entries) {
    if (isSideMatch(entry) && entry.size && entry.price) {
      totalSize += entry.size;
      totalCost += entry.size * entry.price;
    }
    // Redeem is also a sell - redemption price is always 1 (winning position)
    if (side === "SELL" && isRedeem(entry) && entry.size) {
      totalSize += entry.size;
      totalCost += entry.size * REDEMPTION_PRICE;
    }
  }
  if (totalSize === 0) return null;
  return totalCost / totalSize;
}

// this is avg buy price (both open and closed positions)
export function getPositionEntryPrice(position: Position) {
  if (isClosedPosition(position)) {
    return position.avgPrice;
  }
  return position.avgPrice;
}

export function getPositionAvgBuyPrice(
  position: Position,
  entries: ProcessedActivity[]
) {
  //   return getEntriesVwap(entries, "BUY");
  return getPositionEntryPrice(position); // avg buy price
}

export function getPositionAvgSellPrice(
  entries: ProcessedActivity[]
): number | null {
  return getEntriesVwap(entries, "SELL");
}

export function getPositionApr(
  position: Position,
  entries: ProcessedActivity[]
): number | null {
  console.log("entries", entries);
  console.log("position", position);
  // Guard: need at least one entry
  if (!entries || entries.length === 0) return null;

  // Find the earliest BUY trade timestamp (not just any entry)
  const buyTimestamps = entries
    .filter((e) => isBuyTrade(e) && e.timestamp)
    .map((e) => e.timestamp);

  if (buyTimestamps.length === 0) return null;

  const startTime = Math.min(...buyTimestamps) * 1000; // convert to ms
  // Determine end time
  let endTime: number | null = null;
  if (isClosedPosition(position)) {
    endTime = position.timestamp * 1000;
  } else if (position.endDate) {
    endTime = new Date(position.endDate).getTime();
  }

  if (!endTime || !Number.isFinite(endTime)) return null;

  const durationMs = endTime - startTime;
  console.log("startTime", startTime, new Date(startTime).toISOString());
  console.log("endTime", endTime, new Date(endTime).toISOString());
  console.log("durationMs", durationMs);

  // Guard: duration must be positive and at least 1 hour to avoid extreme APR
  // const MIN_DURATION_MS = 60 * 60 * 1000; // 1 hour
  // if (durationMs < MIN_DURATION_MS) return null;

  const entryPrice = getPositionAvgBuyPrice(position, entries);

  // Guard: entry price must be valid and > 0
  if (!entryPrice || entryPrice <= 0) return null;

  // For closed positions, use avg sell price; for open, assume exit at $1 (market resolves in favor)
  const finalPrice = isClosedPosition(position)
    ? getPositionAvgSellPrice(entries)
    : 1;

  // Guard: final price must be valid
  if (finalPrice === null || finalPrice < 0) return null;

  const roi = (finalPrice - entryPrice) / entryPrice;
  const yearMs = 365 * 24 * 60 * 60 * 1000;

  return roi * (yearMs / durationMs);
}

export function getPositionVolume(
  position: Position,
  entries: ProcessedActivity[]
) {
  let volume = 0;
  for (const entry of entries) {
    if (entry.type === "TRADE" && entry.size && entry.price) {
      volume += Math.abs(entry.size * entry.price);
    } else if (entry.type === "MERGE" && entry.size && entry.usdcSize) {
      volume += Math.abs(entry.usdcSize / 2);
    } else if (entry.type === "SPLIT" && entry.size && entry.usdcSize) {
      volume += Math.abs(entry.usdcSize / 2);
    }
  }
  return volume;
}
