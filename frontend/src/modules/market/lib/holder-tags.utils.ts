import { UserPosition, TopHolderAnalysis } from "@/lib/models/api.models";

export type HolderTagIcon =
  | "expert"
  | "high-confidence"
  | "insider"
  | "top-trader"
  | "whale";

export type HolderTag = {
  category: "positions" | "wallet-age" | "trader-type";
  label: string;
  icon: HolderTagIcon;
};

/**
 * Calculates wallet age in days from walletCreatedAt timestamp
 */
function getWalletAgeDays(walletCreatedAt: string | null): number | null {
  if (!walletCreatedAt) return null;

  try {
    // Parse timestamp (could be Unix seconds or ISO string)
    const timestamp = parseInt(walletCreatedAt, 10);
    const createdAt = isNaN(timestamp)
      ? new Date(walletCreatedAt)
      : new Date(timestamp * 1000); // Convert seconds to milliseconds

    if (isNaN(createdAt.getTime())) return null;

    const now = new Date();
    const diffMs = now.getTime() - createdAt.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return diffDays;
  } catch {
    return null;
  }
}

/**
 * Gets wallet age tags based on walletCreatedAt
 */
function getWalletAgeTags(walletCreatedAt: string | null): HolderTag[] {
  const ageDays = getWalletAgeDays(walletCreatedAt);
  if (ageDays === null) return [];

  const tags: HolderTag[] = [];

  if (ageDays < 30) {
    tags.push({
      category: "wallet-age",
      label: "new wallet",
      icon: "expert",
    });
  } else if (ageDays < 365) {
    tags.push({
      category: "wallet-age",
      label: "mid old wallet",
      icon: "expert",
    });
  } else {
    tags.push({
      category: "wallet-age",
      label: "very old wallet",
      icon: "expert",
    });
  }

  return tags;
}

/**
 * Gets position-related tags based on holder's other positions
 */
function getPositionTags(
  holder: TopHolderAnalysis,
  allPositions: UserPosition[] | undefined,
  currentMarketTokenId: string
): HolderTag[] {
  const tags: HolderTag[] = [];

  if (!allPositions || allPositions.length === 0) {
    return tags;
  }

  // Filter out positions in the current market (using holder's asset which is the token for this position)
  const otherPositions = allPositions.filter(
    (pos) => pos.asset !== holder.asset
  );

  // Check if they have few other positions (less than 5)
  if (otherPositions.length > 0 && otherPositions.length < 5) {
    tags.push({
      category: "positions",
      label: "Has few other positions",
      icon: "expert",
    });
  }

  // Check if this is one of their largest positions
  // Sort all positions by currentValue (descending)
  const sortedPositions = [...allPositions].sort(
    (a, b) => b.currentValue - a.currentValue
  );

  // Find the current market position's rank (using holder's asset)
  const currentPosition = allPositions.find(
    (pos) => pos.asset === holder.asset
  );

  if (currentPosition) {
    const rank = sortedPositions.findIndex(
      (pos) => pos.asset === currentPosition.asset
    );

    // If it's in the top 3 largest positions
    if (rank >= 0 && rank < 3) {
      tags.push({
        category: "positions",
        label:
          "This trader's wallet shows characteristics that might indicate insider knowledge.",
        icon: "insider",
      });
    }
  }

  return tags;
}

/**
 * Gets trader-type tags based on profitability, wallet size, and position characteristics
 */
function getTraderTypeTags(
  holder: TopHolderAnalysis,
  allPositions: UserPosition[] | undefined
): HolderTag[] {
  const tags: HolderTag[] = [];

  // Top Trader: Check if they have strong overall P&L
  if (holder.realizedPnl !== null && holder.realizedPnl !== undefined) {
    // Consider top trader if realized PnL is significantly positive (e.g., > $10k)
    if (holder.realizedPnl > 10000) {
      tags.push({
        category: "trader-type",
        label: "Top Trader",
        icon: "top-trader",
      });
    }
  } else if (allPositions && allPositions.length > 0) {
    // Calculate total realized PnL from all positions
    const totalRealizedPnl = allPositions.reduce(
      (sum, pos) => sum + (pos.realizedPnl || 0),
      0
    );
    if (totalRealizedPnl > 10000) {
      tags.push({
        category: "trader-type",
        label: "Top Trader",
        icon: "top-trader",
      });
    }
  }

  // Whale: Check wallet balance or total position sizes
  if (holder.walletBalance !== null && holder.walletBalance !== undefined) {
    // Consider whale if wallet balance is very high (e.g., > $100k)
    if (holder.walletBalance > 100000) {
      tags.push({
        category: "trader-type",
        label: "Whale",
        icon: "whale",
      });
    }
  } else if (allPositions && allPositions.length > 0) {
    // Calculate total position value
    const totalPositionValue = allPositions.reduce(
      (sum, pos) => sum + pos.currentValue,
      0
    );
    if (totalPositionValue > 100000) {
      tags.push({
        category: "trader-type",
        label: "Whale",
        icon: "whale",
      });
    }
  }

  // High Confidence: Position is notably larger than usual position size
  if (allPositions && allPositions.length > 1) {
    const currentPosition = allPositions.find(
      (pos) => pos.asset === holder.asset
    );
    if (currentPosition) {
      // Calculate average position value (excluding current position)
      const otherPositions = allPositions.filter(
        (pos) => pos.asset !== holder.asset
      );
      if (otherPositions.length > 0) {
        const avgPositionValue =
          otherPositions.reduce((sum, pos) => sum + pos.currentValue, 0) /
          otherPositions.length;

        // If current position is 2x or more than average, it's high confidence
        if (
          currentPosition.currentValue > avgPositionValue * 2 &&
          avgPositionValue > 0
        ) {
          tags.push({
            category: "trader-type",
            label:
              "This position is notably larger than the usual position size of this trader.",
            icon: "high-confidence",
          });
        }
      }
    }
  }

  // Potential Insider: This is tricky - we could use heuristics like:
  // - Very early entry into markets
  // - High success rate
  // - Large positions in specific markets
  // For now, we'll skip this as it requires more sophisticated analysis

  return tags;
}

/**
 * Generates tags for a holder based on their wallet age and positions
 */
export function generateHolderTags(
  holder: TopHolderAnalysis,
  allPositions: UserPosition[] | undefined,
  currentMarketTokenId: string
): HolderTag[] {
  const tags: HolderTag[] = [];

  // Add wallet age tags
  //   tags.push(...getWalletAgeTags(holder.walletCreatedAt));

  // Add position tags
  tags.push(...getPositionTags(holder, allPositions, currentMarketTokenId));

  // Add trader type tags
  tags.push(...getTraderTypeTags(holder, allPositions));

  return tags;
}

/**
 * Generates tags for multiple holders
 */
export function generateHolderTagsMap(
  holders: TopHolderAnalysis[],
  positionsMap: Record<string, UserPosition[]> | undefined,
  currentMarketTokenId: string
): Record<string, HolderTag[]> {
  const result: Record<string, HolderTag[]> = {};

  for (const holder of holders) {
    const positions = positionsMap?.[holder.proxyWallet];
    result[holder.proxyWallet] = generateHolderTags(
      holder,
      positions,
      currentMarketTokenId
    );
  }

  return result;
}
