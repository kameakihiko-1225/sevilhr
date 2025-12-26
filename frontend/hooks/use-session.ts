'use client';

import { useState, useEffect, useCallback } from 'react';

interface FormData {
  location?: string;
  companyType?: string;
  roleInCompany?: string;
  interests?: string[];
  companyDescription?: string;
  annualTurnover?: string;
  numberOfEmployees?: string;
  fullName?: string;
  phoneNumber?: string;
  companyName?: string;
}

const SESSION_KEY = 'hrsevil_form_session';
const AUTO_SUBMIT_DELAY = 2 * 60 * 1000; // 2 minutes

export function useSession() {
  const [formData, setFormData] = useState<FormData>({});
  const [timerStarted, setTimerStarted] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load from sessionStorage on mount (only on client)
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) {
        try {
          const data = JSON.parse(saved);
          setFormData(data);
          // Check if required fields are filled
          if (data.location && data.fullName && data.phoneNumber && !data.submitted) {
            setTimerStarted(true);
          }
        } catch (e) {
          console.error('Error loading session:', e);
        }
      }
    }
  }, []);

  const updateField = useCallback((field: keyof FormData, value: string | string[]) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(updated));
      }
      
      // Start timer if required fields are filled (location, fullName, phoneNumber)
      if (updated.location && updated.fullName && updated.phoneNumber && !timerStarted) {
        setTimerStarted(true);
      }
      
      return updated;
    });
  }, [timerStarted]);

  const clearSession = useCallback(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(SESSION_KEY);
    }
    setFormData({});
    setTimerStarted(false);
  }, []);

  const hasRequiredFields = formData.location && formData.fullName && formData.phoneNumber;

  return {
    formData,
    updateField,
    clearSession,
    hasRequiredFields,
    timerStarted,
    mounted,
  };
}

