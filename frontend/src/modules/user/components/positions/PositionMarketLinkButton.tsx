import { ExternalLink } from "lucide-react";
import { getPolymarketEventUrl } from "@/lib/utils/polymarket.utils";

type PositionMarketLinkButtonProps = {
  slug: string | null | undefined;
};

export function PositionMarketLinkButton({
  slug,
}: PositionMarketLinkButtonProps) {
  if (!slug) return null;

  return (
    <a
      href={getPolymarketEventUrl(slug)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center justify-center rounded hover:bg-brand-highlight/20 px-2 py-2"
      onClick={(event) => event.stopPropagation()}
      aria-label="Open market on Polymarket"
    >
      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
    </a>
  );
}
