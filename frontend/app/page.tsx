'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/navbar';
import Hero from '@/components/hero';
import { ApplicationForm } from '@/components/sections/application-form';
import { LogoCloud } from '@/components/sections/logo-cloud';
import Footer from '@/components/footer';
import { Locale } from '@/lib/i18n';

export default function Home() {
  const [locale, setLocale] = useState<Locale>('uz');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('locale') as Locale;
    if (saved && ['uz', 'en', 'ru'].includes(saved)) {
      setLocale(saved);
    }
  }, []);

  // Prevent hydration mismatch by using default locale until mounted
  const currentLocale = mounted ? locale : 'uz';

  return (
    <main className="min-h-screen bg-white">
      <Navbar locale={currentLocale} />
      <Hero locale={currentLocale} />
      <ApplicationForm locale={currentLocale} />
      <LogoCloud locale={currentLocale} />
      <Footer locale={currentLocale} />
    </main>
  );
}
