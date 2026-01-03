"use client";

import Link from "next/link";
import { LogoIcon } from "@/components/LogoIcon";
import { ThemeToggle } from "@/components/ThemeToggle";
import { FontSizeControl } from "@/components/FontSizeControl";
import { UnifiedSearchBar } from "@/components/UnifiedSearchBar";

export function MainHeader() {
  return (
    <div className="flex items-center gap-3 md:gap-5">
      <Link href="/" className="shrink-0">
        <div className="flex items-center gap-2">
          <LogoIcon className="h-8 w-8 text-foreground" />
          <span className="text-xl font-bold text-foreground tracking-widest">
            OMEN
          </span>
        </div>
      </Link>
      <div className="flex-1 max-w-2xl">
        <UnifiedSearchBar />
      </div>
      <div className="flex items-center gap-1 ml-auto">
        <ThemeToggle />
        <FontSizeControl />
      </div>
    </div>
  );
}
