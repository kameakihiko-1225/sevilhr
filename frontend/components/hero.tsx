'use client';

import AnimatedGridPattern from "@/components/ui/animated-grid-pattern";
import { cn } from "@/lib/utils";
import { getTranslations, Locale } from "@/lib/i18n";
import { CarouselInputCTA } from "@/components/sections/carousel-input-cta";
import Image from "next/image";
import { useRef, useEffect, useState } from 'react';

interface HeroProps {
  locale?: Locale;
}

interface HeroLogoCarouselProps {
  logos: Array<{ src: string; alt: string; fallback: string }>;
}

// Hero Logo Carousel Component - Horizontal scrolling carousel
function HeroLogoCarousel({ logos }: HeroLogoCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const innerContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const animationRef = useRef<number | null>(null);
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Duplicate logos for seamless infinite scroll
  const duplicatedLogos = [...logos, ...logos, ...logos];

  // Initialize scroll position to middle set for seamless loop
  useEffect(() => {
    if (!scrollContainerRef.current || !innerContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const innerContainer = innerContainerRef.current;
    
    const initScroll = () => {
      if (container.scrollWidth === 0) {
        requestAnimationFrame(initScroll);
        return;
      }
      
      const singleSetWidth = container.scrollWidth / 3;
      container.scrollLeft = singleSetWidth;
    };
    
    initScroll();
  }, []);

  // Handle infinite loop on scroll
  useEffect(() => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    
    const handleScroll = () => {
      if (!container || isDragging) return;
      
      const singleSetWidth = container.scrollWidth / 3;
      
      if (container.scrollLeft >= singleSetWidth * 2) {
        container.scrollLeft = container.scrollLeft - singleSetWidth;
      } else if (container.scrollLeft <= 0) {
        container.scrollLeft = singleSetWidth + container.scrollLeft;
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [isDragging]);

  // Auto-scroll animation
  useEffect(() => {
    if (isPaused || isDragging || !scrollContainerRef.current) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    const scrollSpeed = 0.8;
    const container = scrollContainerRef.current;

    const animate = () => {
      if (!container || isPaused || isDragging) return;
      
      container.scrollLeft += scrollSpeed;
      
      const singleSetWidth = container.scrollWidth / 3;
      if (container.scrollLeft >= singleSetWidth * 2) {
        container.scrollLeft = container.scrollLeft - singleSetWidth;
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPaused, isDragging]);

  const clearPauseTimeout = () => {
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
      pauseTimeoutRef.current = null;
    }
  };

  const resumeAutoScroll = () => {
    clearPauseTimeout();
    pauseTimeoutRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 800);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setIsPaused(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
    e.preventDefault();
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    resumeAutoScroll();
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    resumeAutoScroll();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2.5;
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
    clearPauseTimeout();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setIsPaused(true);
    setStartX(e.touches[0].pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    const x = e.touches[0].pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2.5;
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
    clearPauseTimeout();
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    resumeAutoScroll();
  };

  useEffect(() => {
    return () => {
      clearPauseTimeout();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="relative w-full mt-6 sm:mt-8 md:mt-10">
      <div 
        ref={scrollContainerRef}
        className="overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ 
          scrollBehavior: 'auto',
          WebkitOverflowScrolling: 'touch',
        } as React.CSSProperties}
      >
        <div ref={innerContainerRef} className="flex gap-4 sm:gap-6 md:gap-8 lg:gap-12 select-none px-2 sm:px-0">
          {duplicatedLogos.map((logo, index) => (
            <div
              key={index}
              className={cn(
                "relative flex-shrink-0 w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 lg:w-40 lg:h-40 xl:w-44 xl:h-44 2xl:w-48 2xl:h-48 flex items-center justify-center transition-all duration-300",
                "opacity-60 grayscale hover:opacity-100 hover:grayscale-0"
              )}
            >
              <Image
                src={logo.src}
                alt={logo.alt}
                fill
                className={cn(
                  "object-contain pointer-events-none",
                  // Increase padding for MUU and MuSchool logos to make them appear same size as others
                  (logo.alt === 'MUU' || logo.alt === 'MuSchool') 
                    ? "p-4 sm:p-5 md:p-6 lg:p-7 xl:p-8" 
                    : "p-3 sm:p-4 md:p-5 lg:p-6"
                )}
                sizes="(max-width: 480px) 96px, (max-width: 640px) 112px, (max-width: 768px) 144px, (max-width: 1024px) 160px, 192px"
              />
            </div>
          ))}
        </div>
      </div>
      
      {/* Gradient overlays for fade effect - responsive width */}
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
