import React, { useRef, useCallback, useState } from 'react';
import { ResumeProvider, useResume } from '@/contexts/ResumeContext';
import { PersonalInfoForm, SummaryForm, ExperienceForm, EducationForm, SkillsForm, AdditionalForm } from '@/components/resume/FormSections';
import { TemplateRenderer } from '@/components/resume/TemplateRenderer';
import { TemplateName } from '@/types/resume';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, ChevronLeft, ChevronRight, RotateCcw, FileText, Eye } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const TEMPLATES: { key: TemplateName; label: string }[] = [
  { key: 'classic', label: 'Classic' },
  { key: 'modern', label: 'Modern' },
  { key: 'minimal', label: 'Minimal' },
  { key: 'creative', label: 'Creative' },
  { key: 'professional', label: 'Professional' },
  { key: 'compact', label: 'Compact' },
];

const ACCENT_COLORS = ['#0d0d0d', '#1e3a5f', '#064e3b', '#7c2d12', '#5b21b6', '#be123c', '#0369a1', '#854d0e'];

const STEPS = [
  { label: 'Personal', component: PersonalInfoForm },
  { label: 'Summary', component: SummaryForm },
  { label: 'Experience', component: ExperienceForm },
  { label: 'Education', component: EducationForm },
  { label: 'Skills', component: SkillsForm },
  { label: 'Additional', component: AdditionalForm },
];

function ResumeBuilder() {
  const { data, template, setTemplate, accentColor, setAccentColor, activeStep, setActiveStep, resetData } = useResume();
  const resumeRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [mobileView, setMobileView] = useState<'form' | 'preview'>('form');

  const StepComponent = STEPS[activeStep].component;

  const handleDownloadPDF = useCallback(async () => {
    if (!resumeRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(resumeRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${data.personalInfo.fullName || 'resume'}.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
    }
    setDownloading(false);
  }, [data.personalInfo.fullName]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Bar */}
      <header className="no-print border-b bg-background px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          <h1 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>Resume Maker</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={resetData} className="text-xs">
            <RotateCcw className="h-3 w-3 mr-1" /> Reset
          </Button>
          <Button size="sm" onClick={handleDownloadPDF} disabled={downloading} className="text-xs">
            <Download className="h-3 w-3 mr-1" /> {downloading ? 'Generating...' : 'Download PDF'}
          </Button>
        </div>
      </header>

      {/* Mobile toggle */}
      <div className="no-print flex md:hidden border-b">
        <button
          className={`flex-1 py-2 text-sm font-medium text-center ${mobileView === 'form' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
          onClick={() => setMobileView('form')}
        >
          <FileText className="h-4 w-4 inline mr-1" /> Edit
        </button>
        <button
          className={`flex-1 py-2 text-sm font-medium text-center ${mobileView === 'preview' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
          onClick={() => setMobileView('preview')}
        >
          <Eye className="h-4 w-4 inline mr-1" /> Preview
        </button>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Form Panel */}
        <div className={`no-print w-full md:w-[420px] border-r flex flex-col ${mobileView === 'preview' ? 'hidden md:flex' : 'flex'}`}>
          {/* Step navigation */}
          <div className="flex items-center border-b px-3 py-2 gap-1 overflow-x-auto">
            {STEPS.map((s, i) => (
              <button
                key={s.label}
                onClick={() => setActiveStep(i)}
                className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors ${
                  i === activeStep ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <ScrollArea className="flex-1 p-4">
            <StepComponent />

            {/* Step buttons */}
            <div className="flex justify-between mt-6 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
                disabled={activeStep === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button
                size="sm"
                onClick={() => setActiveStep(Math.min(STEPS.length - 1, activeStep + 1))}
                disabled={activeStep === STEPS.length - 1}
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </ScrollArea>
        </div>

        {/* Preview Panel */}
        <div className={`flex-1 flex flex-col bg-muted/50 ${mobileView === 'form' ? 'hidden md:flex' : 'flex'}`}>
          {/* Template & color picker bar */}
          <div className="no-print border-b bg-background px-4 py-2 flex items-center gap-4 overflow-x-auto">
            <div className="flex gap-1.5">
              {TEMPLATES.map(t => (
                <button
                  key={t.key}
                  onClick={() => setTemplate(t.key)}
                  className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition-colors ${
                    template === t.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex gap-1.5 items-center">
              {ACCENT_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setAccentColor(c)}
                  className={`w-5 h-5 rounded-full border-2 transition-transform ${accentColor === c ? 'border-foreground scale-125' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <input
                type="color"
                value={accentColor}
                onChange={e => setAccentColor(e.target.value)}
                className="w-5 h-5 rounded cursor-pointer border-0 p-0"
                title="Custom color"
              />
            </div>
          </div>

          {/* Resume preview */}
          <ScrollArea className="flex-1">
            <div className="flex justify-center p-6">
              <div
                ref={resumeRef}
                className="bg-white shadow-lg"
                style={{
                  width: '210mm',
                  minHeight: '297mm',
                  maxWidth: '100%',
                }}
              >
                <TemplateRenderer template={template} data={data} accentColor={accentColor} />
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

export default function Index() {
  return (
    <ResumeProvider>
      <ResumeBuilder />
    </ResumeProvider>
  );
}
