"use client";

import { useEffect, useRef, useState } from "react";

const socialLinks = [
  {
    name: "GitHub",
    href: "https://github.com/itstimetoosleep/PlanIt",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path
          fillRule="evenodd"
          d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
];

export function Footer() {
  const footerRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (footerRef.current) {
      observer.observe(footerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <footer ref={footerRef} className="bg-secondary/30 border-t border-border">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className={`transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <a href="#" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 32 32"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-primary-foreground"
                >
                  <g transform="translate(16, 16)">
                    <ellipse cx="0" cy="0" rx="10" ry="2.5" stroke="currentColor" strokeWidth="1.2" fill="none"/>
                    <ellipse cx="0" cy="0" rx="10" ry="2.5" stroke="currentColor" strokeWidth="1.2" fill="none" transform="rotate(60)"/>
                    <ellipse cx="0" cy="0" rx="10" ry="2.5" stroke="currentColor" strokeWidth="1.2" fill="none" transform="rotate(-60)"/>
                    <circle cx="0" cy="0" r="2.5" stroke="currentColor" strokeWidth="1.3" fill="none"/>
                    <circle cx="0" cy="-10" r="0.7" fill="currentColor"/>
                    <circle cx="8.5" cy="5" r="0.7" fill="currentColor"/>
                    <circle cx="-8.5" cy="5" r="0.7" fill="currentColor"/>
                  </g>
                </svg>
              </div>
              <span className="font-semibold text-lg">PlanIt</span>
            </a>
            <p className="text-sm text-muted-foreground">
              © 2026 PlanIt. 保留所有权利。基于 AGPL-3.0 开源许可
              <a
                href="https://www.gnu.org/licenses/agpl-3.0.html"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors ml-1"
              >
                (查看)
              </a>
            </p>
            <div className="flex items-center gap-3">
              {socialLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={link.name}
                >
                  {link.icon}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
