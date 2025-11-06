import Link from "next/link";
import { Logo } from "./Logo";

export function Header() {
  return (
    <header className="border-b">
      <div className="px-4 h-14 flex items-center justify-between gap-4">
        <Link href="/">
          <div className="flex items-center gap-3">
            <Logo />
            <h1 className="text-xl font-bold text-[#6322FE] tracking-widest">
              OMEN INSIGHT
            </h1>
          </div>
        </Link>
      </div>
    </header>
  );
}
