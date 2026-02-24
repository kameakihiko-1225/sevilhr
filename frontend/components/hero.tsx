'use client';

import AnimatedGridPattern from "@/components/ui/animated-grid-pattern";
import { cn } from "@/lib/utils";
import { getTranslations, Locale } from "@/lib/i18n";
import { CarouselInputCTA } from "@/components/sections/carousel-input-cta";
import Image from "next/image";

interface HeroProps {
  locale?: Locale;
}

interface HeroLogoCarouselProps {
  logos: Array<{ src: string; alt: string; fallback: string }>;
}

// Hero Logo Carousel Component - CSS-animated marquee (works in Telegram WebView)
function HeroLogoCarousel({ logos }: HeroLogoCarouselProps) {
  const duplicatedLogos = [...logos, ...logos];

  return (
    <div className="relative w-full mt-6 sm:mt-8 md:mt-10 overflow-hidden">
      <div className="flex w-max animate-scroll hover:[animation-play-state:paused]">
        {duplicatedLogos.map((logo, index) => (
          <div
            key={index}
            className={cn(
              "relative flex-shrink-0 w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 lg:w-40 lg:h-40 xl:w-44 xl:h-44 2xl:w-48 2xl:h-48 flex items-center justify-center mx-2 sm:mx-3 md:mx-4 lg:mx-6 transition-all duration-300",
              "opacity-60 grayscale hover:opacity-100 hover:grayscale-0"
            )}
          >
            <Image
              src={logo.src}
              alt={logo.alt}
              fill
              className="object-contain pointer-events-none p-2 sm:p-3 md:p-4"
              style={logo.alt === 'Luqmam' ? { objectPosition: 'center calc(50% + 8px)' } : undefined}
              sizes="(max-width: 480px) 96px, (max-width: 640px) 112px, (max-width: 768px) 144px, (max-width: 1024px) 160px, 192px"
            />
          </div>
        ))}
      </div>

      {/* Gradient overlays for fade effect */}
      <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-16 md:w-20 bg-gradient-to-r from-white to-transparent pointer-events-none z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-16 md:w-20 bg-gradient-to-l from-white to-transparent pointer-events-none z-10" />
    </div>
  );
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
    { src: '/companies/gold_real-removebg-preview.png', alt: 'Gold Real', fallback: 'GR' },
    { src: '/companies/muu.png', alt: 'MUU', fallback: 'MU' },
    { src: '/companies/redbullcom-logo_double-with-text.svg', alt: 'Red Bull', fallback: 'RB' },
    { src: '/companies/egs_main-removebg-preview.png', alt: 'EGS', fallback: 'EGS' },
    { src: '/companies/yosh olim.svg', alt: 'Yosh Olim', fallback: 'YO' },
    { src: '/companies/Logo white school.png', alt: 'MuSchool', fallback: 'MS' },
    { src: '/companies/Tez Go.png', alt: 'Tez Go', fallback: 'TG' },
    { src: '/companies/picanother.png', alt: 'Luqmam', fallback: 'LQ' },
    { src: '/companies/registon.svg', alt: 'Registon', fallback: 'RG' },
    { src: '/companies/Yoshlar_ishlari_agentligi_logotipi.svg.png', alt: 'Yoshlar Ishlari Agentligi', fallback: 'YIA' },
  ];

  const headlineParts = parseHeadline(t.hero.headline, locale);

  return (
    <div id="hero-section" className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 md:px-8 overflow-hidden pt-16 sm:pt-20 md:pt-24 pb-8 sm:pb-12 md:pb-16 bg-white">
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
      
      {/* Decorative circles - responsive sizing */}
      <div className="absolute top-10 sm:top-20 right-4 sm:right-20 w-48 h-48 sm:w-72 sm:h-72 bg-red-100 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob" />
      <div className="absolute bottom-10 sm:bottom-20 left-4 sm:left-20 w-48 h-48 sm:w-72 sm:h-72 bg-gray-100 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000" />
      
      <div className="relative z-10 text-center max-w-5xl mx-auto w-full">
        {/* Main headline with highlighted words - improved mobile/tablet sizing */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-bold tracking-tighter mb-4 sm:mb-6 md:mb-8 leading-tight text-gray-900 px-2 sm:px-0">
          {headlineParts.map((part, index) => (
            <span
              key={index}
              className="text-gray-900"
            >
              {part.text}
            </span>
          ))}
        </h1>
        
        {/* Carousel Input CTA Component */}
        <CarouselInputCTA locale={locale} />

        {/* Partner Logos Carousel */}
        <HeroLogoCarousel logos={partnerLogos} />
      </div>
    </div>
  );
}
