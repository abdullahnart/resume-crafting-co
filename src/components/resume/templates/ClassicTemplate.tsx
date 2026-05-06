import { TemplateProps } from '@/types/resume';
import { formatDate } from '@/lib/resumeFormat';

export function ClassicTemplate({ data, accentColor, design }: TemplateProps) {
  const { personalInfo: p, summary, experience, education, skills, languages, certifications, projects } = data;
  const dateFmt = design?.dateFormat ?? 'numbers';
  const headerAlign = design?.headerAlign ?? 'center';
  const dateAlign = design?.dateAlign ?? 'right';
  const locationAlign = design?.locationAlign ?? 'right';
  const skillsLayout = design?.skillsLayout ?? 'commaList';
  const skillsColumns = design?.skillsColumns ?? 2;
  const lineHeight = design?.lineHeight ?? 1.2;
  const listLineHeight = design?.listLineHeight ?? 1.4;

  const fmt = (d: string) => formatDate(d, dateFmt);

  const headerAlignClass =
    headerAlign === 'left' ? 'text-left' : headerAlign === 'right' ? 'text-right' : 'text-center';
  const headerJustify =
    headerAlign === 'left' ? 'justify-start' : headerAlign === 'right' ? 'justify-end' : 'justify-center';

  return (
    <div className="font-serif text-[11px] text-gray-900 p-8" style={{ lineHeight }}>
      {/* Header */}
      <div className={`${headerAlignClass} border-b-2 pb-4 mb-4`} style={{ borderColor: accentColor }}>
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

      {/* Summary */}
      {summary && (
        <div className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: accentColor }}>Summary</h2>
          <p className="text-gray-700">{summary}</p>
        </div>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <div className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: accentColor }}>Experience</h2>
          {experience.map(exp => {
            const dateStr = `${fmt(exp.startDate)}${exp.startDate ? ' — ' : ''}${exp.current ? 'Present' : fmt(exp.endDate)}`;
            const dateEl = <span className="text-gray-500 text-[10px]">{dateStr}</span>;
            const roleEl = <span className="font-bold">{exp.role}</span>;
            return (
              <div key={exp.id} className="mb-3">
                <div className="flex justify-between">
                  {dateAlign === 'left' ? <>{dateEl}{roleEl}</> : <>{roleEl}{dateEl}</>}
                </div>
                <div className={`flex justify-between ${locationAlign === 'left' ? 'flex-row-reverse' : ''}`}>
                  <p className="text-gray-600 italic">{exp.company}</p>
                </div>
                <ul className="list-disc list-inside mt-1 text-gray-700" style={{ lineHeight: listLineHeight }}>
                  {exp.bullets.filter(b => b).map((b, i) => <li key={i}>{b}</li>)}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      {/* Education */}
      {education.length > 0 && (
        <div className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: accentColor }}>Education</h2>
          {education.map(edu => {
            const dateStr = `${fmt(edu.startDate)}${edu.startDate ? ' — ' : ''}${fmt(edu.endDate)}`;
            const dateEl = <span className="text-gray-500 text-[10px]">{dateStr}</span>;
            const titleEl = <span className="font-bold">{edu.degree} {edu.field && `in ${edu.field}`}</span>;
            return (
              <div key={edu.id} className="mb-2">
                <div className="flex justify-between">
                  {dateAlign === 'left' ? <>{dateEl}{titleEl}</> : <>{titleEl}{dateEl}</>}
                </div>
                <p className="text-gray-600">{edu.school}{edu.gpa && ` • GPA: ${edu.gpa}`}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <div className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: accentColor }}>Skills</h2>
          {skillsLayout === 'comma' && (
            <p className="text-gray-700" style={{ lineHeight: listLineHeight }}>
              {skills.map(s => s.name).filter(Boolean).join(', ')}
            </p>
          )}
          {skillsLayout === 'commaList' && (
            <ul className="list-disc list-inside text-gray-700" style={{ lineHeight: listLineHeight }}>
              {skills.map(s => s.name).filter(Boolean).map(name => <li key={name}>{name}</li>)}
            </ul>
          )}
          {skillsLayout === 'columns' && (
            <ul
              className="text-gray-700 list-disc list-inside"
              style={{ columnCount: skillsColumns, columnGap: '1rem', lineHeight: listLineHeight }}
            >
              {skills.map(s => s.name).filter(Boolean).map(name => (
                <li key={name} style={{ breakInside: 'avoid' }}>{name}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Languages */}
      {languages.length > 0 && (
        <div className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: accentColor }}>Languages</h2>
          <p className="text-gray-700">{languages.map(l => `${l.name}${l.proficiency ? ` (${l.proficiency})` : ''}`).join(' • ')}</p>
        </div>
      )}

      {/* Certifications */}
      {certifications.length > 0 && (
        <div className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: accentColor }}>Certifications</h2>
          {certifications.map(c => (
            <p key={c.id} className="text-gray-700">{c.name}{c.issuer && ` — ${c.issuer}`}{c.date && ` (${fmt(c.date)})`}</p>
          ))}
        </div>
      )}

      {/* Projects */}
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
