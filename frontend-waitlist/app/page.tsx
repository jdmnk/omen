"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { TallyForm } from "@/components/TallyForm";
import { TEXTS } from "./texts.const";

const REFERRAL_STORAGE_KEY = "referral-source";

export default function Home() {
  const [referralSource, setReferralSource] = useState<string | null>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    const referral = url.searchParams.get("ref");

    if (referral) {
      setReferralSource(referral);
      localStorage.setItem(REFERRAL_STORAGE_KEY, referral);
      url.searchParams.delete("ref");

      const updatedSearch = url.searchParams.toString();
      const newUrl = `${url.pathname}${
        updatedSearch ? `?${updatedSearch}` : ""
      }${url.hash}`;

      window.history.replaceState(null, "", newUrl);
      return;
    }

    const storedReferral = localStorage.getItem(REFERRAL_STORAGE_KEY);
    if (storedReferral) {
      setReferralSource(storedReferral);
    }
  }, []);

  return (
    <div className="flex min-h-svh flex-col items-center px-4 py-10">
      <main className="flex w-full max-w-2xl flex-1 flex-col items-center justify-center text-center">
        <div className="flex flex-col items-center text-center">
          <h1 className="mt-2 text-[32px] leading-none md:text-5xl font-light text-white">
            {TEXTS.hero.heroLine2}
          </h1>
          <h1
            className="font-serif text-[32px] leading-none md:text-5xl font-light italic text-[#BBA6F2]"
            style={{
              textShadow: "0px 0px 40px #BBA6F2",
            }}
          >
            {TEXTS.hero.heroLine1}
          </h1>
          <p className="mt-10 text-base leading-tight md:text-2xl font-light text-white">
            {TEXTS.hero.tagline.line1}
            <br />
            {TEXTS.hero.tagline.line2}
          </p>
        </div>

        <TallyForm referralSource={referralSource} />
      </main>

      <footer className="flex w-full max-w-2xl items-center justify-center gap-3 pb-4 pt-8">
        <div className="w-9 h-9 md:w-12 md:h-12">
          <Image
            src="/logo.svg"
            alt={TEXTS.branding.logoAlt}
            width={48}
            height={48}
            className="w-full h-full"
          />
        </div>
        <span className="text-[20px] md:text-[28px] font-bold text-white">
          {TEXTS.branding.name}
        </span>
      </footer>
    </div>
  );
}
