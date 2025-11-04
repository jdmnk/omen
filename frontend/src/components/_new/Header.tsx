import Link from "next/link";
import { Logo } from "./Logo";

export function Header() {
  return (
    <header className="border-b">
      <div className="px-4 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Logo />
          <Link href="/">
            <h1 className="text-lg font-bold">OMEN INSIGHT</h1>
          </Link>
        </div>
      </div>
    </header>
  );
}
