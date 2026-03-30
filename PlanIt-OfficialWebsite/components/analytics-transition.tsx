"use client";

import { useEffect, useRef, useState } from "react";
import { TrendingUp } from "lucide-react";

export function AnalyticsTransition() {
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
      className="relative py-24 lg:py-32 bg-secondary/30 overflow-hidden"
    >
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      <div className="max-w-5xl mx-auto px-6 relative z-10">
        <div
          className={`text-center transition-all duration-1000 ease-out ${
            isVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-12"
          }`}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-8">
            <TrendingUp className="w-4 h-4 text-accent" />
            <span className="text-sm text-accent">数据驱动决策</span>
          </div>

          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-balance mb-8">
            <span className="text-foreground">每一次进步</span>
            <br />
            <span className="text-muted-foreground">都值得被看见</span>
          </h2>

          <div
            className={`mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto transition-all duration-1000 delay-300 ease-out ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            {[
              { value: "30+", label: "追踪天数" },
              { value: "85%", label: "效率提升" },
              { value: "10k+", label: "活跃用户" },
              { value: "4.9", label: "用户评分" },
            ].map((stat, index) => (
              <div
                key={stat.label}
                className="text-center"
                style={{
                  transitionDelay: `${400 + index * 100}ms`,
                }}
              >
                <p className="text-3xl md:text-4xl font-bold text-accent mb-1">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          <p
            className={`mt-12 text-lg text-muted-foreground max-w-2xl mx-auto transition-all duration-1000 delay-700 ease-out ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            通过直观的图表和数据分析
            <br />
            你可以清晰地看到自己的成长轨迹
          </p>

          <div
            className={`mt-12 transition-all duration-1000 delay-1000 ease-out ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            <div className="flex justify-center gap-3">
              <div className="w-8 h-px bg-gradient-to-r from-transparent to-accent/50" />
              <div className="w-2 h-2 rounded-full bg-accent/50" />
              <div className="w-8 h-px bg-gradient-to-l from-transparent to-accent/50" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}