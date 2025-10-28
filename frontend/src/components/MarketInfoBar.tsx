import { Search, DollarSign, Package, TrendingDown } from "lucide-react";
import Image from "next/image";
import { formatNumber, formatCurrency } from "@/lib/ui/format.utils";

type Market = {
  question: string;
  icon?: string;
};

type MarketInfoBarProps = {
  market?: Market | null;
  totalValue?: number;
  totalShares?: number;
  avgPrice?: number;
};

export function MarketInfoBar({
  market,
  totalValue,
  totalShares,
  avgPrice,
}: MarketInfoBarProps) {
  const hasStats =
    totalValue !== undefined ||
    totalShares !== undefined ||
    avgPrice !== undefined;

  return (
    <div className="border-b bg-card/50 backdrop-blur-sm mb-4">
      <div className="container mx-auto px-4 py-3">
        {market ? (
          <div className="flex items-center gap-4">
            {/* Market Icon & Title */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {market.icon ? (
                <div className="w-10 h-10 relative shrink-0">
                  <Image
                    src={market.icon}
                    alt={market.question}
                    width={40}
                    height={40}
                    className="rounded-md border object-contain w-full h-full"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-md border bg-muted/30 flex items-center justify-center shrink-0">
                  <Search className="h-5 w-5 text-muted-foreground/50" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-sm truncate">
                  {market.question}
                </h2>
              </div>
            </div>

            {/* Market Stats */}
            {hasStats && (
              <div className="flex items-center gap-6">
                {totalValue !== undefined && (
                  <div className="flex items-center gap-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Value</p>
                      <p className="text-sm font-semibold">
                        {formatCurrency(totalValue)}
                      </p>
                    </div>
                  </div>
                )}

                {totalShares !== undefined && (
                  <div className="flex items-center gap-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Shares</p>
                      <p className="text-sm font-semibold">
                        {formatNumber(totalShares)}
                      </p>
                    </div>
                  </div>
                )}

                {avgPrice !== undefined && (
                  <div className="flex items-center gap-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Avg Price</p>
                      <p className="text-sm font-semibold">
                        {formatNumber(avgPrice, 4)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground">No market selected</p>
          </div>
        )}
      </div>
    </div>
  );
}
