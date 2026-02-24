'use client';

import Image from 'next/image';
import { getTranslations, Locale } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface LogoCloudProps {
  locale?: Locale;
}

const companyLogos = [
  { src: '/companies/cert main.png', alt: 'Cert Main' },
  { src: '/companies/gold_real-removebg-preview.png', alt: 'Gold Real' },
  { src: '/companies/muu.png', alt: 'MUU' },
  { src: '/companies/redbullcom-logo_double-with-text.svg', alt: 'Red Bull' },
  { src: '/companies/egs_main-removebg-preview.png', alt: 'EGS' },
  { src: '/companies/yosh olim.svg', alt: 'Yosh Olim' },
  { src: '/companies/Logo white school.png', alt: 'MuSchool' },
  { src: '/companies/Tez Go.png', alt: 'Tez Go' },
  { src: '/companies/picanother.png', alt: 'Luqmam' },
  { src: '/companies/registon.svg', alt: 'Registon' },
  { src: '/companies/Yoshlar_ishlari_agentligi_logotipi.svg.png', alt: 'Yoshlar Ishlari Agentligi' },
];

export function LogoCloud({ locale = 'uz' }: LogoCloudProps) {
  const t = getTranslations(locale);

  return (
    <section className="py-12 sm:py-16 px-4 bg-white overflow-hidden">
      <div className="container mx-auto max-w-7xl">
        <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-8 sm:mb-12 text-gray-900 px-2">
          {t.partners.title}
        </h2>

        {/* CSS-animated marquee - no JS scrollLeft needed */}
        <div className="relative overflow-hidden">
          <div className="flex w-max animate-scroll hover:[animation-play-state:paused]">
            {[...companyLogos, ...companyLogos].map((logo, index) => (
              <div
                key={index}
                className={cn(
                  "relative flex-shrink-0 w-[240px] sm:w-[280px] md:w-[320px] h-28 sm:h-32 md:h-40 flex items-center justify-center mx-6 md:mx-8",
                  "opacity-100 grayscale-0 max-[864px]:opacity-100 max-[864px]:grayscale-0",
                  "min-[865px]:opacity-60 min-[865px]:grayscale min-[865px]:hover:opacity-100 min-[865px]:hover:grayscale-0",
                  "hover:opacity-100 hover:grayscale-0 transition-all duration-300"
                )}
              >
                <Image
                  src={logo.src}
                  alt={logo.alt}
                  fill
                  className="object-contain p-2 pointer-events-none"
                  style={logo.alt === 'Luqmam' ? { objectPosition: 'center calc(50% + 8px)' } : undefined}
                  sizes="(max-width: 640px) 240px, (max-width: 768px) 280px, 320px"
                />
              </div>
            ))}
          </div>

          {/* Gradient overlays for fade effect */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent pointer-events-none z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent pointer-events-none z-10" />
        </div>
      </div>
    </section>
  );
}
