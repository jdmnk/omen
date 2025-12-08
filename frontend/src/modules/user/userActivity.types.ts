import type {
  ClosedPosition,
  MarketActivityChartModel,
  UserPosition,
} from "@/lib/models/frontend.models";

export type PositionActivity = {
  key: string;
  position: Position;
  entries: MarketActivityChartModel[];
  isLoading: boolean;
  isError: boolean;
};

export type PositionActivityLookup = Record<
  string,
  {
    entries?: MarketActivityChartModel[];
    isLoading?: boolean;
    isError?: boolean;
  }
>;

export type Position = UserPosition | ClosedPosition;

export function isClosedPosition(
  position: Position
): position is ClosedPosition {
  return "timestamp" in position;
}

export function isOpenPosition(position: Position): position is UserPosition {
  return "cashPnl" in position;
}
