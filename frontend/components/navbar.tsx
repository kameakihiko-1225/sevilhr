'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Send } from "lucide-react";
import { getTranslations, Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface NavbarProps {
  locale?: Locale;
}

export default function Navbar({ locale = 'uz' }: NavbarProps) {
  const t = getTranslations(locale);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Set initial visibility
    const setInitialVisibility = () => {
      const initialScrollY = window.scrollY;
      lastScrollYRef.current = initialScrollY;
      const isMobile = window.innerWidth <= 640;
      
      if (isMobile) {
        const heroSection = document.getElementById('hero-section');
        const heroBottom = heroSection ? heroSection.offsetTop + heroSection.offsetHeight : window.innerHeight;
        setIsVisible(initialScrollY === 0 || initialScrollY < heroBottom);
      } else {
        setIsVisible(initialScrollY <= 100);
      }
    };

    setInitialVisibility();

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const isMobile = window.innerWidth <= 640;
          const heroSection = document.getElementById('hero-section');
          const heroBottom = heroSection ? heroSection.offsetTop + heroSection.offsetHeight : window.innerHeight;

          const isScrollingUp = currentScrollY < lastScrollYRef.current;
          const isWithinHero = currentScrollY < heroBottom;

          if (isMobile) {
            // Mobile: Only show when scrolling up AND within hero section, or at top
            if (currentScrollY === 0 || (isScrollingUp && isWithinHero)) {
              setIsVisible(true);
            } else {
              setIsVisible(false);
            }
          } else {
            // Tablet/PC: Hide on scroll down, show on scroll up
            if (currentScrollY === 0 || isScrollingUp) {
              setIsVisible(true);
            } else if (currentScrollY > lastScrollYRef.current && currentScrollY > 100) {
              setIsVisible(false);
            }
          }

          lastScrollYRef.current = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <nav 
      className={cn(
        "fixed top-8 inset-x-4 h-[72px] sm:h-20 bg-background border max-w-7xl mx-auto rounded-full z-50 shadow-lg transition-transform duration-300",
        isVisible ? "translate-y-0" : "-translate-y-[calc(100%+2rem)]"
      )}
      style={{ 
        pointerEvents: isVisible ? 'auto' : 'none',
        opacity: isVisible ? 1 : 0
      }}
    >
      <div className="h-full flex items-center justify-between mx-auto px-4 sm:px-8">
        <Logo />

        <div className="flex items-center gap-3 sm:gap-5">
          <Button
            variant="outline"
            asChild
            className="border-red-600 text-red-600 hover:bg-red-50 hover:text-red-700 h-10 sm:h-12 px-3 sm:px-4"
          >
            <a
              href="https://t.me/hrseviluz"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm sm:text-base font-medium"
            >
              <Send className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">{t.nav.telegram}</span>
            </a>
          </Button>
          
          <LanguageSwitcher />
        </div>
      </div>
    </nav>
  );
}
