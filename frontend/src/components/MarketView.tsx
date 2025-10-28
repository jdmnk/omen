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
import { DollarSign, Package, TrendingDown } from "lucide-react";
import { PriceChart } from "@/components/widgets/PriceChart";
import { MarketResponse, Position } from "@/lib/models/api.models";
import { formatNumber, formatCurrency } from "@/lib/ui/format.utils";
import { PriceChartWidget } from "./widgets/PriceChartWidget";

const getOutcomeStyle = (outcome?: string) => {
  const outcomeText = outcome?.toLowerCase() || "";
  if (outcomeText.includes("yes")) {
    return {
      badge: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      row: "bg-emerald-500/5 hover:bg-emerald-500/10",
    };
  }
  if (outcomeText.includes("no")) {
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
    <div className="space-y-4">
      {/* Market Description (if exists) */}
      {market.description && (
        <Card className="shadow-md">
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {market.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Price Chart Module */}
      <Card className="shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Price Chart</CardTitle>
        </CardHeader>
        <CardContent className="h-[calc(100%-4rem)] p-0 px-2">
          <PriceChartWidget market={market} />
        </CardContent>
      </Card>

      {/* News Articles Module */}
      <Card className="shadow-md h-[300px]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Related News</CardTitle>
        </CardHeader>
        <CardContent className="h-[calc(100%-4rem)] overflow-y-auto">
          <p className="text-sm text-muted-foreground">
            News articles related to this market will appear here
          </p>
        </CardContent>
      </Card>

      {positions && positions.length > 0 && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="shadow-sm">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <DollarSign className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Total Value</p>
                    <p className="text-lg font-bold truncate">
                      {formatCurrency(totalValue)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Package className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Shares</p>
                    <p className="text-lg font-bold truncate">
                      {formatNumber(totalShares)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-amber-500/10 rounded-lg">
                    <TrendingDown className="h-4 w-4 text-amber-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Avg Price</p>
                    <p className="text-lg font-bold truncate">
                      {formatNumber(avgPrice, 4)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

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
                    <TableHead className="text-right">Avg Price</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {positions.map((position: Position) => {
                    const style = getOutcomeStyle(
                      position.outcome || position.side
                    );
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
                            {position.outcome || position.side || "Position"}
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
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {position.createdAt
                            ? new Date(position.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )
                            : "-"}
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
  );
}
