export function parseOutcomePrice(
  outcomePrices: string | null | undefined
): number | null {
  if (!outcomePrices) return null;
  try {
    const prices = outcomePrices.split(",").map((p) => parseFloat(p.trim()));
    // Return the first price (typically YES price)
    return prices.length > 0 && !isNaN(prices[0]) ? prices[0] : null;
  } catch {
    return null;
  }
}

export function parseVolume(volume: string | null | undefined): number {
  if (!volume) return 0;
  const num = parseFloat(volume);
  return isNaN(num) ? 0 : num;
}
