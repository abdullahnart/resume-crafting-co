import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ResumeData, TemplateName, defaultResumeData } from '@/types/resume';

export type DateFormat = 'numbers' | 'monthYear' | 'fullDate';
export type Align = 'left' | 'center' | 'right';
export type SkillsLayout = 'comma' | 'commaList' | 'columns';
export type PaperSize = 'a4' | 'letter';

export interface DesignSettings {
  fontFamily: string;
  lineHeight: number;        // 1.0 – 1.5 (100%-150%)
  listLineHeight: number;    // 1.2 – 1.8
  accentColor: string;
  dateFormat: DateFormat;
  headerAlign: Align;        // left | center | right
  dateAlign: 'left' | 'right';
  locationAlign: 'left' | 'right';
  skillsLayout: SkillsLayout;
  skillsColumns: number;     // 1 – 4
  paperSize: PaperSize;
  marginX: number;           // inches 0.3 – 1
  marginY: number;
}

const defaultDesign: DesignSettings = {
  fontFamily: 'Libre Baskerville',
  lineHeight: 1.2,
  listLineHeight: 1.4,
  accentColor: '#0d0d0d',
  dateFormat: 'numbers',
  headerAlign: 'center',
  dateAlign: 'right',
  locationAlign: 'right',
  skillsLayout: 'commaList',
  skillsColumns: 2,
  paperSize: 'a4',
  marginX: 0.6,
  marginY: 0.6,
};

interface ResumeContextType {
  data: ResumeData;
  setData: React.Dispatch<React.SetStateAction<ResumeData>>;
  updateField: <K extends keyof ResumeData>(key: K, value: ResumeData[K]) => void;
  template: TemplateName;
  setTemplate: (t: TemplateName) => void;
  // legacy convenience accessors (still used by some places)
  accentColor: string;
  setAccentColor: (c: string) => void;
  fontFamily: string;
  setFontFamily: (f: string) => void;
  spacing: number;
  setSpacing: (s: number) => void;
  // unified design settings
  design: DesignSettings;
  updateDesign: <K extends keyof DesignSettings>(key: K, value: DesignSettings[K]) => void;
  activeStep: number;
  setActiveStep: (s: number) => void;
  resetData: () => void;
}

const ResumeContext = createContext<ResumeContextType | null>(null);

const STORAGE_KEY = 'resume-maker-data';
const TEMPLATE_KEY = 'resume-maker-template';
const DESIGN_KEY = 'resume-maker-design';

function loadData(): ResumeData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return defaultResumeData;
}

function loadDesign(): DesignSettings {
  try {
    const stored = localStorage.getItem(DESIGN_KEY);
    if (stored) return { ...defaultDesign, ...JSON.parse(stored) };
  } catch {}
  return defaultDesign;
}

export function ResumeProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<ResumeData>(loadData);
  const [template, setTemplate] = useState<TemplateName>(
    () => (localStorage.getItem(TEMPLATE_KEY) as TemplateName) || 'classic'
  );
  const [design, setDesign] = useState<DesignSettings>(loadDesign);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }, [data]);
  useEffect(() => { localStorage.setItem(TEMPLATE_KEY, template); }, [template]);
  useEffect(() => { localStorage.setItem(DESIGN_KEY, JSON.stringify(design)); }, [design]);

  const updateField = useCallback(<K extends keyof ResumeData>(key: K, value: ResumeData[K]) => {
    setData(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateDesign = useCallback(<K extends keyof DesignSettings>(key: K, value: DesignSettings[K]) => {
    setDesign(prev => ({ ...prev, [key]: value }));
  }, []);

  const resetData = useCallback(() => {
    setData(defaultResumeData);
    setTemplate('classic');
    setDesign(defaultDesign);
  }, []);

  return (
    <ResumeContext.Provider value={{
      data, setData, updateField,
      template, setTemplate,
      accentColor: design.accentColor,
      setAccentColor: (c) => updateDesign('accentColor', c),
      fontFamily: design.fontFamily,
      setFontFamily: (f) => updateDesign('fontFamily', f),
      spacing: design.lineHeight,
      setSpacing: (s) => updateDesign('lineHeight', s),
      design, updateDesign,
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
