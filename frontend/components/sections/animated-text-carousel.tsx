'use client';

import { useState, useEffect } from 'react';
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
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);

  const currentText = texts[currentIndex] || '';
  const words = currentText.split(' ');

  useEffect(() => {
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
        }, 150); // Typing speed: 150ms per word (smoother)
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
        }, 120); // Deleting speed: 120ms per word (smoother)
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

  const textParts = parseCarouselText(displayedText, locale);

  return (
    <div className="relative min-h-[60px] sm:min-h-[80px] flex items-center justify-center px-4">
      <div className="text-center w-full">
        <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-normal leading-tight text-gray-900 transition-all duration-300 ease-in-out">
          {textParts.length > 0 ? (
            textParts.map((part, index) => (
              <span
                key={index}
                className="text-gray-900 transition-opacity duration-200 ease-in-out"
              >
                {part.text}
              </span>
            ))
          ) : (
            <span className="text-gray-900 transition-opacity duration-200 ease-in-out">{displayedText}</span>
          )}
          {/* Cursor blink effect */}
          <span className="inline-block w-0.5 h-6 sm:h-8 md:h-10 bg-gray-900 ml-1 animate-pulse transition-opacity duration-200" />
        </div>
      </div>
    </div>
  );
}
