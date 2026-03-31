"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { label: "功能", href: "#features" },
    { label: "下载", href: "#download" },
  ];

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-background/80 backdrop-blur-lg border-b border-border shadow-sm"
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center transition-transform group-hover:scale-110">
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

        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors relative group"
            >
              {item.label}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <a
            href="https://github.com/itstimetoosleep/PlanIt"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            GitHub
          </a>
          <Button size="sm" asChild>
            <a href="https://github.com/itstimetoosleep/PlanIt/releases/latest">免费下载</a>
          </Button>
        </div>

        <button
          className="md:hidden p-2"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={cn(
          "md:hidden absolute top-16 left-0 right-0 bg-background/95 backdrop-blur-lg border-b border-border transition-all duration-300 overflow-hidden",
          isMobileMenuOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <nav className="flex flex-col p-6 gap-4">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {item.label}
            </a>
          ))}
          <div className="flex flex-col gap-2 pt-4 border-t border-border">
            <a
              href="https://github.com/itstimetoosleep/PlanIt"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              GitHub
            </a>
            <Button size="sm" asChild>
              <a href="https://github.com/itstimetoosleep/PlanIt/releases/latest">免费下载</a>
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
}
