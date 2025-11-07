import Link from "next/link";
import { Logo } from "./Logo";

export function Header() {
  return (
    <header className="border-b">
      <div className="px-3 py-3 flex items-center">
        <Link href="/">
          <div className="flex items-center gap-3">
            <Logo />
            <h1 className="text-xl font-bold text-white tracking-widest">
              OMEN
            </h1>
          </div>
        </Link>
      </div>
    </header>
  );
}
