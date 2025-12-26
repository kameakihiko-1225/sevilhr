'use client';

import { useState, useEffect } from 'react';
import { Locale, getTranslations } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

interface CarouselInputCTAProps {
  locale?: Locale;
}

export function CarouselInputCTA({ locale = 'uz' }: CarouselInputCTAProps) {
  const t = getTranslations(locale);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);

  const texts = t.hero.rotating;
  const currentText = texts[currentIndex] || '';
  const words = currentText.split(' ');

  // Carousel animation logic (reused from AnimatedTextCarousel)
  useEffect(() => {
    // Always animate (input is disabled, so no need to check inputValue or focus)
    if (texts.length <= 1) {
      setDisplayedText(currentText);
      return;
    }

    let timeout: NodeJS.Timeout;

    if (isTyping && !isDeleting) {
      // Typing mode: add word by word
      if (wordIndex < words.length) {
        timeout = setTimeout(() => {
          setDisplayedText(prev => prev + (prev ? ' ' : '') + words[wordIndex]);
          setWordIndex(prev => prev + 1);
        }, 150); // Typing speed: 150ms per word
      } else {
        // All words typed, pause then start deleting
        timeout = setTimeout(() => {
          setIsTyping(false);
          setIsDeleting(true);
          setWordIndex(words.length - 1);
        }, 2000); // Pause for 2 seconds
      }
    } else if (isDeleting) {
      // Deleting mode: delete word by word
      if (wordIndex >= 0) {
        timeout = setTimeout(() => {
          const wordsToKeep = words.slice(0, wordIndex);
          setDisplayedText(wordsToKeep.join(' '));
          setWordIndex(prev => prev - 1);
        }, 120); // Deleting speed: 120ms per word
      } else {
        // All words deleted, move to next text
        timeout = setTimeout(() => {
          setDisplayedText('');
          setCurrentIndex(prev => (prev + 1) % texts.length);
          setIsTyping(true);
          setIsDeleting(false);
          setWordIndex(0);
        }, 200); // Reduced delay for smoother transition
      }
    }

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [currentIndex, isTyping, isDeleting, wordIndex, words, texts.length, currentText]);

  // Reset when currentIndex changes
  useEffect(() => {
    setDisplayedText('');
    setIsTyping(true);
    setIsDeleting(false);
    setWordIndex(0);
  }, [currentIndex]);

  const handleScrollToForm = () => {
    const formSection = document.getElementById('application-form');
    if (formSection) {
      formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="mb-4 sm:mb-6 md:mb-8 flex flex-col sm:flex-row items-stretch sm:items-center max-w-3xl mx-auto px-2 sm:px-0">
      <div className="flex border-2 border-red-300 rounded-lg overflow-hidden flex-1 shadow-sm min-w-0">
        {/* Input field with carousel overlay */}
        <div className="relative flex-1 min-w-0">
          <input
            type="text"
            disabled
            readOnly
            className={cn(
              "w-full h-11 sm:h-12 md:h-14 px-3 sm:px-4 md:px-6",
              "text-xs sm:text-sm md:text-base lg:text-lg",
              "bg-white text-gray-900 outline-none",
              "placeholder:text-transparent", // Hide default placeholder
              "cursor-default",
              "font-normal", // Normal font weight like real input
              "leading-normal" // Normal line height
            )}
          />
          {/* Carousel text overlay - styled like real input text */}
          <div className="absolute inset-0 flex items-center px-3 sm:px-4 md:px-6 pointer-events-none overflow-x-auto overflow-y-hidden scrollbar-hide">
            <span className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-900 font-normal leading-normal transition-opacity duration-200 whitespace-nowrap">
              {displayedText}
              {/* Cursor blink effect - more realistic */}
              <span className="inline-block w-[2px] h-3 sm:h-4 md:h-5 lg:h-6 bg-red-600 ml-0.5 sm:ml-1 animate-pulse" style={{ animationDuration: '1s' }} />
            </span>
          </div>
        </div>
        
        {/* CTA Button */}
        <button
          onClick={handleScrollToForm}
          className={cn(
            "bg-red-600 hover:bg-red-700 active:bg-red-800 text-white",
            "px-3 sm:px-5 md:px-7 lg:px-10",
            "py-2.5 sm:py-3 md:py-4",
            "h-11 sm:h-12 md:h-14",
            "text-xs sm:text-sm md:text-base lg:text-lg font-semibold",
            "flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2",
            "transition-colors duration-200",
            "whitespace-nowrap",
            "cursor-pointer",
            "flex-shrink-0"
          )}
        >
          {t.hero.cta}
          <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
        </button>
      </div>
    </div>
  );
}

