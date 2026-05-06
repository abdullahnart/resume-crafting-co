import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ResumeData, TemplateName, defaultResumeData } from '@/types/resume';

interface ResumeContextType {
  data: ResumeData;
  setData: React.Dispatch<React.SetStateAction<ResumeData>>;
  updateField: <K extends keyof ResumeData>(key: K, value: ResumeData[K]) => void;
  template: TemplateName;
  setTemplate: (t: TemplateName) => void;
  accentColor: string;
  setAccentColor: (c: string) => void;
  fontFamily: string;
  setFontFamily: (f: string) => void;
  spacing: number;
  setSpacing: (s: number) => void;
  activeStep: number;
  setActiveStep: (s: number) => void;
  resetData: () => void;
}

const ResumeContext = createContext<ResumeContextType | null>(null);

const STORAGE_KEY = 'resume-maker-data';
const TEMPLATE_KEY = 'resume-maker-template';
const ACCENT_KEY = 'resume-maker-accent';

function loadFromStorage(): ResumeData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return defaultResumeData;
}

export function ResumeProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<ResumeData>(loadFromStorage);
  const [template, setTemplate] = useState<TemplateName>(
    () => (localStorage.getItem(TEMPLATE_KEY) as TemplateName) || 'classic'
  );
  const [accentColor, setAccentColor] = useState(
    () => localStorage.getItem(ACCENT_KEY) || '#0d0d0d'
  );
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    localStorage.setItem(TEMPLATE_KEY, template);
  }, [template]);

  useEffect(() => {
    localStorage.setItem(ACCENT_KEY, accentColor);
  }, [accentColor]);

  const updateField = useCallback(<K extends keyof ResumeData>(key: K, value: ResumeData[K]) => {
    setData(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetData = useCallback(() => {
    setData(defaultResumeData);
    setTemplate('classic');
    setAccentColor('#0d0d0d');
  }, []);

  return (
    <ResumeContext.Provider value={{
      data, setData, updateField,
      template, setTemplate,
      accentColor, setAccentColor,
      activeStep, setActiveStep,
      resetData,
    }}>
      {children}
    </ResumeContext.Provider>
  );
}

export function useResume() {
  const ctx = useContext(ResumeContext);
  if (!ctx) throw new Error('useResume must be used within ResumeProvider');
  return ctx;
}
