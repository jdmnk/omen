"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search } from "lucide-react";
import { getBaseUrl } from "@/lib/api";

type SearchProps = {
  onSelectMarket: (slug: string) => void;
};

export function MarketSearch({ onSelectMarket }: SearchProps) {
  const [input, setInput] = useState<string>("");
  const [suggestions, setSuggestions] = useState<
    Array<{ slug: string; question: string }>
  >([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const handleSearch = (slug?: string) => {
    const target = slug ?? input;
    if (target) {
      onSelectMarket(target);
      setIsOpen(false);
      setInput("");
    }
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
          )}&limit=15`,
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
    <div className="relative">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search markets..."
            className="pl-9"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
          />
        </div>
        <Button onClick={() => handleSearch()} size="sm">
          Go
        </Button>
      </div>

      {isOpen && suggestions.length > 0 && (
        <Card className="absolute z-50 mt-2 w-full shadow-xl border-2 max-h-80 overflow-auto">
          <ul className="divide-y">
            {suggestions.map((s) => (
              <li key={s.slug}>
                <button
                  className="w-full text-left p-3 hover:bg-accent transition-colors cursor-pointer"
                  onClick={() => handleSearch(s.slug)}
                >
                  <div className="font-medium truncate text-sm">
                    {s.question}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    /{s.slug}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {!isLoading && input && isOpen && suggestions.length === 0 && (
        <Card className="absolute z-50 mt-2 w-full shadow-lg">
          <div className="p-3 text-center text-muted-foreground text-sm">
            No results found
          </div>
        </Card>
      )}
    </div>
  );
}
