'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Locale } from '@/lib/i18n';

interface AnimatedTextCarouselProps {
  texts: string[];
  interval?: number;
  locale?: Locale;
}

// Function to parse carousel text and highlight specific words in red
const parseCarouselText = (text: string, locale: Locale) => {
  // Define words/phrases to highlight for each locale
  const highlightPhrases: Record<Locale, string[]> = {
    uz: ['xodim', 'sotuv bo\'limini', 'mijozlar'],
    en: ['staff', 'sales department', 'customer'],
    ru: ['персонала', 'отдела продаж', 'клиентов'],
  };

  const phrasesToHighlight = highlightPhrases[locale] || [];
  const parts: Array<{ text: string; highlight: boolean }> = [];
  let remainingText = text;

  // Sort phrases by length (longest first) to match multi-word phrases first
  const sortedPhrases = [...phrasesToHighlight].sort((a, b) => b.length - a.length);

  while (remainingText.length > 0) {
    let matched = false;
    
    // Try to match any phrase (case-insensitive)
    for (const phrase of sortedPhrases) {
      const regex = new RegExp(`(${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'i');
      const match = remainingText.match(regex);
      
      if (match && match.index !== undefined) {
        // Add text before the match
        if (match.index > 0) {
          parts.push({
            text: remainingText.substring(0, match.index),
            highlight: false,
          });
        }
        
        // Add the matched phrase
        parts.push({
          text: match[0],
          highlight: true,
        });
        
        // Continue with remaining text
        remainingText = remainingText.substring(match.index + match[0].length);
        matched = true;
        break;
      }
    }
    
    if (!matched) {
      // No match found, add all remaining text
      parts.push({
        text: remainingText,
        highlight: false,
      });
      break;
    }
  }

  return parts.filter(p => p.text.trim());
};

export function AnimatedTextCarousel({ texts, interval = 3000, locale = 'uz' }: AnimatedTextCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (texts.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % texts.length);
    }, interval);

    return () => clearInterval(timer);
  }, [texts.length, interval]);

  const textParts = parseCarouselText(texts[currentIndex], locale);

  return (
    <div className="relative min-h-[60px] flex items-center justify-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
          className="text-center w-full"
        >
          <div className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight">
            {textParts.map((part, index) => (
              <span
                key={index}
                className={part.highlight ? 'text-red-600' : 'text-gray-700'}
              >
                {part.text}
              </span>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
