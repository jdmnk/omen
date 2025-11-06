import PQueue from "p-queue";
import { UserPosition } from "@/lib/models/api.models";
import { fetchUserPositions } from "./fetch-user-positions";

/**
 * Fetches positions for multiple top holders with controlled concurrency to avoid API rate limits.
 * Returns a map of proxyWallet -> UserPosition[]
 */
export async function fetchTopHoldersPositions(
  wallets: string[],
  positionsPerHolder: number = 100
): Promise<Record<string, UserPosition[]>> {
  const result: Record<string, UserPosition[]> = {};
  const queue = new PQueue({ concurrency: 3 });

  // Process holders with controlled concurrency
  await Promise.all(
    wallets.map((wallet) =>
      queue.add(async () => {
        try {
          const positions = await fetchUserPositions(
            wallet,
            positionsPerHolder,
            positionsPerHolder
          );
          result[wallet] = positions;
        } catch (error) {
          // If fetching fails for a holder, set empty array
          console.error(
            `Failed to fetch positions for wallet ${wallet}:`,
            error
          );
          result[wallet] = [];
        }
      })
    )
  );

  return result;
}
