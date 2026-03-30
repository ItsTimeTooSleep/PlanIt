"use client";

import { useEffect, useRef, useState } from "react";
import { Rocket, Sparkles } from "lucide-react";

export function DownloadTransition() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      if (rect.top < viewportHeight * 0.6 && !hasAnimated) {
        setIsVisible(true);
        setHasAnimated(true);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasAnimated]);

  return (
    <section
      ref={sectionRef}
      className="relative py-24 lg:py-32 bg-foreground overflow-hidden"
    >
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-accent/10 via-chart-2/5 to-chart-3/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-5xl mx-auto px-6 relative z-10">
        <div
          className={`text-center transition-all duration-1000 ease-out ${
            isVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-12"
          }`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
            <Rocket className="w-4 h-4 text-chart-2" />
            <span className="text-sm text-white/70">开启高效之旅</span>
          </div>

          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-balance mb-8">
            <span className="text-white">准备好开始了吗？</span>
            <br />
            <span className="text-white/50">免费试用，无风险</span>
          </h2>

          <div
            className={`mt-12 flex flex-wrap justify-center gap-4 transition-all duration-1000 delay-300 ease-out ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            {[
              "无需注册",
              "永久免费",
              "跨平台支持",
            ].map((item, index) => (
              <div
                key={item}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10"
                style={{
                  transitionDelay: `${400 + index * 100}ms`,
                }}
              >
                <Sparkles className="w-3 h-3 text-chart-2" />
                <span className="text-sm text-white/70">{item}</span>
              </div>
            ))}
          </div>

          <p
            className={`mt-12 text-lg text-white/50 max-w-2xl mx-auto transition-all duration-1000 delay-600 ease-out ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            Plan It. Do It.
            <br />
            让 PlanIt 成为你效率提升的得力助手
          </p>

          <div
            className={`mt-16 transition-all duration-1000 delay-800 ease-out ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            <div className="inline-flex items-center gap-2 text-white/30 text-sm">
              <span>向下滚动</span>
              <div className="w-px h-4 bg-white/20" />
              <span>选择你的平台</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}