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

export function getPositionApr(position: SelectablePosition) {
  return 0;
}
