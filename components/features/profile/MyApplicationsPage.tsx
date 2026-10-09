'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { CalendarDays, FileText, FolderOpen, XCircle } from 'lucide-react';
import { useAuthRequiredModal } from '@/components/features/auth/useAuthRequiredModal';
import {
  cancelProjectApplication,
  fetchMyProjectApplications,
  type AppliedProject,
} from '@/components/features/project/projectApi';
import ProjectCoverImage from '@/components/features/project/ProjectCoverImage';
import ConfirmModal from '@/components/shared/ConfirmModal';
import SkeletonBlock from '@/components/shared/SkeletonBlock';
import ToastMessage from '@/components/shared/ToastMessage';

type ApplicationStatusCopy = {
  label: string;
  className: string;
};

const STATUS_COPY: Record<AppliedProject['status'], ApplicationStatusCopy> = {
  pending: {
    label: '대기중',
    className: 'border-mt-border bg-mt-bg-soft text-mt-primary',
  },
  approved: {
    label: '승인됨',
    className: 'border-mt-mint bg-mt-mint text-mt-white',
  },
  rejected: {
    label: '거절됨',
    className: 'border-mt-danger bg-mt-danger text-mt-white',
  },
  cancelled: {
    label: '취소됨',
    className: 'border-mt-text-secondary bg-mt-text-secondary text-mt-white',
  },
};

function formatAppliedDate(value: string) {
  if (!value) {
    return '지원일 미확인';
  }

  const [datePart] = value.split('T');
  const formattedDate = datePart?.replaceAll('-', '.');

  return formattedDate ? `${formattedDate} 지원` : '지원일 미확인';
}

function MyApplicationsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <article
          key={`my-application-skeleton-${index}`}
          className="overflow-hidden rounded-2xl border border-mt-border bg-mt-white shadow-sm"
        >
          <SkeletonBlock className="aspect-[1200/630] w-full rounded-none" />
          <div className="space-y-4 p-5">
            <SkeletonBlock className="h-6 w-48" />
            <SkeletonBlock className="h-4 w-32" />
            <SkeletonBlock className="h-10 w-full rounded-xl" />
          </div>
        </article>
      ))}
    </div>
  );
}

export default function MyApplicationsPage() {
  const handleAuthRequired = useAuthRequiredModal();
  const [applications, setApplications] = useState<AppliedProject[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<AppliedProject | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadApplications = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const nextApplications = await fetchMyProjectApplications();

      setApplications(nextApplications);
    } catch (error) {
      if (handleAuthRequired(error, { redirectPath: '/profile/applications' })) {
        setErrorMessage(null);
        return;
      }

      setApplications([]);
      setErrorMessage(error instanceof Error ? error.message : '내 지원서를 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [handleAuthRequired]);

  useEffect(() => {
    void loadApplications();
  }, [loadApplications]);

  const handleCancelApplication = async () => {
    if (!selectedApplication || isCancelling) {
      return;
    }

    try {
      setIsCancelling(true);
      setErrorMessage(null);

      await cancelProjectApplication(selectedApplication.applicationId);
      setApplications((current) =>
        current.map((application) =>
          application.applicationId === selectedApplication.applicationId
            ? { ...application, status: 'cancelled', statusDisplayName: '취소됨' }
            : application,
        ),
      );
      setSelectedApplication(null);
    } catch (error) {
      if (handleAuthRequired(error, { redirectPath: '/profile/applications' })) {
        return;
      }

      setErrorMessage(error instanceof Error ? error.message : '지원 취소 중 오류가 발생했습니다.');
      setSelectedApplication(null);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <section className="bg-mt-white px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="flex flex-col gap-2">
          <p className="text-sm font-bold text-mt-primary">프로필</p>
          <h1 className="text-3xl leading-9 font-extrabold text-mt-text-primary">내 지원서</h1>
        </header>

        <ToastMessage message={errorMessage} />

        {isLoading ? (
          <MyApplicationsSkeleton />
        ) : applications.length === 0 ? (
          <section className="rounded-2xl border border-mt-border bg-mt-white px-6 py-14 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-mt-bg-soft">
              <FileText className="h-7 w-7 text-mt-primary" aria-hidden strokeWidth={1.8} />
            </div>
            <h2 className="mt-5 text-lg font-bold text-mt-text-primary">
              아직 지원한 프로젝트가 없습니다.
            </h2>
            <p className="mt-2 text-sm leading-6 text-mt-text-secondary">
              마음에 드는 프로젝트를 찾아 지원해보세요.
            </p>
            <Link
              href="/projects"
              className="mt-6 inline-flex h-10 items-center justify-center rounded-xl bg-mt-primary px-4 text-sm font-bold text-mt-white"
            >
              프로젝트 찾기
            </Link>
          </section>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {applications.map((application) => {
              const statusCopy = STATUS_COPY[application.status];
              const statusLabel = application.statusDisplayName || statusCopy.label;

              return (
                <article
                  key={application.applicationId}
                  className="overflow-hidden rounded-2xl border border-mt-border bg-mt-white shadow-sm"
                >
                  <ProjectCoverImage
                    src={application.projectImageUrl}
                    alt={`${application.projectName} 이미지`}
                    className="border-b border-mt-border"
                    fallbackImageClassName="origin-top scale-105"
                    roundedClassName="rounded-t-2xl"
                  />

                  <div className="space-y-4 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="truncate text-lg font-bold text-mt-text-primary">
                          {application.projectName}
                        </h2>
                        <p className="mt-1 text-sm text-mt-text-secondary">
                          {application.jobPositionName}
                        </p>
                      </div>
                      <span
                        className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-xs font-bold ${statusCopy.className}`}
                      >
                        {statusLabel}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-mt-text-secondary">
                      <CalendarDays className="h-4 w-4" aria-hidden strokeWidth={1.8} />
                      <span>{formatAppliedDate(application.appliedAt)}</span>
                    </div>

                    <div className="flex flex-wrap gap-2 border-t border-mt-border pt-4">
                      <Link
                        href={`/projects/${application.projectId}/apply/${application.applicationId}`}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-mt-border bg-mt-white px-4 text-sm font-bold text-mt-text-primary transition-colors hover:bg-mt-bg-soft"
                      >
                        <FileText className="h-4 w-4" aria-hidden strokeWidth={1.8} />
                        지원서 보기
                      </Link>
                      <Link
                        href={`/projects/${application.projectId}`}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-mt-border bg-mt-white px-4 text-sm font-bold text-mt-text-primary transition-colors hover:bg-mt-bg-soft"
                      >
                        <FolderOpen className="h-4 w-4" aria-hidden strokeWidth={1.8} />
                        프로젝트 보기
                      </Link>
                      {application.status === 'pending' ? (
                        <button
                          type="button"
                          onClick={() => setSelectedApplication(application)}
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-mt-danger bg-mt-white px-4 text-sm font-bold text-mt-danger transition-colors hover:bg-mt-danger-soft"
                        >
                          <XCircle className="h-4 w-4" aria-hidden strokeWidth={1.8} />
                          지원 취소
                        </button>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={selectedApplication !== null}
        title="지원을 취소할까요?"
        description={`${selectedApplication?.projectName ?? '프로젝트'} 지원을 취소합니다.`}
        confirmLabel={isCancelling ? '취소 중' : '지원 취소하기'}
        isSubmitting={isCancelling}
        onClose={() => setSelectedApplication(null)}
        onConfirm={handleCancelApplication}
      />
    </section>
  );
}
