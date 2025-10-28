import { MarketView } from "@/components/MarketView";
import { getBaseUrl } from "@/lib/api";
import { MarketResponse } from "@/lib/models/api.models";

export default async function MarketPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = await params;

  let data: MarketResponse | null = null;
  try {
    const response = await fetch(
      `${getBaseUrl()}/markets/search-slug?slug=${slug}`,
      { cache: "no-store" }
    );
    data = (await response.json()) as MarketResponse;
  } catch (error) {
    console.error(error);
  }

  console.log(data);

  if (!data?.market) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Market not found</div>
      </div>
    );
  }

  return <MarketView data={data} />;
}
