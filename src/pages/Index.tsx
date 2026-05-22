import React, { useRef, useCallback, useState } from 'react';
import { ResumeProvider, useResume, DesignSettings } from '@/contexts/ResumeContext';
import { PersonalInfoForm, SummaryForm, ExperienceForm, EducationForm, SkillsForm, AdditionalForm } from '@/components/resume/FormSections';
import { TemplateRenderer } from '@/components/resume/TemplateRenderer';
import { TemplateName } from '@/types/resume';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Download, ChevronLeft, ChevronRight, RotateCcw, FileText, Eye, Palette } from 'lucide-react';
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

const ACCENT_COLORS = ['#0d0d0d', '#6b7280', '#0f766e', '#a16207', '#dc2626', '#7f1d1d', '#2563eb', '#1e3a8a'];

const FONT_FAMILIES = [
  { label: 'Libre Baskerville', value: 'Libre Baskerville, serif' },
  { label: 'Poppins', value: 'Poppins, sans-serif' },
  { label: 'Inter', value: 'Inter, system-ui, sans-serif' },
  { label: 'Roboto', value: 'Roboto, sans-serif' },
  { label: 'Open Sans', value: '"Open Sans", sans-serif' },
  { label: 'Source Sans 3', value: '"Source Sans 3", sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Arial', value: 'Arial, sans-serif' },
];

const PAPER: Record<string, { wMm: number; hMm: number }> = {
  a4: { wMm: 210, hMm: 297 },
  letter: { wMm: 215.9, hMm: 279.4 },
};

const STEPS = [
  { label: 'Personal', component: PersonalInfoForm },
  { label: 'Summary', component: SummaryForm },
  { label: 'Experience', component: ExperienceForm },
  { label: 'Education', component: EducationForm },
  { label: 'Skills', component: SkillsForm },
  { label: 'Additional', component: AdditionalForm },
];

function AlignButtons<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { label: string; value: T }[] }) {
  return (
    <div className="inline-flex rounded-md border overflow-hidden">
      {options.map(o => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`px-3 py-1.5 text-xs font-medium transition-colors ${value === o.value ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function PresentationPanel() {
  const { template, setTemplate, design, updateDesign } = useResume();
  const d = design;

  return (
    <Accordion type="multiple" defaultValue={['template', 'styling', 'align', 'skills', 'page']} className="w-full">
      <AccordionItem value="template">
        <AccordionTrigger className="text-sm">Template</AccordionTrigger>
        <AccordionContent>
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
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="styling">
        <AccordionTrigger className="text-sm">Styling</AccordionTrigger>
        <AccordionContent className="space-y-4">
          <div>
            <label className="text-xs font-medium mb-1.5 block">Font Family</label>
            <Select value={d.fontFamily} onValueChange={(v) => updateDesign('fontFamily', v)}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {FONT_FAMILIES.map(f => (
                  <SelectItem key={f.label} value={f.label} style={{ fontFamily: f.value }}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <div className="flex justify-between mb-1.5">
              <label className="text-xs font-medium">Line Height</label>
              <span className="text-xs text-muted-foreground tabular-nums">{Math.round(d.lineHeight * 100)}%</span>
            </div>
            <Slider value={[d.lineHeight]} min={1} max={1.5} step={0.05} onValueChange={(v) => updateDesign('lineHeight', v[0])} />
          </div>

          <div>
            <div className="flex justify-between mb-1.5">
              <label className="text-xs font-medium">List Line Height</label>
              <span className="text-xs text-muted-foreground tabular-nums">{Math.round(d.listLineHeight * 100)}%</span>
            </div>
            <Slider value={[d.listLineHeight]} min={1.2} max={1.8} step={0.05} onValueChange={(v) => updateDesign('listLineHeight', v[0])} />
          </div>

          <div>
            <label className="text-xs font-medium mb-1.5 block">Accent Color</label>
            <div className="flex flex-wrap gap-2 items-center">
              {ACCENT_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => updateDesign('accentColor', c)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${d.accentColor === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <label className="w-7 h-7 rounded-full border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:bg-muted">
                <input type="color" value={d.accentColor} onChange={e => updateDesign('accentColor', e.target.value)} className="opacity-0 w-0 h-0" />
                <Palette className="h-3.5 w-3.5 text-muted-foreground" />
              </label>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium mb-1.5 block">Date Format</label>
            <Select value={d.dateFormat} onValueChange={(v) => updateDesign('dateFormat', v as DesignSettings['dateFormat'])}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="numbers">Numbers (01/2023)</SelectItem>
                <SelectItem value="monthYear">Month Year (Jan 2023)</SelectItem>
                <SelectItem value="fullDate">Full Date (January 2023)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="align">
        <AccordionTrigger className="text-sm">Alignments &amp; Layout</AccordionTrigger>
        <AccordionContent className="space-y-3">
          <div>
            <label className="text-xs font-medium mb-1.5 block">Header Alignment</label>
            <AlignButtons
              value={d.headerAlign}
              onChange={(v) => updateDesign('headerAlign', v)}
              options={[{ label: 'Left', value: 'left' }, { label: 'Center', value: 'center' }, { label: 'Right', value: 'right' }]}
            />
          </div>
          <div>
            <label className="text-xs font-medium mb-1.5 block">Date Alignment</label>
            <AlignButtons
              value={d.dateAlign}
              onChange={(v) => updateDesign('dateAlign', v)}
              options={[{ label: 'Left', value: 'left' }, { label: 'Right', value: 'right' }]}
            />
          </div>
          <div>
            <label className="text-xs font-medium mb-1.5 block">Location Alignment</label>
            <AlignButtons
              value={d.locationAlign}
              onChange={(v) => updateDesign('locationAlign', v)}
              options={[{ label: 'Left', value: 'left' }, { label: 'Right', value: 'right' }]}
            />
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="skills">
        <AccordionTrigger className="text-sm">Skills Layout</AccordionTrigger>
        <AccordionContent className="space-y-3">
          <div>
            <label className="text-xs font-medium mb-1.5 block">Display Type</label>
            <AlignButtons
              value={d.skillsLayout}
              onChange={(v) => updateDesign('skillsLayout', v)}
              options={[
                { label: 'Comma', value: 'comma' },
                { label: 'List', value: 'commaList' },
                { label: 'Columns', value: 'columns' },
              ]}
            />
          </div>
          {d.skillsLayout === 'columns' && (
            <div>
              <div className="flex justify-between mb-1.5">
                <label className="text-xs font-medium">Number of Columns</label>
                <span className="text-xs text-muted-foreground tabular-nums">{d.skillsColumns}</span>
              </div>
              <Slider value={[d.skillsColumns]} min={1} max={4} step={1} onValueChange={(v) => updateDesign('skillsColumns', v[0])} />
            </div>
          )}
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="page">
        <AccordionTrigger className="text-sm">Page Setup</AccordionTrigger>
        <AccordionContent className="space-y-3">
          <div>
            <label className="text-xs font-medium mb-1.5 block">Paper Size</label>
            <Select value={d.paperSize} onValueChange={(v) => updateDesign('paperSize', v as DesignSettings['paperSize'])}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="a4">A4 (210 × 297 mm)</SelectItem>
                <SelectItem value="letter">Letter (8.5 × 11 in)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="flex justify-between mb-1.5">
              <label className="text-xs font-medium">Left &amp; Right Margins</label>
              <span className="text-xs text-muted-foreground tabular-nums">{d.marginX.toFixed(2)} in</span>
            </div>
            <Slider value={[d.marginX]} min={0.3} max={1} step={0.05} onValueChange={(v) => updateDesign('marginX', v[0])} />
          </div>
          <div>
            <div className="flex justify-between mb-1.5">
              <label className="text-xs font-medium">Top &amp; Bottom Margins</label>
              <span className="text-xs text-muted-foreground tabular-nums">{d.marginY.toFixed(2)} in</span>
            </div>
            <Slider value={[d.marginY]} min={0.3} max={1} step={0.05} onValueChange={(v) => updateDesign('marginY', v[0])} />
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

const TEXT_FIELDS: { key: keyof DesignSettings['textSizes']; label: string; min: number; max: number }[] = [
  { key: 'bodyCopy', label: 'Body Copy', min: 7, max: 14 },
  { key: 'primaryHeading', label: 'Primary Heading', min: 8, max: 18 },
  { key: 'secondaryHeading', label: 'Secondary Heading', min: 8, max: 16 },
  { key: 'sectionTitle', label: 'Section Titles', min: 8, max: 16 },
  { key: 'fullName', label: 'Full Name', min: 14, max: 36 },
  { key: 'minorCopy', label: 'Minor Copy', min: 6, max: 12 },
  { key: 'contactInfo', label: 'Contact Info', min: 7, max: 12 },
];

const WEIGHT_OPTIONS = [
  { v: 'thin', l: 'Thin' }, { v: 'extralight', l: 'Extra Light' }, { v: 'light', l: 'Light' },
  { v: 'regular', l: 'Regular' }, { v: 'medium', l: 'Medium' }, { v: 'semibold', l: 'Semi-Bold' },
  { v: 'bold', l: 'Bold' }, { v: 'extrabold', l: 'Extra Bold' },
] as const;

const TRANSFORM_OPTIONS = [
  { v: 'none', l: 'As Written' }, { v: 'uppercase', l: 'Uppercase' },
  { v: 'lowercase', l: 'Lowercase' }, { v: 'capitalize', l: 'Capitalize' },
  { v: 'small-caps', l: 'Small Caps' },
] as const;

const WEIGHT_FIELDS = ['bodyCopy','primaryHeading','secondaryHeading','sectionTitle','fullName','minorCopy'] as const;
const TRANSFORM_FIELDS = ['primaryHeading','secondaryHeading','sectionTitle','fullName','minorCopy','bodyCopy'] as const;
const FIELD_LABELS: Record<string, string> = {
  bodyCopy: 'Body Copy', primaryHeading: 'Primary Heading', secondaryHeading: 'Secondary Heading',
  sectionTitle: 'Section Titles', fullName: 'Full Name', minorCopy: 'Minor Copy', contactInfo: 'Contact Info',
};

function AdvancedPanel() {
  const { design, updateDesign } = useResume();
  const updateNested = <K extends 'textSizes'|'textWeights'|'textTransforms'>(group: K, key: string, value: any) => {
    updateDesign(group, { ...(design[group] as any), [key]: value });
  };

  return (
    <Accordion type="multiple" defaultValue={['sizes','weights','transforms','spacing','lh']} className="w-full">
      <AccordionItem value="sizes">
        <AccordionTrigger className="text-sm">Text Sizes</AccordionTrigger>
        <AccordionContent className="space-y-3">
          {TEXT_FIELDS.map(f => (
            <div key={f.key} className="grid grid-cols-[110px_60px_1fr] items-center gap-2">
              <label className="text-xs">{f.label}</label>
              <div className="border rounded px-2 py-1 text-xs text-center">{design.textSizes[f.key]} pt</div>
              <Slider value={[design.textSizes[f.key]]} min={f.min} max={f.max} step={1}
                onValueChange={(v) => updateNested('textSizes', f.key, v[0])} />
            </div>
          ))}
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="weights">
        <AccordionTrigger className="text-sm">Text Weights</AccordionTrigger>
        <AccordionContent className="space-y-2">
          {WEIGHT_FIELDS.map(k => (
            <div key={k} className="grid grid-cols-[140px_1fr] items-center gap-2">
              <label className="text-xs">{FIELD_LABELS[k]}</label>
              <Select value={design.textWeights[k]} onValueChange={(v) => updateNested('textWeights', k, v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {WEIGHT_OPTIONS.map(o => <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          ))}
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="transforms">
        <AccordionTrigger className="text-sm">Text Transformations</AccordionTrigger>
        <AccordionContent className="space-y-2">
          {TRANSFORM_FIELDS.map(k => (
            <div key={k} className="grid grid-cols-[140px_1fr] items-center gap-2">
              <label className="text-xs">{FIELD_LABELS[k]}</label>
              <Select value={design.textTransforms[k]} onValueChange={(v) => updateNested('textTransforms', k, v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TRANSFORM_OPTIONS.map(o => <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          ))}
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="spacing">
        <AccordionTrigger className="text-sm">Letter Spacing</AccordionTrigger>
        <AccordionContent>
          <AlignButtons
            value={design.letterSpacing}
            onChange={(v) => updateDesign('letterSpacing', v)}
            options={[
              { label: 'Tight', value: 'tight' },
              { label: 'Normal', value: 'normal' },
              { label: 'Wide', value: 'wide' },
              { label: 'Extra Wide', value: 'extrawide' },
            ]}
          />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="lh">
        <AccordionTrigger className="text-sm">Line Height</AccordionTrigger>
        <AccordionContent>
          <AlignButtons
            value={design.lineHeightPreset}
            onChange={(v) => updateDesign('lineHeightPreset', v)}
            options={[
              { label: 'Compact', value: 'compact' },
              { label: 'Normal', value: 'normal' },
              { label: 'Relaxed', value: 'relaxed' },
              { label: 'Loose', value: 'loose' },
            ]}
          />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function ResumeBuilder() {
  const { data, template, design, activeStep, setActiveStep, resetData } = useResume();
  const resumeRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [mobileView, setMobileView] = useState<'form' | 'preview'>('form');

  const StepComponent = STEPS[activeStep].component;

  const handleDownloadPDF = useCallback(async () => {
    if (!resumeRef.current) return;
    setDownloading(true);
    try {
      const source = resumeRef.current;
      const SCALE = 2;
      if ('fonts' in document) await document.fonts.ready;
      const canvas = await html2canvas(source, { scale: SCALE, useCORS: true, backgroundColor: '#ffffff' });
      const fmt = design.paperSize === 'letter' ? 'letter' : 'a4';
      const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: fmt, compress: true });
      const JPEG_QUALITY = 0.82;
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const pxPerMm = canvas.width / pdfWidth;
      const pageHeightPx = Math.floor(pdfHeight * pxPerMm);
      const imgFullHeightMm = (canvas.height * pdfWidth) / canvas.width;

      if (imgFullHeightMm <= pdfHeight + 0.5) {
        pdf.addImage(canvas.toDataURL('image/jpeg', JPEG_QUALITY), 'JPEG', 0, 0, pdfWidth, imgFullHeightMm, undefined, 'FAST');
      } else {
        const sourceRect = source.getBoundingClientRect();
        const cssToCanvas = canvas.height / sourceRect.height;
        const textGuardPx = Math.max(4, Math.ceil(2 * cssToCanvas));
        const pageGuardPx = Math.max(12, Math.ceil(6 * cssToCanvas));
        const minimumUsefulSlicePx = pageHeightPx * 0.25;
        const textIntervals: { top: number; bottom: number }[] = [];

        const walker = document.createTreeWalker(source, NodeFilter.SHOW_TEXT, {
          acceptNode: (node) => node.textContent?.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT,
        });
        while (walker.nextNode()) {
          const range = document.createRange();
          range.selectNodeContents(walker.currentNode);
          Array.from(range.getClientRects()).forEach((rect) => {
            const top = Math.max(0, Math.floor((rect.top - sourceRect.top) * cssToCanvas) - textGuardPx);
            const bottom = Math.min(canvas.height, Math.ceil((rect.bottom - sourceRect.top) * cssToCanvas) + textGuardPx);
            if (bottom > top) textIntervals.push({ top, bottom });
          });
        }

        const mergedTextIntervals = textIntervals
          .sort((a, b) => a.top - b.top)
          .reduce<{ top: number; bottom: number }[]>((merged, interval) => {
            const last = merged[merged.length - 1];
            if (!last || interval.top > last.bottom) merged.push({ ...interval });
            else last.bottom = Math.max(last.bottom, interval.bottom);
            return merged;
          }, []);

        const breakpoints = new Set<number>();
        const all = source.querySelectorAll<HTMLElement>('h1,h2,h3,h4,p,li,ul,ol,section,article,div');
        all.forEach(el => {
          const r = el.getBoundingClientRect();
          if (r.height === 0) return;
          const bottomPx = Math.min(canvas.height, Math.round((r.bottom - sourceRect.top) * cssToCanvas) + textGuardPx);
          if (bottomPx > 0 && bottomPx <= canvas.height) breakpoints.add(bottomPx);
        });
        breakpoints.add(canvas.height);
        const breaks = Array.from(breakpoints).sort((a, b) => a - b);

        const isInsideText = (y: number) => mergedTextIntervals.some(interval => y > interval.top && y < interval.bottom);
        const nearestTextSafeY = (limit: number, start: number) => {
          let y = limit;
          for (let i = mergedTextIntervals.length - 1; i >= 0; i--) {
            const interval = mergedTextIntervals[i];
            if (interval.bottom <= start) break;
            if (interval.top < y && interval.bottom > y) y = interval.top - pageGuardPx;
          }
          return Math.max(start, Math.floor(y));
        };

        const getSafeSliceEnd = (start: number) => {
          const remaining = canvas.height - start;
          if (remaining <= pageHeightPx) return canvas.height;
          const pageLimit = Math.min(start + pageHeightPx - pageGuardPx, canvas.height);
          const textSafeLimit = nearestTextSafeY(pageLimit, start);
          let candidate = start;
          for (const bp of breaks) {
            if (bp > start && bp <= textSafeLimit && !isInsideText(bp)) candidate = bp;
            else if (bp > textSafeLimit) break;
          }
          if (candidate > start + minimumUsefulSlicePx) return candidate;
          if (textSafeLimit > start + minimumUsefulSlicePx) return textSafeLimit;
          return Math.min(start + pageHeightPx, canvas.height);
        };

        let renderedPx = 0;
        let pageIndex = 0;
        while (renderedPx < canvas.height) {
          const sliceEnd = getSafeSliceEnd(renderedPx);
          const sliceHeightPx = sliceEnd - renderedPx;
          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = canvas.width;
          pageCanvas.height = sliceHeightPx;
          const ctx = pageCanvas.getContext('2d');
          if (!ctx) break;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
          ctx.drawImage(canvas, 0, renderedPx, canvas.width, sliceHeightPx, 0, 0, canvas.width, sliceHeightPx);
          const sliceHeightMm = (sliceHeightPx * pdfWidth) / canvas.width;
          if (pageIndex > 0) pdf.addPage();
          pdf.addImage(pageCanvas.toDataURL('image/jpeg', JPEG_QUALITY), 'JPEG', 0, 0, pdfWidth, sliceHeightMm, undefined, 'FAST');
          renderedPx = sliceEnd;
          pageIndex++;
        }
      }
      pdf.save(`${data.personalInfo.fullName || 'resume'}.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
    }
    setDownloading(false);
  }, [data.personalInfo.fullName, design.paperSize]);


  const fontStack = FONT_FAMILIES.find(f => f.label === design.fontFamily)?.value || design.fontFamily;
  const paper = PAPER[design.paperSize];
  const marginXmm = design.marginX * 25.4;
  const marginYmm = design.marginY * 25.4;

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
                  This will clear all your resume content and reset all design settings to defaults. This action cannot be undone.
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
            <TabsList className="rounded-none w-full justify-start h-auto bg-background border-b px-2 py-1.5 gap-1">
              <TabsTrigger value="content" className="data-[state=active]:bg-muted gap-1.5 text-xs">
                <FileText className="h-3.5 w-3.5" /> Content Editor
              </TabsTrigger>
              <TabsTrigger value="designer" className="data-[state=active]:bg-muted gap-1.5 text-xs">
                <Palette className="h-3.5 w-3.5" /> Designer
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

            <TabsContent value="designer" className="flex-1 mt-0 overflow-hidden data-[state=inactive]:hidden flex flex-col">
              <Tabs defaultValue="presentation" className="flex-1 flex flex-col overflow-hidden">
                <TabsList className="rounded-none w-full justify-start bg-muted/40 border-b px-2 py-1 gap-1 h-auto">
                  <TabsTrigger value="presentation" className="text-xs data-[state=active]:bg-background">Presentation</TabsTrigger>
                  <TabsTrigger value="advanced" className="text-xs data-[state=active]:bg-background">Advanced</TabsTrigger>
                </TabsList>
                <TabsContent value="presentation" className="flex-1 mt-0 overflow-hidden data-[state=inactive]:hidden">
                  <ScrollArea className="h-full p-4">
                    <PresentationPanel />
                  </ScrollArea>
                </TabsContent>
                <TabsContent value="advanced" className="flex-1 mt-0 overflow-hidden data-[state=inactive]:hidden">
                  <ScrollArea className="h-full p-4">
                    <AdvancedPanel />
                  </ScrollArea>
                </TabsContent>
              </Tabs>
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
                  width: `${paper.wMm}mm`,
                  minHeight: `${paper.hMm}mm`,
                  maxWidth: '100%',
                  fontFamily: fontStack,
                  paddingLeft: `${marginXmm}mm`,
                  paddingRight: `${marginXmm}mm`,
                  paddingTop: `${marginYmm}mm`,
                  paddingBottom: `${marginYmm}mm`,
                }}
              >
                <TemplateRenderer template={template} data={data} accentColor={design.accentColor} design={design} />
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
