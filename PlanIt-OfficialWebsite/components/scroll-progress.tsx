"use client";

import { useScrollProgress } from "@/hooks/use-scroll-animation";

export function ScrollProgress() {
  const progress = useScrollProgress();

  return (
    <div className="fixed top-0 left-0 right-0 h-1 z-[100] bg-transparent">
      <div
        className="h-full bg-gradient-to-r from-accent via-chart-2 to-chart-3 transition-transform duration-100 origin-left"
        style={{ transform: `scaleX(${progress})` }}
      />
    </div>
  );
}
