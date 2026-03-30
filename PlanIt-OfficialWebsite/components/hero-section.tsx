"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Apple, Monitor } from "lucide-react";

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const sectionHeight = sectionRef.current.offsetHeight;
      // 计算section在视口中的滚动进度 (0 = 刚进入, 1 = 完全离开)
      const progress = Math.min(Math.max(-rect.top / (sectionHeight * 0.5), 0), 1);
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 标题动画：向后移动、变淡，但高度不变
  const titleOpacity = Math.max(1 - scrollProgress * 2, 0);
  const titleScale = Math.max(1 - scrollProgress * 0.2, 0.8);

  // 截图动画：从底部向上移动、放大
  const screenshotTranslateY = 100 - scrollProgress * 180; // 从 100% 移动到 -80%
  const screenshotScale = 0.85 + scrollProgress * 0.2;
  const screenshotOpacity = 0.4 + scrollProgress * 0.6;

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[180vh]"
    >
      {/* Sticky Container */}
      <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 -z-10">
          <div
            className="absolute top-20 left-10 w-72 h-72 bg-accent/10 rounded-full blur-3xl transition-transform duration-100"
            style={{ transform: `translateY(${scrollProgress * 100}px) scale(${1 + scrollProgress * 0.3})` }}
          />
          <div
            className="absolute bottom-20 right-10 w-96 h-96 bg-chart-2/10 rounded-full blur-3xl transition-transform duration-100"
            style={{ transform: `translateY(${scrollProgress * -80}px) scale(${1 + scrollProgress * 0.2})` }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,var(--background)_70%)]" />
        </div>

        {/* Title Group - 滚动时变淡，高度固定 */}
        <div
          className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center px-6 transition-all duration-100 will-change-transform z-10"
          style={{
            opacity: titleOpacity,
            transform: `translateY(-50%) scale(${titleScale})`,
          }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-secondary-foreground text-sm mb-8 border border-border">
            <span className="w-2 h-2 rounded-full bg-chart-4 animate-pulse" />
            全新 2.0 版本已发布
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-8xl font-bold tracking-tight text-balance max-w-4xl mx-auto">
            规划时间
            <br />
            <span className="text-muted-foreground">掌控生活</span>
          </h1>

          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
            PlanIt 是一款跨平台桌面任务管理应用，帮助学生和知识工作者更好地规划任务、保持专注、提升效率。
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="gap-2 px-8 group">
              免费下载
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button size="lg" variant="outline" className="gap-2">
              了解更多
            </Button>
          </div>
          <div className="mt-6 flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Apple className="w-4 h-4" />
              macOS
            </span>
            <span className="flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              Windows
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
              </svg>
              Linux
            </span>
          </div>
        </div>

        {/* Screenshot - 从底部向上移动、放大 */}
        <div
          className="absolute inset-x-0 bottom-0 flex justify-center px-6 transition-all duration-100 will-change-transform"
          style={{
            transform: `translateY(${screenshotTranslateY}%)`,
            opacity: screenshotOpacity,
          }}
        >
          <div 
            className="relative w-full max-w-5xl transition-transform duration-100"
            style={{ transform: `scale(${screenshotScale})` }}
          >
            <div className="absolute -inset-4 bg-gradient-to-r from-accent/20 via-chart-2/20 to-chart-3/20 rounded-2xl blur-2xl opacity-60" />
            <div className="relative bg-secondary/80 backdrop-blur rounded-t-2xl border border-b-0 border-border p-4 shadow-2xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-destructive/60" />
                <div className="w-3 h-3 rounded-full bg-chart-5/60" />
                <div className="w-3 h-3 rounded-full bg-chart-4/60" />
                <span className="ml-4 text-xs text-muted-foreground">
                  PlanIt - 主界面
                </span>
              </div>
              <div className="aspect-[16/9] bg-card rounded-t-lg overflow-hidden border border-b-0 border-border">
                {/* Mock App Interface */}
                <div className="h-full flex">
                  {/* Sidebar */}
                  <div className="w-56 bg-secondary/50 border-r border-border p-4 flex flex-col gap-3">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-accent" stroke="currentColor" strokeWidth="2">
                          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <span className="font-semibold text-sm">PlanIt</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/10 text-accent text-sm">
                        <div className="w-4 h-4 rounded bg-accent/20" />
                        <span>今日任务</span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-muted-foreground text-sm hover:bg-secondary">
                        <div className="w-4 h-4 rounded bg-muted" />
                        <span>日历</span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-muted-foreground text-sm hover:bg-secondary">
                        <div className="w-4 h-4 rounded bg-muted" />
                        <span>笔记</span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-muted-foreground text-sm hover:bg-secondary">
                        <div className="w-4 h-4 rounded bg-muted" />
                        <span>统计</span>
                      </div>
                    </div>
                  </div>
                  {/* Main Content */}
                  <div className="flex-1 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-lg font-semibold">今日任务</h2>
                        <p className="text-xs text-muted-foreground">3月30日 周日</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="px-3 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs">+ 新建任务</div>
                      </div>
                    </div>
                    {/* Task List */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border">
                        <div className="w-5 h-5 rounded-full border-2 border-chart-4 flex items-center justify-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-chart-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm line-through text-muted-foreground">完成项目提案</p>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-chart-4/10 text-chart-4">已完成</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border">
                        <div className="w-5 h-5 rounded-full border-2 border-accent" />
                        <div className="flex-1">
                          <p className="text-sm">准备周一会议材料</p>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent">进行中</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border">
                        <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />
                        <div className="flex-1">
                          <p className="text-sm">阅读技术文档</p>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">待办</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
