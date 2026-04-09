import { TemplateProps } from '@/types/resume';

export function ClassicTemplate({ data, accentColor }: TemplateProps) {
  const { personalInfo: p, summary, experience, education, skills, languages, certifications, projects } = data;

  return (
    <div className="font-serif text-[11px] leading-relaxed text-gray-900 p-8" style={{ fontFamily: "'Libre Baskerville', serif" }}>
      {/* Header */}
      <div className="text-center border-b-2 pb-4 mb-4" style={{ borderColor: accentColor }}>
        <h1 className="text-2xl font-bold tracking-wide" style={{ color: accentColor }}>{p.fullName || 'Your Name'}</h1>
        {p.jobTitle && <p className="text-sm mt-1 text-gray-600">{p.jobTitle}</p>}
        <div className="flex justify-center gap-3 mt-2 text-[10px] text-gray-500 flex-wrap">
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
          {experience.map(exp => (
            <div key={exp.id} className="mb-3">
              <div className="flex justify-between">
                <span className="font-bold">{exp.role}</span>
                <span className="text-gray-500 text-[10px]">{exp.startDate} — {exp.current ? 'Present' : exp.endDate}</span>
              </div>
              <p className="text-gray-600 italic">{exp.company}</p>
              <ul className="list-disc list-inside mt-1 text-gray-700">
                {exp.bullets.filter(b => b).map((b, i) => <li key={i}>{b}</li>)}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Education */}
      {education.length > 0 && (
        <div className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: accentColor }}>Education</h2>
          {education.map(edu => (
            <div key={edu.id} className="mb-2">
              <div className="flex justify-between">
                <span className="font-bold">{edu.degree} {edu.field && `in ${edu.field}`}</span>
                <span className="text-gray-500 text-[10px]">{edu.startDate} — {edu.endDate}</span>
              </div>
              <p className="text-gray-600">{edu.school}{edu.gpa && ` • GPA: ${edu.gpa}`}</p>
            </div>
          ))}
        </div>
      )}

      {/* Skills */}
      {skills.length > 0 && (
        <div className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: accentColor }}>Skills</h2>
          <p className="text-gray-700">{skills.map(s => s.name).filter(Boolean).join(' • ')}</p>
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
            <p key={c.id} className="text-gray-700">{c.name}{c.issuer && ` — ${c.issuer}`}{c.date && ` (${c.date})`}</p>
          ))}
        </div>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <div className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: accentColor }}>Projects</h2>
          {projects.map(proj => (
            <div key={proj.id} className="mb-1">
              <span className="font-bold">{proj.name}</span>
              {proj.description && <span className="text-gray-600"> — {proj.description}</span>}
              {proj.url && <span className="text-gray-500 text-[10px]"> ({proj.url})</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
