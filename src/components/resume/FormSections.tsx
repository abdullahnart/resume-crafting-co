import React from 'react';
import { useResume } from '@/contexts/ResumeContext';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WorkExperience, Education, Skill, Language, Certification, Project } from '@/types/resume';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { ResumeUploader } from './ResumeUploader';

const uid = () => crypto.randomUUID();

// --- Photo Upload ---
function PhotoUpload() {
  const { data, updateField } = useResume();
  const p = data.personalInfo;
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      updateField('personalInfo', { ...p, photo: String(reader.result || '') });
    };
    reader.readAsDataURL(file);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="flex items-center gap-3 rounded-lg border p-3 bg-muted/30">
      <div
        className="h-16 w-16 rounded-full bg-muted overflow-hidden border flex items-center justify-center text-xs text-muted-foreground"
        style={p.photo ? { backgroundImage: `url(${p.photo})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
      >
        {!p.photo && 'Photo'}
      </div>
      <div className="flex-1">
        <Label>Profile Photo</Label>
        <p className="text-xs text-muted-foreground">Shown on Modern, Professional & Creative templates.</p>
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <div className="flex flex-col gap-1">
        <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()}>
          {p.photo ? 'Replace' : 'Upload'}
        </Button>
        {p.photo && (
          <Button size="sm" variant="ghost" onClick={() => updateField('personalInfo', { ...p, photo: '' })}>
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}

// --- Personal Info ---
export function PersonalInfoForm() {
  const { data, updateField } = useResume();
  const p = data.personalInfo;
  const set = (key: keyof typeof p, val: string) =>
    updateField('personalInfo', { ...p, [key]: val });

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold font-[var(--font-heading)]">Personal Information</h2>
      <ResumeUploader />
      <PhotoUpload />
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label>Full Name</Label>
          <Input value={p.fullName} onChange={e => set('fullName', e.target.value)} placeholder="John Doe" />
        </div>
        <div className="col-span-2">
          <Label>Job Title</Label>
          <Input value={p.jobTitle} onChange={e => set('jobTitle', e.target.value)} placeholder="Software Engineer" />
        </div>
        <div>
          <Label>Email</Label>
          <Input value={p.email} onChange={e => set('email', e.target.value)} placeholder="john@example.com" />
        </div>
        <div>
          <Label>Phone</Label>
          <Input value={p.phone} onChange={e => set('phone', e.target.value)} placeholder="+1 (555) 000-0000" />
        </div>
        <div>
          <Label>Location</Label>
          <Input value={p.location} onChange={e => set('location', e.target.value)} placeholder="New York, NY" />
        </div>
        <div>
          <Label>LinkedIn</Label>
          <Input value={p.linkedin} onChange={e => set('linkedin', e.target.value)} placeholder="linkedin.com/in/johndoe" />
        </div>
        <div className="col-span-2">
          <Label>Website</Label>
          <Input value={p.website} onChange={e => set('website', e.target.value)} placeholder="johndoe.com" />
        </div>
      </div>
    </div>
  );
}

// --- Summary ---
export function SummaryForm() {
  const { data, updateField } = useResume();
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold font-[var(--font-heading)]">Professional Summary</h2>
      <Textarea
        value={data.summary}
        onChange={e => updateField('summary', e.target.value)}
        placeholder="Experienced software engineer with 5+ years..."
        className="min-h-[120px]"
      />
    </div>
  );
}

// --- Work Experience ---
export function ExperienceForm() {
  const { data, updateField } = useResume();
  const items = data.experience;

  const add = () => updateField('experience', [...items, {
    id: uid(), company: '', role: '', location: '', startDate: '', endDate: '', current: false, bullets: ['']
  }]);

  const update = (id: string, field: keyof WorkExperience, val: any) =>
    updateField('experience', items.map(i => i.id === id ? { ...i, [field]: val } : i));

  const remove = (id: string) => updateField('experience', items.filter(i => i.id !== id));

  const updateBullet = (id: string, idx: number, val: string) =>
    updateField('experience', items.map(i =>
      i.id === id ? { ...i, bullets: i.bullets.map((b, j) => j === idx ? val : b) } : i
    ));

  const addBullet = (id: string) =>
    updateField('experience', items.map(i =>
      i.id === id ? { ...i, bullets: [...i.bullets, ''] } : i
    ));

  const removeBullet = (id: string, idx: number) =>
    updateField('experience', items.map(i =>
      i.id === id ? { ...i, bullets: i.bullets.filter((_, j) => j !== idx) } : i
    ));

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold font-[var(--font-heading)]">Work Experience</h2>
      {items.map((exp) => (
        <div key={exp.id} className="border rounded-md p-4 space-y-3 bg-card">
          <div className="flex justify-between items-center">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            <Button variant="ghost" size="icon" onClick={() => remove(exp.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Company</Label>
              <Input value={exp.company} onChange={e => update(exp.id, 'company', e.target.value)} placeholder="Company Inc." />
            </div>
            <div>
              <Label>Role</Label>
              <Input value={exp.role} onChange={e => update(exp.id, 'role', e.target.value)} placeholder="Software Engineer" />
            </div>
            <div>
              <Label>Start Date</Label>
              <Input value={exp.startDate} onChange={e => update(exp.id, 'startDate', e.target.value)} placeholder="Jan 2020" />
            </div>
            <div>
              <Label>End Date</Label>
              <Input
                value={exp.current ? 'Present' : exp.endDate}
                onChange={e => update(exp.id, 'endDate', e.target.value)}
                disabled={exp.current}
                placeholder="Dec 2023"
              />
            </div>
            <div className="col-span-2">
              <Label>Location</Label>
              <Input value={exp.location || ''} onChange={e => update(exp.id, 'location', e.target.value)} placeholder="City, Country" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={exp.current} onChange={e => update(exp.id, 'current', e.target.checked)} />
            Currently working here
          </label>
          <div className="space-y-2">
            <Label>Key Achievements</Label>
            {exp.bullets.map((b, idx) => (
              <div key={idx} className="flex gap-2">
                <Input value={b} onChange={e => updateBullet(exp.id, idx, e.target.value)} placeholder="Led a team of..." />
                {exp.bullets.length > 1 && (
                  <Button variant="ghost" size="icon" onClick={() => removeBullet(exp.id, idx)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => addBullet(exp.id)}>
              <Plus className="h-3 w-3 mr-1" /> Add Bullet
            </Button>
          </div>
        </div>
      ))}
      <Button variant="outline" onClick={add} className="w-full">
        <Plus className="h-4 w-4 mr-2" /> Add Experience
      </Button>
    </div>
  );
}

// --- Education ---
export function EducationForm() {
  const { data, updateField } = useResume();
  const items = data.education;

  const add = () => updateField('education', [...items, {
    id: uid(), school: '', degree: '', field: '', startDate: '', endDate: '', gpa: ''
  }]);

  const update = (id: string, field: keyof Education, val: string) =>
    updateField('education', items.map(i => i.id === id ? { ...i, [field]: val } : i));

  const remove = (id: string) => updateField('education', items.filter(i => i.id !== id));

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold font-[var(--font-heading)]">Education</h2>
      {items.map((edu) => (
        <div key={edu.id} className="border rounded-md p-4 space-y-3 bg-card">
          <div className="flex justify-end">
            <Button variant="ghost" size="icon" onClick={() => remove(edu.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>School</Label>
              <Input value={edu.school} onChange={e => update(edu.id, 'school', e.target.value)} placeholder="MIT" />
            </div>
            <div>
              <Label>Degree</Label>
              <Input value={edu.degree} onChange={e => update(edu.id, 'degree', e.target.value)} placeholder="B.S." />
            </div>
            <div>
              <Label>Field</Label>
              <Input value={edu.field} onChange={e => update(edu.id, 'field', e.target.value)} placeholder="Computer Science" />
            </div>
            <div>
              <Label>Start</Label>
              <Input value={edu.startDate} onChange={e => update(edu.id, 'startDate', e.target.value)} placeholder="2016" />
            </div>
            <div>
              <Label>End</Label>
              <Input value={edu.endDate} onChange={e => update(edu.id, 'endDate', e.target.value)} placeholder="2020" />
            </div>
            <div>
              <Label>GPA</Label>
              <Input value={edu.gpa} onChange={e => update(edu.id, 'gpa', e.target.value)} placeholder="3.8" />
            </div>
          </div>
        </div>
      ))}
      <Button variant="outline" onClick={add} className="w-full">
        <Plus className="h-4 w-4 mr-2" /> Add Education
      </Button>
    </div>
  );
}

// --- Skills ---
export function SkillsForm() {
  const { data, updateField } = useResume();
  const items = data.skills;

  const add = () => updateField('skills', [...items, { id: uid(), name: '', level: 'intermediate' as const }]);
  const update = (id: string, field: keyof Skill, val: string) =>
    updateField('skills', items.map(i => i.id === id ? { ...i, [field]: val } : i));
  const remove = (id: string) => updateField('skills', items.filter(i => i.id !== id));

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold font-[var(--font-heading)]">Skills</h2>
      {items.map((skill) => (
        <div key={skill.id} className="flex gap-2 items-end">
          <div className="flex-1">
            <Label>Skill</Label>
            <Input value={skill.name} onChange={e => update(skill.id, 'name', e.target.value)} placeholder="React" />
          </div>
          <div className="w-36">
            <Label>Level</Label>
            <Select value={skill.level} onValueChange={v => update(skill.id, 'level', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
                <SelectItem value="expert">Expert</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="ghost" size="icon" onClick={() => remove(skill.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button variant="outline" onClick={add} className="w-full">
        <Plus className="h-4 w-4 mr-2" /> Add Skill
      </Button>
    </div>
  );
}

// --- Additional ---
export function AdditionalForm() {
  const { data, updateField } = useResume();

  // Languages
  const addLang = () => updateField('languages', [...data.languages, { id: uid(), name: '', proficiency: '' }]);
  const updateLang = (id: string, field: keyof Language, val: string) =>
    updateField('languages', data.languages.map(i => i.id === id ? { ...i, [field]: val } : i));
  const removeLang = (id: string) => updateField('languages', data.languages.filter(i => i.id !== id));

  // Certifications
  const addCert = () => updateField('certifications', [...data.certifications, { id: uid(), name: '', issuer: '', date: '' }]);
  const updateCert = (id: string, field: keyof Certification, val: string) =>
    updateField('certifications', data.certifications.map(i => i.id === id ? { ...i, [field]: val } : i));
  const removeCert = (id: string) => updateField('certifications', data.certifications.filter(i => i.id !== id));

  // Projects
  const addProj = () => updateField('projects', [...data.projects, { id: uid(), name: '', description: '', url: '' }]);
  const updateProj = (id: string, field: keyof Project, val: string) =>
    updateField('projects', data.projects.map(i => i.id === id ? { ...i, [field]: val } : i));
  const removeProj = (id: string) => updateField('projects', data.projects.filter(i => i.id !== id));

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold font-[var(--font-heading)]">Additional Sections</h2>

      {/* Languages */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Languages</h3>
        {data.languages.map(l => (
          <div key={l.id} className="flex gap-2 items-end">
            <div className="flex-1">
              <Input value={l.name} onChange={e => updateLang(l.id, 'name', e.target.value)} placeholder="Spanish" />
            </div>
            <div className="flex-1">
              <Input value={l.proficiency} onChange={e => updateLang(l.id, 'proficiency', e.target.value)} placeholder="Fluent" />
            </div>
            <Button variant="ghost" size="icon" onClick={() => removeLang(l.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addLang}>
          <Plus className="h-3 w-3 mr-1" /> Add Language
        </Button>
      </div>

      {/* Certifications */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Certifications</h3>
        {data.certifications.map(c => (
          <div key={c.id} className="flex gap-2 items-end">
            <div className="flex-1">
              <Input value={c.name} onChange={e => updateCert(c.id, 'name', e.target.value)} placeholder="AWS Solutions Architect" />
            </div>
            <div className="w-28">
              <Input value={c.issuer} onChange={e => updateCert(c.id, 'issuer', e.target.value)} placeholder="Amazon" />
            </div>
            <div className="w-24">
              <Input value={c.date} onChange={e => updateCert(c.id, 'date', e.target.value)} placeholder="2023" />
            </div>
            <Button variant="ghost" size="icon" onClick={() => removeCert(c.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addCert}>
          <Plus className="h-3 w-3 mr-1" /> Add Certification
        </Button>
      </div>

      {/* Projects */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Projects</h3>
        {data.projects.map(p => (
          <div key={p.id} className="border rounded-md p-3 space-y-2 bg-card">
            <div className="flex justify-end">
              <Button variant="ghost" size="icon" onClick={() => removeProj(p.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <Input value={p.name} onChange={e => updateProj(p.id, 'name', e.target.value)} placeholder="Project name" />
            <Textarea value={p.description} onChange={e => updateProj(p.id, 'description', e.target.value)} placeholder="Brief description..." className="min-h-[60px]" />
            <Input value={p.url} onChange={e => updateProj(p.id, 'url', e.target.value)} placeholder="https://..." />
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={addProj}>
          <Plus className="h-3 w-3 mr-1" /> Add Project
        </Button>
      </div>
    </div>
  );
}
