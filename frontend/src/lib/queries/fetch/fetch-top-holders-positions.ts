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
  let rateLimited = false;

  // Process holders with controlled concurrency
  try {
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
            const status = (error as any)?.status;
            if (status === 429) {
              rateLimited = true;
              // Cancel all remaining queued tasks; running tasks will complete
              queue.clear();
              throw error;
            }
            // For non-429 errors, log and continue with empty positions for this wallet
            console.error(
              `Failed to fetch positions for wallet ${wallet}:`,
              error
            );
            result[wallet] = [];
          }
        })
      )
    );
  } catch (error) {
    if (rateLimited) {
      // Propagate the error so callers can keep previous data (React Query) or handle gracefully
      throw error;
    }
    // For other errors, fall through and return whatever we have
  }

  return result;
}
