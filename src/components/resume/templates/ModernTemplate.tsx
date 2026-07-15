import { TemplateProps } from '@/types/resume';
import { getDesign, dateRange, alignClass, fmt, SkillsList } from '@/lib/templateHelpers';

export function ModernTemplate({ data, accentColor, design }: TemplateProps) {
  const { personalInfo: p, summary, experience, education, skills, languages, certifications, projects } = data;
  const d = getDesign(design);

  return (
    <div className="flex text-[11px] min-h-full" style={{ lineHeight: d.lineHeight }}>
      <div className="w-[35%] p-5 text-white" style={{ backgroundColor: accentColor }}>
        {p.photo && (
          <img
            src={p.photo}
            alt={p.fullName || 'Profile'}
            className="w-24 h-24 rounded-full object-cover border-2 border-white/40 mb-3"
          />
        )}
        <h1 className="text-xl font-bold mb-1">{p.fullName || 'Your Name'}</h1>
        {p.jobTitle && <p className="text-sm opacity-90 mb-4">{p.jobTitle}</p>}

        <div className="space-y-1 text-[10px] opacity-80 mb-6">
          {p.email && <p>✉ {p.email}</p>}
          {p.phone && <p>☎ {p.phone}</p>}
          {p.location && <p>📍 {p.location}</p>}
          {p.linkedin && <p>🔗 {p.linkedin}</p>}
          {p.website && <p>🌐 {p.website}</p>}
        </div>

        {skills.length > 0 && (
          <div className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-wider border-b border-white/30 pb-1 mb-2">Skills</h2>
            <SkillsList skills={skills} design={design} className="text-[10px]" />
          </div>
        )}

        {languages.length > 0 && (
          <div className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-wider border-b border-white/30 pb-1 mb-2">Languages</h2>
            {languages.map(l => (
              <p key={l.id}>{l.name}{l.proficiency && ` — ${l.proficiency}`}</p>
            ))}
          </div>
        )}

        {certifications.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider border-b border-white/30 pb-1 mb-2">Certifications</h2>
            {certifications.map(c => (
              <p key={c.id} className="mb-1">{c.name}{c.date && ` (${fmt(c.date, design)})`}</p>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 p-6 text-gray-900">
        <div className={alignClass(d.headerAlign)}>
          {/* (header lives in sidebar; this maintains alignment for top section if needed) */}
        </div>
        {summary && (
          <div className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: accentColor }}>Profile</h2>
            <p className="text-gray-700">{summary}</p>
          </div>
        )}

        {experience.length > 0 && (
          <div className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: accentColor }}>Experience</h2>
            {experience.map(exp => (
              <div key={exp.id} className="mb-3">
                <div className="flex justify-between">
                  {d.dateAlign === 'left' ? (
                    <>
                      <span className="text-gray-500 text-[10px]">{dateRange(exp.startDate, exp.endDate, exp.current, design)}</span>
                      <span className="font-bold">{exp.role}</span>
                    </>
                  ) : (
                    <>
                      <span className="font-bold">{exp.role}</span>
                      <span className="text-gray-500 text-[10px]">{dateRange(exp.startDate, exp.endDate, exp.current, design)}</span>
                    </>
                  )}
                </div>
                <div className="text-gray-700 text-[10px] font-bold">
                  {exp.company}{exp.location && <span className="font-normal text-gray-500 italic"> · {exp.location}</span>}
                </div>
                <ul className="list-disc list-inside mt-1 text-gray-700" style={{ lineHeight: d.listLineHeight }}>
                  {exp.bullets.filter(b => b).map((b, i) => <li key={i}>{b}</li>)}
                </ul>
              </div>
            ))}
          </div>
        )}

        {education.length > 0 && (
          <div className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: accentColor }}>Education</h2>
            {education.map(edu => (
              <div key={edu.id} className="mb-2">
                <div className="font-bold">{edu.degree} {edu.field && `in ${edu.field}`}</div>
                <div className="text-gray-500 text-[10px]">{edu.school} | {dateRange(edu.startDate, edu.endDate, false, design)}{edu.gpa && ` | GPA: ${edu.gpa}`}</div>
              </div>
            ))}
          </div>
        )}

        {projects.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: accentColor }}>Projects</h2>
            {projects.map(proj => (
              <div key={proj.id} className="mb-2">
                <a href={proj.url} target="_blank" rel="noreferrer" className="font-bold underline underline-offset-2">
                  {proj.name}
                </a>
                {proj.description && <p className="text-gray-600">{proj.description}</p>}
                {proj.technologies && proj.technologies.length > 0 && (
                  <p className="text-gray-500 text-[10px] italic">{proj.technologies.join(' • ')}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
