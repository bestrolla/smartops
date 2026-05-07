'use client'

// Instructions: Create the main page structure with header and hero section matching ElevaCards design

import { Header } from '@/components/Header'
import { HeroSection } from '@/components/HeroSection'
import { FeaturesSection } from '@/components/FeaturesSection'
import { ModulesSection } from '@/components/ModulesSection'
import { BackgroundVideosSection } from '@/components/BackgroundVideosSection'
import ProductsSection from '@/components/ProductsSection'
import { TemplatesSection } from '@/components/TemplatesSection'
import { PricingSection } from '@/components/PricingSection'
import FAQSection from '@/components/FAQSection'
import { FinalCTASection } from '@/components/FinalCTASection'
import { Footer } from '@/components/Footer'
import { useTheme } from '@/hooks/useTheme'

export default function Home() {
  const { theme } = useTheme();

  return (
    <main className="min-h-screen">
      <Header theme={theme} />
      <HeroSection theme={theme} />
      <FeaturesSection theme={theme} />
      <ModulesSection theme={theme} />
      <BackgroundVideosSection theme={theme} />
      <TemplatesSection theme={theme} />
      <PricingSection theme={theme} />
      <FAQSection theme={theme} />
      <FinalCTASection theme={theme} />
      <Footer theme={theme} />
    </main>
  )
}
