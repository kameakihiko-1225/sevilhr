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
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
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
    // Only animate if input is empty and not focused
    if (inputValue.trim() !== '' || isFocused || texts.length <= 1) {
      if (texts.length <= 1 && inputValue.trim() === '') {
        setDisplayedText(currentText);
      }
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
  }, [currentIndex, isTyping, isDeleting, wordIndex, words, texts.length, currentText, inputValue, isFocused]);

  // Reset when currentIndex changes
  useEffect(() => {
    if (inputValue.trim() === '' && !isFocused) {
      setDisplayedText('');
      setIsTyping(true);
      setIsDeleting(false);
      setWordIndex(0);
    }
  }, [currentIndex, inputValue, isFocused]);

  const handleScrollToForm = () => {
    const formSection = document.getElementById('application-form');
    if (formSection) {
      formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const showCarousel = inputValue.trim() === '' && !isFocused;

  return (
    <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-stretch sm:items-center max-w-2xl mx-auto">
      <div className="flex border-2 border-red-300 rounded-lg overflow-hidden flex-1">
        {/* Input field with carousel overlay */}
        <div className="relative flex-1">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={cn(
              "w-full h-12 sm:h-14 px-4 sm:px-6 text-base sm:text-lg",
              "bg-white text-gray-900 outline-none",
              "placeholder:text-transparent", // Hide default placeholder
              "focus:border-red-400"
            )}
          />
          {/* Carousel text overlay */}
          {showCarousel && (
            <div className="absolute inset-0 flex items-center px-4 sm:px-6 pointer-events-none">
              <span className="text-base sm:text-lg text-gray-400 transition-opacity duration-200">
                {displayedText}
                {/* Cursor blink effect */}
                <span className="inline-block w-0.5 h-4 sm:h-5 bg-gray-400 ml-1 animate-pulse" />
              </span>
            </div>
          )}
        </div>
        
        {/* CTA Button */}
        <button
          onClick={handleScrollToForm}
          className={cn(
            "bg-red-600 hover:bg-red-700 text-white",
            "px-6 sm:px-8 md:px-12 py-3 sm:py-4",
            "h-12 sm:h-14",
            "text-base sm:text-lg font-semibold",
            "flex items-center justify-center gap-2",
            "transition-colors duration-200",
            "whitespace-nowrap",
            "cursor-pointer"
          )}
        >
          {t.hero.cta}
          <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
      </div>
    </div>
  );
}

