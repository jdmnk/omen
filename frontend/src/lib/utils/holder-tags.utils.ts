import { TopHolder, UserPosition } from "@/lib/models/api.models";
import { LucideIcon } from "lucide-react";
import { Sparkles, Clock, History, Layers, TrendingUp } from "lucide-react";

export type HolderTag = {
  category: "positions" | "wallet-age";
  label: string;
  icon: LucideIcon;
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
      icon: Sparkles,
    });
  } else if (ageDays < 365) {
    tags.push({
      category: "wallet-age",
      label: "mid old wallet",
      icon: Clock,
    });
  } else {
    tags.push({
      category: "wallet-age",
      label: "very old wallet",
      icon: History,
    });
  }

  return tags;
}

/**
 * Gets position-related tags based on holder's other positions
 */
function getPositionTags(
  holder: TopHolder,
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
      label: "has few other positions",
      icon: Layers,
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
        label: "this is one of his largest positions",
        icon: TrendingUp,
      });
    }
  }

  return tags;
}

/**
 * Generates tags for a holder based on their wallet age and positions
 */
export function generateHolderTags(
  holder: TopHolder,
  allPositions: UserPosition[] | undefined,
  currentMarketTokenId: string
): HolderTag[] {
  const tags: HolderTag[] = [];

  // Add wallet age tags
  tags.push(...getWalletAgeTags(holder.walletCreatedAt));

  // Add position tags
  tags.push(...getPositionTags(holder, allPositions, currentMarketTokenId));

  return tags;
}

/**
 * Generates tags for multiple holders
 */
export function generateHolderTagsMap(
  holders: TopHolder[],
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
