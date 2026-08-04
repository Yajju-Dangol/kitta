import { HeroSection } from "../components/ui/hero-section-2";
import { FeaturedSpotlight } from "../components/ui/feature-spotlight";
import { StackedCircularFooter } from "../components/ui/stacked-circular-footer";

import { Session } from "@supabase/supabase-js";

interface LandingPageProps {
  onEnterApp: () => void;
  session?: Session | null;
}

export default function LandingPage({ onEnterApp, session }: LandingPageProps) {
  return (
    <div className="flex min-h-screen flex-col bg-black overflow-x-hidden font-sans">
      <HeroSection onEnterApp={onEnterApp} session={session} />
      <StackedCircularFooter />
    </div>
  );
}
