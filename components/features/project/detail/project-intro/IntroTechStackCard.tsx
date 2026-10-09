import IntroSkillChip from './IntroSkillChip';

interface IntroTechStackCardProps {
  title: string;
  subtitle: string;
  skills: string[];
}

export default function IntroTechStackCard({ title, subtitle, skills }: IntroTechStackCardProps) {
  return (
    <article className="min-w-0 rounded-2xl border border-mt-border bg-mt-bg-soft p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="break-keep text-base leading-6 font-bold text-mt-text-primary">{title}</h3>
        {subtitle ? (
          <>
            <span className="h-3 w-px bg-mt-shadow-blue" aria-hidden />
            <span className="text-xs leading-4 font-medium text-mt-text-secondary">{subtitle}</span>
          </>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {skills.length > 0 ? (
          skills.map((skill) => <IntroSkillChip key={skill} label={skill} />)
        ) : (
          <p className="text-sm leading-5 text-mt-text-secondary">등록된 기술 스택이 없습니다.</p>
        )}
      </div>
    </article>
  );
}
