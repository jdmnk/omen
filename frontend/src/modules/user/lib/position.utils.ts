import {
  ClosedPosition,
  OpenPosition,
  Position,
} from "@/lib/models/frontend.models";

export function getPositionKey(position: Position) {
  const condition = position.conditionId || "unknown";
  const outcome =
    position.outcomeIndex === null || position.outcomeIndex === undefined
      ? "na"
      : position.outcomeIndex;
  const asset = position.asset ?? "asset";
  return `${condition}:${outcome}:${asset}`;
}

export function isClosedPosition(
  position: Position
): position is ClosedPosition {
  return "timestamp" in position;
}

export function isOpenPosition(position: Position): position is OpenPosition {
  return "cashPnl" in position;
}
