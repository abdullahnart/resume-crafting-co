import { TemplateProps } from '@/types/resume';
import { getDesign, dateRange, alignClass, fmt, SkillsList } from '@/lib/templateHelpers';

export function CompactTemplate({ data, accentColor, design }: TemplateProps) {
  const { personalInfo: p, summary, experience, education, skills, languages, certifications, projects } = data;
  const d = getDesign(design);
  const headerJustify = d.headerAlign === 'left' ? 'justify-start' : d.headerAlign === 'right' ? 'justify-end' : 'justify-center';

  return (
    <div className="text-[9.5px] text-gray-900" style={{ lineHeight: d.lineHeight }}>
      <div className={`flex ${headerJustify} items-start border-b pb-2 mb-2 gap-4`} style={{ borderColor: accentColor }}>
        <div className={alignClass(d.headerAlign)}>
          <h1 className="text-lg font-bold" style={{ color: accentColor }}>{p.fullName || 'Your Name'}</h1>
          {p.jobTitle && <p className="text-xs text-gray-500">{p.jobTitle}</p>}
        </div>
        <div className="text-right text-[9px] text-gray-500 space-y-0.5 ml-auto">
          {p.email && <p>{p.email}</p>}
          {p.phone && <p>{p.phone}</p>}
          {p.location && <p>{p.location}</p>}
          {p.linkedin && <p>{p.linkedin}</p>}
        </div>
      </div>

      {summary && <p className="text-gray-600 mb-2">{summary}</p>}

      {experience.length > 0 && (
        <div className="mb-2">
          <h2 className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: accentColor }}>Experience</h2>
          {experience.map(exp => {
            const dateEl = <span className="text-gray-400">{dateRange(exp.startDate, exp.endDate, exp.current, design)}</span>;
            const titleEl = <span><span className="font-semibold">{exp.role}</span> · {exp.company}</span>;
            return (
              <div key={exp.id} className="mb-1.5">
                <div className="flex justify-between">
                  {d.dateAlign === 'left' ? <>{dateEl}{titleEl}</> : <>{titleEl}{dateEl}</>}
                </div>
                {exp.bullets.filter(b => b).length > 0 && (
                  <ul className="list-disc list-inside text-gray-600 ml-2" style={{ lineHeight: d.listLineHeight }}>
                    {exp.bullets.filter(b => b).map((b, i) => <li key={i}>{b}</li>)}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {education.length > 0 && (
          <div className="mb-2">
            <h2 className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: accentColor }}>Education</h2>
            {education.map(edu => (
              <div key={edu.id} className="mb-1">
                <div className="font-semibold">{edu.degree} {edu.field && `in ${edu.field}`}</div>
                <div className="text-gray-500">{edu.school} · {dateRange(edu.startDate, edu.endDate, false, design)}</div>
              </div>
            ))}
          </div>
        )}

        <div>
          {skills.length > 0 && (
            <div className="mb-2">
              <h2 className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: accentColor }}>Skills</h2>
              <SkillsList skills={skills} design={design} textColor="text-gray-600" />
            </div>
          )}

          {languages.length > 0 && (
            <div className="mb-2">
              <h2 className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: accentColor }}>Languages</h2>
              <p className="text-gray-600">{languages.map(l => l.name).join(', ')}</p>
            </div>
          )}
        </div>
      </div>

      {certifications.length > 0 && (
        <div className="mb-2">
          <h2 className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: accentColor }}>Certifications</h2>
          <p className="text-gray-600">{certifications.map(c => `${c.name}${c.date ? ` (${fmt(c.date, design)})` : ''}`).join(' • ')}</p>
        </div>
      )}

      {projects.length > 0 && (
        <div>
          <h2 className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: accentColor }}>Projects</h2>
          <div className="space-y-0.5">
            {projects.map(proj => (
              <div key={proj.id} className="text-gray-600">
                <a href={proj.url} target="_blank" rel="noreferrer" className="underline underline-offset-2">{proj.name}</a>
                {proj.description && `: ${proj.description}`}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
