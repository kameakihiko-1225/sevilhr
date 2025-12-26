'use client';

import { getTranslations, Locale } from '@/lib/i18n';

interface PartnersProps {
  locale?: Locale;
  partnerLogos?: string[];
}

export function Partners({ locale = 'uz', partnerLogos = [] }: PartnersProps) {
  const t = getTranslations(locale);

  if (partnerLogos.length === 0) {
    return null;
  }

  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="container mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">{t.partners.title}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {partnerLogos.map((logo, index) => (
            <div
              key={index}
              className="flex items-center justify-center p-4 bg-white rounded-lg hover:shadow-lg transition-shadow"
            >
              {/* Placeholder for partner logos */}
              <div className="text-gray-400 text-sm">Partner {index + 1}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

