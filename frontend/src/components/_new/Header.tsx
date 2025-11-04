import { LayoutGrid } from "lucide-react";
import Link from "next/link";

export function Header() {
  return (
    <header className="border-b">
      <div className="px-4 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-5 w-5 text-primary" />
          <Link href="/">
            <h1 className="text-lg font-bold">Omen Insights</h1>
          </Link>
        </div>
      </div>
    </header>
  );
}
