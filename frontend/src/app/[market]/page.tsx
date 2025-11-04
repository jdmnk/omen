import { TerminalLayout } from "@/components/TerminalLayout";

export default function MarketPage({ params }: { params: { market: string } }) {
  const { market } = params;
  return <TerminalLayout market={market}></TerminalLayout>;
}
