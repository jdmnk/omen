import { Activity, ProcessedActivity } from "@/lib/models/api.models";

type ActivityEntry = Activity | ProcessedActivity;

export function isBuyTrade(entry: ActivityEntry): boolean {
  return entry.type === "TRADE" && entry.side?.toUpperCase() === "BUY";
}

export function isSellTrade(entry: ActivityEntry): boolean {
  return entry.type === "TRADE" && entry.side?.toUpperCase() === "SELL";
}

export function isRedeem(entry: ActivityEntry): boolean {
  return entry.type === "REDEEM";
}

export function isMerge(entry: ActivityEntry): boolean {
  return entry.type === "MERGE";
}

export function isSplit(entry: ActivityEntry): boolean {
  return entry.type === "SPLIT";
}

export function isConversion(entry: ActivityEntry): boolean {
  return entry.type === "CONVERSION";
}

