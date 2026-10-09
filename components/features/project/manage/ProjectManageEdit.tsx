'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useAuthRequiredModal } from '@/components/features/auth/useAuthRequiredModal';
import ProjectForm from '@/components/features/project/create/ProjectForm';
import {
  buildProjectEditPayload,
  fetchProjectEditPrefill,
  type ProjectEditPrefill,
  updateProject,
} from '@/components/features/project/projectApi';
import ToastMessage from '@/components/shared/ToastMessage';
import { useToastStore } from '@/stores/useToastStore';
import type { JobFieldOption } from '@/types/auth';
import type { ProjectFormValues, ProjectRecruitmentStatus } from '@/types/project';
import ProjectManageShell from './ProjectManageShell';
import { ProjectManageEditSkeleton } from './ProjectManageSkeletons';
import ProjectPendingRecruitmentDeleteModal from './ProjectPendingRecruitmentDeleteModal';
import {
  getPendingRecruitmentDeleteTargets,
  isPendingRecruitmentDeleteError,
  type PendingRecruitmentDeleteTarget,
} from './projectEditGuards';

type ProjectManageEditProps = {
  projectId: string;
};

type PendingDeleteSubmit = {
  values: ProjectFormValues;
  jobFields: JobFieldOption[];
  targets: PendingRecruitmentDeleteTarget[];
};

const SUSPENDED_EDIT_MESSAGE =
  '모집이 중단된 상태에서는 수정할 수 없습니다. 모집을 재개한 후 수정해주세요.';

export default function ProjectManageEdit({ projectId }: ProjectManageEditProps) {
  const router = useRouter();
  const handleAuthRequired = useAuthRequiredModal();
  const showToast = useToastStore((state) => state.showToast);
  const [prefill, setPrefill] = useState<ProjectEditPrefill | null>(null);
  const [pendingDeleteSubmit, setPendingDeleteSubmit] = useState<PendingDeleteSubmit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const handleRecruitmentStatusChange = useCallback((status: ProjectRecruitmentStatus) => {
    setPrefill((current) => syncPrefillEditableState(current, status));
  }, []);

  const submitEditProject = useCallback(
    async (
      values: ProjectFormValues,
      jobFields: JobFieldOption[],
      options: { confirmDeletePositionsWithPendingApplicants?: boolean } = {},
    ) => {
      const payload = buildProjectEditPayload(values, jobFields, options);
      const result = await updateProject(projectId, payload, values.coverImage);

      if (result.autoRejectedApplicantCount > 0) {
        showToast({
          tone: 'success',
          message: `대기 지원자 ${result.autoRejectedApplicantCount}명을 자동 거절하고 저장했어요.`,
        });
      }

      router.push(`/projects/${projectId}/manage`);
    },
    [projectId, router, showToast],
  );

  const handleConfirmPendingDelete = useCallback(async () => {
    if (!pendingDeleteSubmit) {
      return;
    }

    try {
      setIsConfirmingDelete(true);
      await submitEditProject(pendingDeleteSubmit.values, pendingDeleteSubmit.jobFields, {
        confirmDeletePositionsWithPendingApplicants: true,
      });
    } catch (error) {
      if (handleAuthRequired(error, { redirectPath: `/projects/${projectId}/manage/edit` })) {
        return;
      }

      showToast({
        message: error instanceof Error ? error.message : '프로젝트 수정 중 오류가 발생했습니다.',
      });
    } finally {
      setIsConfirmingDelete(false);
    }
  }, [handleAuthRequired, pendingDeleteSubmit, projectId, showToast, submitEditProject]);

  useEffect(() => {
    let active = true;

    const loadPrefill = async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const nextPrefill = await fetchProjectEditPrefill(projectId);

        if (!active) {
          return;
        }

        setPrefill(nextPrefill);
      } catch (error) {
        if (!active) {
          return;
        }

        if (handleAuthRequired(error, { redirectPath: `/projects/${projectId}/manage/edit` })) {
          setErrorMessage(null);
          return;
        }

        setErrorMessage(
          error instanceof Error ? error.message : '프로젝트 수정 정보를 불러오지 못했습니다.',
        );
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadPrefill();

    return () => {
      active = false;
    };
  }, [handleAuthRequired, projectId]);

  if (isLoading) {
    return (
      <ProjectManageShell
        projectId={projectId}
        activeTab="edit"
        onRecruitmentStatusChange={handleRecruitmentStatusChange}
      >
        <ProjectManageEditSkeleton />
      </ProjectManageShell>
    );
  }

  if (!prefill) {
    return (
      <ProjectManageShell
        projectId={projectId}
        activeTab="edit"
        onRecruitmentStatusChange={handleRecruitmentStatusChange}
      >
        <ToastMessage message={errorMessage} />

        <section className="rounded-3xl border border-mt-border bg-mt-white px-8 py-12 text-center shadow-sm">
          <h2 className="text-xl font-bold text-mt-text-primary">프로젝트를 찾을 수 없습니다.</h2>
          <p className="mt-2 text-sm text-mt-text-secondary">
            {errorMessage ?? '올바른 프로젝트인지 다시 확인해주세요.'}
          </p>
        </section>
      </ProjectManageShell>
    );
  }

  return (
    <ProjectManageShell
      projectId={projectId}
      activeTab="edit"
      onRecruitmentStatusChange={handleRecruitmentStatusChange}
    >
      <ProjectForm
        variant="edit"
        initialValues={prefill.values}
        initialCoverImageUrl={prefill.coverImageUrl}
        editable={prefill.editable}
        notEditableReason={prefill.notEditableReason}
        onSubmit={async (values, { jobFields }) => {
          try {
            await submitEditProject(values, jobFields);
          } catch (error) {
            if (isPendingRecruitmentDeleteError(error)) {
              setPendingDeleteSubmit({
                values,
                jobFields,
                targets: getPendingRecruitmentDeleteTargets(
                  prefill.values.recruitInterests,
                  values.recruitInterests,
                ),
              });
              return;
            }

            throw error;
          }
        }}
      />

      <ProjectPendingRecruitmentDeleteModal
        isOpen={pendingDeleteSubmit !== null}
        isSubmitting={isConfirmingDelete}
        targets={pendingDeleteSubmit?.targets ?? []}
        onClose={() => {
          if (!isConfirmingDelete) {
            setPendingDeleteSubmit(null);
          }
        }}
        onConfirm={() => void handleConfirmPendingDelete()}
      />
    </ProjectManageShell>
  );
}

function syncPrefillEditableState(
  current: ProjectEditPrefill | null,
  status: ProjectRecruitmentStatus,
) {
  if (!current || status === 'CLOSED') {
    return current;
  }

  return {
    ...current,
    editable: status === 'RECRUITING',
    notEditableReason:
      status === 'RECRUITING' ? null : (current.notEditableReason ?? SUSPENDED_EDIT_MESSAGE),
  };
}
