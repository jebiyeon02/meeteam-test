import type { MouseEvent } from 'react';
import type { ProjectRecord } from '@/types/project';
import AuthLink from '@/components/features/auth/AuthLink';
import BaseButton from '@/components/shared/BaseButton';
import { formatJobRole } from '@/components/shared/jobRoleFormat';
import SkillChip from '@/components/shared/SkillChip';
import StatusBadge from '@/components/shared/StatusBadge';
import { useToastStore } from '@/stores/useToastStore';

type RecruitPositionStatus = 'open' | 'closed';

type RecruitPosition = {
  id: number;
  role: string;
  specialty: string;
  joined: number;
  total: number;
  status: RecruitPositionStatus;
  techStack: string[];
};

function buildApplyHref(projectId: string, position: RecruitPosition) {
  const params = new URLSearchParams({
    jobField: position.role,
    jobPosition: position.specialty,
  });

  return `/projects/${projectId}/apply?${params.toString()}`;
}

type ProjectRecruitSectionProps = {
  project: ProjectRecord;
  canApply?: boolean;
};

export default function ProjectRecruitSection({
  project,
  canApply = true,
}: ProjectRecruitSectionProps) {
  const showToast = useToastStore((state) => state.showToast);
  const recruitPositions: RecruitPosition[] =
    project.recruitmentDetails?.map((recruitment, index) => ({
      id: index + 1,
      role: recruitment.jobFieldName,
      specialty: recruitment.jobPositionName,
      joined: recruitment.currentCount,
      total: recruitment.recruitmentCount,
      status: recruitment.isClosed || project.status === 'closed' ? 'closed' : 'open',
      techStack: recruitment.techStacks,
    })) ??
    project.recruitInterests.map((interest, index) => {
      const joined = project.members.filter(
        (member) => !member.isLeader && member.role.includes(interest.major),
      ).length;

      return {
        id: index + 1,
        role: interest.major,
        specialty: interest.minor,
        joined,
        total: interest.count,
        status: joined >= interest.count || project.status === 'closed' ? 'closed' : 'open',
        techStack: project.recruitTechStacks[`${interest.major} - ${interest.minor}`] ?? [],
      };
    });

  return (
    <section
      className="flex w-full flex-col gap-5 rounded-3xl border border-mt-border bg-mt-white p-6 shadow-sm"
      data-node-id="97:800"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="text-xl leading-7 font-extrabold text-mt-text-primary">팀원 모집</h2>
        <p className="text-sm leading-5 font-bold text-mt-primary">
          {recruitPositions.filter((position) => position.status === 'open').length}개 포지션 모집중
        </p>
      </div>

      {recruitPositions.map((position) => {
        const isOpen = position.status === 'open';
        const handleApplyClick = (event: MouseEvent<HTMLAnchorElement>) => {
          if (canApply) {
            return;
          }

          event.preventDefault();
          showToast({ message: '이미 참여중인 프로젝트에는 지원할 수 없습니다.' });
        };

        return (
          <article
            key={position.id}
            className={`w-full border-t border-mt-border pt-5 first:border-t-0 first:pt-0 ${isOpen ? '' : 'opacity-70'}`}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <h3 className="break-keep text-lg leading-7 font-extrabold text-mt-text-primary">
                      {formatJobRole(position.role, position.specialty)}
                    </h3>
                    <StatusBadge status={position.status} />
                  </div>
                  <span className="text-sm leading-5 font-bold text-mt-text-secondary">
                    {position.joined} / {position.total}명 합류
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {position.techStack.length > 0 ? (
                    position.techStack.map((tech) => <SkillChip key={tech} label={tech} />)
                  ) : (
                    <span className="text-sm leading-5 text-mt-text-secondary">
                      등록된 기술 스택이 없습니다.
                    </span>
                  )}
                </div>
              </div>

              <div className="lg:w-32">
                {isOpen ? (
                  <AuthLink
                    href={buildApplyHref(project.id, position)}
                    onClick={handleApplyClick}
                    aria-disabled={!canApply}
                  >
                    <BaseButton
                      size="S"
                      className={`h-11 w-full rounded-xl px-4 text-sm leading-5 font-bold text-mt-white shadow-none ${
                        canApply
                          ? 'bg-mt-text-primary hover:bg-mt-text-primary'
                          : 'cursor-not-allowed bg-mt-text-secondary'
                      }`}
                    >
                      지원하기
                    </BaseButton>
                  </AuthLink>
                ) : null}
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
