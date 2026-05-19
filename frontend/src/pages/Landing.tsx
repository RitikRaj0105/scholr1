import { Navbar } from '@/components/landing/Navbar';
import { Hero } from '@/components/landing/Hero';
import { Features } from '@/components/landing/Features';
import { DashboardPreview } from '@/components/landing/DashboardPreview';
import { Testimonials } from '@/components/landing/Testimonials';
import { Pricing } from '@/components/landing/Pricing';
import { FAQ } from '@/components/landing/FAQ';
import { Footer } from '@/components/landing/Footer';

export default function Landing() {
  return (
    <div className="relative min-h-screen bg-ink-950 text-bone-50 overflow-x-hidden">
      {/* Ambient grain overlay */}
      <div className="fixed inset-0 pointer-events-none bg-grain opacity-[0.02] z-50 mix-blend-soft-light" />

      <Navbar />
      <main className="relative">
        <Hero />
        <Features />
        <DashboardPreview />
        <Testimonials />
        <Pricing />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
