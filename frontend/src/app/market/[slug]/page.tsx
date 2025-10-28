import { MarketView } from "@/components/MarketView";

export default async function MarketPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = await params;

  return <MarketView slug={slug} />;
}
