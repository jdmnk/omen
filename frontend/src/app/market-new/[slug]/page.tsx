import type { Metadata } from "next";
import { Market } from "@/lib/models/api.models";
import { METADATA } from "@/lib/metadata.const";
import { getBaseUrl } from "@/lib/api.const";
import { getSiteUrl } from "@/lib/app.const";
import { MarketLayout } from "@/modules/market_new/components/MarketLayout";

async function fetchMarket(slug: string): Promise<Market | null> {
  const baseUrl = getBaseUrl();
  if (!baseUrl) return null;

  try {
    const response = await fetch(
      `${baseUrl}/markets/search-slug?slug=${encodeURIComponent(slug)}`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as Market;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const market = await fetchMarket(slug);

  if (!market) {
    return {
      metadataBase: new URL(getSiteUrl()),
      title: METADATA.title,
      description: METADATA.description,
    };
  }

  const outcomes = market.outcomes?.split(",") || ["YES", "NO"];
  const outcomePrices = market.outcomePrices?.split(",") || ["0.50", "0.50"];
  const yesPrice = outcomePrices[0]
    ? (Number(outcomePrices[0]) * 100).toFixed(1)
    : "50.0";
  const noPrice = outcomePrices[1]
    ? (Number(outcomePrices[1]) * 100).toFixed(1)
    : "50.0";

  const title = `Omen | ${market.question}`;
  const description = `${outcomes[0]}: ${yesPrice}% | ${outcomes[1]}: ${noPrice}%`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: [
        {
          url: `/market-new/${slug}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: market.question,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`/market-new/${slug}/opengraph-image`],
    },
  };
}

export default async function MarketNewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const market = await fetchMarket(slug);

  return <MarketLayout initialMarket={market} />;
}
