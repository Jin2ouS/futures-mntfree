import Hero from "@/components/Hero";
import Philosophy from "@/components/Philosophy";
import SystemArchitecture from "@/components/SystemArchitecture";
import RiskSection from "@/components/RiskSection";
import Closing from "@/components/Closing";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <Hero />
      <Philosophy />
      <SystemArchitecture />
      <RiskSection />
      <Closing />
      <Footer />
    </div>
  );
}
