import type { Trade } from "@/lib/models/api.models";
import type { UserPosition } from "@/lib/models/frontend.models";

export type PositionActivity = {
  key: string;
  position: UserPosition;
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
