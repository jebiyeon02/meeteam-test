'use client';

import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Settings, UserPlus, Users } from 'lucide-react';
import { useAuthRequiredModal } from '@/components/features/auth/useAuthRequiredModal';
import { isPermissionDeniedError } from '@/components/features/auth/authError';
import {
  fetchProjectDetail,
  fetchProjectTeamManagement,
  toggleProjectRecruitmentStatus,
} from '@/components/features/project/projectApi';
import SkeletonBlock from '@/components/shared/SkeletonBlock';
import ToastMessage from '@/components/shared/ToastMessage';
import { useToastStore } from '@/stores/useToastStore';
import type { ProjectRecruitmentStatus } from '@/types/project';

type ProjectManageShellProps = {
  projectId: string;
  activeTab: 'members' | 'applicants' | 'edit';
  pendingApplicantsCount?: number;
  onRecruitmentStatusChange?: (status: ProjectRecruitmentStatus) => void;
  children: ReactNode;
};

type ManageTab = {
  key: ProjectManageShellProps['activeTab'];
  href: string;
  label: string;
  icon: typeof Users;
  count?: number;
};

const TABS: ManageTab[] = [
  {
    key: 'members',
    href: '',
    label: '팀원 관리',
    icon: Users,
  },
  {
    key: 'applicants',
    href: '/applicants',
    label: '지원자 관리',
    icon: UserPlus,
    count: 0,
  },
  {
    key: 'edit',
    href: '/edit',
    label: '프로젝트 수정',
    icon: Settings,
  },
];

const STATUS_COPY: Record<ProjectRecruitmentStatus, { label: string }> = {
  RECRUITING: { label: '모집 중' },
  SUSPENDED: { label: '모집 중단' },
  CLOSED: { label: '모집 완료' },
};

const EDITABLE_STATUS_OPTIONS = [
  { value: 'RECRUITING', label: '모집 중' },
  { value: 'SUSPENDED', label: '모집 중단' },
] as const satisfies ReadonlyArray<{ value: ProjectRecruitmentStatus; label: string }>;

const STATUS_OPTION_ACTIVE_CLASS: Record<
  (typeof EDITABLE_STATUS_OPTIONS)[number]['value'],
  string
> = {
  RECRUITING: 'bg-mt-badge-bg text-mt-primary',
  SUSPENDED: 'bg-mt-danger-soft text-mt-danger',
};

const STATUS_OPTION_DOT_CLASS: Record<(typeof EDITABLE_STATUS_OPTIONS)[number]['value'], string> = {
  RECRUITING: 'bg-mt-primary',
  SUSPENDED: 'bg-mt-danger',
};

type ProjectManageHeader = {
  title: string;
  status: ProjectRecruitmentStatus;
  pendingApplicants: number;
};

const projectManageHeaderCache = new Map<string, ProjectManageHeader>();

export default function ProjectManageShell({
  projectId,
  activeTab,
  pendingApplicantsCount,
  onRecruitmentStatusChange,
  children,
}: ProjectManageShellProps) {
  const router = useRouter();
  const handleAuthRequired = useAuthRequiredModal();
  const showToast = useToastStore((state) => state.showToast);
  const cachedHeader = projectManageHeaderCache.get(projectId);
  const permissionRedirectedRef = useRef(false);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);
  const [isHeaderLoading, setIsHeaderLoading] = useState(!cachedHeader);
  const [projectTitle, setProjectTitle] = useState(cachedHeader?.title ?? '');
  const [projectStatus, setProjectStatus] = useState<ProjectRecruitmentStatus>(
    cachedHeader?.status ?? 'RECRUITING',
  );
  const [pendingApplicants, setPendingApplicants] = useState(cachedHeader?.pendingApplicants ?? 0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const statusCopy = STATUS_COPY[projectStatus];
  const canEditStatus = projectStatus !== 'CLOSED';

  const redirectToProjectDetailIfPermissionDenied = useCallback(
    (error: unknown) => {
      if (!isPermissionDeniedError(error)) {
        return false;
      }

      if (!permissionRedirectedRef.current) {
        permissionRedirectedRef.current = true;
        showToast({ message: error.message });
        router.replace(`/projects/${projectId}`);
      }

      return true;
    },
    [projectId, router, showToast],
  );

  useEffect(() => {
    let active = true;

    const loadManageHeader = async () => {
      const nextCachedHeader = projectManageHeaderCache.get(projectId);

      if (nextCachedHeader) {
        setProjectTitle(nextCachedHeader.title);
        setProjectStatus(nextCachedHeader.status);
        setPendingApplicants(pendingApplicantsCount ?? nextCachedHeader.pendingApplicants);
        setIsHeaderLoading(false);
      } else {
        setIsHeaderLoading(true);
      }

      try {
        setErrorMessage(null);

        const [project, team] = await Promise.all([
          fetchProjectDetail(projectId),
          fetchProjectTeamManagement(projectId),
        ]);

        if (!active) {
          return;
        }

        const nextHeader = {
          title: project.title,
          status: project.recruitmentStatus ?? 'RECRUITING',
          pendingApplicants: team.pendingApplicationCount,
        } satisfies ProjectManageHeader;

        projectManageHeaderCache.set(projectId, nextHeader);
        setProjectTitle(nextHeader.title);
        setProjectStatus(nextHeader.status);
        onRecruitmentStatusChange?.(nextHeader.status);
        setPendingApplicants(pendingApplicantsCount ?? nextHeader.pendingApplicants);
      } catch (error) {
        if (!active) {
          return;
        }

        if (redirectToProjectDetailIfPermissionDenied(error)) {
          return;
        }

        if (handleAuthRequired(error, { redirectPath: `/projects/${projectId}/manage` })) {
          setErrorMessage(null);
          return;
        }

        setErrorMessage(
          error instanceof Error ? error.message : '프로젝트 관리 정보를 불러오지 못했습니다.',
        );
      } finally {
        if (active) {
          setIsHeaderLoading(false);
        }
      }
    };

    void loadManageHeader();

    return () => {
      active = false;
    };
  }, [
    handleAuthRequired,
    onRecruitmentStatusChange,
    pendingApplicantsCount,
    projectId,
    redirectToProjectDetailIfPermissionDenied,
  ]);

  useEffect(() => {
    if (typeof pendingApplicantsCount === 'number') {
      setPendingApplicants(pendingApplicantsCount);
      const cached = projectManageHeaderCache.get(projectId);

      if (cached) {
        projectManageHeaderCache.set(projectId, {
          ...cached,
          pendingApplicants: pendingApplicantsCount,
        });
      }
    }
  }, [pendingApplicantsCount, projectId]);

  const handleStatusChange = async (nextStatus: ProjectRecruitmentStatus) => {
    if (!canEditStatus || isStatusUpdating || nextStatus === projectStatus) {
      return;
    }

    try {
      setIsStatusUpdating(true);
      setErrorMessage(null);

      const statusResponse = await toggleProjectRecruitmentStatus(projectId);

      setProjectStatus(statusResponse.recruitmentStatus);
      onRecruitmentStatusChange?.(statusResponse.recruitmentStatus);
      const cached = projectManageHeaderCache.get(projectId);

      if (cached) {
        projectManageHeaderCache.set(projectId, {
          ...cached,
          status: statusResponse.recruitmentStatus,
        });
      }
    } catch (error) {
      if (handleAuthRequired(error, { redirectPath: `/projects/${projectId}/manage` })) {
        return;
      }

      if (redirectToProjectDetailIfPermissionDenied(error)) {
        return;
      }

      setErrorMessage(
        error instanceof Error ? error.message : '모집 상태 변경 중 오류가 발생했습니다.',
      );
    } finally {
      setIsStatusUpdating(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-8 lg:px-8">
      <div className="space-y-6 md:space-y-8">
        <ToastMessage message={errorMessage} />

        <header className="flex flex-col gap-5 border-b border-mt-border pb-6 md:gap-6">
          <div className="flex min-w-0 flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0 space-y-0.5">
              {isHeaderLoading ? (
                <SkeletonBlock className="h-10 w-72 max-w-full" />
              ) : (
                <Link
                  href={`/projects/${projectId}`}
                  className="inline-flex max-w-full break-words text-2xl leading-8 font-bold text-mt-text-primary transition-colors hover:text-mt-primary md:text-3xl md:leading-10"
                  data-cy="project-manage-title-link"
                >
                  {projectTitle}
                </Link>
              )}
            </div>

            <div className="flex w-full flex-wrap items-center gap-3 self-start md:w-auto md:self-auto">
              <span className="text-sm leading-5 font-bold text-mt-text-nav">상태:</span>
              {isHeaderLoading ? (
                <SkeletonBlock className="h-10 w-48 rounded-xl" />
              ) : projectStatus === 'CLOSED' ? (
                <span className="inline-flex h-10 items-center rounded-xl bg-mt-bg-soft px-4 text-sm leading-5 font-bold text-mt-text-nav">
                  {statusCopy.label}
                </span>
              ) : (
                <fieldset
                  className="inline-flex max-w-full overflow-x-auto rounded-full border border-mt-border bg-mt-white p-1 shadow-sm"
                  disabled={isStatusUpdating}
                  data-cy="project-manage-status-radio-group"
                >
                  <legend className="sr-only">프로젝트 모집 상태</legend>
                  {EDITABLE_STATUS_OPTIONS.map((option) => {
                    const checked = projectStatus === option.value;

                    return (
                      <label
                        key={option.value}
                        className={`inline-flex h-8 cursor-pointer items-center gap-2 rounded-full px-3 text-sm leading-5 font-bold transition-colors ${
                          checked
                            ? STATUS_OPTION_ACTIVE_CLASS[option.value]
                            : 'text-mt-text-secondary hover:text-mt-primary'
                        } ${isStatusUpdating ? 'cursor-not-allowed opacity-70' : ''}`}
                      >
                        <input
                          type="radio"
                          name={`project-${projectId}-recruitment-status`}
                          value={option.value}
                          checked={checked}
                          onChange={() => handleStatusChange(option.value)}
                          className="sr-only"
                          data-cy={`project-manage-status-${option.value.toLowerCase()}`}
                        />
                        <span
                          className={`h-2 w-2 rounded-full ${
                            checked ? STATUS_OPTION_DOT_CLASS[option.value] : 'bg-mt-border'
                          }`}
                          aria-hidden
                        />
                        {option.label}
                      </label>
                    );
                  })}
                </fieldset>
              )}
            </div>
          </div>

          <nav className="-mx-4 -mb-6 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
            <ul className="flex min-w-max items-center">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = tab.key === activeTab;

                return (
                  <li key={tab.label}>
                    <Link
                      href={`/projects/${projectId}/manage${tab.href}`}
                      className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm leading-5 font-bold transition-colors md:px-6 md:py-3.5 ${
                        isActive
                          ? 'border-mt-primary text-mt-primary'
                          : 'border-transparent text-mt-text-secondary hover:text-mt-text-primary'
                      }`}
                    >
                      <Icon className="h-4 w-4" aria-hidden strokeWidth={1.8} />
                      <span>{tab.label}</span>
                      {typeof tab.count === 'number' ? (
                        isHeaderLoading ? (
                          <SkeletonBlock className="h-5 w-6 rounded-full" />
                        ) : (
                          <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-mt-border px-2 py-0.5 text-[10px] leading-5 font-bold text-mt-primary">
                            {pendingApplicants}
                          </span>
                        )
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </header>

        {children}
      </div>
    </section>
  );
}
