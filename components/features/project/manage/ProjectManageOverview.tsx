'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { ChevronRight, Crown, Trash2 } from 'lucide-react';
import { useAuthRequiredModal } from '@/components/features/auth/useAuthRequiredModal';
import {
  deleteProject,
  expelProjectMember,
  fetchProjectDetail,
  fetchProjectTeamManagement,
  type ProjectTeamManagement,
} from '@/components/features/project/projectApi';
import ConfirmModal from '@/components/shared/ConfirmModal';
import ProfileAvatar from '@/components/shared/ProfileAvatar';
import StatusBadge from '@/components/shared/StatusBadge';
import ToastMessage from '@/components/shared/ToastMessage';
import { useToastStore } from '@/stores/useToastStore';
import ProjectManageShell from './ProjectManageShell';
import { ProjectManageOverviewSkeleton } from './ProjectManageSkeletons';
import ProjectMemberRemovalModal from './ProjectMemberRemovalModal';
import type { ProjectMember } from '@/types/project';

type ProjectManageOverviewProps = {
  projectId: string;
};

export default function ProjectManageOverview({ projectId }: ProjectManageOverviewProps) {
  const router = useRouter();
  const handleAuthRequired = useAuthRequiredModal();
  const showToast = useToastStore((state) => state.showToast);
  const [teamManagement, setTeamManagement] = useState<ProjectTeamManagement | null>(null);
  const [projectTitle, setProjectTitle] = useState('');
  const [selectedMember, setSelectedMember] = useState<ProjectMember | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadTeamManagement = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const [project, nextTeamManagement] = await Promise.all([
        fetchProjectDetail(projectId),
        fetchProjectTeamManagement(projectId),
      ]);

      setProjectTitle(project.title);
      setTeamManagement(nextTeamManagement);
    } catch (error) {
      if (handleAuthRequired(error, { redirectPath: `/projects/${projectId}/manage` })) {
        setErrorMessage(null);
        return;
      }

      setErrorMessage(
        error instanceof Error ? error.message : '팀원 관리 정보를 불러오지 못했습니다.',
      );
      setTeamManagement(null);
    } finally {
      setIsLoading(false);
    }
  }, [handleAuthRequired, projectId]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const [project, nextTeamManagement] = await Promise.all([
          fetchProjectDetail(projectId),
          fetchProjectTeamManagement(projectId),
        ]);

        if (!active) {
          return;
        }

        setProjectTitle(project.title);
        setTeamManagement(nextTeamManagement);
      } catch (error) {
        if (!active) {
          return;
        }

        if (handleAuthRequired(error, { redirectPath: `/projects/${projectId}/manage` })) {
          setErrorMessage(null);
          return;
        }

        setErrorMessage(
          error instanceof Error ? error.message : '팀원 관리 정보를 불러오지 못했습니다.',
        );
        setTeamManagement(null);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [handleAuthRequired, projectId]);

  const handleConfirmRemoval = async () => {
    if (!selectedMember || isRemoving) {
      return;
    }

    try {
      setIsRemoving(true);
      setErrorMessage(null);

      await expelProjectMember(projectId, selectedMember.id);
      await loadTeamManagement();
      setSelectedMember(null);
    } catch (error) {
      if (handleAuthRequired(error, { redirectPath: `/projects/${projectId}/manage` })) {
        return;
      }

      setErrorMessage(error instanceof Error ? error.message : '팀원 방출 중 오류가 발생했습니다.');
    } finally {
      setIsRemoving(false);
    }
  };

  const isDeleteConfirmationMatched =
    projectTitle.length > 0 && deleteConfirmation === projectTitle;

  const handleConfirmDeleteProject = async () => {
    if (isDeleting || !isDeleteConfirmationMatched) {
      return;
    }

    try {
      setIsDeleting(true);
      setErrorMessage(null);

      await deleteProject(projectId);
      showToast({ tone: 'success', message: '프로젝트를 삭제했습니다.' });
      router.replace('/projects');
    } catch (error) {
      if (handleAuthRequired(error, { redirectPath: `/projects/${projectId}/manage` })) {
        return;
      }

      setErrorMessage(
        error instanceof Error ? error.message : '프로젝트 삭제 중 오류가 발생했습니다.',
      );
      setIsDeleteModalOpen(false);
      setDeleteConfirmation('');
    } finally {
      setIsDeleting(false);
    }
  };

  const closeDeleteModal = () => {
    if (isDeleting) {
      return;
    }

    setIsDeleteModalOpen(false);
    setDeleteConfirmation('');
  };

  if (isLoading && !teamManagement) {
    return (
      <ProjectManageShell projectId={projectId} activeTab="members">
        <ProjectManageOverviewSkeleton />
      </ProjectManageShell>
    );
  }

  if (!teamManagement) {
    return (
      <ProjectManageShell projectId={projectId} activeTab="members">
        <section className="rounded-3xl border border-mt-border bg-mt-white px-8 py-12 text-center shadow-sm">
          <h2 className="text-xl font-bold text-mt-text-primary">
            팀원 정보를 불러오지 못했습니다.
          </h2>
          <p className="mt-2 text-sm text-mt-text-secondary">
            {errorMessage ?? '올바른 프로젝트인지 다시 확인해주세요.'}
          </p>
        </section>
      </ProjectManageShell>
    );
  }

  const summaryCards = [
    { label: '현재 멤버', value: `${teamManagement.currentMemberCount}명` },
    { label: '모집 정원', value: `${teamManagement.totalRecruitmentCount}명` },
    {
      label: '대기 중인 지원서',
      value: `${teamManagement.pendingApplicationCount}건`,
      accent: true,
      href: '/applicants',
    },
  ];

  return (
    <ProjectManageShell projectId={projectId} activeTab="members">
      <div className="space-y-6 md:space-y-8">
        <ToastMessage message={errorMessage} />

        <div className="grid gap-4 md:grid-cols-3">
          {summaryCards.map((card) => {
            const content = (
              <article className="rounded-2xl border border-mt-border/40 bg-mt-white p-5 shadow-sm">
                <p className="text-sm leading-5 font-medium text-mt-text-secondary">{card.label}</p>
                <div className="mt-1 flex items-center gap-1">
                  <p
                    className={`text-2xl leading-8 font-bold ${
                      card.accent ? 'text-mt-primary' : 'text-mt-text-primary'
                    }`}
                  >
                    {card.value}
                  </p>
                  {card.href ? (
                    <ChevronRight
                      className="mt-0.5 h-5 w-5 shrink-0 text-mt-primary"
                      aria-hidden
                      strokeWidth={2}
                    />
                  ) : null}
                </div>
              </article>
            );

            if (!card.href) {
              return <div key={card.label}>{content}</div>;
            }

            return (
              <Link key={card.label} href={`/projects/${projectId}/manage${card.href}`}>
                {content}
              </Link>
            );
          })}
        </div>

        <div className="overflow-hidden rounded-2xl border border-mt-border/40 bg-mt-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-mt-border/40 bg-mt-bg-soft/50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base leading-6 font-bold text-mt-text-primary">팀원 목록</h2>
            <p className="text-xs leading-4 text-mt-text-secondary">리더는 방출할 수 없습니다.</p>
          </div>

          <ul>
            {teamManagement.members.map((member, index) => (
              <li
                key={member.id}
                className={`${index === 0 ? '' : 'border-t border-mt-border/40'} px-6 py-6`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <ProfileAvatar
                      name={member.name}
                      imageUrl={member.avatarUrl}
                      sizeClassName="h-12 w-12"
                      textClassName="text-sm"
                      className="bg-mt-border text-mt-text-secondary"
                    />

                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base leading-6 font-bold text-mt-text-primary">
                          {member.name}
                        </p>
                        {member.isLeader ? (
                          <StatusBadge
                            status="leader"
                            icon={<Crown className="h-3 w-3" aria-hidden strokeWidth={1.8} />}
                          />
                        ) : null}
                      </div>
                      <p className="text-sm leading-5 text-mt-text-secondary">
                        {member.role || '포지션 미지정'}
                      </p>
                    </div>
                  </div>

                  {!member.isLeader ? (
                    <button
                      type="button"
                      onClick={() => setSelectedMember(member)}
                      className="inline-flex h-8 items-center justify-center gap-1.5 self-start rounded-lg border border-mt-border bg-mt-white px-3 text-xs leading-4 font-bold text-mt-text-secondary shadow-sm transition-colors hover:bg-mt-bg-soft sm:self-auto"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden strokeWidth={1.8} />
                      방출
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>

          {teamManagement.members.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm leading-6 text-mt-text-secondary">
              아직 참여 중인 팀원이 없습니다.
            </div>
          ) : null}
        </div>

        <section className="rounded-2xl border border-mt-danger/30 bg-mt-danger-soft p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base leading-6 font-bold text-mt-danger">프로젝트 삭제</h2>
              <p className="mt-1 text-sm leading-6 text-mt-text-secondary">
                프로젝트와 관련된 모집, 지원서, 팀 관리 정보가 삭제됩니다.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-mt-danger px-4 text-sm font-bold text-mt-white shadow-sm transition-colors hover:opacity-90"
              data-cy="project-delete-button"
            >
              <Trash2 className="h-4 w-4" aria-hidden strokeWidth={1.8} />
              프로젝트 삭제
            </button>
          </div>
        </section>
      </div>

      <ProjectMemberRemovalModal
        isOpen={selectedMember !== null}
        isSubmitting={isRemoving}
        memberName={selectedMember?.name ?? ''}
        onClose={() => setSelectedMember(null)}
        onConfirm={handleConfirmRemoval}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="프로젝트를 삭제할까요?"
        description="삭제 후에는 프로젝트 관리 페이지로 돌아올 수 없습니다. 아래 입력칸에 프로젝트 이름을 정확히 입력하면 삭제 버튼이 활성화됩니다."
        closeLabel="취소"
        confirmLabel={isDeleting ? '삭제 중' : '삭제하기'}
        isSubmitting={isDeleting}
        isConfirmDisabled={!isDeleteConfirmationMatched}
        confirmButtonDataCy="project-delete-confirm-button"
        onClose={closeDeleteModal}
        onConfirm={handleConfirmDeleteProject}
      >
        <label className="block">
          <span className="text-sm font-bold text-mt-text-primary">프로젝트 이름 확인</span>
          <input
            type="text"
            value={deleteConfirmation}
            onChange={(event) => setDeleteConfirmation(event.target.value)}
            disabled={isDeleting}
            className="mt-2 h-11 w-full rounded-xl border border-mt-border bg-mt-white px-4 text-sm text-mt-text-primary outline-none transition-colors placeholder:text-mt-text-secondary focus:border-mt-primary disabled:cursor-not-allowed disabled:opacity-60"
            placeholder="프로젝트 이름 입력"
            data-cy="project-delete-confirm-input"
          />
          <p
            className={`mt-2 min-h-4 text-xs leading-4 font-medium text-mt-danger ${
              deleteConfirmation.length > 0 && !isDeleteConfirmationMatched ? '' : 'invisible'
            }`}
          >
            프로젝트 이름과 정확히 일치해야 합니다.
          </p>
        </label>
      </ConfirmModal>
    </ProjectManageShell>
  );
}
