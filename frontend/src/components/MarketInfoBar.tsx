import { Search } from "lucide-react";
import Image from "next/image";
import { formatNumber, formatCurrency } from "@/lib/ui/format.utils";
import { Market } from "@/lib/models/api.models";

type MarketInfoBarProps = {
  market: Market;
};

export function MarketInfoBar({ market }: MarketInfoBarProps) {
  return (
    <div className="border-b bg-card/50 mb-4">
      <div className="container mx-auto px-4 py-3">
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
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div>
                <p className="text-xs text-muted-foreground">Liquidity</p>
                <p className="text-sm font-semibold">
                  {formatCurrency(market.liquidity)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div>
                <p className="text-xs text-muted-foreground">Volume</p>
                <p className="text-sm font-semibold">
                  {formatCurrency(market.volume)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div>
                <p className="text-xs text-muted-foreground">Best Bid</p>
                <p className="text-sm font-semibold text-green-500">
                  {formatNumber(market.bestBid, 4)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div>
                <p className="text-xs text-muted-foreground">Best Ask</p>
                <p className="text-sm font-semibold text-red-500">
                  {formatNumber(market.bestAsk, 4)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
