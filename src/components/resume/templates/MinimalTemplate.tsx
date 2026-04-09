import { TemplateProps } from '@/types/resume';

export function MinimalTemplate({ data }: TemplateProps) {
  const { personalInfo: p, summary, experience, education, skills, languages, certifications, projects } = data;

  return (
    <div className="text-[11px] leading-relaxed text-gray-800 p-10" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
      <div className="mb-8">
        <h1 className="text-3xl font-light tracking-wide text-gray-900">{p.fullName || 'Your Name'}</h1>
        {p.jobTitle && <p className="text-sm text-gray-400 mt-1">{p.jobTitle}</p>}
        <div className="flex gap-4 mt-2 text-[10px] text-gray-400">
          {p.email && <span>{p.email}</span>}
          {p.phone && <span>{p.phone}</span>}
          {p.location && <span>{p.location}</span>}
        </div>
      </div>

      {summary && (
        <div className="mb-6">
          <p className="text-gray-600 leading-relaxed">{summary}</p>
        </div>
      )}

      {experience.length > 0 && (
        <div className="mb-6">
          <h2 className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-3">Experience</h2>
          <div className="border-t border-gray-200" />
          {experience.map(exp => (
            <div key={exp.id} className="py-3 border-b border-gray-100">
              <div className="flex justify-between items-baseline">
                <span className="font-semibold text-gray-900">{exp.role}</span>
                <span className="text-[10px] text-gray-400">{exp.startDate} — {exp.current ? 'Present' : exp.endDate}</span>
              </div>
              <p className="text-gray-500">{exp.company}</p>
              <ul className="mt-1 space-y-0.5 text-gray-600">
                {exp.bullets.filter(b => b).map((b, i) => <li key={i}>— {b}</li>)}
              </ul>
            </div>
          ))}
        </div>
      )}

      {education.length > 0 && (
        <div className="mb-6">
          <h2 className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-3">Education</h2>
          <div className="border-t border-gray-200" />
          {education.map(edu => (
            <div key={edu.id} className="py-2 border-b border-gray-100">
              <span className="font-semibold text-gray-900">{edu.degree} {edu.field && `— ${edu.field}`}</span>
              <p className="text-gray-500">{edu.school} · {edu.startDate}–{edu.endDate}</p>
            </div>
          ))}
        </div>
      )}

      {skills.length > 0 && (
        <div className="mb-6">
          <h2 className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-2">Skills</h2>
          <p className="text-gray-600">{skills.map(s => s.name).filter(Boolean).join(', ')}</p>
        </div>
      )}

      {languages.length > 0 && (
        <div className="mb-6">
          <h2 className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-2">Languages</h2>
          <p className="text-gray-600">{languages.map(l => `${l.name} (${l.proficiency})`).join(', ')}</p>
        </div>
      )}

      {certifications.length > 0 && (
        <div className="mb-6">
          <h2 className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-2">Certifications</h2>
          {certifications.map(c => <p key={c.id} className="text-gray-600">{c.name} — {c.issuer} ({c.date})</p>)}
        </div>
      )}

      {projects.length > 0 && (
        <div>
          <h2 className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mb-2">Projects</h2>
          {projects.map(proj => (
            <div key={proj.id} className="mb-1">
              <span className="font-semibold">{proj.name}</span>
              {proj.description && <span className="text-gray-500"> — {proj.description}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
