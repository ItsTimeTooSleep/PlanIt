import { Header } from "@/components/header";
import { HeroSection } from "@/components/hero-section";
import { TransitionSection } from "@/components/transition-section";
import { FeaturesShowcase } from "@/components/features-showcase";
import { AnalyticsTransition } from "@/components/analytics-transition";
import { AnalyticsReveal } from "@/components/analytics-reveal";
import { DownloadTransition } from "@/components/download-transition";
import { DownloadSection } from "@/components/download-section";
import { Footer } from "@/components/footer";
import { ScrollProgress } from "@/components/scroll-progress";

export default function Home() {
  return (
    <main className="relative">
      <ScrollProgress />
      <Header />
      <HeroSection />
      <TransitionSection />
      <FeaturesShowcase />
      <AnalyticsTransition />
      <AnalyticsReveal />
      <DownloadTransition />
      <DownloadSection />
      <Footer />
    </main>
  );
}
