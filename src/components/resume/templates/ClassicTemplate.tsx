import { TemplateProps } from '@/types/resume';
import { getDesign, fmt, dateRange, alignClass, SkillsList } from '@/lib/templateHelpers';

export function ClassicTemplate({ data, accentColor, design }: TemplateProps) {
  const { personalInfo: p, summary, experience, education, languages, certifications, projects, skills } = data;
  const d = getDesign(design);
  const headerJustify =
    d.headerAlign === 'left' ? 'justify-start' : d.headerAlign === 'right' ? 'justify-end' : 'justify-center';

  return (
    <div className="text-[11px] text-gray-900" style={{ lineHeight: d.lineHeight }}>
      <div className={`${alignClass(d.headerAlign)} border-b-2 pb-4 mb-4`} style={{ borderColor: accentColor }}>
        <h1 className="text-2xl font-bold tracking-wide" style={{ color: accentColor }}>{p.fullName || 'Your Name'}</h1>
        {p.jobTitle && <p className="text-sm mt-1 text-gray-600">{p.jobTitle}</p>}
        <div className={`flex ${headerJustify} gap-3 mt-2 text-[10px] text-gray-500 flex-wrap`}>
          {p.email && <span>{p.email}</span>}
          {p.phone && <span>• {p.phone}</span>}
          {p.location && <span>• {p.location}</span>}
          {p.linkedin && <span>• {p.linkedin}</span>}
          {p.website && <span>• {p.website}</span>}
        </div>
      </div>

      {summary && (
        <div className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: accentColor }}>Summary</h2>
          <p className="text-gray-700">{summary}</p>
        </div>
      )}

      {experience.length > 0 && (
        <div className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: accentColor }}>Experience</h2>
          {experience.map(exp => {
            const dateEl = <span className="text-gray-500 text-[10px]">{dateRange(exp.startDate, exp.endDate, exp.current, design)}</span>;
            const roleEl = <span className="font-semibold">{exp.role}</span>;
            return (
              <div key={exp.id} className="mb-3">
                <div className="flex justify-between">
                  {d.dateAlign === 'left' ? <>{dateEl}{roleEl}</> : <>{roleEl}{dateEl}</>}
                </div>
                <div className="flex justify-between text-[10px]">
                  <p className="font-bold text-gray-800">{exp.company}</p>
                  {exp.location && <p className="text-gray-500 italic">{exp.location}</p>}
                </div>
                <ul className="list-disc list-inside mt-1 text-gray-700" style={{ lineHeight: d.listLineHeight }}>
                  {exp.bullets.filter(b => b).map((b, i) => <li key={i}>{b}</li>)}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      {education.length > 0 && (
        <div className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: accentColor }}>Education</h2>
          {education.map(edu => {
            const dateEl = <span className="text-gray-500 text-[10px]">{dateRange(edu.startDate, edu.endDate, false, design)}</span>;
            const titleEl = <span className="font-bold">{edu.degree} {edu.field && `in ${edu.field}`}</span>;
            return (
              <div key={edu.id} className="mb-2">
                <div className="flex justify-between">
                  {d.dateAlign === 'left' ? <>{dateEl}{titleEl}</> : <>{titleEl}{dateEl}</>}
                </div>
                <p className="text-gray-600">{edu.school}{edu.gpa && ` • GPA: ${edu.gpa}`}</p>
              </div>
            );
          })}
        </div>
      )}

      {skills.length > 0 && (
        <div className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: accentColor }}>Skills</h2>
          <SkillsList skills={skills} design={design} textColor="text-gray-700" />
        </div>
      )}

      {languages.length > 0 && (
        <div className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: accentColor }}>Languages</h2>
          <p className="text-gray-700">{languages.map(l => `${l.name}${l.proficiency ? ` (${l.proficiency})` : ''}`).join(' • ')}</p>
        </div>
      )}

      {certifications.length > 0 && (
        <div className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: accentColor }}>Certifications</h2>
          {certifications.map(c => (
            <p key={c.id} className="text-gray-700">{c.name}{c.issuer && ` — ${c.issuer}`}{c.date && ` (${fmt(c.date, design)})`}</p>
          ))}
        </div>
      )}

      {projects.length > 0 && (
        <div className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: accentColor }}>Projects</h2>
          {projects.map(proj => (
            <div key={proj.id} className="mb-1">
              <a href={proj.url} target="_blank" rel="noreferrer" className="font-bold underline underline-offset-2">
                {proj.name}
              </a>
              {proj.description && <span className="text-gray-600"> — {proj.description}</span>}
              {proj.url && <span className="text-gray-500 text-[10px]"> ({proj.url})</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
