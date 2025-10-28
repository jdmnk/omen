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

const getOutcomeStyle = (outcome: string) => {
  if (outcome === "yes") {
    return {
      badge: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      row: "bg-emerald-500/5 hover:bg-emerald-500/10",
    };
  }
  if (outcome === "no") {
    return {
      badge: "bg-rose-500/10 text-rose-500 border-rose-500/20",
      row: "bg-rose-500/5 hover:bg-rose-500/10",
    };
  }
  return {
    badge: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    row: "hover:bg-muted/50",
  };
};

export async function MarketView({ data }: { data: MarketResponse }) {
  const { market, positions } = data;

  // Calculate summary statistics
  const totalShares = positions.reduce((sum, p) => {
    const amount = typeof p.amount === "string" ? Number(p.amount) : p.amount;
    return sum + (Number.isNaN(amount) ? 0 : amount);
  }, 0);

  const totalValue = positions.reduce((sum, p) => {
    const amount = typeof p.amount === "string" ? Number(p.amount) : p.amount;
    const price =
      typeof p.avgPrice === "string" ? Number(p.avgPrice) : p.avgPrice;
    return (
      sum + (Number.isNaN(amount) || Number.isNaN(price) ? 0 : amount * price)
    );
  }, 0);

  const avgPrice = totalShares > 0 ? totalValue / totalShares : 0;

  return (
    <>
      <MarketInfoBar
        market={market}
        totalValue={positions.length > 0 ? totalValue : undefined}
        totalShares={positions.length > 0 ? totalShares : undefined}
        avgPrice={positions.length > 0 ? avgPrice : undefined}
      />

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

              {positions && positions.length > 0 && (
                <>
                  {/* Positions Table */}
                  <Card className="shadow-md">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Positions</CardTitle>
                        <Badge variant="secondary" className="text-xs">
                          {positions.length}{" "}
                          {positions.length === 1 ? "position" : "positions"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Outcome</TableHead>
                            <TableHead className="text-right">Shares</TableHead>
                            <TableHead className="text-right">
                              Avg Price
                            </TableHead>
                            <TableHead className="text-right">Value</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {positions.map((position: Position) => {
                            const positionOutcome =
                              position.tokenId === market.token1 ? "yes" : "no";

                            const style = getOutcomeStyle(positionOutcome);
                            const posAmount =
                              typeof position.amount === "string"
                                ? Number(position.amount)
                                : position.amount;
                            const posPrice =
                              typeof position.avgPrice === "string"
                                ? Number(position.avgPrice)
                                : position.avgPrice;
                            const posValue = posAmount * posPrice;

                            return (
                              <TableRow key={position.id} className={style.row}>
                                <TableCell>
                                  <Badge className={style.badge}>
                                    {positionOutcome}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right font-semibold">
                                  {formatNumber(position.amount)}
                                </TableCell>
                                <TableCell className="text-right font-mono text-sm">
                                  ${formatNumber(position.avgPrice, 4)}
                                </TableCell>
                                <TableCell className="text-right font-semibold">
                                  {formatCurrency(posValue)}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </div>

          {/* Right Column - Modules */}
          <div className="space-y-4 overflow-y-auto">
            {market.description && (
              <Card>
                {/* <CardHeader className="pb-3">
                  <CardTitle className="text-base">Description</CardTitle>
                </CardHeader> */}
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
