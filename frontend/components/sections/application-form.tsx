'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { FormStages } from './form-stages';
import { CEOComment } from './ceo-comment';
import { useSession } from '@/hooks/use-session';
import { getTranslations, Locale } from '@/lib/i18n';
import { MapPin, Building2, User, Phone, ArrowRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import AnimatedGridPattern from '@/components/ui/animated-grid-pattern';

type FormData = {
  location: 'Toshkent shahri' | 'Boshqa viloyatda';
  companyType: string;
  roleInCompany: string;
  interests: string[];
  companyDescription: string;
  annualTurnover: string;
  numberOfEmployees: string;
  fullName: string;
  phoneNumber: string;
  companyName?: string;
};

interface ApplicationFormProps {
  locale?: Locale;
  onSubmitSuccess?: (data: FormData) => void;
}

const TOTAL_STAGES = 9;

export function ApplicationForm({ locale = 'uz', onSubmitSuccess }: ApplicationFormProps) {
  const [currentStage, setCurrentStage] = useState(1);
  const [wantsTelegram, setWantsTelegram] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [lastActivityTime, setLastActivityTime] = useState<number>(Date.now());
  const { formData: sessionData, updateField, clearSession, hasRequiredFields, mounted } = useSession();
  const t = getTranslations(locale);
  
  const formSchema = z.object({
    location: z.enum(['Toshkent shahri', 'Boshqa viloyatda']),
    companyType: z.string().min(1, t.validation?.required || 'Company type is required'),
    roleInCompany: z.string().min(1, t.validation?.required || 'Role in company is required'),
    interests: z.array(z.string()).min(1, t.validation?.interestsMin || 'Select at least one interest'),
    companyDescription: z.string().min(1, t.validation?.required || 'Company description is required'),
    annualTurnover: z.string().min(1, t.validation?.required || 'Annual turnover is required'),
    numberOfEmployees: z.string().min(1, t.validation?.required || 'Number of employees is required'),
    fullName: z.string().min(2, t.validation?.nameMin || 'Name must be at least 2 characters'),
    phoneNumber: z.string().min(9, t.validation?.phoneInvalid || 'Phone number must be at least 9 characters'),
    companyName: z.string().optional(),
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: mounted ? {
      ...(sessionData as Partial<FormData>),
      interests: (sessionData.interests as string[]) || [],
    } : undefined,
  });

  const formValues = watch();
  const currentInterests = (formValues.interests || sessionData.interests || []) as string[];

  // Helper function to check if a stage has data
  const isStageFilled = (stage: number): boolean => {
    // Prioritize formValues (current live state) over sessionData
    const location = formValues.location || sessionData.location;
    const companyType = formValues.companyType || sessionData.companyType;
    const roleInCompany = formValues.roleInCompany || sessionData.roleInCompany;
    const interests = formValues.interests || sessionData.interests;
    const companyDescription = formValues.companyDescription || sessionData.companyDescription;
    const annualTurnover = formValues.annualTurnover || sessionData.annualTurnover;
    const numberOfEmployees = formValues.numberOfEmployees || sessionData.numberOfEmployees;
    const fullName = formValues.fullName || sessionData.fullName;
    const phoneNumber = formValues.phoneNumber || sessionData.phoneNumber;
    
    switch (stage) {
      case 1:
        return !!location && (location === 'Toshkent shahri' || location === 'Boshqa viloyatda');
      case 2:
        return !!companyType && typeof companyType === 'string' && companyType.trim().length > 0;
      case 3:
        return !!roleInCompany && typeof roleInCompany === 'string' && roleInCompany.trim().length > 0;
      case 4:
        return Array.isArray(interests) && interests.length > 0 && interests.some(i => i && i.trim().length > 0);
      case 5:
        return !!companyDescription && typeof companyDescription === 'string' && companyDescription.trim().length > 0;
      case 6:
        return !!annualTurnover && typeof annualTurnover === 'string' && annualTurnover.trim().length > 0;
      case 7:
        return !!numberOfEmployees && typeof numberOfEmployees === 'string' && numberOfEmployees.trim().length > 0;
      case 8:
        return !!(fullName && typeof fullName === 'string' && fullName.trim().length > 0) && 
               !!(phoneNumber && typeof phoneNumber === 'string' && phoneNumber.trim().length > 0);
      case 9:
        return wantsTelegram !== null && wantsTelegram !== undefined;
      default:
        return false;
    }
  };

  // Sync form values with session
  useEffect(() => {
    if (!mounted) return;
    Object.entries(formValues).forEach(([key, value]) => {
      // Special handling for interests array
      if (key === 'interests') {
        const currentSession = (sessionData.interests as string[]) || [];
        const currentForm = (value as string[]) || [];
        if (JSON.stringify(currentForm) !== JSON.stringify(currentSession)) {
          updateField('interests', currentForm);
        }
      } else if (value && value !== sessionData[key as keyof typeof sessionData]) {
        updateField(key as keyof typeof sessionData, value as string);
      }
    });
  }, [formValues, sessionData, updateField, mounted]);

  // Helper function to check if all form fields are filled (FULL form)
  const isFullFormFilled = (): boolean => {
    const location = formValues.location || sessionData.location;
    const companyType = formValues.companyType || sessionData.companyType;
    const roleInCompany = formValues.roleInCompany || sessionData.roleInCompany;
    const interests = formValues.interests || sessionData.interests;
    const companyDescription = formValues.companyDescription || sessionData.companyDescription;
    const annualTurnover = formValues.annualTurnover || sessionData.annualTurnover;
    const numberOfEmployees = formValues.numberOfEmployees || sessionData.numberOfEmployees;
    const fullName = formValues.fullName || sessionData.fullName;
    const phoneNumber = formValues.phoneNumber || sessionData.phoneNumber;

    return !!(
      location &&
      companyType &&
      roleInCompany &&
      Array.isArray(interests) && interests.length > 0 &&
      companyDescription &&
      annualTurnover &&
      numberOfEmployees &&
      fullName &&
      phoneNumber
    );
  };

  // Track user activity to detect inactivity
  useEffect(() => {
    if (!mounted || hasSubmitted) return;

    const updateActivity = () => {
      setLastActivityTime(Date.now());
    };

    // Track various user activities
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      window.addEventListener(event, updateActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, updateActivity);
      });
    };
  }, [mounted, hasSubmitted]);

  // 30-second inactivity timer for FULL forms
  useEffect(() => {
    if (!mounted || hasSubmitted) return;
    
    const isFull = isFullFormFilled();
    if (!isFull) return;

    const inactivityTimer = setInterval(() => {
      const timeSinceLastActivity = Date.now() - lastActivityTime;
      
      if (timeSinceLastActivity >= 30 * 1000) {
        // 30 seconds of inactivity detected
        const allData = {
          location: (formValues.location || sessionData.location) as 'Toshkent shahri' | 'Boshqa viloyatda',
          companyType: formValues.companyType || sessionData.companyType || '',
          roleInCompany: formValues.roleInCompany || sessionData.roleInCompany || '',
          interests: (formValues.interests || sessionData.interests || []) as string[],
          companyDescription: formValues.companyDescription || sessionData.companyDescription || '',
          annualTurnover: formValues.annualTurnover || sessionData.annualTurnover || '',
          numberOfEmployees: formValues.numberOfEmployees || sessionData.numberOfEmployees || '',
          fullName: formValues.fullName || sessionData.fullName || '',
          phoneNumber: formValues.phoneNumber || sessionData.phoneNumber || '',
          companyName: formValues.companyName || sessionData.companyName,
        };
        
        submitForm(allData as FormData, 'DID_NOT_CLICK_SUBMIT_BUTTON', false);
        clearInterval(inactivityTimer);
      }
    }, 1000); // Check every second

    return () => clearInterval(inactivityTimer);
  }, [mounted, hasSubmitted, lastActivityTime, formValues, sessionData]);

  // Page leave detection for FULL forms
  useEffect(() => {
    if (!mounted || hasSubmitted) return;
    
    const isFull = isFullFormFilled();
    if (!isFull) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Only submit if form is fully filled and user hasn't submitted yet
      if (!hasSubmitted) {
        // Use sendBeacon for reliable submission on page unload
        const allData = {
          location: (formValues.location || sessionData.location) as 'Toshkent shahri' | 'Boshqa viloyatda',
          companyType: formValues.companyType || sessionData.companyType || '',
          roleInCompany: formValues.roleInCompany || sessionData.roleInCompany || '',
          interests: (formValues.interests || sessionData.interests || []) as string[],
          companyDescription: formValues.companyDescription || sessionData.companyDescription || '',
          annualTurnover: formValues.annualTurnover || sessionData.annualTurnover || '',
          numberOfEmployees: formValues.numberOfEmployees || sessionData.numberOfEmployees || '',
          fullName: formValues.fullName || sessionData.fullName || '',
          phoneNumber: formValues.phoneNumber || sessionData.phoneNumber || '',
          companyName: formValues.companyName || sessionData.companyName,
        };

        // Use sendBeacon for reliable submission
        const data = JSON.stringify({ ...allData, status: 'DID_NOT_CLICK_SUBMIT_BUTTON', locale });
        navigator.sendBeacon('/api/leads', new Blob([data], { type: 'application/json' }));
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [mounted, hasSubmitted, formValues, sessionData]);

  // Auto-submit after 2 minutes if only phone and name are filled (PARTIAL)
  useEffect(() => {
    if (!mounted || hasSubmitted || hasRequiredFields === false) return;

    const timer = setTimeout(async () => {
      // Only submit PARTIAL if form is NOT fully filled
      const isFull = isFullFormFilled();
      if (!isFull) {
        const location = (formValues.location || sessionData.location) as 'Toshkent shahri' | 'Boshqa viloyatda';
        const fullName = formValues.fullName || sessionData.fullName || '';
        const phoneNumber = formValues.phoneNumber || sessionData.phoneNumber || '';

        if (location && fullName && phoneNumber) {
          // Create minimal data for PARTIAL submission
          const partialData: Partial<FormData> & { location: 'Toshkent shahri' | 'Boshqa viloyatda'; fullName: string; phoneNumber: string } = {
            location,
            fullName,
            phoneNumber,
          };
          await submitForm(partialData as any, 'PARTIAL', false);
        }
      }
    }, 2 * 60 * 1000);

    return () => clearTimeout(timer);
  }, [hasRequiredFields, formValues, sessionData, mounted, hasSubmitted]);

  const submitForm = async (data: FormData, status: 'PARTIAL' | 'FULL' | 'FULL_WITHOUT_TELEGRAM' | 'DID_NOT_CLICK_SUBMIT_BUTTON', useTelegram: boolean = false) => {
    if (!data.location || !data.fullName || !data.phoneNumber) {
      return;
    }
    
    // Prevent duplicate submissions
    if (hasSubmitted) {
      console.log('Form already submitted, skipping duplicate submission');
      return;
    }
    
    if (status === 'FULL' || status === 'FULL_WITHOUT_TELEGRAM') {
      setIsSubmitting(true);
      setHasSubmitted(true);
    }
    
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, status, locale }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error', message: 'Failed to submit form' }));
        throw new Error(errorData.message || errorData.error || 'Failed to submit form');
      }

      const result = await response.json();
      
      // Only clear session for successful FULL submissions (not for auto-submissions)
      if (status === 'FULL' || status === 'FULL_WITHOUT_TELEGRAM') {
        clearSession();
      }

      // Log result for debugging
      console.log('Form submission result:', result);
      console.log('Status:', status, 'useTelegram:', useTelegram);

      if (status === 'FULL' && useTelegram) {
        // Check if telegramBotUrl exists in result
        if (result.telegramBotUrl) {
          // Redirect to Telegram bot
          console.log('Redirecting to Telegram bot:', result.telegramBotUrl);
          window.location.href = result.telegramBotUrl;
          return;
        } else {
          console.warn('telegramBotUrl not found in response, but useTelegram is true');
          console.warn('Result object:', JSON.stringify(result, null, 2));
          // Fallback: construct URL from environment variable or use default
          const botUrl = process.env.NEXT_PUBLIC_TELEGRAM_BOT_URL || 'https://t.me/hr_sevil_lead_bot';
          console.log('Using fallback bot URL:', botUrl);
          if (result.id) {
            const fallbackUrl = `${botUrl}?start=${result.id}`;
            console.log('Redirecting to fallback URL:', fallbackUrl);
            window.location.href = fallbackUrl;
            return;
          } else {
            console.error('No lead ID in result, cannot construct Telegram URL');
            alert('Form submitted successfully, but could not redirect to Telegram. Please contact us manually.');
          }
        }
      }
      
      if (onSubmitSuccess) {
        onSubmitSuccess(data);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Error submitting form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = (data: FormData) => {
    // For stage 9, if wantsTelegram is false, submit as FULL_WITHOUT_TELEGRAM
    if (currentStage === 9 && wantsTelegram === false) {
      submitForm(data, 'FULL_WITHOUT_TELEGRAM', false);
    } else if (currentStage === 9 && wantsTelegram === true) {
      // This is handled by the Share Telegram button click handler
      return;
    } else {
      // Fallback: submit as FULL_WITHOUT_TELEGRAM if no preference
      submitForm(data, 'FULL_WITHOUT_TELEGRAM', false);
    }
  };

  const handleStageClick = (stage: number) => {
    setCurrentStage(stage);
  };

  const nextStage = () => {
    if (currentStage < TOTAL_STAGES) {
      setCurrentStage(currentStage + 1);
    }
  };

  const prevStage = () => {
    if (currentStage > 1) {
      setCurrentStage(currentStage - 1);
      if (currentStage === 9) {
        setWantsTelegram(null);
      }
    }
  };

  const toggleInterest = (interest: string) => {
    const current = currentInterests;
    const updated = current.includes(interest)
      ? current.filter((i) => i !== interest)
      : [...current, interest];
    setValue('interests', updated);
    updateField('interests', updated);
  };

  const progressPercentage = (currentStage / TOTAL_STAGES) * 100;

  const renderStage = () => {
    switch (currentStage) {
      case 1:
        return (
          <div className="space-y-4">
            {/* Options */}
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(['Toshkent shahri', 'Boshqa viloyatda'] as const).map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => {
                      setValue('location', loc);
                      updateField('location', loc);
                      // Auto-advance to next stage after selection
                      setTimeout(() => {
                        if (currentStage < TOTAL_STAGES) {
                          nextStage();
                        }
                      }, 300);
                    }}
                    className={cn(
                      "relative flex flex-col items-center justify-center p-5 sm:p-6 rounded-xl border-2 transition-all hover:shadow-lg min-h-[120px] sm:min-h-[140px]",
                      formValues.location === loc
                        ? "border-red-600 bg-red-50 ring-4 ring-red-200"
                        : "border-gray-300 bg-white hover:border-red-400"
                    )}
                  >
                    <div className={cn(
                      "absolute top-3 left-3 w-5 h-5 rounded-full border-2 flex items-center justify-center",
                      formValues.location === loc
                        ? "border-red-600 bg-red-600"
                        : "border-gray-400 bg-white"
                    )}>
                      {formValues.location === loc && (
                        <div className="w-2.5 h-2.5 rounded-full bg-white" />
                      )}
                    </div>
                    <MapPin className={cn(
                      "w-10 h-10 sm:w-12 sm:h-12 mb-2 sm:mb-3",
                      formValues.location === loc ? "text-red-600" : "text-gray-400"
                    )} />
                    <span className={cn(
                      "text-base sm:text-lg font-semibold",
                      formValues.location === loc ? "text-red-600" : "text-gray-700"
                    )}>
                      {t.form.location[loc === 'Toshkent shahri' ? 'tashkent' : 'other']}
                    </span>
                  </button>
                ))}
              </div>
              {errors.location && (
                <p className="text-sm text-red-600 mt-3 font-medium">{errors.location.message}</p>
              )}
            </div>
            {/* CEO Comment */}
            <CEOComment stage={1} locale={locale} />
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            {/* Options */}
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { key: 'service', label: t.form.companyType.service },
                  { key: 'trade', label: t.form.companyType.trade },
                  { key: 'education', label: t.form.companyType.education },
                  { key: 'it', label: t.form.companyType.it },
                  { key: 'construction', label: t.form.companyType.construction },
                  { key: 'other', label: t.form.companyType.other },
                ].map((type) => (
                  <button
                    key={type.key}
                    type="button"
                    onClick={() => {
                      setValue('companyType', type.key);
                      updateField('companyType', type.key);
                      // Auto-advance to next stage after selection
                      setTimeout(() => {
                        if (currentStage < TOTAL_STAGES) {
                          nextStage();
                        }
                      }, 300);
                    }}
                    className={cn(
                      "relative p-5 sm:p-6 rounded-lg border-2 text-left transition-all min-h-[56px] sm:min-h-[60px]",
                      formValues.companyType === type.key
                        ? "border-red-600 bg-red-50"
                        : "border-gray-300 bg-white hover:border-red-400"
                    )}
                  >
                    {formValues.companyType === type.key && (
                      <Check className="absolute top-3 right-3 sm:top-2 sm:right-2 w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                    )}
                    <span className="text-base sm:text-lg font-medium">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>
            {/* CEO Comment */}
            <CEOComment stage={2} locale={locale} />
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            {/* Options */}
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {[
                  { key: 'founder', label: t.form.roleInCompany.founder },
                  { key: 'cofounder', label: t.form.roleInCompany.cofounder },
                  { key: 'director', label: t.form.roleInCompany.director },
                  { key: 'other', label: t.form.roleInCompany.other },
                ].map((role) => (
                  <button
                    key={role.key}
                    type="button"
                    onClick={() => {
                      setValue('roleInCompany', role.key);
                      updateField('roleInCompany', role.key);
                      // Auto-advance to next stage after selection
                      setTimeout(() => {
                        if (currentStage < TOTAL_STAGES) {
                          nextStage();
                        }
                      }, 300);
                    }}
                    className={cn(
                      "relative w-full p-5 sm:p-6 rounded-lg border-2 text-left transition-all min-h-[56px] sm:min-h-[60px]",
                      formValues.roleInCompany === role.key
                        ? "border-red-600 bg-red-50"
                        : "border-gray-300 bg-white hover:border-red-400"
                    )}
                  >
                    {formValues.roleInCompany === role.key && (
                      <Check className="absolute top-3 right-3 sm:top-2 sm:right-2 w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                    )}
                    <span className="text-base sm:text-lg font-medium">{role.label}</span>
                  </button>
                ))}
              </div>
            </div>
            {/* CEO Comment */}
            <CEOComment stage={3} locale={locale} />
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            {/* Options */}
            <div>
              <div className="space-y-2">
                {[
                  { key: 'hiring', label: t.form.interests.hiring },
                  { key: 'customerFlow', label: t.form.interests.customerFlow },
                  { key: 'salesSystem', label: t.form.interests.salesSystem },
                ].map((interest) => (
                  <button
                    key={interest.key}
                    type="button"
                    onClick={() => toggleInterest(interest.key)}
                    className={cn(
                      "relative w-full p-5 sm:p-6 rounded-lg border-2 text-left transition-all min-h-[56px] sm:min-h-[60px]",
                      currentInterests.includes(interest.key)
                        ? "border-red-600 bg-red-50"
                        : "border-gray-300 bg-white hover:border-red-400"
                    )}
                  >
                    {currentInterests.includes(interest.key) && (
                      <Check className="absolute top-3 right-3 sm:top-2 sm:right-2 w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                    )}
                    <span className="text-base sm:text-lg font-medium">{interest.label}</span>
                  </button>
                ))}
              </div>
              {currentInterests.length === 0 && (
                <p className="text-sm text-red-600 mt-3 font-medium">{t.validation?.interestsMin || 'Select at least one'}</p>
              )}
            </div>
            {/* CEO Comment */}
            <CEOComment stage={4} locale={locale} />
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            {/* Options */}
            <div>
              <Textarea
                {...register('companyDescription')}
                placeholder={t.form.companyDescription.placeholder}
                onChange={(e) => {
                  setValue('companyDescription', e.target.value);
                  updateField('companyDescription', e.target.value);
                }}
                className="min-h-40 text-lg sm:text-xl md:text-2xl px-4 sm:px-6 py-4 sm:py-5 border-2 focus:border-red-600 resize-none"
                rows={6}
              />
            </div>
            {/* CEO Comment */}
            <CEOComment stage={5} locale={locale} />
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            {/* Options */}
            <div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: 'range1', label: t.form.annualTurnover.range1 },
                  { key: 'range2', label: t.form.annualTurnover.range2 },
                  { key: 'range3', label: t.form.annualTurnover.range3 },
                  { key: 'range4', label: t.form.annualTurnover.range4 },
                  { key: 'range5', label: t.form.annualTurnover.range5 },
                  { key: 'range6', label: t.form.annualTurnover.range6 },
                ].map((range) => (
                  <button
                    key={range.key}
                    type="button"
                    onClick={() => {
                      setValue('annualTurnover', range.key);
                      updateField('annualTurnover', range.key);
                      // Auto-advance to next stage after selection
                      setTimeout(() => {
                        if (currentStage < TOTAL_STAGES) {
                          nextStage();
                        }
                      }, 300);
                    }}
                    className={cn(
                      "relative w-full p-5 sm:p-6 rounded-lg border-2 text-left transition-all min-h-[56px] sm:min-h-[60px]",
                      formValues.annualTurnover === range.key
                        ? "border-red-600 bg-red-50"
                        : "border-gray-300 bg-white hover:border-red-400"
                    )}
                  >
                    {formValues.annualTurnover === range.key && (
                      <Check className="absolute top-3 right-3 sm:top-2 sm:right-2 w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                    )}
                    <span className="text-sm sm:text-base md:text-lg font-medium leading-tight">{range.label}</span>
                  </button>
                ))}
              </div>
            </div>
            {/* CEO Comment */}
            <CEOComment stage={6} locale={locale} />
          </div>
        );

      case 7:
        return (
          <div className="space-y-4">
            {/* Options */}
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {[
                  { key: 'range1', label: t.form.numberOfEmployees.range1 },
                  { key: 'range2', label: t.form.numberOfEmployees.range2 },
                  { key: 'range3', label: t.form.numberOfEmployees.range3 },
                  { key: 'range4', label: t.form.numberOfEmployees.range4 },
                  { key: 'range5', label: t.form.numberOfEmployees.range5 },
                ].map((range) => (
                  <button
                    key={range.key}
                    type="button"
                    onClick={() => {
                      setValue('numberOfEmployees', range.key);
                      updateField('numberOfEmployees', range.key);
                      // Auto-advance to next stage after selection
                      setTimeout(() => {
                        if (currentStage < TOTAL_STAGES) {
                          nextStage();
                        }
                      }, 300);
                    }}
                    className={cn(
                      "relative w-full p-5 sm:p-6 rounded-lg border-2 text-left transition-all min-h-[56px] sm:min-h-[60px]",
                      formValues.numberOfEmployees === range.key
                        ? "border-red-600 bg-red-50"
                        : "border-gray-300 bg-white hover:border-red-400"
                    )}
                  >
                    {formValues.numberOfEmployees === range.key && (
                      <Check className="absolute top-3 right-3 sm:top-2 sm:right-2 w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                    )}
                    <span className="text-base sm:text-lg font-medium">{range.label}</span>
                  </button>
                ))}
              </div>
            </div>
            {/* CEO Comment */}
            <CEOComment stage={7} locale={locale} />
          </div>
        );

      case 8:
        return (
          <div className="space-y-4">
            {/* Options */}
            <div>
              <Input
                {...register('fullName')}
                placeholder={t.form.fullName.placeholder}
                value={formValues.fullName || sessionData.fullName || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setValue('fullName', value);
                  updateField('fullName', value);
                }}
                className="h-14 sm:h-16 text-lg sm:text-xl md:text-2xl px-4 sm:px-6 border-2 focus:border-red-600"
              />
              {errors.fullName && (
                <p className="text-sm text-red-600 mt-3 font-medium">{errors.fullName.message}</p>
              )}
            </div>
            {/* CEO Comment */}
            <CEOComment stage={8} locale={locale} />
          </div>
        );

      case 9:
        return (
          <div className="space-y-4">
            {/* Phone Number Input */}
            <div>
              <Input
                {...register('phoneNumber')}
                type="tel"
                placeholder={t.form.phoneNumber.placeholder}
                value={formValues.phoneNumber || sessionData.phoneNumber || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setValue('phoneNumber', value);
                  updateField('phoneNumber', value);
                }}
                className="h-14 sm:h-16 text-lg sm:text-xl md:text-2xl px-4 sm:px-6 border-2 focus:border-red-600"
              />
              {errors.phoneNumber && (
                <p className="text-sm text-red-600 mt-2 font-medium">{errors.phoneNumber.message}</p>
              )}
            </div>

            {/* Telegram Instruction Text */}
            <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border-2 border-red-300 p-4 sm:p-6 shadow-sm">
              <p className="text-base sm:text-lg md:text-xl text-gray-900 font-medium leading-relaxed">{t.form.phoneNumber.hint}</p>
            </div>

            {/* Telegram Button */}
            {(wantsTelegram === null || isSubmitting) && (
              <Button
                type="button"
                disabled={isSubmitting}
                onClick={async () => {
                  if (isSubmitting) return;
                  // Validate form first
                  const isValid = await trigger();
                  if (!isValid) {
                    return;
                  }
                  
                  setWantsTelegram(true);
                  
                  // Merge formValues and sessionData, prioritizing formValues
                  const currentData: FormData = {
                    location: (formValues.location || sessionData.location) as 'Toshkent shahri' | 'Boshqa viloyatda',
                    companyType: formValues.companyType || sessionData.companyType || '',
                    roleInCompany: formValues.roleInCompany || sessionData.roleInCompany || '',
                    interests: (formValues.interests || sessionData.interests || []) as string[],
                    companyDescription: formValues.companyDescription || sessionData.companyDescription || '',
                    annualTurnover: formValues.annualTurnover || sessionData.annualTurnover || '',
                    numberOfEmployees: formValues.numberOfEmployees || sessionData.numberOfEmployees || '',
                    fullName: formValues.fullName || sessionData.fullName || '',
                    phoneNumber: formValues.phoneNumber || sessionData.phoneNumber || '',
                    companyName: formValues.companyName || sessionData.companyName,
                  };
                  
                  if (currentData.location && currentData.fullName && currentData.phoneNumber) {
                    setIsSubmitting(true);
                    try {
                      // Generate session ID
                      const sessionId = `session_${crypto.randomUUID()}`;
                      
                      // Store form data temporarily
                      const storeResponse = await fetch('/api/leads/pending', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          sessionId,
                          formData: { ...currentData, status: 'FULL', locale },
                        }),
                      });
                      
                      if (!storeResponse.ok) {
                        throw new Error('Failed to store form data');
                      }
                      
                      // Get bot URL and redirect
                      const botUrl = process.env.NEXT_PUBLIC_TELEGRAM_BOT_URL || 'https://t.me/hr_sevil_lead_bot';
                      const redirectUrl = `${botUrl}?start=${sessionId}`;
                      
                      console.log('[ApplicationForm] Storing form data and redirecting to bot:', redirectUrl);
                      
                      // Clear session before redirect
                      clearSession();
                      
                      // Redirect to Telegram bot
                      window.location.href = redirectUrl;
                    } catch (error) {
                      console.error('[ApplicationForm] Error storing form data:', error);
                      setIsSubmitting(false);
                      setWantsTelegram(null);
                      // Fallback: submit normally
                      await submitForm(currentData, 'FULL', true);
                    }
                  }
                }}
                className="w-full h-12 sm:h-14 text-base sm:text-lg rounded-lg bg-red-600 hover:bg-red-700 text-white min-h-[48px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {'Submitting...'}
                  </span>
                ) : (
                  <>
                    {t.form.phoneNumber.submitButton}
                    <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                  </>
                )}
              </Button>
            )}

            {/* CEO Comment */}
            <CEOComment stage={9} locale={locale} />
            
            {/* Finish Button - shown when wantsTelegram is null or submitting */}
            {(wantsTelegram === null || isSubmitting) && (
              <div className="mt-6 sm:mt-8">
                <Button
                  type="button"
                  disabled={isSubmitting}
                  onClick={async () => {
                    if (isSubmitting) return;
                    // Validate form first
                    const isValid = await trigger();
                    if (!isValid) {
                      return;
                    }
                    
                    setWantsTelegram(false);
                    // Merge formValues and sessionData, prioritizing formValues
                    const currentData: FormData = {
                      location: (formValues.location || sessionData.location) as 'Toshkent shahri' | 'Boshqa viloyatda',
                      companyType: formValues.companyType || sessionData.companyType || '',
                      roleInCompany: formValues.roleInCompany || sessionData.roleInCompany || '',
                      interests: (formValues.interests || sessionData.interests || []) as string[],
                      companyDescription: formValues.companyDescription || sessionData.companyDescription || '',
                      annualTurnover: formValues.annualTurnover || sessionData.annualTurnover || '',
                      numberOfEmployees: formValues.numberOfEmployees || sessionData.numberOfEmployees || '',
                      fullName: formValues.fullName || sessionData.fullName || '',
                      phoneNumber: formValues.phoneNumber || sessionData.phoneNumber || '',
                      companyName: formValues.companyName || sessionData.companyName,
                    };
                    if (currentData.location && currentData.fullName && currentData.phoneNumber) {
                      // Tugatish/Finish button: submit as FULL_WITHOUT_TELEGRAM
                      await submitForm(currentData, 'FULL_WITHOUT_TELEGRAM', false);
                    }
                  }}
                  className="w-full h-12 sm:h-14 text-base sm:text-lg rounded-lg bg-red-600 hover:bg-red-700 text-white min-h-[48px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {'Submitting...'}
                    </span>
                  ) : (
                    <>
                      {t.form.finish}
                      <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <section id="application-form" className="relative py-12 sm:py-16 md:py-20 px-4 bg-white overflow-hidden">
      {/* Beautiful background pattern similar to hero */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-red-50/30" />
      
      <AnimatedGridPattern
        numSquares={50}
        maxOpacity={0.4}
        duration={3}
        className={cn(
          "absolute inset-0 h-full"
        )}
      />
      
      {/* Blur mask - blur center and edges, keep form card area visible */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Edge blurs */}
        <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-white/60 via-white/30 to-transparent backdrop-blur-lg" />
        <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-white/60 via-white/30 to-transparent backdrop-blur-lg" />
        <div className="absolute top-0 left-0 w-40 h-full bg-gradient-to-r from-white/60 via-white/30 to-transparent backdrop-blur-lg" />
        <div className="absolute top-0 right-0 w-40 h-full bg-gradient-to-l from-white/60 via-white/30 to-transparent backdrop-blur-lg" />
        
        {/* Center blur - but keep form area clear */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 backdrop-blur-xl bg-white/20 rounded-full"
          style={{ 
            width: '150%', 
            height: '150%',
            maskImage: 'radial-gradient(ellipse 70% 50% at 50% 50%, transparent 35%, black 50%, transparent 65%)',
            WebkitMaskImage: 'radial-gradient(ellipse 70% 50% at 50% 50%, transparent 35%, black 50%, transparent 65%)'
          }}
        />
      </div>
      
      <div className="container mx-auto max-w-4xl relative z-10">
        {/* Form Section Title */}
        <div className="text-center mb-6 sm:mb-8 px-2">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-2 sm:mb-3">
            {t.form.title}
          </h2>
          {'subtitle' in t.form && (
            <p className="text-base sm:text-lg md:text-xl text-gray-600">
              {t.form.subtitle as string}
            </p>
          )}
        </div>
        
        <Card className="bg-white/95 backdrop-blur-sm border-2 border-red-600 shadow-2xl">
          <CardHeader className="pb-6">
            <div className="text-center mb-3 sm:mb-4 max-[319px]:block min-[320px]:hidden min-[426px]:block">
              <div className="inline-block px-4 sm:px-5 py-2 sm:py-2.5 bg-red-600 text-white rounded-full text-sm sm:text-base font-semibold mb-2 sm:mb-3">
                {t.form.step} {currentStage}/{TOTAL_STAGES}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2.5 sm:h-2 mb-4 sm:mb-6">
              <div
                className="bg-red-600 h-2.5 sm:h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            {/* Stage navigation */}
            <FormStages
              currentStage={currentStage}
              totalStages={TOTAL_STAGES}
              onStageClick={handleStageClick}
              locale={locale}
              isStageFilled={isStageFilled}
            />

            {/* Main Question - Below stage selector */}
            <div className="text-center mt-3 sm:mt-4 mb-0">
              <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold text-black leading-tight">
                {t.form.stages[currentStage.toString() as keyof typeof t.form.stages]}
              </CardTitle>
            </div>
          </CardHeader>
          
          <CardContent className="px-4 sm:px-6 pb-0">
            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Form content */}
              <div className="min-h-[300px] pt-2 sm:pt-4 pb-6 sm:pb-8">{renderStage()}</div>

              {/* Navigation buttons - Hide on stage 9 if wantsTelegram is null */}
              {!(currentStage === 9 && wantsTelegram === null) && (
                <div className="flex justify-between mt-6 sm:mt-8 gap-3 sm:gap-4 pb-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStage}
                    disabled={currentStage === 1}
                    className="h-12 sm:h-11 px-5 sm:px-6 text-base sm:text-lg rounded-full border-2 disabled:opacity-50 min-h-[48px] sm:min-h-[44px]"
                  >
                    {t.form.previous}
                  </Button>
                  {currentStage < TOTAL_STAGES ? (
                    <Button 
                      type="button" 
                      onClick={() => {
                        // Validate interests on stage 4
                        if (currentStage === 4 && currentInterests.length === 0) {
                          return;
                        }
                        nextStage();
                      }}
                      disabled={currentStage === 4 && currentInterests.length === 0}
                      className="h-11 px-6 text-base rounded-full bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                    >
                      {t.form.next}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
              )}
              {/* Finish button for stage 9 - with spacing matching navigation buttons */}
              {currentStage === 9 && wantsTelegram === false && (
                <div className="flex justify-between mt-6 sm:mt-8 gap-3 sm:gap-4 pb-0">
                  <div></div>
                  <Button 
                    type="submit"
                    className="h-12 sm:h-11 px-5 sm:px-6 text-base sm:text-lg rounded-full bg-red-600 hover:bg-red-700 text-white min-h-[48px] sm:min-h-[44px]"
                  >
                    {t.form.finish}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
