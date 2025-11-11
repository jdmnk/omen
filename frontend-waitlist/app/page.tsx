"use client";

import Image from "next/image";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

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
      setError("Please enter a valid email address");
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
      setError("Please enter a valid email address");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
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
        body: JSON.stringify({ email }),
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
    <div className="flex min-h-screen items-center justify-center bg-black px-4">
      <main className="flex w-full max-w-2xl flex-col items-center justify-center text-center">
        {/* Main Content */}
        <div className="flex flex-col items-center text-center">
          {/* Advanced Text */}
          <h1
            className="font-serif text-[32px] leading-none md:text-5xl font-light italic text-[#BBA6F2]"
            style={{
              textShadow: "0px 0px 40px #BBA6F2",
            }}
          >
            Advanced
          </h1>

          {/* Polymarket Analytics */}
          <h2 className="mt-2 text-[32px] leading-none md:text-5xl font-light text-white">
            Polymarket Analytics
          </h2>

          {/* Tagline */}
          <p className="mt-10 text-base leading-tight md:text-2xl font-light text-white">
            Understand markets and holders in seconds.
            <br />
            Trade with confidence.
          </p>
        </div>

        {/* Email Form */}
        {isSuccess ? (
          <div className="flex w-full max-w-[280px] flex-col gap-2 mt-32">
            <p className="text-base font-normal italic text-[#BBA6F2] h-10">
              {"You're in!"}
            </p>
            <Button onClick={handleShare} variant="brand" size="xl">
              {copied ? "Copied!" : "Share"}
            </Button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            noValidate
            className="flex w-full max-w-[280px] flex-col gap-2 mt-32"
          >
            <div className="flex flex-col">
              {error && (
                <p className="text-xs text-destructive text-left">{error}</p>
              )}
              <Input
                type="email"
                value={email}
                onChange={handleEmailChange}
                onBlur={handleEmailBlur}
                placeholder="Enter your email"
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
              {isLoading ? "Joining..." : "Join the waitlist"}
            </Button>
          </form>
        )}

        {/* Logo */}
        <div className="absolute bottom-8 flex items-center gap-3">
          <div className="w-9 h-9 md:w-12 md:h-12">
            <Image
              src="/logo.svg"
              alt="OMEN Logo"
              width={48}
              height={48}
              className="w-full h-full"
            />
          </div>
          <span className="text-[20px] md:text-[28px] font-bold text-white">
            OMEN
          </span>
        </div>
      </main>
    </div>
  );
}
