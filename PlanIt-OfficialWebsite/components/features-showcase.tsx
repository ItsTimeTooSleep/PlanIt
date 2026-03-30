"use client";

import { useEffect, useRef, useState } from "react";
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
}

const features: Feature[] = [
  {
    id: 1,
    icon: CheckSquare,
    title: "任务管理",
    description: "创建任务、添加标签、追踪状态，让每一项待办都井井有条",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    id: 2,
    icon: Calendar,
    title: "日历视图",
    description: "周视图与月视图灵活切换，支持日期笔记，规划一目了然",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  {
    id: 3,
    icon: Timer,
    title: "番茄钟计时器",
    description: "专注模式帮助你保持高效，科学管理工作与休息时间",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
  },
  {
    id: 4,
    icon: StickyNote,
    title: "笔记系统",
    description: "多彩笔记卡片，随时记录灵感，让想法不再流失",
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
  },
  {
    id: 5,
    icon: LayoutGrid,
    title: "桌面小组件",
    description: "可拖拽的多种类型小组件，打造专属工作空间",
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
  },
  {
    id: 6,
    icon: BarChart3,
    title: "数据统计",
    description: "图表可视化展示效率数据，了解自己的工作习惯",
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
  },
];

export function FeaturesShowcase() {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [transitionProgress, setTransitionProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const sectionHeight = sectionRef.current.offsetHeight;
      const viewportHeight = window.innerHeight;
      
      // 计算在 sticky 区域内的滚动进度
      const scrolled = -rect.top;
      const scrollableHeight = sectionHeight - viewportHeight;
      const progress = Math.min(Math.max(scrolled / scrollableHeight, 0), 1);
      
      // 根据进度计算当前激活的功能索引和过渡进度
      const totalProgress = progress * features.length;
      const currentIndex = Math.min(Math.floor(totalProgress), features.length - 1);
      const currentTransition = totalProgress - currentIndex;
      
      setActiveIndex(currentIndex);
      setTransitionProgress(currentTransition);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section
      ref={sectionRef}
      id="features"
      className="relative bg-foreground text-background"
      style={{ height: `${120 * features.length}vh` }}
    >
      <div className="sticky top-0 h-screen flex items-center overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left: Feature Icons Stack */}
            <div className="relative h-[400px] lg:h-[500px] flex items-center justify-center">
              {/* Background Glow */}
              <div 
                className="absolute w-64 h-64 rounded-full blur-3xl transition-colors duration-500"
                style={{
                  background: `radial-gradient(circle, ${activeIndex === 0 ? 'rgba(59,130,246,0.3)' : activeIndex === 1 ? 'rgba(16,185,129,0.3)' : activeIndex === 2 ? 'rgba(249,115,22,0.3)' : activeIndex === 3 ? 'rgba(234,179,8,0.3)' : activeIndex === 4 ? 'rgba(236,72,153,0.3)' : 'rgba(6,182,212,0.3)'}, transparent)`,
                }}
              />
              
              {/* Stacked Icons */}
              <div className="relative w-full h-full flex items-center justify-center">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  const isActive = index === activeIndex;
                  const isNext = index === activeIndex + 1;
                  const isPast = index < activeIndex;
                  
                  let translateX = 0;
                  let translateY = 0;
                  let scale = 1;
                  let opacity = 0;
                  let rotateY = 0;

                  if (isActive) {
                    // 当前图标：随滚动向左滑出
                    translateX = -transitionProgress * 200;
                    scale = 1 - transitionProgress * 0.3;
                    opacity = 1 - transitionProgress;
                    rotateY = -transitionProgress * 45;
                  } else if (isNext) {
                    // 下一个图标：从右侧滑入
                    translateX = 150 - transitionProgress * 150;
                    scale = 0.7 + transitionProgress * 0.3;
                    opacity = transitionProgress;
                    rotateY = 30 - transitionProgress * 30;
                  } else if (isPast) {
                    // 已过去的图标：隐藏
                    translateX = -300;
                    opacity = 0;
                  } else {
                    // 未来的图标：在右侧等待
                    const futureIndex = index - activeIndex - 1;
                    translateX = 200 + futureIndex * 30;
                    scale = 0.6 - futureIndex * 0.1;
                    opacity = Math.max(0.15 - futureIndex * 0.05, 0);
                  }

                  return (
                    <div
                      key={feature.id}
                      className="absolute transition-all duration-150 ease-out"
                      style={{
                        transform: `translateX(${translateX}px) translateY(${translateY}px) scale(${scale}) perspective(1000px) rotateY(${rotateY}deg)`,
                        opacity,
                        zIndex: isActive ? 10 : isNext ? 5 : 1,
                      }}
                    >
                      <div
                        className={`w-32 h-32 lg:w-40 lg:h-40 rounded-3xl ${feature.bgColor} backdrop-blur-sm border border-white/10 flex items-center justify-center shadow-2xl`}
                      >
                        <Icon className={`w-16 h-16 lg:w-20 lg:h-20 ${feature.color}`} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Progress Dots */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-2">
                {features.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === activeIndex
                        ? "bg-white w-6"
                        : index < activeIndex
                        ? "bg-white/50 w-2"
                        : "bg-white/20 w-2"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Right: Feature Text - Only show active feature */}
            <div className="relative h-[350px] lg:h-[450px] overflow-hidden">
              {features.map((feature, index) => {
                const isActive = index === activeIndex;
                const isNext = index === activeIndex + 1;
                const isPrev = index === activeIndex - 1;
                
                let translateY = 0;
                let opacity = 0;
                let scale = 1;

                if (isActive) {
                  // 当前内容：随滚动向上滑出
                  translateY = -transitionProgress * 60;
                  opacity = 1 - transitionProgress;
                  scale = 1 - transitionProgress * 0.05;
                } else if (isNext) {
                  // 下一个内容：从下方滑入
                  translateY = 60 - transitionProgress * 60;
                  opacity = transitionProgress;
                  scale = 0.95 + transitionProgress * 0.05;
                } else if (isPrev) {
                  // 上一个内容：已滑出
                  translateY = -80;
                  opacity = 0;
                } else {
                  // 其他内容：在下方等待
                  translateY = 100;
                  opacity = 0;
                }

                return (
                  <div
                    key={feature.id}
                    className="absolute inset-0 flex flex-col justify-center transition-all duration-150 ease-out"
                    style={{
                      transform: `translateY(${translateY}px) scale(${scale})`,
                      opacity,
                      visibility: opacity > 0 ? 'visible' : 'hidden',
                    }}
                  >
                    <span className={`text-sm font-medium ${feature.color} mb-4`}>
                      功能 0{index + 1}
                    </span>
                    <h3 className="text-3xl lg:text-5xl font-bold mb-6 text-balance">
                      {feature.title}
                    </h3>
                    <p className="text-lg lg:text-xl text-white/70 leading-relaxed max-w-md">
                      {feature.description}
                    </p>
                    
                    {/* Feature Screenshot Placeholder */}
                    <div className="mt-8 p-4 rounded-xl bg-white/5 border border-white/10 max-w-md">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 rounded-full bg-red-400/60" />
                        <div className="w-2 h-2 rounded-full bg-yellow-400/60" />
                        <div className="w-2 h-2 rounded-full bg-green-400/60" />
                      </div>
                      <div className="aspect-video bg-white/5 rounded-lg flex items-center justify-center">
                        <feature.icon className={`w-12 h-12 ${feature.color} opacity-50`} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
