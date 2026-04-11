import { TemplateProps } from '@/types/resume';

export function ProfessionalTemplate({ data, accentColor }: TemplateProps) {
  const { personalInfo: p, summary, experience, education, skills, languages, certifications, projects } = data;

  return (
    <div className="text-[11px] leading-relaxed text-gray-900" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
      {/* Dark header block */}
      <div className="p-6 text-white" style={{ backgroundColor: accentColor }}>
        <h1 className="text-2xl font-bold">{p.fullName || 'Your Name'}</h1>
        {p.jobTitle && <p className="text-sm opacity-90 mt-0.5">{p.jobTitle}</p>}
        <div className="grid grid-cols-3 gap-2 mt-3 text-[10px] opacity-80">
          {p.email && <span>✉ {p.email}</span>}
          {p.phone && <span>☎ {p.phone}</span>}
          {p.location && <span>📍 {p.location}</span>}
          {p.linkedin && <span>🔗 {p.linkedin}</span>}
          {p.website && <span>🌐 {p.website}</span>}
        </div>
      </div>

      <div className="p-6 space-y-4">
        {summary && (
          <div className="bg-gray-50 p-3 rounded">
            <h2 className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: accentColor }}>Professional Summary</h2>
            <p className="text-gray-700">{summary}</p>
          </div>
        )}

        {experience.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider pb-1 border-b-2 mb-3" style={{ color: accentColor, borderColor: accentColor }}>Professional Experience</h2>
            {experience.map(exp => (
              <div key={exp.id} className="mb-3">
                <div className="flex justify-between">
                  <div>
                    <span className="font-bold text-sm">{exp.role}</span>
                    <span className="text-gray-500"> | {exp.company}</span>
                  </div>
                  <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{exp.startDate} — {exp.current ? 'Present' : exp.endDate}</span>
                </div>
                <ul className="list-disc list-inside mt-1 text-gray-700">
                  {exp.bullets.filter(b => b).map((b, i) => <li key={i}>{b}</li>)}
                </ul>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-6">
          {education.length > 0 && (
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider pb-1 border-b-2 mb-2" style={{ color: accentColor, borderColor: accentColor }}>Education</h2>
              {education.map(edu => (
                <div key={edu.id} className="mb-2">
                  <div className="font-bold">{edu.degree} {edu.field && `in ${edu.field}`}</div>
                  <div className="text-gray-500">{edu.school}</div>
                  <div className="text-[10px] text-gray-400">{edu.startDate} — {edu.endDate}{edu.gpa && ` | GPA: ${edu.gpa}`}</div>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3">
            {skills.length > 0 && (
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider pb-1 border-b-2 mb-2" style={{ color: accentColor, borderColor: accentColor }}>Skills</h2>
                <ul className="list-disc list-inside text-gray-700 space-y-0.5">
                  {skills.map(s => <li key={s.id}>{s.name}</li>)}
                </ul>
              </div>
            )}

            {languages.length > 0 && (
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider pb-1 border-b-2 mb-2" style={{ color: accentColor, borderColor: accentColor }}>Languages</h2>
                {languages.map(l => <p key={l.id}>{l.name} — {l.proficiency}</p>)}
              </div>
            )}
          </div>
        </div>

        {certifications.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider pb-1 border-b-2 mb-2" style={{ color: accentColor, borderColor: accentColor }}>Certifications</h2>
            <div className="grid grid-cols-2 gap-1">
              {certifications.map(c => <p key={c.id}>{c.name} — {c.issuer} ({c.date})</p>)}
            </div>
          </div>
        )}

        {projects.length > 0 && (
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider pb-1 border-b-2 mb-2" style={{ color: accentColor, borderColor: accentColor }}>Projects</h2>
            {projects.map(proj => (
              <div key={proj.id} className="mb-1">
                <a href={proj.url} target="_blank" rel="noreferrer" className="font-bold underline underline-offset-2">
                  {proj.name}
                </a>
                {proj.description && <span className="text-gray-600"> — {proj.description}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
