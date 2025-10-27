import { getBaseUrl } from "@/lib/api";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrendingUp, DollarSign, Package, TrendingDown } from "lucide-react";

type Position = {
  id: string | number;
  amount: number | string;
  avgPrice: number | string;
  outcome?: string;
  side?: string;
  createdAt?: string;
};

type Market = {
  question: string;
  description?: string;
  icon?: string;
};

type MarketResponse = {
  market: Market;
  positions: Position[];
};

export default async function MarketPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = await params;
  console.log("slug: " + slug);

  let data: MarketResponse | null = null;
  try {
    const response = await fetch(
      `${getBaseUrl()}/markets/search-slug?slug=${slug}`
    );
    data = (await response.json()) as MarketResponse;
  } catch (error) {
    console.error(error);
  }

  if (!data?.market) {
    return <div className="max-w-6xl mx-auto p-6">Market not found</div>;
  }

  const { market, positions } = data;

  const formatNumber = (value: number | string, maximumFractionDigits = 2) => {
    const n = typeof value === "string" ? Number(value) : value;
    if (Number.isNaN(n)) return String(value);
    return n.toLocaleString(undefined, { maximumFractionDigits });
  };

  const formatCurrency = (value: number | string) => {
    const n = typeof value === "string" ? Number(value) : value;
    if (Number.isNaN(n)) return "$0";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n);
  };

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
    <div className="min-h-screen bg-linear-to-br from-background via-background to-muted/20">
      <div className="max-w-7xl mx-auto p-6 flex flex-col gap-8">
        <Card className="shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row gap-6">
              {market.icon ? (
                <div className="w-24 h-24 relative shrink-0">
                  <Image
                    src={market.icon}
                    alt={market.question}
                    width={96}
                    height={96}
                    className="rounded-lg border shadow-sm object-contain w-full h-full"
                  />
                </div>
              ) : (
                <div className="size-24 rounded-lg border bg-muted/30 flex items-center justify-center shrink-0">
                  <TrendingUp className="h-10 w-10 text-muted-foreground/50" />
                </div>
              )}

              <div className="flex-1 space-y-3">
                <CardTitle className="text-2xl md:text-3xl leading-tight">
                  {market.question}
                </CardTitle>
                {market.description && (
                  <CardDescription className="text-base leading-relaxed">
                    {market.description}
                  </CardDescription>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {positions && positions.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Positions</h2>
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {positions.length}{" "}
                {positions.length === 1 ? "position" : "positions"}
              </Badge>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="shadow-sm bg-linear-to-br from-card to-card/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Total Value
                      </p>
                      <p className="text-2xl font-bold mt-1">
                        {formatCurrency(totalValue)}
                      </p>
                    </div>
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <DollarSign className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm bg-linear-to-br from-card to-card/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Total Shares
                      </p>
                      <p className="text-2xl font-bold mt-1">
                        {formatNumber(totalShares)}
                      </p>
                    </div>
                    <div className="p-3 bg-blue-500/10 rounded-lg">
                      <Package className="h-6 w-6 text-blue-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm bg-linear-to-br from-card to-card/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Price</p>
                      <p className="text-2xl font-bold mt-1">
                        {formatNumber(avgPrice, 4)}
                      </p>
                    </div>
                    <div className="p-3 bg-amber-500/10 rounded-lg">
                      <TrendingDown className="h-6 w-6 text-amber-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Positions Table */}
            <Card className="shadow-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Outcome</TableHead>
                    <TableHead className="text-right">Shares</TableHead>
                    <TableHead className="text-right">Avg Price</TableHead>
                    <TableHead className="text-right">Total Value</TableHead>
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
            </Card>
          </section>
        )}
      </div>
    </div>
  );
}
