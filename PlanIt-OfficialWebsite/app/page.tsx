import { AnalyticsReveal } from "@/components/analytics-reveal";
import { AnalyticsTransition } from "@/components/analytics-transition";
import { DownloadSection } from "@/components/download-section";
import { DownloadTransition } from "@/components/download-transition";
import { FeaturesShowcase } from "@/components/features-showcase";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { HeroSection } from "@/components/hero-section";
import { ScrollProgress } from "@/components/scroll-progress";
import { TransitionSection } from "@/components/transition-section";

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
