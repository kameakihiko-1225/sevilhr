'use client';

import { Button } from '../ui/button';
import { cn } from '@/lib/utils';

interface FormStagesProps {
  currentStage: number;
  totalStages: number;
  onStageClick: (stage: number) => void;
  locale?: string;
  isStageFilled?: (stage: number) => boolean;
}

export function FormStages({ currentStage, totalStages, onStageClick, locale = 'uz', isStageFilled }: FormStagesProps) {
  return (
    <div className="flex justify-center gap-2 sm:gap-3 mb-4 sm:mb-6 flex-wrap">
      {Array.from({ length: totalStages }, (_, i) => i + 1).map((stage) => {
        const isFilled = isStageFilled ? isStageFilled(stage) : false;
        const isCurrent = stage === currentStage;
        
        // Determine styling based on state
        let buttonClass = '';
        if (isCurrent) {
          // Current stage: bright red
          buttonClass = 'bg-red-600 text-white ring-4 ring-red-200 shadow-lg scale-110';
        } else if (isFilled) {
          // Filled but not current: reddish coloring
          buttonClass = 'bg-red-400 text-white hover:bg-red-500 shadow-md';
        } else {
          // Not filled: gray
          buttonClass = 'bg-gray-200 text-gray-600 hover:bg-gray-300 hover:scale-105';
        }
        
        return (
          <button
            key={stage}
            onClick={() => onStageClick(stage)}
            className={cn(
              "w-14 h-14 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-lg sm:text-base transition-all min-h-[56px] sm:min-h-[48px] max-[319px]:block min-[320px]:hidden min-[426px]:block relative",
              buttonClass
            )}
          >
            {stage}
          </button>
        );
      })}
    </div>
  );
}
