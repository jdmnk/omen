import { getBaseUrl } from "@/lib/api";
import Image from "next/image";

export default async function MarketPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = await params;
  console.log("slug: " + slug);

  let data = null;
  try {
    const response = await fetch(
      `${getBaseUrl()}/markets/search-slug?slug=${slug}`
    );
    data = await response.json();
    console.log(data);
  } catch (error) {
    console.error(error);
  }

  if (!data?.market) {
    return <div>Market not found</div>;
  }

  const { market, positions } = data;

  return (
    <div className="flex flex-col items-center h-screen gap-4 p-4 max-w-7xl mx-auto">
      <div className="flex gap-2">
        <div className="flex gap-4">
          <Image
            src={market.icon}
            alt={market.question}
            width={100}
            height={100}
          />
          <h1>{market.question}</h1>
        </div>
        <div className="flex flex-col gap-2">
          <p className="font-bold">Description</p>
          <p className="text-sm">{market.description}</p>
        </div>
      </div>

      {positions && positions.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="font-bold">Positions</p>
          <div className="flex flex-col gap-2">
            {positions.map((position: any) => (
              <div key={position.id}>
                <div>
                  Amount: {position.amount} @ avg price {position.avgPrice}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
