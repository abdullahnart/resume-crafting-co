import React, { useRef, useState } from 'react';
import { useResume } from '@/contexts/ResumeContext';
import { extractTextFromFile, parseResumeText, extractFirstImageFromFile } from '@/lib/resumeParser';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function ResumeUploader() {
  const { setData, data } = useResume();
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<'idle' | 'parsing' | 'done' | 'error'>('idle');
  const { toast } = useToast();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus('parsing');
    try {
      const text = await extractTextFromFile(file);
      const parsed = parseResumeText(text);
      const photo = await extractFirstImageFromFile(file).catch(() => '');

      setData(prev => ({
        ...prev,
        personalInfo: {
          ...prev.personalInfo,
          ...Object.fromEntries(
            Object.entries(parsed.personalInfo || {}).filter(([, v]) => v)
          ),
          ...(photo && !prev.personalInfo.photo ? { photo } : {}),
        },
        summary: parsed.summary || prev.summary,
        experience: parsed.experience?.length ? parsed.experience : prev.experience,
        education: parsed.education?.length ? parsed.education : prev.education,
        skills: parsed.skills?.length ? parsed.skills : prev.skills,
        languages: parsed.languages?.length ? parsed.languages : prev.languages,
        certifications: parsed.certifications?.length ? parsed.certifications : prev.certifications,
        projects: parsed.projects?.length ? parsed.projects : prev.projects,
      }));

      setStatus('done');
      toast({
        title: 'Resume imported!',
        description: 'Your data has been extracted and filled in. Please review each section.',
      });
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err: any) {
      setStatus('error');
      toast({
        title: 'Import failed',
        description: err.message || 'Could not parse the file.',
        variant: 'destructive',
      });
      setTimeout(() => setStatus('idle'), 3000);
    }

    // Reset input
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 p-4 text-center space-y-2 bg-muted/30">
      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.docx,.doc"
        onChange={handleFile}
        className="hidden"
      />
      <div className="flex flex-col items-center gap-2">
        {status === 'idle' && (
          <>
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Upload an existing resume to auto-fill all fields
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
            >
              Choose PDF or DOCX
            </Button>
          </>
        )}
        {status === 'parsing' && (
          <>
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Extracting data from your resume...</p>
          </>
        )}
        {status === 'done' && (
          <>
            <CheckCircle2 className="h-8 w-8 text-green-600" />
            <p className="text-sm text-green-700">Data imported successfully! Review each section.</p>
          </>
        )}
        {status === 'error' && (
          <>
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm text-destructive">Failed to parse. Try another file.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
            >
              Try Again
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
