import type { Activity } from "@/lib/models/frontend.models";

const TYPE_LABEL_MAP: Record<string, string> = {
  YIELD: "REWARDS",
  REDEEM: "REDEEM",
  MERGE: "MERGE",
  CONVERSION: "CONVERT",
};

const MARKET_LABEL_MAP: Record<string, string> = {
  YIELD: "4% Rewards",
  REWARD: "LP Rewards",
};

export function getActivityTypeLabel(entry: Activity): string {
  const type = entry.type?.toUpperCase() ?? "ACTIVITY";
  if (type === "TRADE") {
    return (entry.side ?? "TRADE").toUpperCase();
  }
  return TYPE_LABEL_MAP[type] ?? type;
}

export function getActivityMarketLabel(entry: Activity): string {
  const type = entry.type?.toUpperCase() ?? "";
  if (type in MARKET_LABEL_MAP) {
    return MARKET_LABEL_MAP[type];
  }
  return entry.title ?? entry.slug ?? "Market";
}
