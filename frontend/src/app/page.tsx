"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { getBaseUrl } from "@/lib/api";

export default function Home() {
  const [input, setInput] = useState<string>("");
  const [suggestions, setSuggestions] = useState<
    Array<{ slug: string; question: string }>
  >([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const router = useRouter();

  const handleSearch = (slug?: string) => {
    const target = slug ?? input;
    if (target) router.push(`/market/${target}`);
  };

  // Debounced fetch for autocomplete
  useEffect(() => {
    const q = input.trim();
    if (!q) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `${getBaseUrl()}/markets/autocomplete?q=${encodeURIComponent(
            q
          )}&limit=8`,
          {
            signal: controller.signal,
            cache: "no-store",
          }
        );
        if (!res.ok) throw new Error("autocomplete failed");
        const data = (await res.json()) as Array<{
          slug: string;
          question: string;
        }>;
        setSuggestions(data);
        setIsOpen(true);
      } catch (e) {
        if ((e as any)?.name !== "AbortError") {
          setSuggestions([]);
          setIsOpen(false);
        }
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [input]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-xl flex flex-col gap-6">
        <div className="text-center">
          <h1 className="text-3xl font-semibold">Poly Insights</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Find markets by name or slug
          </p>
        </div>

        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search markets..."
            className="w-full rounded-md border p-3 pr-10 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
          />
          <button
            onClick={() => handleSearch()}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-blue-600 text-white px-3 py-1 text-sm hover:bg-blue-700"
          >
            Go
          </button>

          {isOpen && suggestions.length > 0 && (
            <div className="absolute z-10 mt-2 w-full rounded-md border bg-white shadow-md overflow-hidden">
              <ul className="max-h-80 overflow-auto divide-y">
                {suggestions.map((s) => (
                  <li key={s.slug}>
                    <button
                      className="w-full text-left p-3 hover:bg-zinc-50"
                      onClick={() => handleSearch(s.slug)}
                    >
                      <div className="text-sm font-medium truncate">
                        {s.question}
                      </div>
                      <div className="text-xs text-zinc-500 truncate">
                        /{s.slug}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!isLoading && input && isOpen && suggestions.length === 0 && (
            <div className="absolute z-10 mt-2 w-full rounded-md border bg-white shadow-sm p-3 text-sm text-zinc-500">
              No results
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
