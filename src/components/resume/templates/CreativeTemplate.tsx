import { TemplateProps } from '@/types/resume';
import { getDesign, dateRange, alignClass, fmt, SkillsList } from '@/lib/templateHelpers';

export function CreativeTemplate({ data, accentColor, design }: TemplateProps) {
  const { personalInfo: p, summary, experience, education, skills, languages, certifications, projects } = data;
  const d = getDesign(design);

  return (
    <div className="text-[11px] text-gray-900" style={{ lineHeight: d.lineHeight }}>
      <div data-pdf-section className={`p-6 pb-4 ${alignClass(d.headerAlign)}`} style={{ backgroundColor: accentColor }}>
        <h1 className="text-3xl font-black text-white tracking-tight">{p.fullName || 'Your Name'}</h1>
        {p.jobTitle && <p className="text-base text-white/80 font-light mt-1">{p.jobTitle}</p>}
        <div className={`flex gap-3 mt-3 text-[10px] text-white/70 flex-wrap ${d.headerAlign === 'center' ? 'justify-center' : d.headerAlign === 'right' ? 'justify-end' : ''}`}>
          {p.email && <span className="bg-white/10 px-2 py-0.5 rounded">{p.email}</span>}
          {p.phone && <span className="bg-white/10 px-2 py-0.5 rounded">{p.phone}</span>}
          {p.location && <span className="bg-white/10 px-2 py-0.5 rounded">{p.location}</span>}
          {p.linkedin && <span className="bg-white/10 px-2 py-0.5 rounded">{p.linkedin}</span>}
        </div>
      </div>

      <div className="p-6 pt-4 space-y-4">
        {summary && (
          <div data-pdf-section className="border-l-4 pl-3" style={{ borderColor: accentColor }}>
            <p className="text-gray-600 italic">{summary}</p>
          </div>
        )}

        {experience.length > 0 && (
          <div>
            <h2 className="text-sm font-black uppercase mb-2" style={{ color: accentColor }}>▎Experience</h2>
            {experience.map(exp => (
              <div key={exp.id} data-pdf-section className="mb-3 pl-3 border-l-2 border-gray-200">
                <div className="font-bold">{exp.role} <span className="font-normal text-gray-500">@ {exp.company}</span></div>
                <div className={`text-[10px] text-gray-400 ${d.dateAlign === 'left' ? 'text-left' : 'text-right'}`}>{dateRange(exp.startDate, exp.endDate, exp.current, design, '→')}</div>
                <ul className="mt-1 text-gray-700" style={{ lineHeight: d.listLineHeight }}>
                  {exp.bullets.filter(b => b).map((b, i) => <li key={i}>→ {b}</li>)}
                </ul>
              </div>
            ))}
          </div>
        )}

        {education.length > 0 && (
          <div>
            <h2 className="text-sm font-black uppercase mb-2" style={{ color: accentColor }}>▎Education</h2>
            {education.map(edu => (
              <div key={edu.id} data-pdf-section className="mb-2 pl-3 border-l-2 border-gray-200">
                <div className="font-bold">{edu.degree} {edu.field && `— ${edu.field}`}</div>
                <div className="text-gray-500">{edu.school} · {dateRange(edu.startDate, edu.endDate, false, design)}</div>
              </div>
            ))}
          </div>
        )}

        {skills.length > 0 && (
          <div data-pdf-section>
            <h2 className="text-sm font-black uppercase mb-2" style={{ color: accentColor }}>▎Skills</h2>
            <SkillsList skills={skills} design={design} textColor="text-gray-700" />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {languages.length > 0 && (
            <div data-pdf-section>
              <h2 className="text-sm font-black uppercase mb-1" style={{ color: accentColor }}>▎Languages</h2>
              {languages.map(l => <p key={l.id} className="text-gray-600">{l.name} — {l.proficiency}</p>)}
            </div>
          )}
          {certifications.length > 0 && (
            <div data-pdf-section>
              <h2 className="text-sm font-black uppercase mb-1" style={{ color: accentColor }}>▎Certifications</h2>
              {certifications.map(c => <p key={c.id} className="text-gray-600">{c.name}{c.date && ` (${fmt(c.date, design)})`}</p>)}
            </div>
          )}
        </div>

        {projects.length > 0 && (
          <div>
            <h2 className="text-sm font-black uppercase mb-2" style={{ color: accentColor }}>▎Projects</h2>
            {projects.map(proj => (
              <div key={proj.id} data-pdf-section className="mb-1">
                <a href={proj.url} target="_blank" rel="noreferrer" className="font-bold underline underline-offset-2">
                  {proj.name}
                </a>
                {proj.description && <span className="text-gray-500"> — {proj.description}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
