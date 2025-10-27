"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getBaseUrl } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Search } from "lucide-react";

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
    <div className="min-h-screen flex items-center justify-center p-6 bg-linear-to-br from-background via-background to-muted/20">
      <div className="w-full max-w-2xl flex flex-col gap-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Poly Insights
          </h1>
          <p className="text-muted-foreground text-base">
            Explore prediction markets by name or slug
          </p>
        </div>

        <Card className="p-6 shadow-lg">
          <div className="relative">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Search markets..."
                  className="pl-9 h-11"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearch();
                  }}
                />
              </div>
              <Button onClick={() => handleSearch()} size="lg" className="h-11">
                Go
              </Button>
            </div>

            {isOpen && suggestions.length > 0 && (
              <Card className="absolute z-10 mt-3 w-full shadow-xl border-2">
                <ul className="max-h-96 overflow-auto divide-y">
                  {suggestions.map((s) => (
                    <li key={s.slug}>
                      <button
                        className="w-full text-left p-4 hover:bg-accent transition-colors cursor-pointer"
                        onClick={() => handleSearch(s.slug)}
                      >
                        <div className="font-medium truncate mb-1">
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
              <Card className="absolute z-10 mt-3 w-full shadow-lg">
                <div className="p-4 text-center text-muted-foreground">
                  No results found
                </div>
              </Card>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
