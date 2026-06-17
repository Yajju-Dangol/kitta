import { HeroSection } from "../components/ui/hero-section-2";
import { FeaturedSpotlight } from "../components/ui/feature-spotlight";
import { StackedCircularFooter } from "../components/ui/stacked-circular-footer";

interface LandingPageProps {
  onEnterApp: () => void;
}

export default function LandingPage({ onEnterApp }: LandingPageProps) {
  return (
    <div className="flex min-h-screen flex-col bg-black overflow-x-hidden font-sans">
      <HeroSection onEnterApp={onEnterApp} />
      <FeaturedSpotlight />
      <StackedCircularFooter />
    </div>
  );
}
