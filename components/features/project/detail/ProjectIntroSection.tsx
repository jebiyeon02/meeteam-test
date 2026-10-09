import type { ProjectRecord } from '@/types/project';
import ProjectDetailDescriptionSection from './project-intro/ProjectDetailDescriptionSection';
import ProjectExternalLinksSection from './project-intro/ProjectExternalLinksSection';

type ProjectIntroSectionProps = {
  project: ProjectRecord;
  onCopyExternalUrl: (url: string, label: string) => void;
};

export default function ProjectIntroSection({
  project,
  onCopyExternalUrl,
}: ProjectIntroSectionProps) {
  const hasExternalLinks = Boolean(project.githubUrl || project.communicationUrl);

  return (
    <section className="flex min-w-0 w-full flex-col items-start gap-6" data-node-id="97:510">
      <ProjectDetailDescriptionSection description={project.description} />
      {hasExternalLinks ? (
        <ProjectExternalLinksSection
          githubUrl={project.githubUrl}
          communicationUrl={project.communicationUrl}
          onCopy={onCopyExternalUrl}
        />
      ) : null}
    </section>
  );
}
