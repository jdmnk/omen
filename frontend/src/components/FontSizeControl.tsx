"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";

const FONT_SIZE_MIN = 0.75;
const FONT_SIZE_MAX = 1.5;
const FONT_SIZE_STEP = 0.05;
const FONT_SIZE_DEFAULT = 1;
const STORAGE_KEY = "font-size-scale";

export function FontSizeControl() {
  const [fontSize, setFontSize] = useState(FONT_SIZE_DEFAULT);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Load saved font size from localStorage
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = parseFloat(saved);
      if (
        !isNaN(parsed) &&
        parsed >= FONT_SIZE_MIN &&
        parsed <= FONT_SIZE_MAX
      ) {
        setFontSize(parsed);
        document.documentElement.style.fontSize = `${parsed * 100}%`;
      }
    }
  }, []);

  const handleValueChange = (value: number[]) => {
    const newSize = value[0];
    setFontSize(newSize);
    document.documentElement.style.fontSize = `${newSize * 100}%`;
    localStorage.setItem(STORAGE_KEY, newSize.toString());
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer [&_svg]:size-5"
          aria-label="Font size control"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 20h16" />
            <path d="m6 16 6-12 6 12" />
            <path d="M8 12h8" />
          </svg>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="end">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Font Size</label>
            <span className="text-sm text-muted-foreground">
              {Math.round(fontSize * 100)}%
            </span>
          </div>
          <Slider
            value={[fontSize]}
            onValueChange={handleValueChange}
            min={FONT_SIZE_MIN}
            max={FONT_SIZE_MAX}
            step={FONT_SIZE_STEP}
            className="w-full"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Small</span>
            <span>Default</span>
            <span>Large</span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
