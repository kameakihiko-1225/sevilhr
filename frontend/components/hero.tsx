'use client';

import AnimatedGridPattern from "@/components/ui/animated-grid-pattern";
import { cn } from "@/lib/utils";
import { getTranslations, Locale } from "@/lib/i18n";
import { AnimatedTextCarousel } from "@/components/sections/animated-text-carousel";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowRight } from "lucide-react";

interface HeroProps {
  locale?: Locale;
}

// Function to parse headline and highlight specific words in red
const parseHeadline = (text: string, locale: Locale) => {
  const highlightWords: Record<Locale, string[]> = {
    uz: ['kattalashishda'],
    en: ['grow'],
    ru: ['расти'],
  };

  const wordsToHighlight = highlightWords[locale] || [];
  const words = text.split(' ');
  
  return words.map((word, index) => {
    // Check if word (or word without punctuation) should be highlighted
    const cleanWord = word.replace(/[.,!?;:]/g, '').toLowerCase();
    const shouldHighlight = wordsToHighlight.some(hw => 
      cleanWord.includes(hw.toLowerCase())
    );
    
    return {
      text: word + (index < words.length - 1 ? ' ' : ''),
      highlight: shouldHighlight,
    };
  });
};

export default function Hero({ locale = 'uz' }: HeroProps) {
  const t = getTranslations(locale);

  // Partner logos data - all available company logos
  const partnerLogos = [
    { src: '/companies/cert main.png', alt: 'Cert Main', fallback: 'CM' },
    { src: '/companies/gold real.jpg', alt: 'Gold Real', fallback: 'GR' },
    { src: '/companies/muschool.png', alt: 'MuSchool', fallback: 'MS' },
    { src: '/companies/muu.png', alt: 'MUU', fallback: 'MU' },
    { src: '/companies/redbullcom-logo_double-with-text.svg', alt: 'Red Bull', fallback: 'RB' },
    { src: '/companies/egs main.jpg', alt: 'EGS', fallback: 'EGS' },
  ];

  const headlineParts = parseHeadline(t.hero.headline, locale);

  return (
    <div id="hero-section" className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 overflow-hidden pt-20 sm:pt-24 bg-white">
      {/* Beautiful background pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-red-50/30" />
      
      <AnimatedGridPattern
        numSquares={50}
        maxOpacity={0.4}
        duration={3}
        className={cn(
          "inset-x-0 h-full"
        )}
      />
      
      {/* Decorative circles */}
      <div className="absolute top-20 right-20 w-72 h-72 bg-red-100 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob" />
      <div className="absolute bottom-20 left-20 w-72 h-72 bg-gray-100 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000" />
      
      <div className="relative z-10 text-center max-w-5xl mx-auto">
        {/* What's new banner */}
        <div 
          onClick={() => {
            const formSection = document.getElementById('application-form');
            if (formSection) {
              formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }}
          className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-white border border-red-300 shadow-sm mb-6 sm:mb-8 hover:bg-red-50 transition-colors cursor-pointer group min-h-[44px]"
        >
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-600"></div>
          <span className="text-sm sm:text-base text-gray-700 font-medium">{t.hero.whatsNew}</span>
          <ArrowUpRight className="w-4 h-4 sm:w-4 sm:h-4 text-red-600 group-hover:text-red-700 transition-colors" />
        </div>

        {/* Main headline with highlighted words */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tighter mb-6 sm:mb-8 leading-tight">
          {headlineParts.map((part, index) => (
            <span
              key={index}
              className={part.highlight ? 'text-red-600' : 'text-gray-900'}
            >
              {part.text}
            </span>
          ))}
        </h1>
        
        {/* Carousel text in a card - no backdrop blur */}
        <Card className="bg-white border-2 border-red-600 shadow-xl rounded-2xl p-4 sm:p-6 md:p-8 mb-6 sm:mb-8">
          <AnimatedTextCarousel texts={t.hero.rotating} locale={locale} />
        </Card>

        {/* CTA Button - Extra large width, reduced height */}
        <Button 
          onClick={() => {
            const formSection = document.getElementById('application-form');
            if (formSection) {
              formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }}
          className="rounded-lg bg-red-600 hover:bg-red-700 text-white mb-8 sm:mb-10 cursor-pointer text-lg sm:text-xl px-8 sm:px-12 md:px-16 py-3 sm:py-4 h-12 sm:h-auto min-h-[48px] font-semibold"
        >
          {t.hero.cta}
          <ArrowRight className="ml-2 sm:ml-3 h-4 w-4 sm:h-5 sm:w-5" />
        </Button>

        {/* Partner Logos Section - Centered with Overlapping Avatar Group */}
        <div className="flex flex-col items-center gap-4">
          {/* Partner Logos - Overlapping Avatar Group */}
          <div className="flex items-center justify-center -space-x-3">
            {partnerLogos.map((partner, index) => (
              <div
                key={index}
                className={cn(
                  "relative w-16 h-16 md:w-20 md:h-20 rounded-full ring-2 ring-background border-2 border-white overflow-hidden",
                  "transition-all duration-300 hover:scale-110 hover:shadow-lg"
                )}
              >
                <Image
                  src={partner.src}
                  alt={partner.alt}
                  fill
                  className="object-contain p-1.5 md:p-2 bg-white"
                  sizes="(max-width: 768px) 64px, 80px"
                />
              </div>
            ))}
          </div>
          
          {/* Social proof text - Bigger */}
          <p className="text-base sm:text-lg md:text-xl text-gray-600 font-semibold">
            {t.hero.socialProof}
          </p>
        </div>
      </div>
    </div>
  );
}
