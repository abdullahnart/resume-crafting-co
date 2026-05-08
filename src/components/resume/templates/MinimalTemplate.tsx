import { TemplateProps } from '@/types/resume';
import { getDesign, dateRange, alignClass, fmt, SkillsList } from '@/lib/templateHelpers';

export function MinimalTemplate({ data, accentColor, design }: TemplateProps) {
  const { personalInfo: p, summary, experience, education, skills, languages, certifications, projects } = data;
  const d = getDesign(design);

  return (
    <div className="text-[11px] text-gray-800" style={{ lineHeight: d.lineHeight }}>
      <div className={`mb-8 ${alignClass(d.headerAlign)}`}>
        <h1 className="text-3xl font-light tracking-wide text-gray-900">{p.fullName || 'Your Name'}</h1>
        {p.jobTitle && <p className="text-sm text-gray-400 mt-1">{p.jobTitle}</p>}
        <div className={`flex gap-4 mt-2 text-[10px] text-gray-400 flex-wrap ${d.headerAlign === 'center' ? 'justify-center' : d.headerAlign === 'right' ? 'justify-end' : ''}`}>
          {p.email && <span>{p.email}</span>}
          {p.phone && <span>{p.phone}</span>}
          {p.location && <span>{p.location}</span>}
        </div>
      </div>

      {summary && (
        <div className="mb-6">
          <p className="text-gray-600">{summary}</p>
        </div>
      )}

      {experience.length > 0 && (
        <div className="mb-6">
          <h2 className="text-[10px] uppercase tracking-[0.2em] mb-3" style={{ color: accentColor }}>Experience</h2>
          <div className="border-t border-gray-200" />
          {experience.map(exp => (
            <div key={exp.id} className="py-3 border-b border-gray-100">
              <div className="flex justify-between items-baseline">
                {d.dateAlign === 'left' ? (
                  <>
                    <span className="text-[10px] text-gray-400">{dateRange(exp.startDate, exp.endDate, exp.current, design)}</span>
                    <span className="font-semibold text-gray-900">{exp.role}</span>
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-gray-900">{exp.role}</span>
                    <span className="text-[10px] text-gray-400">{dateRange(exp.startDate, exp.endDate, exp.current, design)}</span>
                  </>
                )}
              </div>
              <p className="text-gray-500">{exp.company}</p>
              <ul className="mt-1 text-gray-600" style={{ lineHeight: d.listLineHeight }}>
                {exp.bullets.filter(b => b).map((b, i) => <li key={i}>— {b}</li>)}
              </ul>
            </div>
          ))}
        </div>
      )}

      {education.length > 0 && (
        <div className="mb-6">
          <h2 className="text-[10px] uppercase tracking-[0.2em] mb-3" style={{ color: accentColor }}>Education</h2>
          <div className="border-t border-gray-200" />
          {education.map(edu => (
            <div key={edu.id} className="py-2 border-b border-gray-100">
              <span className="font-semibold text-gray-900">{edu.degree} {edu.field && `— ${edu.field}`}</span>
              <p className="text-gray-500">{edu.school} · {dateRange(edu.startDate, edu.endDate, false, design)}</p>
            </div>
          ))}
        </div>
      )}

      {skills.length > 0 && (
        <div className="mb-6">
          <h2 className="text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: accentColor }}>Skills</h2>
          <SkillsList skills={skills} design={design} textColor="text-gray-600" />
        </div>
      )}

      {languages.length > 0 && (
        <div className="mb-6">
          <h2 className="text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: accentColor }}>Languages</h2>
          <p className="text-gray-600">{languages.map(l => `${l.name} (${l.proficiency})`).join(', ')}</p>
        </div>
      )}

      {certifications.length > 0 && (
        <div className="mb-6">
          <h2 className="text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: accentColor }}>Certifications</h2>
          {certifications.map(c => <p key={c.id} className="text-gray-600">{c.name} — {c.issuer} ({fmt(c.date, design)})</p>)}
        </div>
      )}

      {projects.length > 0 && (
        <div>
          <h2 className="text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: accentColor }}>Projects</h2>
          {projects.map(proj => (
            <div key={proj.id} className="mb-1">
              <a href={proj.url} target="_blank" rel="noreferrer" className="font-semibold underline underline-offset-2">
                {proj.name}
              </a>
              {proj.description && <span className="text-gray-500"> — {proj.description}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
