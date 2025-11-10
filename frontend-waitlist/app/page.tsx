"use client";

import Image from "next/image";
import { useState } from "react";

export default function Home() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Add API call to submit email
    console.log("Email submitted:", email);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4 py-32">
      <main className="flex w-full max-w-2xl flex-col items-center justify-center text-center">
        {/* Main Content */}
        <div className="flex flex-col items-center text-center">
          {/* Advanced Text */}
          <h1
            className="font-serif text-5xl font-light italic text-[#BBA6F2]"
            style={{
              textShadow: "0px 0px 40px 0px #BBA6F2",
            }}
          >
            Advanced
          </h1>

          {/* Polymarket Analytics */}
          <h2 className="mt-3 text-5xl font-light text-white">
            Polymarket Analytics
          </h2>

          {/* Tagline */}
          <p className="mt-10 text-2xl font-light text-white">
            Understand markets and holders in seconds.
            <br />
            Trade with confidence.
          </p>
        </div>

        {/* Email Form */}
        <form
          onSubmit={handleSubmit}
          className="flex w-full max-w-[280px] flex-col gap-3 mt-32"
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="shayne@coplan.com"
            className="h-14 w-full rounded-lg border border-white/10 bg-white/5 px-5 text-lg text-white placeholder:text-white/50 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
            required
          />
          <button
            type="submit"
            className="h-14 w-full rounded-lg bg-[#4B0082] text-lg font-medium text-white transition-colors hover:bg-[#5a0099] focus:outline-none focus:ring-2 focus:ring-[#9966FF] focus:ring-offset-2 focus:ring-offset-black"
          >
            Join the waitlist
          </button>
        </form>

        {/* Logo */}
        <div className="mt-16 flex items-center gap-3">
          <Image src="/logo.svg" alt="OMEN Logo" width={37} height={37} />
          <span className="text-xl font-bold text-white">OMEN</span>
        </div>
      </main>
    </div>
  );
}
