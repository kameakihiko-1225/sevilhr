'use client';

import Image from 'next/image';
import { Locale } from '@/lib/i18n';

interface CEOCommentProps {
  stage: number;
  locale?: Locale;
}

const ceoComments: Record<number, Record<Locale, string>> = {
  1: {
    uz: "Kontekstni yaxshiroq tushunishimiz uchun so'rayapmiz. Chunki bozor sharoiti va o'sish tezligi hududga qarab farq qiladi.",
    en: "We're asking to better understand the context. Because market conditions and growth rates vary by region.",
    ru: "Мы спрашиваем, чтобы лучше понять контекст. Потому что рыночные условия и темпы роста различаются по регионам.",
  },
  2: {
    uz: "Yondashuvni biznes modelingizga moslash uchun so'rayapmiz.",
    en: "We're asking to adapt the approach to your business model.",
    ru: "Мы спрашиваем, чтобы адаптировать подход к вашей бизнес-модели.",
  },
  3: {
    uz: "Bu qaror qabul qilish jarayonini tushunish uchun kerak.",
    en: "This is needed to understand the decision-making process.",
    ru: "Это необходимо для понимания процесса принятия решений.",
  },
  4: {
    uz: "Fokusni aniqlash uchun kerak.",
    en: "This is needed to identify the focus.",
    ru: "Это необходимо для определения фокуса.",
  },
  5: {
    uz: "Biznesingizni sizning tilingizda tushunish olishimiz uchun kerak.",
    en: "This is needed to understand your business in your own words.",
    ru: "Это необходимо для понимания вашего бизнеса на вашем языке.",
  },
  6: {
    uz: "Buni sizga qaysi darajadagi yechim mos kelishini aniqlash uchun so'rayapmiz.",
    en: "We're asking to determine which level of solution suits you.",
    ru: "Мы спрашиваем, чтобы определить, какой уровень решения вам подходит.",
  },
  7: {
    uz: "Bu bizga tashkiliy murakkablik darajasini baholash uchun kerak.",
    en: "This is needed to assess the level of organizational complexity.",
    ru: "Это необходимо для оценки уровня организационной сложности.",
  },
  8: {
    uz: "Odam ekaningizni bilaylik. Robotlar ko'payib ketgan 🙂",
    en: "Let us know you're human. Robots are multiplying 🙂",
    ru: "Дайте нам знать, что вы человек. Роботы размножаются 🙂",
  },
  9: {
    uz: "Yechim bera olishimizni bilsak aloqaga chiqamiz.",
    en: "If we know we can provide a solution, we'll reach out.",
    ru: "Если мы знаем, что можем предоставить решение, мы свяжемся.",
  },
};

export function CEOComment({ stage, locale = 'uz' }: CEOCommentProps) {
  const comment = ceoComments[stage]?.[locale] || ceoComments[stage]?.['uz'] || '';

  if (!comment) return null;

  return (
    <div className="flex items-center gap-3 sm:gap-5 p-4 sm:p-6 bg-gray-50 rounded-lg border border-gray-200 mt-4 sm:mt-6 mb-0">
      <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-full overflow-hidden">
        <Image
          src="/ceo.jpg"
          alt="CEO"
          fill
          className="object-cover"
          sizes="(max-width: 640px) 64px, 80px"
        />
      </div>
      <div className="flex-1">
        <p className="text-sm sm:text-lg md:text-xl text-gray-700 leading-relaxed">{comment}</p>
      </div>
    </div>
  );
}

