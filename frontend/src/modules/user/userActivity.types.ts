import type {
  ClosedPosition,
  MarketActivityEntry,
  UserPosition,
} from "@/lib/models/frontend.models";

export type PositionActivity = {
  key: string;
  position: SelectablePosition;
  entries: MarketActivityEntry[];
  isLoading: boolean;
  isError: boolean;
};

export type PositionActivityLookup = Record<
  string,
  {
    entries?: MarketActivityEntry[];
    isLoading?: boolean;
    isError?: boolean;
  }
>;

export type SelectablePosition = UserPosition | ClosedPosition;
