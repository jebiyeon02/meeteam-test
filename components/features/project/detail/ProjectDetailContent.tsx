'use client';

import type { ProjectRecord } from '@/types/project';
import ProjectDetailTabs from './ProjectDetailTabs';
import ProjectIntroSection from './ProjectIntroSection';
import ProjectQnaSection from './ProjectQnaSection';
import ProjectRecruitSection from './ProjectRecruitSection';

export type ProjectDetailTab = 'intro' | 'recruit' | 'qna';

type ProjectDetailContentProps = {
  project: ProjectRecord;
  activeTab: ProjectDetailTab;
  onTabChange: (tab: ProjectDetailTab) => void;
  canApply?: boolean;
  onCopyExternalUrl: (url: string, label: string) => void;
};

export default function ProjectDetailContent({
  project,
  activeTab,
  onTabChange,
  canApply = true,
  onCopyExternalUrl,
}: ProjectDetailContentProps) {
  return (
    <div className="min-w-0 space-y-6">
      <ProjectDetailTabs activeTab={activeTab} onTabChange={onTabChange} />

      {activeTab === 'intro' && (
        <ProjectIntroSection project={project} onCopyExternalUrl={onCopyExternalUrl} />
      )}
      {activeTab === 'recruit' && <ProjectRecruitSection project={project} canApply={canApply} />}
      {activeTab === 'qna' && <ProjectQnaSection project={project} />}
    </div>
  );
}
