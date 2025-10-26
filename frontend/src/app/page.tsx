"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const [input, setInput] = useState<string | null>(null);
  const router = useRouter();

  const handleSearch = () => {
    if (input) {
      router.push(`/market/${input}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <h1 className="text-2xl font-bold">Poly Insights</h1>

      <input
        type="text"
        placeholder="Search for a market"
        onChange={(e) => setInput(e.target.value)}
        className="border border-gray-300 rounded-md p-2 w-64"
      />

      <button
        onClick={handleSearch}
        className="bg-blue-500 text-white rounded-md p-2 hover:bg-blue-600"
      >
        Search
      </button>
    </div>
  );
}
