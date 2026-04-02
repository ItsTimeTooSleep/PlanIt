"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Apple, Monitor, Download, ArrowRight } from "lucide-react";
import { useGitHubRelease, getPlatformSizes, getPlatformDownloadUrls } from "@/hooks/use-github-release";

const GITHUB_OWNER = "itstimetoosleep";
const GITHUB_REPO = "PlanIt";
const GITHUB_RELEASES_URL = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;

export function DownloadSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const { release, loading } = useGitHubRelease(GITHUB_OWNER, GITHUB_REPO);

  const platformSizes = useMemo(() => getPlatformSizes(release), [release]);
  const platformDownloadUrls = useMemo(() => getPlatformDownloadUrls(release), [release]);

  const platforms = useMemo(
    () => [
      {
        name: "macOS",
        icon: Apple,
        version: release?.tag_name || "",
        size: platformSizes.macos.aarch64,
        sizeX64: platformSizes.macos.x64,
        requirement: "macOS 12.0 或更高版本",
        downloadUrl: platformDownloadUrls.macos.aarch64 || GITHUB_RELEASES_URL,
        downloadUrlX64: platformDownloadUrls.macos.x64,
        primary: false,
      },
      {
        name: "Windows",
        icon: Monitor,
        version: release?.tag_name || "",
        size: platformSizes.windows,
        requirement: "Windows 10/11 64位",
        downloadUrl: platformDownloadUrls.windows || GITHUB_RELEASES_URL,
        primary: true,
      },
      {
        name: "Linux",
        icon: () => (
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
          </svg>
        ),
        version: "",
        size: "",
        requirement: "Ubuntu 20.04+ / Fedora 35+",
        downloadUrl: GITHUB_RELEASES_URL,
        primary: false,
        comingSoon: true,
      },
    ],
    [release, platformSizes, platformDownloadUrls]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} id="download" className="py-24 md:py-32 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-6">
        <div
          className={`text-center mb-16 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
            立即开始使用
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            选择你的平台，免费下载 PlanIt，开启高效规划之旅
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {platforms.map((platform, index) => (
            <div
              key={platform.name}
              className={`transition-all duration-700 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${index * 100 + 200}ms` }}
            >
              <div
                className={`relative p-6 rounded-2xl border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group ${
                  platform.comingSoon
                    ? "bg-muted/30 border-dashed opacity-70 hover:opacity-100"
                    : platform.primary
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border hover:border-accent/50"
                }`}
              >
                {platform.comingSoon && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-chart-4 text-chart-4-foreground text-xs font-medium rounded-full">
                    即将发行
                  </div>
                )}
                {platform.primary && !platform.comingSoon && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-accent text-accent-foreground text-xs font-medium rounded-full">
                    推荐
                  </div>
                )}
                <div className="flex flex-col items-center text-center">
                  <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${
                      platform.primary && !platform.comingSoon
                        ? "bg-primary-foreground/10"
                        : "bg-secondary"
                    }`}
                  >
                    <platform.icon
                      className={`w-8 h-8 ${
                        platform.primary && !platform.comingSoon ? "text-primary-foreground" : "text-foreground"
                      }`}
                    />
                  </div>
                  <h3 className="text-xl font-semibold mb-1">{platform.name}</h3>
                  <p
                    className={`text-sm mb-4 ${
                      platform.primary && !platform.comingSoon
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground"
                    }`}
                  >
                    {(platform.version || platform.size) && (
                      <>
                        {platform.version}
                        {platform.version && platform.size && " · "}
                        {platform.size}
                      </>
                    )}
                  </p>
                  {platform.comingSoon ? (
                    <Button
                      variant="secondary"
                      disabled
                      className="w-full gap-2"
                    >
                      敬请期待
                    </Button>
                  ) : (
                    <Button
                      variant={platform.primary ? "secondary" : "default"}
                      className="w-full gap-2 group/btn"
                      asChild
                    >
                      <a
                        href={platform.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Download className="w-4 h-4" />
                        下载
                        <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 transition-all group-hover/btn:opacity-100 group-hover/btn:translate-x-0" />
                      </a>
                    </Button>
                  )}
                  <p
                    className={`text-xs mt-3 ${
                      platform.comingSoon
                        ? "text-muted-foreground/50"
                        : platform.primary && !platform.comingSoon
                        ? "text-primary-foreground/50"
                        : "text-muted-foreground/70"
                    }`}
                  >
                    {platform.requirement}
                  </p>
                  {platform.name === "macOS" && platform.downloadUrlX64 && !platform.comingSoon && (
                    <a
                      href={platform.downloadUrlX64}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs mt-1 underline underline-offset-4 hover:no-underline transition-colors"
                    >
                      <span className={`${
                        platform.primary ? "text-primary-foreground/60 hover:text-primary-foreground" : "text-muted-foreground/60 hover:text-muted-foreground"
                      }`}>
                        x64 (Intel)？点我下载
                      </span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div
          className={`mt-16 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{ transitionDelay: "600ms" }}
        >
          <div className="text-center p-8 rounded-2xl bg-secondary/50 border border-border max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold mb-2">更多下载选项</h3>
            <p className="text-muted-foreground text-sm mb-4">
              需要其他版本？查看我们的历史版本或获取测试版
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button variant="outline" size="sm" asChild>
                <a href={`https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases`} target="_blank" rel="noopener noreferrer">历史版本</a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href={`https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases`} target="_blank" rel="noopener noreferrer">Beta 测试版</a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href={`https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases`} target="_blank" rel="noopener noreferrer">更新日志</a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
