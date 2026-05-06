import React, { useRef, useCallback, useState } from 'react';
import { ResumeProvider, useResume } from '@/contexts/ResumeContext';
import { PersonalInfoForm, SummaryForm, ExperienceForm, EducationForm, SkillsForm, AdditionalForm } from '@/components/resume/FormSections';
import { TemplateRenderer } from '@/components/resume/TemplateRenderer';
import { TemplateName } from '@/types/resume';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Download, ChevronLeft, ChevronRight, RotateCcw, FileText, Eye, Palette, BarChart3, Briefcase, Mail, Type } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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

const FONT_FAMILIES = [
  { label: 'Libre Baskerville', value: 'Libre Baskerville, serif' },
  { label: 'Source Sans 3', value: '"Source Sans 3", sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Times New Roman', value: '"Times New Roman", serif' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Helvetica', value: 'Helvetica, Arial, sans-serif' },
  { label: 'Inter', value: 'Inter, system-ui, sans-serif' },
  { label: 'Roboto', value: 'Roboto, sans-serif' },
];

const STEPS = [
  { label: 'Personal', component: PersonalInfoForm },
  { label: 'Summary', component: SummaryForm },
  { label: 'Experience', component: ExperienceForm },
  { label: 'Education', component: EducationForm },
  { label: 'Skills', component: SkillsForm },
  { label: 'Additional', component: AdditionalForm },
];

function ComingSoon({ title, description, icon: Icon }: { title: string; description: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-sm">
        <div className="mx-auto w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
          <Icon className="h-7 w-7 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold mb-2" style={{ fontFamily: 'var(--font-heading)' }}>{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
        <p className="text-xs text-muted-foreground mt-3 italic">Coming soon</p>
      </div>
    </div>
  );
}

function ResumeBuilder() {
  const {
    data, template, setTemplate, accentColor, setAccentColor,
    fontFamily, setFontFamily, spacing, setSpacing,
    activeStep, setActiveStep, resetData,
  } = useResume();
  const resumeRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [mobileView, setMobileView] = useState<'form' | 'preview'>('form');

  const StepComponent = STEPS[activeStep].component;

  const handleDownloadPDF = useCallback(async () => {
    if (!resumeRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(resumeRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
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

  const fontStack = FONT_FAMILIES.find(f => f.label === fontFamily)?.value || fontFamily;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Bar */}
      <header className="no-print border-b bg-background px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          <h1 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>Resume Maker</h1>
        </div>
        <div className="flex items-center gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs">
                <RotateCcw className="h-3 w-3 mr-1" /> Reset
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset everything?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will clear all your resume content and reset the template, accent color, font, and spacing to defaults. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={resetData}>Yes, reset</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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
        <div className={`no-print w-full md:w-[460px] border-r flex flex-col ${mobileView === 'preview' ? 'hidden md:flex' : 'flex'}`}>
          <Tabs defaultValue="content" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="rounded-none w-full justify-start h-auto bg-background border-b px-2 py-1.5 gap-1 flex-wrap">
              <TabsTrigger value="content" className="data-[state=active]:bg-muted gap-1.5 text-xs">
                <FileText className="h-3.5 w-3.5" /> Content Editor
              </TabsTrigger>
              <TabsTrigger value="designer" className="data-[state=active]:bg-muted gap-1.5 text-xs">
                <Palette className="h-3.5 w-3.5" /> Designer
              </TabsTrigger>
              <TabsTrigger value="analyzer" className="data-[state=active]:bg-muted gap-1.5 text-xs">
                <BarChart3 className="h-3.5 w-3.5" /> Analyzer
              </TabsTrigger>
              <TabsTrigger value="matcher" className="data-[state=active]:bg-muted gap-1.5 text-xs">
                <Briefcase className="h-3.5 w-3.5" /> Job Matcher
              </TabsTrigger>
              <TabsTrigger value="cover" className="data-[state=active]:bg-muted gap-1.5 text-xs">
                <Mail className="h-3.5 w-3.5" /> Cover Letter
              </TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="flex-1 flex flex-col mt-0 overflow-hidden data-[state=inactive]:hidden">
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
                <div className="flex justify-between mt-6 pt-4 border-t">
                  <Button variant="outline" size="sm" onClick={() => setActiveStep(Math.max(0, activeStep - 1))} disabled={activeStep === 0}>
                    <ChevronLeft className="h-4 w-4 mr-1" /> Back
                  </Button>
                  <Button size="sm" onClick={() => setActiveStep(Math.min(STEPS.length - 1, activeStep + 1))} disabled={activeStep === STEPS.length - 1}>
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="designer" className="flex-1 mt-0 overflow-hidden data-[state=inactive]:hidden">
              <ScrollArea className="h-full p-4">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold mb-3" style={{ fontFamily: 'var(--font-heading)' }}>Template</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {TEMPLATES.map(t => (
                        <button
                          key={t.key}
                          onClick={() => setTemplate(t.key)}
                          className={`px-3 py-2 rounded border text-sm font-medium transition-colors ${
                            template === t.key ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted border-border'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold mb-3" style={{ fontFamily: 'var(--font-heading)' }}>Accent Color</h3>
                    <div className="flex flex-wrap gap-2 items-center">
                      {ACCENT_COLORS.map(c => (
                        <button
                          key={c}
                          onClick={() => setAccentColor(c)}
                          className={`w-8 h-8 rounded-full border-2 transition-transform ${accentColor === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                      <label className="w-8 h-8 rounded-full border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:bg-muted">
                        <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)} className="opacity-0 w-0 h-0" />
                        <Palette className="h-4 w-4 text-muted-foreground" />
                      </label>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5" style={{ fontFamily: 'var(--font-heading)' }}>
                      <Type className="h-4 w-4" /> Font Family
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {FONT_FAMILIES.map(f => (
                        <button
                          key={f.label}
                          onClick={() => setFontFamily(f.label)}
                          className={`px-3 py-2 rounded border text-xs font-medium text-left transition-colors ${
                            fontFamily === f.label ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted border-border'
                          }`}
                          style={{ fontFamily: f.value }}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>Spacing / Density</h3>
                      <span className="text-xs text-muted-foreground tabular-nums">{spacing.toFixed(2)}x</span>
                    </div>
                    <Slider
                      value={[spacing]}
                      min={0.75}
                      max={1.5}
                      step={0.05}
                      onValueChange={(v) => setSpacing(v[0])}
                    />
                    <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground uppercase tracking-wide">
                      <span>Compact</span>
                      <span>Default</span>
                      <span>Roomy</span>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="analyzer" className="flex-1 mt-0 data-[state=inactive]:hidden flex">
              <ComingSoon title="Resume Analyzer" description="Get an instant ATS-friendliness score, keyword gaps, and improvement tips for your resume." icon={BarChart3} />
            </TabsContent>

            <TabsContent value="matcher" className="flex-1 mt-0 data-[state=inactive]:hidden flex">
              <ComingSoon title="Job Matcher" description="Paste a job description and see how well your resume matches with tailored recommendations." icon={Briefcase} />
            </TabsContent>

            <TabsContent value="cover" className="flex-1 mt-0 data-[state=inactive]:hidden flex">
              <ComingSoon title="Cover Letter" description="Generate a personalized cover letter from your resume content and a target job description." icon={Mail} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Preview Panel */}
        <div className={`flex-1 flex flex-col bg-muted/50 ${mobileView === 'form' ? 'hidden md:flex' : 'flex'}`}>
          <ScrollArea className="flex-1">
            <div className="flex justify-center p-6">
              <div
                ref={resumeRef}
                className="bg-white shadow-lg"
                style={{
                  width: '210mm',
                  minHeight: '297mm',
                  maxWidth: '100%',
                  fontFamily: fontStack,
                  ['--resume-spacing' as string]: String(spacing),
                  lineHeight: 1.4 * spacing,
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
