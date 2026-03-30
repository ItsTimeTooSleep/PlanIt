import { Header } from "@/components/header";
import { HeroSection } from "@/components/hero-section";
import { FeaturesShowcase } from "@/components/features-showcase";
import { AnalyticsReveal } from "@/components/analytics-reveal";
import { DownloadSection } from "@/components/download-section";
import { Footer } from "@/components/footer";
import { ScrollProgress } from "@/components/scroll-progress";

export default function Home() {
  return (
    <main className="relative">
      <ScrollProgress />
      <Header />
      <HeroSection />
      <FeaturesShowcase />
      <AnalyticsReveal />
      <DownloadSection />
      <Footer />
    </main>
  );
}
