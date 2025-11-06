import { TopHolder, UserPosition } from "@/lib/models/api.models";
import { fetchUserPositions } from "./fetch-user-positions";

/**
 * Fetches positions for multiple top holders sequentially to avoid API rate limits.
 * Returns a map of proxyWallet -> UserPosition[]
 */
export async function fetchTopHoldersPositions(
  wallets: string[],
  positionsPerHolder: number = 100
): Promise<Record<string, UserPosition[]>> {
  const result: Record<string, UserPosition[]> = {};

  // Process holders sequentially to avoid overwhelming the API
  for (const wallet of wallets) {
    try {
      const positions = await fetchUserPositions(
        wallet,
        positionsPerHolder,
        positionsPerHolder
      );
      result[wallet] = positions;
    } catch (error) {
      // If fetching fails for a holder, set empty array
      console.error(`Failed to fetch positions for wallet ${wallet}:`, error);
      result[wallet] = [];
    }
  }

  return result;
}
