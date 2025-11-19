"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TEXTS } from "./texts.const";

const REFERRAL_STORAGE_KEY = "referral-source";

export default function Home() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
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

  const validateEmail = (emailValue: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailValue);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (error && value) {
      setError("");
    }
  };

  const handleEmailBlur = () => {
    if (email && !validateEmail(email)) {
      setError(TEXTS.form.emailError);
    } else {
      setError("");
    }
  };

  const handleShare = async () => {
    try {
      const url = window.location.href;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setError(TEXTS.form.emailError);
      return;
    }

    if (!validateEmail(email)) {
      setError(TEXTS.form.emailError);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, referralSource }),
      });

      if (response.ok) {
        setIsSuccess(true);
      } else {
        console.error("Failed to sign up");
      }
    } catch (error) {
      console.error("Error signing up:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-svh flex-col items-center px-4 py-10">
      <main className="flex w-full max-w-2xl flex-1 flex-col items-center justify-center text-center">
        {/* Main Content */}
        <div className="flex flex-col items-center text-center">
          {/* Hero Line 2 */}
          <h1 className="mt-2 text-[32px] leading-none md:text-5xl font-light text-white">
            {TEXTS.hero.heroLine2}
          </h1>

          {/* Hero Line 1 */}
          <h1
            className="font-serif text-[32px] leading-none md:text-5xl font-light italic text-[#BBA6F2]"
            style={{
              textShadow: "0px 0px 40px #BBA6F2",
            }}
          >
            {TEXTS.hero.heroLine1}
          </h1>

          {/* Tagline */}
          <p className="mt-10 text-base leading-tight md:text-2xl font-light text-white">
            {TEXTS.hero.tagline.line1}
            <br />
            {TEXTS.hero.tagline.line2}
          </p>
        </div>

        {/* Email Form */}
        {isSuccess ? (
          <div className="flex w-full max-w-[280px] flex-col gap-2 mt-32">
            <p className="text-sm md:text-base font-normal italic text-[#BBA6F2] h-10 flex items-center justify-center">
              {TEXTS.form.successMessage}
            </p>
            <Button onClick={handleShare} variant="brand" size="xl">
              {copied ? TEXTS.form.copiedButton : TEXTS.form.shareButton}
            </Button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            noValidate
            className="flex w-full max-w-[280px] flex-col gap-3 mt-16 md:mt-32"
          >
            <div className="flex flex-col">
              <p
                className={`text-xs text-destructive text-left min-h-[16px] ${
                  error ? "opacity-100" : "opacity-0"
                }`}
              >
                {error || "\u00A0"}
              </p>
              <Input
                type="email"
                value={email}
                onChange={handleEmailChange}
                onBlur={handleEmailBlur}
                placeholder={TEXTS.form.emailPlaceholder}
                aria-invalid={error ? "true" : "false"}
                disabled={isLoading}
              />
            </div>
            <Button
              type="submit"
              variant="brand"
              disabled={isLoading}
              size="xl"
            >
              {isLoading ? TEXTS.form.joiningButton : TEXTS.form.joinButton}
            </Button>
          </form>
        )}

      </main>

      {/* Logo */}
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
