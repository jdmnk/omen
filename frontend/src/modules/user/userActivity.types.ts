import type {
  ClosedPosition,
  MarketActivityChartModel,
  UserPosition,
} from "@/lib/models/frontend.models";

export type PositionActivity = {
  key: string;
  position: SelectablePosition;
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

export type SelectablePosition = UserPosition | ClosedPosition;

export function isClosedPosition(
  position: SelectablePosition
): position is ClosedPosition {
  return "timestamp" in position;
}

export function isOpenPosition(
  position: SelectablePosition
): position is UserPosition {
  return "cashPnl" in position;
}
