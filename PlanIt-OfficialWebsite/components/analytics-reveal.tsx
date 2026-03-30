"use client";

import { useEffect, useRef, useState } from "react";

// 生成模拟数据
function generateData(days: number) {
  const data = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // 生成波动的效率数据
    const baseValue = 4 + Math.sin(i * 0.5) * 1.5;
    const randomVariation = (Math.random() - 0.5) * 2;
    const currentValue = Math.max(1, Math.min(8, baseValue + randomVariation));
    
    // 上周期数据（略低一些）
    const previousValue = Math.max(1, Math.min(8, currentValue - 0.5 + (Math.random() - 0.5)));
    
    data.push({
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      current: Number(currentValue.toFixed(1)),
      previous: Number(previousValue.toFixed(1)),
    });
  }
  
  return data;
}

export function AnalyticsReveal() {
  const sectionRef = useRef<HTMLElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [allData, setAllData] = useState<ReturnType<typeof generateData>>([]);

  useEffect(() => {
    setAllData(generateData(30));
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const sectionHeight = sectionRef.current.offsetHeight;
      const viewportHeight = window.innerHeight;
      
      const scrolled = -rect.top;
      const scrollableHeight = sectionHeight - viewportHeight;
      const progress = Math.min(Math.max(scrolled / scrollableHeight, 0), 1);
      
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 根据滚动进度计算显示的天数 (1 - 30天)
  const visibleDays = Math.max(1, Math.min(30, Math.ceil(scrollProgress * 29) + 1));
  const visibleData = allData.slice(-visibleDays);

  // 图表尺寸
  const chartWidth = 800;
  const chartHeight = 300;
  const padding = { top: 30, right: 30, bottom: 50, left: 50 };
  const graphWidth = chartWidth - padding.left - padding.right;
  const graphHeight = chartHeight - padding.top - padding.bottom;

  // 计算刻度
  const maxValue = 8;
  const yTicks = [0, 2, 4, 6, 8];

  // 生成路径
  const generatePath = (data: typeof visibleData, key: "current" | "previous") => {
    if (data.length === 0) return "";
    
    const points = data.map((d, i) => {
      const x = padding.left + (i / Math.max(data.length - 1, 1)) * graphWidth;
      const y = padding.top + graphHeight - (d[key] / maxValue) * graphHeight;
      return { x, y };
    });

    return points
      .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
      .join(" ");
  };

  // 计算统计数据
  const avgCurrent = visibleData.length > 0 
    ? (visibleData.reduce((sum, d) => sum + d.current, 0) / visibleData.length).toFixed(1)
    : "0";
  const avgPrevious = visibleData.length > 0
    ? (visibleData.reduce((sum, d) => sum + d.previous, 0) / visibleData.length).toFixed(1)
    : "0";
  const improvement = ((Number(avgCurrent) - Number(avgPrevious)) / Number(avgPrevious) * 100).toFixed(0);

  return (
    <section
      ref={sectionRef}
      className="relative bg-secondary/30"
      style={{ height: "400vh" }}
    >
      <div className="sticky top-0 h-screen flex items-center overflow-hidden">
        <div className="max-w-5xl mx-auto px-6 w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              效率趋势
            </h2>
            <p className="text-muted-foreground text-lg">
              滚动查看更多历史数据 · 当前显示 {visibleDays} 天
            </p>
          </div>

          {/* Chart Container */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-lg">
            {/* Stats Row */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">本周期平均</p>
                  <p className="text-2xl font-bold text-accent">{avgCurrent} 小时</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">上周期平均</p>
                  <p className="text-2xl font-bold text-muted-foreground">{avgPrevious} 小时</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">效率提升</p>
                  <p className={`text-2xl font-bold ${Number(improvement) > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {Number(improvement) > 0 ? '+' : ''}{improvement}%
                  </p>
                </div>
              </div>
              
              {/* Timeline indicator */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-20 h-1 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-accent rounded-full transition-all duration-100"
                    style={{ width: `${scrollProgress * 100}%` }}
                  />
                </div>
                <span>{visibleDays}/30 天</span>
              </div>
            </div>

            {/* SVG Chart */}
            <div className="w-full overflow-hidden">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-auto"
                preserveAspectRatio="xMidYMid meet"
              >
                {/* Grid Lines */}
                {yTicks.map((tick) => {
                  const y = padding.top + graphHeight - (tick / maxValue) * graphHeight;
                  return (
                    <g key={tick}>
                      <line
                        x1={padding.left}
                        y1={y}
                        x2={chartWidth - padding.right}
                        y2={y}
                        stroke="currentColor"
                        strokeOpacity={0.1}
                        strokeDasharray="3 3"
                      />
                      <text
                        x={padding.left - 10}
                        y={y}
                        textAnchor="end"
                        dominantBaseline="middle"
                        className="fill-muted-foreground text-[10px]"
                      >
                        {tick}h
                      </text>
                    </g>
                  );
                })}

                {/* X Axis Labels */}
                {visibleData.map((d, i) => {
                  // 只显示部分标签避免重叠
                  const showLabel = visibleData.length <= 7 || i % Math.ceil(visibleData.length / 7) === 0 || i === visibleData.length - 1;
                  if (!showLabel) return null;
                  
                  const x = padding.left + (i / Math.max(visibleData.length - 1, 1)) * graphWidth;
                  return (
                    <text
                      key={i}
                      x={x}
                      y={chartHeight - padding.bottom + 20}
                      textAnchor="middle"
                      className="fill-muted-foreground text-[10px]"
                    >
                      {d.date}
                    </text>
                  );
                })}

                {/* Previous Period Line (dashed) */}
                <path
                  d={generatePath(visibleData, "previous")}
                  fill="none"
                  stroke="currentColor"
                  strokeOpacity={0.3}
                  strokeWidth={1.5}
                  strokeDasharray="4 2"
                  className="transition-all duration-300"
                />

                {/* Current Period Line */}
                <path
                  d={generatePath(visibleData, "current")}
                  fill="none"
                  className="stroke-accent"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    transition: "d 0.3s ease-out",
                  }}
                />

                {/* Data Points for Current Period */}
                {visibleData.map((d, i) => {
                  const x = padding.left + (i / Math.max(visibleData.length - 1, 1)) * graphWidth;
                  const y = padding.top + graphHeight - (d.current / maxValue) * graphHeight;
                  const isLast = i === visibleData.length - 1;
                  
                  return (
                    <g key={i}>
                      {isLast && (
                        <>
                          {/* Pulse animation for latest point */}
                          <circle
                            cx={x}
                            cy={y}
                            r={8}
                            className="fill-accent/30 animate-ping"
                          />
                          <circle
                            cx={x}
                            cy={y}
                            r={5}
                            className="fill-accent"
                          />
                          {/* Value label */}
                          <rect
                            x={x - 20}
                            y={y - 30}
                            width={40}
                            height={20}
                            rx={4}
                            className="fill-accent"
                          />
                          <text
                            x={x}
                            y={y - 16}
                            textAnchor="middle"
                            className="fill-white text-[10px] font-medium"
                          >
                            {d.current}h
                          </text>
                        </>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-4 text-[11px]">
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-accent rounded" />
                <span className="text-muted-foreground">本周期</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-muted-foreground/30 rounded" style={{ backgroundImage: 'repeating-linear-gradient(90deg, currentColor 0, currentColor 4px, transparent 4px, transparent 6px)' }} />
                <span className="text-muted-foreground">上周期</span>
              </div>
            </div>
          </div>

          {/* Scroll Hint */}
          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground animate-pulse">
              继续向下滚动查看更多数据
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
