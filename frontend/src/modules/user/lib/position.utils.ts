import type { OpenPosition } from "@/lib/models/frontend.models";

type PositionLike = Pick<OpenPosition, "conditionId" | "outcomeIndex"> & {
  asset?: string | null;
};

export function getPositionKey(position: PositionLike) {
  const condition = position.conditionId || "unknown";
  const outcome =
    position.outcomeIndex === null || position.outcomeIndex === undefined
      ? "na"
      : position.outcomeIndex;
  const asset = position.asset ?? "asset";
  return `${condition}:${outcome}:${asset}`;
}
