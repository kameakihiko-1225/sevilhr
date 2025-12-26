'use client';

import Image from 'next/image';
import { getTranslations, Locale } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { useRef, useState, useEffect } from 'react';

interface LogoCloudProps {
  locale?: Locale;
}

const companyLogos = [
  { src: '/companies/cert main.png', alt: 'Cert Main' },
  { src: '/companies/gold real.jpg', alt: 'Gold Real' },
  { src: '/companies/muschool.png', alt: 'MuSchool' },
  { src: '/companies/muu.png', alt: 'MUU' },
  { src: '/companies/redbullcom-logo_double-with-text.svg', alt: 'Red Bull' },
  { src: '/companies/egs main.jpg', alt: 'EGS' },
];

// Duplicate logos multiple times for seamless infinite scroll
const duplicatedLogos = [...companyLogos, ...companyLogos, ...companyLogos];

export function LogoCloud({ locale = 'uz' }: LogoCloudProps) {
  const t = getTranslations(locale);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const innerContainerRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const animationRef = useRef<number | null>(null);
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize scroll position to middle set for seamless loop
  useEffect(() => {
    if (!scrollContainerRef.current || !innerContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const innerContainer = innerContainerRef.current;
    
    // Wait for layout to calculate proper width
    const initScroll = () => {
      if (container.scrollWidth === 0) {
        requestAnimationFrame(initScroll);
        return;
      }
      
      const singleSetWidth = container.scrollWidth / 3;
      // Start in the middle set (second set) for seamless loop in both directions
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
      
      // Loop forward: if scrolled past the second set, jump back to first set
      if (container.scrollLeft >= singleSetWidth * 2) {
        container.scrollLeft = container.scrollLeft - singleSetWidth;
      }
      // Loop backward: if scrolled before first set, jump to second set
      else if (container.scrollLeft <= 0) {
        container.scrollLeft = singleSetWidth + container.scrollLeft;
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [isDragging]);

  // Auto-scroll animation with infinite loop
  useEffect(() => {
    if (isPaused || isDragging || !scrollContainerRef.current) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    const scrollSpeed = 0.8; // pixels per frame (adjust for speed)
    const container = scrollContainerRef.current;

    const animate = () => {
      if (!container || isPaused || isDragging) return;
      
      container.scrollLeft += scrollSpeed;
      
      // Infinite loop: reset when reaching end of second set
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

  // Clear pause timeout helper
  const clearPauseTimeout = () => {
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
      pauseTimeoutRef.current = null;
    }
  };

  // Resume auto-scroll after pause
  const resumeAutoScroll = () => {
    clearPauseTimeout();
    pauseTimeoutRef.current = setTimeout(() => {
      setIsPaused(false);
    }, 800); // Resume after 800ms of no interaction
  };

  // Mouse drag handlers
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
    const walk = (x - startX) * 2.5; // Scroll speed multiplier
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
    clearPauseTimeout();
  };

  // Touch handlers for mobile
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

  // Intersection Observer for tablet focus detection
  useEffect(() => {
    if (!sectionRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Check if section is in viewport (at least 50% visible)
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            setIsInView(true);
          } else {
            setIsInView(false);
          }
        });
      },
      {
        threshold: [0, 0.5, 1],
        rootMargin: '-20% 0px -20% 0px', // Trigger when section is in middle 60% of viewport
      }
    );

    observer.observe(sectionRef.current);

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearPauseTimeout();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <section ref={sectionRef} className="py-12 sm:py-16 px-4 bg-white overflow-hidden">
      <div className="container mx-auto max-w-7xl">
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-8 sm:mb-12 text-gray-900 px-2">
          {t.partners.title}
        </h2>
        
        {/* Auto-scrolling logo cloud with manual scroll */}
        <div className="relative">
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
            <div ref={innerContainerRef} className="flex gap-12 md:gap-16 select-none">
              {duplicatedLogos.map((logo, index) => (
                <div
                  key={index}
                  tabIndex={0}
                  className={cn(
                    "relative flex-shrink-0 w-[240px] sm:w-[280px] md:w-[320px] h-28 sm:h-32 md:h-40 flex items-center justify-center transition-all duration-300",
                    // Mobile (< 768px) and Tablet (768px to 864px): colorful by default
                    "opacity-100 grayscale-0 max-[864px]:opacity-100 max-[864px]:grayscale-0",
                    // Tablet when section is in view: ensure colorful
                    isInView ? "md:grayscale-0 md:opacity-100" : "md:opacity-100 md:grayscale-0",
                    // Desktop (> 864px): grayscale by default, colorful on hover
                    "min-[865px]:opacity-60 min-[865px]:grayscale min-[865px]:hover:opacity-100 min-[865px]:hover:grayscale-0",
                    "hover:opacity-100 hover:grayscale-0",
                    "focus:opacity-100 focus:grayscale-0 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-lg",
                    "active:opacity-100 active:grayscale-0",
                    "touch-manipulation"
                  )}
                >
                  <Image
                    src={logo.src}
                    alt={logo.alt}
                    fill
                    className="object-contain p-2 pointer-events-none"
                    sizes="(max-width: 640px) 240px, (max-width: 768px) 280px, 320px"
                  />
                </div>
              ))}
            </div>
          </div>
          
          {/* Gradient overlays for fade effect */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent pointer-events-none z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent pointer-events-none z-10" />
        </div>
      </div>
    </section>
  );
}
