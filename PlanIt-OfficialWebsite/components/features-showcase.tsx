"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  CheckSquare,
  Calendar,
  Timer,
  StickyNote,
  LayoutGrid,
  BarChart3,
  LucideIcon,
} from "lucide-react";

interface Feature {
  id: number;
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
  bgColor: string;
  screenshot: string;
}

const features: Feature[] = [
  {
    id: 1,
    icon: CheckSquare,
    title: "任务管理",
    description: "创建任务、添加标签、追踪状态，让每一项待办都井井有条",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    screenshot: "/PlanIt/screenshot-newtask.png",
  },
  {
    id: 2,
    icon: Calendar,
    title: "日历视图",
    description: "周视图与月视图灵活切换，支持日期笔记，规划一目了然",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    screenshot: "/PlanIt/screenshot-calendar.png",
  },
  {
    id: 3,
    icon: Timer,
    title: "番茄钟计时器",
    description: "专注模式帮助你保持高效，科学管理工作与休息时间",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    screenshot: "/PlanIt/screenshot-pomodoro.png",
  },
  {
    id: 4,
    icon: StickyNote,
    title: "笔记系统",
    description: "多彩笔记卡片，随时记录灵感，让想法不再流失",
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    screenshot: "/PlanIt/screenshot-notes.png",
  },
  {
    id: 5,
    icon: LayoutGrid,
    title: "桌面小组件",
    description: "可拖拽的多种类型小组件，打造专属工作空间",
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
    screenshot: "/PlanIt/screenshot-custom.png",
  },
  {
    id: 6,
    icon: BarChart3,
    title: "数据统计",
    description: "图表可视化展示效率数据，了解自己的工作习惯",
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
    screenshot: "/PlanIt/screenshot-analysis.png",
  },
];

const featureColors = [
  "rgba(59,130,246,0.3)",
  "rgba(16,185,129,0.3)",
  "rgba(249,115,22,0.3)",
  "rgba(234,179,8,0.3)",
  "rgba(236,72,153,0.3)",
  "rgba(6,182,212,0.3)",
];

export function FeaturesShowcase() {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    let currentIndex = 0;
    let isTransitioning = false;

    const updateActiveIndex = (newIndex: number) => {
      if (newIndex === currentIndex || isTransitioning) return;
      if (newIndex < 0 || newIndex >= features.length) return;

      isTransitioning = true;
      currentIndex = newIndex;
      setActiveIndex(newIndex);

      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        isTransitioning = false;
      }, 600);
    };

    const handleScroll = () => {
      const rect = section.getBoundingClientRect();
      const scrollTop = window.scrollY;
      const viewportHeight = window.innerHeight;
      const sectionTop = section.offsetTop;

      if (scrollTop < sectionTop) {
        return;
      }

      if (scrollTop >= sectionTop + section.offsetHeight - viewportHeight) {
        if (currentIndex !== features.length - 1) {
          updateActiveIndex(features.length - 1);
        }
        return;
      }

      const relativeScroll = scrollTop - sectionTop;
      const newIndex = Math.round(relativeScroll / viewportHeight);
      const clampedIndex = Math.max(0, Math.min(newIndex, features.length - 1));

      updateActiveIndex(clampedIndex);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  const scrollToFeature = useCallback((index: number) => {
    if (index < 0 || index >= features.length) return;

    const section = sectionRef.current;
    if (!section) return;

    const sectionTop = section.offsetTop;
    const targetScroll = sectionTop + index * window.innerHeight;

    window.scrollTo({
      top: targetScroll,
      behavior: "smooth",
    });
  }, []);

  return (
    <section
      ref={sectionRef}
      id="features"
      className="relative bg-foreground text-background"
      style={{ height: `${features.length * 100}vh` }}
    >
      <div className="sticky top-0 h-screen overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 w-full h-full flex items-center">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center w-full">
            <div className="relative flex flex-col justify-center order-2 lg:order-1">
              {features.map((feature, index) => {
                const isActive = index === activeIndex;

                return (
                  <div
                    key={feature.id}
                    className={`absolute inset-0 flex flex-col justify-center transition-all duration-500 ease-out ${
                      isActive ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0"
                    }`}
                  >
                    <div
                      className={`w-16 h-16 rounded-2xl ${feature.bgColor} backdrop-blur-sm border border-white/10 flex items-center justify-center shadow-xl mb-6`}
                    >
                      {(() => {
                        const Icon = feature.icon;
                        return <Icon className={`w-8 h-8 ${feature.color}`} />;
                      })()}
                    </div>
                    <span className={`text-sm font-medium ${feature.color} mb-3`}>
                      功能 0{index + 1}
                    </span>
                    <h3 className="text-3xl lg:text-4xl font-bold mb-4 text-balance">
                      {feature.title}
                    </h3>
                    <p className="text-base lg:text-lg text-white/70 leading-relaxed max-w-md">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="relative h-[450px] lg:h-[650px] flex items-center justify-center order-1 lg:order-2">
              <div
                className="absolute w-96 h-96 rounded-full blur-3xl transition-all duration-500"
                style={{
                  background: `radial-gradient(circle, ${featureColors[activeIndex]}, transparent)`,
                }}
              />

              {features.map((feature, index) => {
                const isActive = index === activeIndex;
                const isPrev = index < activeIndex;
                const isNext = index === activeIndex + 1;

                return (
                  <div
                    key={feature.id}
                    className={`absolute transition-all duration-500 ease-out ${
                      isActive
                        ? "translate-x-0 translate-y-0 scale-100 opacity-100 z-10"
                        : isPrev
                        ? "-translate-x-24 -translate-y-12 scale-75 opacity-0 z-0"
                        : isNext
                        ? "translate-x-24 translate-y-12 scale-75 opacity-0 z-0"
                        : "translate-x-32 translate-y-16 scale-50 opacity-0 z-0"
                    }`}
                  >
                    <div className="w-[500px] lg:w-[680px] h-auto aspect-[4/3] flex items-center justify-center">
                      <div className="w-full h-full p-6 rounded-2xl bg-gradient-to-b from-white/15 to-white/5 border border-white/20 shadow-2xl shadow-black/30">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-red-400 to-red-500/80 shadow-sm" />
                          <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500/80 shadow-sm" />
                          <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-green-400 to-green-500/80 shadow-sm" />
                        </div>
                        <div className="w-full h-full rounded-lg overflow-hidden">
                          <img
                            src={feature.screenshot}
                            alt={feature.title}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
            {features.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  index === activeIndex
                    ? "bg-white w-6"
                    : index < activeIndex
                    ? "bg-white/50 w-2"
                    : "bg-white/20 w-2"
                }`}
                onClick={() => scrollToFeature(index)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}