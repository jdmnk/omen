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
