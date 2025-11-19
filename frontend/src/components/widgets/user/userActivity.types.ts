import type { Trade } from "@/lib/models/api.models";
import type { UserPosition, ClosedPosition } from "@/lib/models/frontend.models";

export type SelectablePosition = UserPosition | ClosedPosition;

export type PositionActivity = {
  key: string;
  position: SelectablePosition;
  trades: Trade[];
  isLoading: boolean;
  isError: boolean;
};

export type PositionActivityLookup = Record<
  string,
  {
    trades?: Trade[];
    isLoading?: boolean;
    isError?: boolean;
  }
>;
