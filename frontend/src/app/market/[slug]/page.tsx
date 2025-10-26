import { getBaseUrl } from "@/lib/api";
import Image from "next/image";

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
    <div className="min-h-screen max-w-6xl mx-auto p-6 flex flex-col gap-8">
      <section className="grid grid-cols-1 md:grid-cols-[auto,1fr] items-start gap-6">
        {market.icon ? (
          <Image
            src={market.icon}
            alt={market.question}
            width={96}
            height={96}
            className="rounded-md border"
          />
        ) : (
          <div className="size-24 rounded-md border" />
        )}

        <div className="flex flex-col gap-3">
          <h1 className="text-2xl md:text-3xl font-semibold leading-tight">
            {market.question}
          </h1>
          {market.description && (
            <div className="rounded-lg border p-4 text-sm text-zinc-600 dark:text-zinc-300">
              {market.description}
            </div>
          )}
        </div>
      </section>

      {positions && positions.length > 0 && (
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Positions</h2>
            <span className="text-sm text-zinc-500">{positions.length}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {positions.map((position: Position) => (
              <div
                key={position.id}
                className="rounded-lg border p-4 shadow-sm bg-white/60 dark:bg-zinc-900/60"
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm text-zinc-500">
                    {position.outcome || position.side || "Position"}
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <div className="text-2xl font-semibold">
                    {formatNumber(position.amount)}
                  </div>
                  <div className="text-sm text-zinc-500">
                    @ {formatNumber(position.avgPrice, 4)}
                  </div>
                </div>
                {position.createdAt && (
                  <div className="mt-3 text-xs text-zinc-500">
                    {new Date(position.createdAt).toLocaleString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
