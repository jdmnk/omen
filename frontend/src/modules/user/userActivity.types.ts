import type {
  ClosedPosition,
  ProcessedActivity,
  OpenPosition,
} from "@/lib/models/frontend.models";

export type PositionActivity = {
  key: string;
  position: Position;
  entries: ProcessedActivity[];
  isLoading: boolean;
  isError: boolean;
};

export type PositionActivityLookup = Record<
  string,
  {
    entries?: ProcessedActivity[];
    isLoading?: boolean;
    isError?: boolean;
  }
>;

export type Position = OpenPosition | ClosedPosition;

export function isClosedPosition(
  position: Position
): position is ClosedPosition {
  return "timestamp" in position;
}

export function isOpenPosition(position: Position): position is OpenPosition {
  return "cashPnl" in position;
}
