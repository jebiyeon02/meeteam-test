'use client';

import { useEffect, useState } from 'react';
import { CalendarDays, LogOut, Monitor, Settings, UserRound, UsersRound } from 'lucide-react';
import AuthLink from '@/components/features/auth/AuthLink';
import { isAuthRequiredError } from '@/components/features/auth/authError';
import { useAuthRequiredModal } from '@/components/features/auth/useAuthRequiredModal';
import { getProjectCategoryLabel } from '@/components/features/project/constants';
import ProjectCoverImage from '@/components/features/project/ProjectCoverImage';
import ProjectActionButtons from '@/components/features/project/detail/ProjectActionButtons';
import ProjectDetailContent, {
  type ProjectDetailTab,
} from '@/components/features/project/detail/ProjectDetailContent';
import ProjectDetailSkeleton from '@/components/features/project/detail/ProjectDetailSkeleton';
import {
  fetchProjectDetail,
  fetchProjectTeamManagement,
  leaveProject,
} from '@/components/features/project/projectApi';
import CategoryBadge from '@/components/shared/CategoryBadge';
import ConfirmModal from '@/components/shared/ConfirmModal';
import ProfileAvatar from '@/components/shared/ProfileAvatar';
import { formatJobRole } from '@/components/shared/jobRoleFormat';
import StatusBadge from '@/components/shared/StatusBadge';
import ToastMessage from '@/components/shared/ToastMessage';
import { useAuthStore } from '@/stores/useAuthStore';
import { useToastStore } from '@/stores/useToastStore';
import { useProjectStore } from '@/components/features/project/store';
import type { ProjectMember, ProjectRecord } from '@/types/project';

type RecruitSummary = {
  role: string;
  specialty: string;
  joined: number;
  total: number;
  isOpen: boolean;
};

function formatProjectDeadline(
  recruitDeadline: string,
  isRecruitUntilComplete: boolean,
  isClosed: boolean,
) {
  if (isRecruitUntilComplete) {
    return isClosed ? '모집 종료' : '상시 모집';
  }

  if (!recruitDeadline) {
    return isClosed ? '모집 종료' : '마감일 미정';
  }

  const [year, month, day] = recruitDeadline.split('-');
  const monthNumber = Number(month);
  const dayNumber = Number(day);

  if (year && monthNumber > 0 && dayNumber > 0) {
    return `${monthNumber}월 ${dayNumber}일 마감`;
  }

  return `${recruitDeadline.replaceAll('-', '.')} 마감`;
}

export default function ProjectDetailPage({ projectId }: { projectId: string }) {
  const openAuthRequiredModal = useAuthRequiredModal();
  const memberId = useAuthStore((state) => state.memberId);
  const showToast = useToastStore((state) => state.showToast);
  const projectsById = useProjectStore((state) => state.projectsById);
  const removeMember = useProjectStore((state) => state.removeMember);
  const localProject = projectsById[projectId] ?? null;
  const [project, setProject] = useState<ProjectRecord | null>(null);
  const [teamMembers, setTeamMembers] = useState<ProjectMember[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ProjectDetailTab>('recruit');

  useEffect(() => {
    let active = true;

    const loadProject = async () => {
      try {
        setIsLoading(true);
        setProject(null);
        setTeamMembers(null);

        const nextProject = await fetchProjectDetail(projectId);

        if (!active) {
          return;
        }

        setProject(nextProject);
        setTeamMembers(nextProject.members);
        setErrorMessage(null);

        if (nextProject.isLeader) {
          try {
            const nextTeamManagement = await fetchProjectTeamManagement(projectId);

            if (active) {
              setTeamMembers(nextTeamManagement.members);
            }
          } catch {
            if (active) {
              setTeamMembers(nextProject.members);
            }
          }
        }
      } catch (error) {
        if (!active) {
          return;
        }

        setProject(localProject);
        setTeamMembers(localProject?.members ?? null);

        if (!localProject) {
          setErrorMessage(
            error instanceof Error ? error.message : '프로젝트를 불러오지 못했습니다.',
          );
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadProject();

    return () => {
      active = false;
    };
  }, [localProject, projectId]);

  if (isLoading && !project) {
    return <ProjectDetailSkeleton />;
  }

  if (!project) {
    return (
      <section className="mx-auto flex w-full max-w-7xl flex-col items-center gap-4 py-24 text-center">
        <ToastMessage message={errorMessage} />

        <h1 className="text-3xl font-bold text-mt-text-primary">프로젝트를 찾을 수 없어요.</h1>
        <p className="text-base leading-6 text-mt-text-secondary">
          {errorMessage ?? '목록으로 돌아가서 다른 프로젝트를 확인해보세요.'}
        </p>
      </section>
    );
  }

  const leader = project.members.find((member) => member.isLeader) ?? project.members[0];
  const rawMembers = teamMembers && teamMembers.length > 0 ? teamMembers : project.members;
  const members = rawMembers.filter(
    (member, index, items) => items.findIndex((item) => item.id === member.id) === index,
  );
  const canManageProject =
    project.isLeader === true || (memberId !== null && memberId === project.leaderProfileId);
  const isProjectMember = memberId !== null && members.some((member) => member.id === memberId);
  const isCurrentUserParticipant = canManageProject || isProjectMember;
  const canLeaveProject = isProjectMember && !canManageProject;
  const recruitSummaries: RecruitSummary[] =
    project.recruitmentDetails?.map((recruitment) => ({
      role: recruitment.jobFieldName,
      specialty: recruitment.jobPositionName,
      joined: recruitment.currentCount,
      total: recruitment.recruitmentCount,
      isOpen: !recruitment.isClosed && project.status !== 'closed',
    })) ??
    project.recruitInterests.map((interest) => {
      const joined = members.filter(
        (member) => !member.isLeader && member.role.includes(interest.major),
      ).length;

      return {
        role: interest.major,
        specialty: interest.minor,
        joined,
        total: interest.count,
        isOpen: project.status !== 'closed',
      };
    });
  const recruitCount = recruitSummaries.reduce((sum, position) => sum + position.total, 0);
  const totalMemberCount = recruitCount + 1;
  const remainingRecruitCount = recruitSummaries.reduce(
    (sum, position) =>
      position.isOpen ? sum + Math.max(position.total - position.joined, 0) : sum,
    0,
  );
  const recruitingText =
    remainingRecruitCount > 0
      ? `${remainingRecruitCount}명 모집 중`
      : project.status === 'closed'
        ? '모집 종료'
        : '모집 완료';
  const recruitRoleNames = recruitSummaries
    .slice(0, 3)
    .map((position) => formatJobRole(position.role, position.specialty));
  const deadlineText = formatProjectDeadline(
    project.recruitDeadline,
    project.isRecruitUntilComplete,
    project.status === 'closed',
  );
  const platformText = project.releasePlatforms.join(', ');

  const handleCopyExternalUrl = async (url: string, label: string) => {
    if (!url) {
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      showToast({ tone: 'success', message: `${label}를 복사했어요.` });
    } catch {
      showToast({ message: '주소를 복사하지 못했습니다. 다시 시도해 주세요.' });
    }
  };

  const handleLeaveProject = async () => {
    if (!memberId || isLeaving) {
      return;
    }

    try {
      setIsLeaving(true);
      setErrorMessage(null);

      await leaveProject(project.id);

      setTeamMembers((current) =>
        current ? current.filter((member) => member.id !== memberId) : current,
      );
      setProject((current) =>
        current
          ? {
              ...current,
              members: current.members.filter((member) => member.id !== memberId),
            }
          : current,
      );
      removeMember(project.id, memberId);
      setIsLeaveModalOpen(false);
      showToast({ tone: 'success', message: '프로젝트에서 나갔어요.' });
    } catch (error) {
      if (openAuthRequiredModal(error)) {
        setIsLeaveModalOpen(false);
        return;
      }

      if (!isAuthRequiredError(error)) {
        setErrorMessage(error instanceof Error ? error.message : '프로젝트를 나가지 못했습니다.');
      }
    } finally {
      setIsLeaving(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-6xl min-w-0 pb-20">
      <header className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <CategoryBadge label={getProjectCategoryLabel(project.categoryId)} size="md" />
            <StatusBadge
              status={project.status === 'closed' ? 'closed' : 'open'}
              label={project.status === 'closed' ? '모집 마감' : '모집중'}
              size="md"
            />
          </div>

          <h1 className="mt-5 break-keep text-3xl leading-tight font-extrabold text-mt-text-primary md:text-4xl">
            {project.title}
          </h1>
          <p className="mt-3 break-keep text-base leading-7 font-medium text-mt-text-secondary">
            함께 프로젝트를 만들 팀원을 찾고 있어요.
            {recruitRoleNames.length > 0 ? (
              <>
                {' '}
                {recruitRoleNames.map((roleName, index) => (
                  <span key={roleName}>
                    {index > 0 ? ', ' : ''}
                    <strong className="font-extrabold text-mt-text-primary">{roleName}</strong>
                  </span>
                ))}{' '}
                포지션을 모집 중입니다.
              </>
            ) : null}
          </p>

          <AuthLink
            href={`/profile/${project.leaderProfileId ?? 1}`}
            className="mt-4 inline-flex items-center gap-2 text-sm leading-5 font-bold text-mt-text-secondary hover:text-mt-primary"
          >
            <ProfileAvatar
              name={leader?.name ?? '프로젝트 리더'}
              imageUrl={leader?.avatarUrl}
              sizeClassName="h-8 w-8"
              shape="rounded"
              textClassName="text-xs"
            />
            <span className="text-mt-text-primary">{leader?.name}</span>
            <span aria-hidden>·</span>
            <span>{project.leaderRole}</span>
          </AuthLink>
        </div>

        <div className="w-full min-w-0 md:w-72">
          <ProjectActionButtons
            projectId={project.id}
            projectTitle={project.title}
            initialLikeCount={project.likeCount ?? 0}
            initialLiked={project.isLiked ?? false}
          />
        </div>
      </header>

      <div className="mt-6 space-y-4">
        <div className="overflow-hidden rounded-3xl border border-mt-border bg-mt-white p-2 shadow-sm sm:p-3">
          <ProjectCoverImage
            src={project.coverImageUrl}
            alt={project.title}
            priority
            className="aspect-[4/3] rounded-2xl sm:aspect-[16/7] lg:aspect-[16/6]"
            imageClassName="object-center"
            overlayClassName="bg-mt-text-primary/10"
          />
        </div>

        <div className="rounded-3xl border border-mt-border bg-mt-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <h2 className="text-lg leading-7 font-extrabold text-mt-text-primary">
                프로젝트 현황
              </h2>

              <dl className="mt-3 flex min-w-0 flex-wrap items-center gap-x-5 gap-y-3 text-sm leading-5">
                <div className="flex items-center gap-1.5">
                  <UsersRound className="h-4 w-4 text-mt-primary" aria-hidden strokeWidth={1.8} />
                  <dt className="font-bold text-mt-text-secondary">팀원</dt>
                  <dd className="font-extrabold text-mt-text-primary">
                    {members.length}/{totalMemberCount}명
                  </dd>
                </div>
                <div className="flex items-center gap-1.5">
                  <UserRound className="h-4 w-4 text-mt-primary" aria-hidden strokeWidth={1.8} />
                  <dt className="font-bold text-mt-text-secondary">모집</dt>
                  <dd className="font-extrabold text-mt-text-primary">{recruitingText}</dd>
                </div>
                <div className="flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 text-mt-primary" aria-hidden strokeWidth={1.8} />
                  <dt className="font-bold text-mt-text-secondary">마감일</dt>
                  <dd className="font-extrabold text-mt-text-primary">{deadlineText}</dd>
                </div>
                {platformText ? (
                  <div className="flex min-w-0 items-center gap-1.5">
                    <Monitor
                      className="h-4 w-4 shrink-0 text-mt-primary"
                      aria-hidden
                      strokeWidth={1.8}
                    />
                    <dt className="font-bold text-mt-text-secondary">플랫폼</dt>
                    <dd className="min-w-0 break-words font-extrabold text-mt-text-primary">
                      {platformText}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </div>

            <div className="flex w-full flex-col gap-2 sm:flex-row lg:w-auto">
              {canManageProject ? (
                <AuthLink
                  href={`/projects/${project.id}/manage`}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-mt-border bg-mt-badge-bg px-4 text-sm font-bold text-mt-primary shadow-sm transition-colors hover:bg-mt-white sm:w-auto"
                >
                  <Settings className="h-4 w-4" aria-hidden strokeWidth={1.8} />
                  관리하기
                </AuthLink>
              ) : null}

              {canLeaveProject ? (
                <button
                  type="button"
                  onClick={() => setIsLeaveModalOpen(true)}
                  disabled={isLeaving}
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-mt-danger bg-mt-danger-soft px-4 text-sm leading-5 font-bold text-mt-danger shadow-sm transition-colors hover:bg-mt-white disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  <LogOut className="h-4 w-4" aria-hidden strokeWidth={1.8} />
                  {isLeaving ? '나가는 중' : '나가기'}
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-4 border-t border-mt-border pt-4">
            <p className="text-xs leading-4 font-bold text-mt-text-secondary">팀원</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {members.map((member) => (
                <AuthLink
                  key={member.id}
                  href={`/profile/${member.id}`}
                  className="inline-flex h-9 min-w-0 items-center gap-2 rounded-full border border-mt-border bg-mt-bg-soft py-1 pr-3 pl-1 transition-colors hover:bg-mt-badge-bg"
                >
                  <ProfileAvatar
                    name={member.name}
                    imageUrl={member.avatarUrl}
                    sizeClassName="h-7 w-7"
                    shape="rounded"
                    textClassName="text-xs"
                  />
                  <span className="max-w-24 truncate text-sm leading-5 font-bold text-mt-text-primary">
                    {member.name}
                  </span>
                </AuthLink>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div id="project-detail-content" className="mt-10 min-w-0 scroll-mt-24 pb-14">
        <ProjectDetailContent
          project={project}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          canApply={!isCurrentUserParticipant}
          onCopyExternalUrl={handleCopyExternalUrl}
        />
      </div>

      <ConfirmModal
        isOpen={isLeaveModalOpen}
        title="프로젝트에서 나가시겠어요?"
        description="나가면 팀원 목록에서 제외되고, 다시 참여하려면 프로젝트에 다시 지원해야 할 수 있어요."
        closeLabel="취소"
        confirmLabel={isLeaving ? '나가는 중' : '나가기'}
        isSubmitting={isLeaving}
        onClose={() => setIsLeaveModalOpen(false)}
        onConfirm={handleLeaveProject}
      />
    </section>
  );
}
