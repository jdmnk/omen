export function getOutcomeColorClass(
  outcomeIndex?: number | null,
  fallback = "text-muted-foreground"
): string {
  if (outcomeIndex === 0) return "text-outcome-yes";
  if (outcomeIndex === 1) return "text-outcome-no";
  return fallback;
}
