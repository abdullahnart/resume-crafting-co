import { TemplateProps } from '@/types/resume';

export function CompactTemplate({ data, accentColor }: TemplateProps) {
  const { personalInfo: p, summary, experience, education, skills, languages, certifications, projects } = data;

  return (
    <div className="text-[9.5px] leading-snug text-gray-900 p-5" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
      {/* Compact header */}
      <div className="flex justify-between items-start border-b pb-2 mb-2" style={{ borderColor: accentColor }}>
        <div>
          <h1 className="text-lg font-bold" style={{ color: accentColor }}>{p.fullName || 'Your Name'}</h1>
          {p.jobTitle && <p className="text-xs text-gray-500">{p.jobTitle}</p>}
        </div>
        <div className="text-right text-[9px] text-gray-500 space-y-0.5">
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
          {experience.map(exp => (
            <div key={exp.id} className="mb-1.5">
              <div className="flex justify-between">
                <span><span className="font-semibold">{exp.role}</span> · {exp.company}</span>
                <span className="text-gray-400">{exp.startDate}–{exp.current ? 'Present' : exp.endDate}</span>
              </div>
              {exp.bullets.filter(b => b).length > 0 && (
                <ul className="list-disc list-inside text-gray-600 ml-2">
                  {exp.bullets.filter(b => b).map((b, i) => <li key={i}>{b}</li>)}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {education.length > 0 && (
          <div className="mb-2">
            <h2 className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: accentColor }}>Education</h2>
            {education.map(edu => (
              <div key={edu.id} className="mb-1">
                <div className="font-semibold">{edu.degree} {edu.field && `in ${edu.field}`}</div>
                <div className="text-gray-500">{edu.school} · {edu.startDate}–{edu.endDate}</div>
              </div>
            ))}
          </div>
        )}

        <div>
          {skills.length > 0 && (
            <div className="mb-2">
              <h2 className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: accentColor }}>Skills</h2>
              <p className="text-gray-600">{skills.map(s => s.name).filter(Boolean).join(', ')}</p>
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
          <p className="text-gray-600">{certifications.map(c => c.name).join(' • ')}</p>
        </div>
      )}

      {projects.length > 0 && (
        <div>
          <h2 className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: accentColor }}>Projects</h2>
          {projects.map(proj => (
            <span key={proj.id} className="text-gray-600">{proj.name}{proj.description && `: ${proj.description}`} · </span>
          ))}
        </div>
      )}
    </div>
  );
}
