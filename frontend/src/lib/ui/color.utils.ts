export function getOutcomeColorClass(
  outcomeIndex?: number | null,
  fallback = "text-muted-foreground"
): string {
  if (outcomeIndex === 0) return "text-outcome-yes";
  if (outcomeIndex === 1) return "text-outcome-no";
  return fallback;
}

export function getPnlColorClass(pnl: number): string {
  if (pnl > 0) return "text-outcome-yes";
  if (pnl < 0) return "text-outcome-no";
  return "text-outcome-neutral";
}
