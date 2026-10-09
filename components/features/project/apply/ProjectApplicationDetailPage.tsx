'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BriefcaseBusiness, CalendarDays, Mail, XCircle } from 'lucide-react';
import { useAuthRequiredModal } from '@/components/features/auth/useAuthRequiredModal';
import {
  cancelProjectApplication,
  fetchProjectApplicationDetail,
  fetchMyProjectApplications,
} from '@/components/features/project/projectApi';
import { isPermissionDeniedError } from '@/components/features/auth/authError';
import { useToastStore } from '@/stores/useToastStore';
import BaseButton from '@/components/shared/BaseButton';
import ConfirmModal from '@/components/shared/ConfirmModal';
import { formatJobRole } from '@/components/shared/jobRoleFormat';
import MarkdownContent from '@/components/shared/MarkdownContent';
import ProfileAvatar from '@/components/shared/ProfileAvatar';
import SkillChip from '@/components/shared/SkillChip';
import SkeletonBlock from '@/components/shared/SkeletonBlock';
import ToastMessage from '@/components/shared/ToastMessage';
import type { ProjectApplicant } from '@/types/project';

type ProjectApplicationDetailPageProps = {
  projectId: string;
  applicationId: string;
};

function ApplicationDetailSkeleton() {
  return (
    <section className="overflow-hidden rounded-2xl border border-mt-border bg-mt-white shadow-sm">
      <div className="border-b border-mt-border bg-mt-bg-soft px-6 py-5">
        <SkeletonBlock className="h-6 w-40" />
        <SkeletonBlock className="mt-3 h-8 w-64" />
      </div>
      <div className="space-y-5 px-6 py-6">
        <SkeletonBlock className="h-16 w-full rounded-2xl" />
        <SkeletonBlock className="h-40 w-full rounded-2xl" />
      </div>
    </section>
  );
}

function getStatusLabel(status: ProjectApplicant['status']) {
  switch (status) {
    case 'approved':
      return '승인됨';
    case 'rejected':
      return '거절됨';
    case 'cancelled':
      return '취소됨';
    case 'pending':
    default:
      return '대기중';
  }
}

export default function ProjectApplicationDetailPage({
  projectId,
  applicationId,
}: ProjectApplicationDetailPageProps) {
  const router = useRouter();
  const handleAuthRequired = useAuthRequiredModal();
  const showToast = useToastStore((state) => state.showToast);
  const [isDetailLimited, setIsDetailLimited] = useState(false);
  const [application, setApplication] = useState<ProjectApplicant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadApplication = async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const summaries = await fetchMyProjectApplications();
        const summary = summaries.find(
          (item) =>
            String(item.applicationId) === applicationId && String(item.projectId) === projectId,
        );
        if (!summary) throw new Error('본인의 지원서를 찾을 수 없습니다.');
        let nextApplication: ProjectApplicant;
        try {
          nextApplication = await fetchProjectApplicationDetail(projectId, applicationId);
          nextApplication.appliedAt = `${summary.appliedAt.slice(0, 10).replaceAll('-', '.')} 지원`;
        } catch (error) {
          if (!isPermissionDeniedError(error)) throw error;
          if (active) setIsDetailLimited(true);
          nextApplication = {
            id: summary.applicationId,
            name: '내 지원서',
            position: '',
            specialty: summary.jobPositionName,
            appliedAt: summary.appliedAt.slice(0, 10),
            email: '',
            introduction: '',
            avatarUrl: '',
            status: summary.status,
          };
        }

        if (active) {
          setApplication(nextApplication);
        }
      } catch (error) {
        if (!active) {
          return;
        }

        if (
          handleAuthRequired(error, {
            redirectPath: `/projects/${projectId}/apply/${applicationId}`,
          })
        ) {
          setErrorMessage(null);
          return;
        }

        setErrorMessage(
          error instanceof Error ? error.message : '지원서 상세 정보를 불러오지 못했습니다.',
        );
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadApplication();

    return () => {
      active = false;
    };
  }, [applicationId, handleAuthRequired, projectId]);

  const handleCancelApplication = async () => {
    if (isCancelling) {
      return;
    }

    try {
      setIsCancelling(true);
      setErrorMessage(null);

      await cancelProjectApplication(applicationId);
      showToast({ tone: 'success', message: '지원을 취소했습니다.' });
      router.push('/profile/applications');
    } catch (error) {
      if (
        handleAuthRequired(error, {
          redirectPath: `/projects/${projectId}/apply/${applicationId}`,
        })
      ) {
        return;
      }

      setErrorMessage(error instanceof Error ? error.message : '지원 취소 중 오류가 발생했습니다.');
      setIsCancelModalOpen(false);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <section className="w-full space-y-6">
      <ToastMessage message={errorMessage} />

      {isLoading ? (
        <ApplicationDetailSkeleton />
      ) : application ? (
        <article className="overflow-hidden rounded-2xl border border-mt-border bg-mt-white shadow-sm">
          <header className="border-b border-mt-border bg-mt-bg-soft px-6 py-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <ProfileAvatar
                  name={application.name}
                  imageUrl={application.avatarUrl}
                  sizeClassName="h-14 w-14"
                  shape="rounded"
                  textClassName="text-base"
                  className="bg-mt-border text-mt-text-secondary"
                />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-mt-primary">내 지원서</p>
                  <h1 className="mt-1 truncate text-2xl font-extrabold text-mt-text-primary">
                    {formatJobRole(application.position, application.specialty)}
                  </h1>
                </div>
              </div>

              <span className="inline-flex h-8 items-center rounded-md border border-mt-border bg-mt-white px-3 text-sm font-bold text-mt-text-secondary">
                {getStatusLabel(application.status)}
              </span>
            </div>
          </header>

          <div className="space-y-6 px-6 py-6">
            {isDetailLimited && (
              <p
                role="status"
                className="rounded-xl bg-mt-bg-soft p-4 text-sm text-mt-text-secondary"
              >
                현재 지원 동기 상세 조회가 제한되어 있습니다. 지원 상태 확인과 대기 중인 지원 취소는
                이용할 수 있습니다.
              </p>
            )}
            <div className="grid gap-3 text-sm text-mt-text-secondary md:grid-cols-3">
              <span className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-mt-bg-soft px-3 font-medium">
                <BriefcaseBusiness className="h-4 w-4" aria-hidden strokeWidth={1.8} />
                {application.name}
              </span>
              <span className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-mt-bg-soft px-3 font-medium">
                <Mail className="h-4 w-4" aria-hidden strokeWidth={1.8} />
                {application.email}
              </span>
              <span className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-mt-bg-soft px-3 font-medium">
                <CalendarDays className="h-4 w-4" aria-hidden strokeWidth={1.8} />
                {application.appliedAt}
              </span>
            </div>

            <div className="rounded-2xl border border-mt-border bg-mt-white p-5">
              <p className="text-sm font-bold text-mt-text-primary">내 기술스택</p>
              {application.techStacks?.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {application.techStacks.map((techStack) => (
                    <SkillChip
                      key={techStack.id}
                      label={techStack.name}
                      variant="outline"
                      size="md"
                    />
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm leading-5 text-mt-text-secondary">
                  프로필에 등록된 기술스택이 없습니다.
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-mt-border bg-mt-white p-5">
              <p className="text-sm font-bold text-mt-text-primary">지원 동기</p>
              <div className="mt-3">
                <MarkdownContent
                  value={application.introduction}
                  emptyText="지원 동기가 비어 있습니다."
                  className="text-sm leading-6"
                />
              </div>
            </div>

            {application.status === 'pending' ? (
              <div className="flex justify-end border-t border-mt-border pt-5">
                <BaseButton
                  size="M"
                  variant="gray"
                  onClick={() => setIsCancelModalOpen(true)}
                  data-cy="application-cancel-button"
                >
                  <XCircle className="mr-2 h-4 w-4" aria-hidden strokeWidth={1.8} />
                  지원 취소
                </BaseButton>
              </div>
            ) : null}
          </div>
        </article>
      ) : (
        <section className="rounded-2xl border border-mt-border bg-mt-white px-6 py-12 text-center shadow-sm">
          <p className="text-base font-bold text-mt-text-primary">지원서를 찾을 수 없습니다.</p>
        </section>
      )}

      <ConfirmModal
        isOpen={isCancelModalOpen}
        title="지원을 취소할까요?"
        description="취소한 지원서는 대기 목록에서 제외됩니다."
        confirmLabel={isCancelling ? '취소 중' : '지원 취소하기'}
        isSubmitting={isCancelling}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleCancelApplication}
      />
    </section>
  );
}
