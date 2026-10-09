'use client';

import { useCallback, useEffect, useState } from 'react';
import { CalendarDays, CheckCircle2, ExternalLink, Mail, XCircle } from 'lucide-react';
import { useAuthRequiredModal } from '@/components/features/auth/useAuthRequiredModal';
import {
  decideProjectApplication,
  fetchProjectApplicationDetail,
  fetchProjectApplications,
  type ProjectApplicationDecision,
} from '@/components/features/project/projectApi';
import MarkdownContent from '@/components/shared/MarkdownContent';
import ProfileAvatar from '@/components/shared/ProfileAvatar';
import SkeletonBlock from '@/components/shared/SkeletonBlock';
import ToastMessage from '@/components/shared/ToastMessage';
import type { ProjectApplicant } from '@/types/project';
import ProjectApplicantDetailModal from './ProjectApplicantDetailModal';
import ProjectManageShell from './ProjectManageShell';

type ProjectManageApplicantsProps = {
  projectId: string;
};

function ProjectManageApplicantsSkeleton() {
  return (
    <section className="overflow-hidden rounded-2xl border border-mt-border/40 bg-mt-white shadow-sm">
      <header className="border-b border-mt-border/40 bg-mt-bg-soft/50 px-6 py-4">
        <SkeletonBlock className="h-6 w-28" />
      </header>
      <div className="space-y-6 px-6 py-6">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={`project-applicant-skeleton-${index}`}
            className={index === 0 ? '' : 'border-t border-mt-border/40 pt-6'}
          >
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
              <div className="flex min-w-0 gap-4 lg:w-52">
                <SkeletonBlock className="h-14 w-14 rounded-2xl" />
                <div className="space-y-2">
                  <SkeletonBlock className="h-6 w-24" />
                  <SkeletonBlock className="h-4 w-20" />
                </div>
              </div>
              <div className="min-w-0 flex-1 space-y-3">
                <SkeletonBlock className="h-4 w-64" />
                <SkeletonBlock className="h-20 w-full rounded-xl" />
                <SkeletonBlock className="h-10 w-56 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function ProjectManageApplicants({ projectId }: ProjectManageApplicantsProps) {
  const handleAuthRequired = useAuthRequiredModal();
  const [applicants, setApplicants] = useState<ProjectApplicant[]>([]);
  const [selectedApplicant, setSelectedApplicant] = useState<ProjectApplicant | null>(null);
  const [detailApplicant, setDetailApplicant] = useState<ProjectApplicant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [decisionLoadingId, setDecisionLoadingId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [detailErrorMessage, setDetailErrorMessage] = useState<string | null>(null);

  const loadApplicants = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const nextApplicants = await fetchProjectApplications(projectId);

      setApplicants(nextApplicants.filter((applicant) => applicant.status === 'pending'));
    } catch (error) {
      if (handleAuthRequired(error, { redirectPath: `/projects/${projectId}/manage/applicants` })) {
        setErrorMessage(null);
        return;
      }

      setApplicants([]);
      setErrorMessage(
        error instanceof Error ? error.message : '지원자 목록을 불러오지 못했습니다.',
      );
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

        const nextApplicants = await fetchProjectApplications(projectId);

        if (!active) {
          return;
        }

        setApplicants(nextApplicants.filter((applicant) => applicant.status === 'pending'));
      } catch (error) {
        if (!active) {
          return;
        }

        if (
          handleAuthRequired(error, { redirectPath: `/projects/${projectId}/manage/applicants` })
        ) {
          setErrorMessage(null);
          return;
        }

        setApplicants([]);
        setErrorMessage(
          error instanceof Error ? error.message : '지원자 목록을 불러오지 못했습니다.',
        );
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

  const handleOpenDetail = async (applicant: ProjectApplicant) => {
    setSelectedApplicant(applicant);
    setDetailApplicant(applicant);
    setDetailErrorMessage(null);

    try {
      setIsDetailLoading(true);

      const nextDetail = await fetchProjectApplicationDetail(projectId, applicant.id);

      setDetailApplicant({ ...applicant, ...nextDetail, appliedAt: applicant.appliedAt });
    } catch (error) {
      if (handleAuthRequired(error, { redirectPath: `/projects/${projectId}/manage/applicants` })) {
        setSelectedApplicant(null);
        setDetailApplicant(null);
        return;
      }

      setDetailErrorMessage(
        error instanceof Error ? error.message : '지원서 상세 정보를 불러오지 못했습니다.',
      );
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleDecision = async (
    applicant: ProjectApplicant,
    decision: ProjectApplicationDecision,
  ) => {
    if (decisionLoadingId !== null) {
      return;
    }

    try {
      setDecisionLoadingId(applicant.id);
      setErrorMessage(null);

      await decideProjectApplication(projectId, applicant.id, decision);
      setApplicants((current) => current.filter((item) => item.id !== applicant.id));

      if (selectedApplicant?.id === applicant.id) {
        setSelectedApplicant(null);
        setDetailApplicant(null);
      }

      void loadApplicants();
    } catch (error) {
      if (handleAuthRequired(error, { redirectPath: `/projects/${projectId}/manage/applicants` })) {
        return;
      }

      setErrorMessage(
        error instanceof Error ? error.message : '지원자 처리 중 오류가 발생했습니다.',
      );
    } finally {
      setDecisionLoadingId(null);
    }
  };

  const pendingApplicants = applicants.filter((item) => item.status === 'pending');
  const pendingApplicantsCount =
    isLoading && pendingApplicants.length === 0 ? undefined : pendingApplicants.length;

  return (
    <ProjectManageShell
      projectId={projectId}
      activeTab="applicants"
      pendingApplicantsCount={pendingApplicantsCount}
    >
      <div className="space-y-6">
        <ToastMessage message={errorMessage} />

        {isLoading && pendingApplicants.length === 0 ? (
          <ProjectManageApplicantsSkeleton />
        ) : (
          <section className="overflow-hidden rounded-2xl border border-mt-border/40 bg-mt-white shadow-sm">
            <header className="border-b border-mt-border/40 bg-mt-bg-soft/50 px-6 py-4">
              <h2 className="text-base leading-6 font-bold text-mt-text-primary">
                지원자 목록 <span className="ml-1 text-mt-primary">{pendingApplicants.length}</span>
              </h2>
            </header>

            {pendingApplicants.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="text-base font-bold text-mt-text-primary">
                  대기 중인 지원자가 없습니다.
                </p>
                <p className="mt-2 text-sm text-mt-text-secondary">
                  새로운 지원이 들어오면 이곳에서 검토할 수 있습니다.
                </p>
              </div>
            ) : (
              <ul>
                {pendingApplicants.map((applicant, index) => {
                  const isRecruitmentFull = applicant.isRecruitmentFull === true;
                  const isDecisionLoading = decisionLoadingId === applicant.id;

                  return (
                    <li
                      key={applicant.id}
                      className={`${index === 0 ? '' : 'border-t border-mt-border/40'} px-6 py-6`}
                    >
                      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                        <div className="flex min-w-0 gap-4 lg:w-52">
                          <ProfileAvatar
                            name={applicant.name}
                            imageUrl={applicant.avatarUrl}
                            sizeClassName="h-14 w-14"
                            shape="rounded"
                            textClassName="text-base"
                            className="bg-mt-border text-mt-text-secondary"
                          />

                          <div className="min-w-0 space-y-0.5">
                            <p className="truncate text-xl leading-7 font-bold text-mt-text-primary">
                              {applicant.name}
                            </p>
                            <p className="text-sm leading-5 font-bold text-mt-primary">
                              {applicant.position}
                            </p>
                            <p className="text-xs leading-4 text-mt-text-secondary">
                              {applicant.specialty}
                            </p>
                            {typeof applicant.currentCount === 'number' &&
                            typeof applicant.recruitmentCount === 'number' ? (
                              <p className="text-xs leading-4 text-mt-text-secondary">
                                현재 {applicant.currentCount}/{applicant.recruitmentCount}명
                              </p>
                            ) : null}
                          </div>
                        </div>

                        <div className="min-w-0 flex-1 space-y-3">
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs leading-4 text-mt-text-secondary">
                            <span className="inline-flex items-center gap-1">
                              <CalendarDays className="h-3.5 w-3.5" aria-hidden strokeWidth={1.8} />
                              {applicant.appliedAt}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Mail className="h-3.5 w-3.5" aria-hidden strokeWidth={1.8} />
                              {applicant.email}
                            </span>
                            {isRecruitmentFull ? (
                              <span className="rounded-full bg-mt-bg-soft px-2 py-1 font-bold text-mt-hero-blue">
                                정원 마감
                              </span>
                            ) : null}
                          </div>

                          <div className="max-h-36 min-w-0 overflow-hidden rounded-xl bg-mt-bg-soft px-3 py-3 text-sm leading-6 text-mt-text-nav">
                            <MarkdownContent
                              value={applicant.introduction}
                              emptyText="아직 자기소개가 비어 있어요."
                              className="space-y-2 text-sm leading-6"
                            />
                          </div>

                          <div className="flex flex-wrap items-center gap-3 pt-1">
                            <button
                              type="button"
                              onClick={() => void handleOpenDetail(applicant)}
                              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-mt-border bg-mt-white px-4 text-sm leading-5 font-bold text-mt-text-nav transition-colors hover:bg-mt-bg-soft"
                            >
                              <ExternalLink className="h-4 w-4" aria-hidden strokeWidth={1.8} />
                              상세 보기
                            </button>

                            <div className="h-6 w-px bg-mt-border" aria-hidden />

                            <button
                              type="button"
                              onClick={() => void handleDecision(applicant, 'ACCEPTED')}
                              disabled={decisionLoadingId !== null || isRecruitmentFull}
                              title={isRecruitmentFull ? '모집 정원이 가득 찼습니다.' : undefined}
                              data-cy={`project-applicant-approve-${applicant.id}`}
                              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-mt-primary px-4 text-sm leading-5 font-bold text-mt-white shadow-sm transition-colors hover:bg-mt-logo-blue disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <CheckCircle2 className="h-4 w-4" aria-hidden strokeWidth={1.8} />
                              {isRecruitmentFull
                                ? '정원 마감'
                                : isDecisionLoading
                                  ? '처리 중'
                                  : '승인'}
                            </button>

                            <button
                              type="button"
                              onClick={() => void handleDecision(applicant, 'REJECTED')}
                              disabled={decisionLoadingId !== null}
                              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-mt-border bg-mt-white px-4 text-sm leading-5 font-bold text-mt-hero-blue transition-colors hover:bg-mt-bg-soft disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <XCircle className="h-4 w-4" aria-hidden strokeWidth={1.8} />
                              {isDecisionLoading ? '처리 중' : '거절'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}
      </div>

      <ProjectApplicantDetailModal
        applicant={detailApplicant ?? selectedApplicant}
        isOpen={selectedApplicant !== null}
        isLoading={isDetailLoading}
        errorMessage={detailErrorMessage}
        onClose={() => {
          setSelectedApplicant(null);
          setDetailApplicant(null);
          setDetailErrorMessage(null);
        }}
      />
    </ProjectManageShell>
  );
}
