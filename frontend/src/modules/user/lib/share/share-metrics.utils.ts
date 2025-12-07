import { MarketActivityChartModel } from "@/lib/models/api.models";
import { isClosedPosition, SelectablePosition } from "../../userActivity.types";

export function getAbsolutePnl(position: SelectablePosition) {
  if (isClosedPosition(position)) {
    return position.realizedPnl;
  }
  return position.cashPnl;
}

export function getPercentPnl(position: SelectablePosition) {
  if (isClosedPosition(position)) {
    return position.totalBought > 0
      ? (position.realizedPnl / position.totalBought) * 100
      : 0;
  }
  return position.percentPnl;
}

export function getPositionVolume(position: SelectablePosition) {
  if (isClosedPosition(position)) {
    return position.curPrice * position.totalBought;
  }
  return position.currentValue;
}

export function getPositionEntryPrice(position: SelectablePosition) {
  if (isClosedPosition(position)) {
    return position.avgPrice;
  }
  return position.avgPrice;
}

export function getPositionExitPrice(position: SelectablePosition) {
  if (isClosedPosition(position)) {
    return position.curPrice;
  }
  return position.curPrice;
}

export function getPositionApr(
  position: SelectablePosition,
  entries: MarketActivityChartModel[]
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
  const entryPrice = getPositionEntryPrice(position);
  const finalPrice = isClosedPosition(position)
    ? getPositionExitPrice(position)
    : 1;
  const roi = (finalPrice - entryPrice) / entryPrice;
  const yearMs = 365 * 24 * 60 * 60 * 1000;

  console.log("start time", startTime);
  console.log("end time", endTime);
  console.log("duration ms", durationMs);
  console.log("entry price", entryPrice);
  console.log("final price", finalPrice);
  console.log("roi", roi);
  console.log("year ms", yearMs);
  console.log("apr", roi * (yearMs / durationMs));

  return roi * (yearMs / durationMs);
}
