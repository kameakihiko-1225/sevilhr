'use client';

import { Card, CardContent } from '../ui/card';

interface CaseShowcaseProps {
  stage: number;
  locale?: string;
}

const cases: Record<string, Record<number, string>> = {
  uz: {
    1: 'Masalan: Toshkent shahri yoki Qashqadaryo viloyati',
    2: 'Masalan: Aliyev Ali Aliyevich',
    3: 'Masalan: +998901234567',
    4: 'Masalan: ABC Corporation',
  },
  en: {
    1: 'Example: Tashkent city or Kashkadarya region',
    2: 'Example: Ali Aliyev Aliyevich',
    3: 'Example: +998901234567',
    4: 'Example: ABC Corporation',
  },
  ru: {
    1: 'Например: Город Ташкент или Кашкадарья область',
    2: 'Например: Алиев Али Алиевич',
    3: 'Например: +998901234567',
    4: 'Например: ABC Corporation',
  },
};

export function CaseShowcase({ stage, locale = 'uz' }: CaseShowcaseProps) {
  const caseText = cases[locale]?.[stage] || cases.uz[stage] || '';

  if (!caseText) return null;

  return (
    <Card className="mb-4 bg-red-50 border-2 border-red-200">
      <CardContent className="pt-4 pb-4">
        <p className="text-sm text-red-700 font-medium">{caseText}</p>
      </CardContent>
    </Card>
  );
}
