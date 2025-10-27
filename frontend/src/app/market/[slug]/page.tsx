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
import { TrendingUp, Calendar } from "lucide-react";

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
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Positions</h2>
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {positions.length} total
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {positions.map((position: Position) => (
                <Card
                  key={position.id}
                  className="shadow-md hover:shadow-lg transition-shadow"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">
                        {position.outcome || position.side || "Position"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-baseline gap-2">
                      <div className="text-3xl font-bold">
                        {formatNumber(position.amount)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        shares
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Avg Price:{" "}
                      <span className="font-medium text-foreground">
                        {formatNumber(position.avgPrice, 4)}
                      </span>
                    </div>
                    {position.createdAt && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-2 border-t">
                        <Calendar className="h-3 w-3" />
                        {new Date(position.createdAt).toLocaleString()}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
