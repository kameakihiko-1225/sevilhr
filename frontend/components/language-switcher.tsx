'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Locale } from '@/lib/i18n';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const locales: { code: Locale; label: string; flag: string }[] = [
  { code: 'uz', label: 'O\'zbek', flag: '🇺🇿' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
];

export function LanguageSwitcher() {
  const [locale, setLocale] = useState<Locale>('uz');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('locale') as Locale;
      if (saved && locales.some((l) => l.code === saved)) {
        setLocale(saved);
      }
    }
  }, []);

  const handleLocaleChange = (newLocale: Locale) => {
    setLocale(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', newLocale);
    }
    window.location.reload(); // Simple reload for now
  };

  // Use default locale until mounted to prevent hydration mismatch
  const currentLocale = mounted ? locale : 'uz';
  const currentLocaleData = locales.find(l => l.code === currentLocale) || locales[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2 h-10 sm:h-12 px-2 sm:px-4 min-[376px]:px-3">
          <span className="text-xl sm:text-2xl">{currentLocaleData.flag}</span>
          <span className="text-sm sm:text-base max-[319px]:inline hidden min-[376px]:inline">{currentLocaleData.label}</span>
          <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 opacity-50 max-[319px]:block hidden min-[376px]:block" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {locales.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => handleLocaleChange(l.code)}
            className="cursor-pointer min-h-[44px]"
          >
            <span className="text-lg mr-2">{l.flag}</span>
            <span className="flex-1">{l.label}</span>
            {currentLocale === l.code && (
              <Check className="h-4 w-4 text-red-600" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
