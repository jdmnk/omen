import { ActivityChartModel } from "@/lib/models/api.models";
import { isClosedPosition, Position } from "../../userActivity.types";

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

function getEntriesVwap(
  position: Position,
  entries: ActivityChartModel[],
  side: "BUY" | "SELL"
) {
  let totalSize = 0;
  let totalCost = 0;
  console.log("entries", entries);

  for (const entry of entries) {
    if (
      entry.type === "TRADE" &&
      entry.side?.toUpperCase() === side &&
      entry.size &&
      entry.price
    ) {
      totalSize += entry.size;
      totalCost += entry.size * entry.price;
    }
    // redeem is also a sell
    if (
      side.toUpperCase() === "SELL" &&
      entry.type === "REDEEM" &&
      entry.size
    ) {
      console.log("redeem is also a sell", entry.size, position.curPrice);
      totalSize += entry.size;
      totalCost += entry.size * position.curPrice;
    }
  }
  if (totalSize === 0) return 0;
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
  entries: ActivityChartModel[]
) {
  //   return getEntriesVwap(entries, "BUY");
  return getPositionEntryPrice(position); // avg buy price
}

function getPositionBuyVolume(entries: ActivityChartModel[]) {
  let volume = 0;
  for (const entry of entries) {
    if (
      entry.type === "TRADE" &&
      entry.side?.toUpperCase() === "BUY" &&
      entry.size &&
      entry.price
    ) {
      volume += Math.abs(entry.size * entry.price);
    }
  }
  return volume;
}

function getPositionSellVolume(
  position: Position,
  entries: ActivityChartModel[]
) {
  let volume = 0;
  for (const entry of entries) {
    if (
      entry.type === "TRADE" &&
      entry.side?.toUpperCase() === "SELL" &&
      entry.size &&
      entry.price
    ) {
      volume += Math.abs(entry.size * entry.price);
    }

    // redeem is also a sell
    if (entry.type === "REDEEM" && entry.size) {
      volume += Math.abs(entry.size * position.curPrice);
    }
  }
  return volume;
}
// export function getPositionExitPrice(position: SelectablePosition) {
//   if (isClosedPosition(position)) {
//     return position.avgPrice;
//   }
//   return position.curPrice;
// }

export function getPositionAvgSellPrice(
  position: Position,
  entries: ActivityChartModel[]
) {
  return getEntriesVwap(position, entries, "SELL");
}

export function getPositionApr(
  position: Position,
  entries: ActivityChartModel[]
): number | null {
  const startTime = entries[0].timestamp * 1000; // convert to ms
  let endTime: number | null = null;
  if (isClosedPosition(position)) {
    endTime = new Date(position.endDate).getTime();
  } else {
    if (position.endDate) {
      endTime = new Date(position.endDate).getTime();
    } else {
      endTime = null;
    }
  }

  if (!endTime) return null;
  const durationMs = endTime - startTime;
  const entryPrice = getPositionAvgBuyPrice(position, entries); //getPositionEntryPrice(position);
  const finalPrice = isClosedPosition(position)
    ? getPositionAvgSellPrice(position, entries)
    : 1;
  const roi = (finalPrice - entryPrice) / entryPrice;
  const yearMs = 365 * 24 * 60 * 60 * 1000;

  console.log("start time", startTime);
  console.log("end time", endTime);
  console.log("duration ms", durationMs);
  console.log("entry price", entryPrice);
  console.log("final price", finalPrice);
  console.log("buy volume", getPositionBuyVolume(entries));
  console.log("sell volume", getPositionSellVolume(position, entries));
  console.log("roi", roi);
  console.log("year ms", yearMs);
  console.log("apr", roi * (yearMs / durationMs));

  return roi * (yearMs / durationMs);
}

export function getPositionVolume(
  position: Position,
  entries: ActivityChartModel[]
) {
  let volume = 0;
  for (const entry of entries) {
    if (entry.type === "TRADE" && entry.size && entry.price) {
      volume += Math.abs(entry.size * entry.price);
    }
  }
  return volume;
}
