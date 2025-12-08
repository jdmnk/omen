import type {
  ClosedPosition,
  ProcessedActivity,
  OpenPosition,
  Position,
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
