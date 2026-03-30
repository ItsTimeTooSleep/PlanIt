"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, CheckCircle, Calendar, Timer, BarChart3 } from "lucide-react";

export function TransitionSection() {
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
      className="relative py-32 lg:py-40 bg-foreground overflow-hidden"
    >
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-accent/5 via-chart-2/5 to-chart-3/5 rounded-full blur-3xl" />
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
            <Sparkles className="w-4 h-4 text-chart-2" />
            <span className="text-sm text-white/70">强大功能，助你高效</span>
          </div>

          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-balance mb-8">
            <span className="text-white">不止于任务管理</span>
            <br />
            <span className="text-white/50">让每一天都有迹可循</span>
          </h2>

          <p
            className={`text-lg md:text-xl text-white/50 max-w-2xl mx-auto transition-all duration-1000 delay-300 ease-out ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            从任务管理到数据分析，从番茄钟到桌面小组件
            <br />
            每一个功能都经过精心设计，为你打造完整的时间管理闭环
          </p>

          <div
            className={`mt-16 flex justify-center gap-8 transition-all duration-1000 delay-500 ease-out ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            {[
              { label: "任务管理", icon: CheckCircle },
              { label: "日历视图", icon: Calendar },
              { label: "番茄钟", icon: Timer },
              { label: "数据统计", icon: BarChart3 },
            ].map((item, index) => (
              <div
                key={item.label}
                className="flex items-center gap-2 text-white/40"
                style={{
                  transitionDelay: `${600 + index * 100}ms`,
                }}
              >
                <item.icon className="w-4 h-4 text-chart-2" />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
            ))}
          </div>

          <div
            className={`mt-20 transition-all duration-1000 delay-1000 ease-out ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            <div className="flex justify-center">
              <div className="w-px h-16 bg-gradient-to-b from-white/20 to-transparent" />
            </div>
            <p className="mt-4 text-sm text-white/30">向下滚动，探索全部功能</p>
          </div>
        </div>
      </div>
    </section>
  );
}