import LandingNavbar from '../components/Landing/LandingNavbar';
import HeroSection from '../components/Landing/HeroSection';
import FeaturesSection from '../components/Landing/FeaturesSection';
import StatsSection from '../components/Landing/StatsSection';
import PricingSection from '../components/Landing/PricingSection';
import TestimonialsSection from '../components/Landing/TestimonialsSection';
import CTASection from '../components/Landing/CTASection';
import Footer from '../components/Landing/Footer';

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#080C14] text-white overflow-x-hidden">
      {/* Global grid background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />
      <LandingNavbar />
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <PricingSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </div>
  );
}
