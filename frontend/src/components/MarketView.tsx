import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MarketResponse, Position } from "@/lib/models/api.models";
import { formatNumber, formatCurrency } from "@/lib/ui/format.utils";
import { PriceChartWidget } from "./widgets/PriceChartWidget";
import { ExpandableText } from "@/components/ui/expandable-text";
import { MarketInfoBar } from "@/components/MarketInfoBar";
import { MainSharedContainer } from "./layouts/MainSharedContainer";
import { PositionsWidget } from "./widgets/PositionsWidget";

export async function MarketView({ data }: { data: MarketResponse }) {
  const { market } = data;

  return (
    <>
      <MarketInfoBar market={market} />

      <MainSharedContainer>
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4 h-[calc(100vh-9rem)]">
          {/* Left Column - Market Details (Children) */}
          <div className="overflow-y-auto">
            <div className="space-y-4">
              {/* Price Chart Module */}
              <Card className="shadow-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Price Chart</CardTitle>
                </CardHeader>
                <CardContent className="h-[calc(100%-4rem)] p-0 px-2">
                  <PriceChartWidget market={market} />
                </CardContent>
              </Card>

              <PositionsWidget clobTokenIds={[market.token1, market.token2]} />
            </div>
          </div>

          {/* Right Column - Modules */}
          <div className="space-y-4 overflow-y-auto">
            {market.description && (
              <Card>
                <CardContent className="pt-3 pb-3">
                  <ExpandableText text={market.description} maxLength={150} />
                </CardContent>
              </Card>
            )}

            {/* Placeholder for additional modules */}
            <Card className="shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Watchlist</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Your saved markets will appear here
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Recent trades and updates
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </MainSharedContainer>
    </>
  );
}
