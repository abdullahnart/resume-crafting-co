import { ResumeData, TemplateName } from '@/types/resume';
import { ClassicTemplate } from './templates/ClassicTemplate';
import { ModernTemplate } from './templates/ModernTemplate';
import { MinimalTemplate } from './templates/MinimalTemplate';
import { CreativeTemplate } from './templates/CreativeTemplate';
import { ProfessionalTemplate } from './templates/ProfessionalTemplate';
import { CompactTemplate } from './templates/CompactTemplate';

interface Props {
  template: TemplateName;
  data: ResumeData;
  accentColor: string;
}

const templates: Record<TemplateName, React.ComponentType<{ data: ResumeData; accentColor: string }>> = {
  classic: ClassicTemplate,
  modern: ModernTemplate,
  minimal: MinimalTemplate,
  creative: CreativeTemplate,
  professional: ProfessionalTemplate,
  compact: CompactTemplate,
};

export function TemplateRenderer({ template, data, accentColor }: Props) {
  const Component = templates[template];
  return <Component data={data} accentColor={accentColor} />;
}
