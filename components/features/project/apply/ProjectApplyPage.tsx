'use client';

import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { MessageSquareText } from 'lucide-react';
import { useAuthRequiredModal } from '@/components/features/auth/useAuthRequiredModal';
import { fetchJobOptions } from '@/components/features/auth/signupApi';
import {
  applyToProject,
  fetchProjectDetail,
  fetchProjectApplicationPage,
  type ProjectApplicationPage,
} from '@/components/features/project/projectApi';
import {
  findProjectJobField,
  findProjectJobPosition,
} from '@/components/features/project/projectJobOptions';
import { projectApplicationSchema } from '@/components/features/project/apply/schema';
import { PROJECT_CATEGORIES } from '@/components/features/project/constants';
import BaseButton from '@/components/shared/BaseButton';
import BaseTextarea from '@/components/shared/BaseTextarea';
import { formatJobRole } from '@/components/shared/jobRoleFormat';
import ProfileAvatar from '@/components/shared/ProfileAvatar';
import SkillChip from '@/components/shared/SkillChip';
import ToastMessage from '@/components/shared/ToastMessage';
import { findUniversityByEmail } from '@/components/shared/universityLogoRegistry';
import type { JobFieldOption } from '@/types/auth';
import type { ProjectRecord } from '@/types/project';
import { useToastStore } from '@/stores/useToastStore';

type ProjectApplyPageProps = {
  projectId: string;
  initialJobField?: string;
  initialJobPosition?: string;
  initialJobPositionCode?: string;
};

type ApplicationPositionOption = {
  code: string;
  fieldName: string;
  positionName: string;
  label: string;
  techStacks: string[];
};

const PROJECT_APPLICATION_MAX_LENGTH = 700;
const PROJECT_APPLY_FALLBACK_IMAGE_SRC = '/brand/meeteam_character_hat.png';

function InfoChip({ label, tone = 'position' }: { label: string; tone?: 'position' | 'tech' }) {
  const toneClass =
    tone === 'tech'
      ? 'border-mt-border bg-mt-badge-bg text-mt-primary'
      : 'border-mt-border bg-mt-white text-mt-text-primary';

  return (
    <span
      className={`inline-flex h-6 items-center rounded-md border px-3 text-xs leading-4 font-bold ${toneClass}`}
    >
      {label}
    </span>
  );
}

function getProjectCategoryLabel(project?: ProjectRecord | null) {
  const category = PROJECT_CATEGORIES.find((item) => item.id === project?.categoryId);

  return category?.label ?? '카테고리 미정';
}

function getProjectDeadlineLabel(project?: ProjectRecord | null) {
  if (!project) {
    return '마감일 미정';
  }

  if (project.isRecruitUntilComplete) {
    return '상시 모집';
  }

  if (!project.recruitDeadline) {
    return '마감일 미정';
  }

  return `${project.recruitDeadline.replaceAll('-', '.')} 마감`;
}

function getProjectTeamName(project?: ProjectRecord | null) {
  return project?.title ? `${project.title} 팀` : '프로젝트 팀';
}

function getPositionTitle(position?: ApplicationPositionOption) {
  if (!position) {
    return '선택한 포지션';
  }

  return `${position.fieldName}(${position.positionName})`;
}

function ProjectApplyThumbnail({
  src,
  alt,
  className = '',
}: {
  src?: string | null;
  alt: string;
  className?: string;
}) {
  const normalizedSrc = src?.trim() || PROJECT_APPLY_FALLBACK_IMAGE_SRC;
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const resolvedSrc =
    failedSrc === normalizedSrc ? PROJECT_APPLY_FALLBACK_IMAGE_SRC : normalizedSrc;
  const isFallback = resolvedSrc === PROJECT_APPLY_FALLBACK_IMAGE_SRC;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-mt-border bg-mt-bg-soft ${className}`}
    >
      <img
        src={resolvedSrc}
        alt={alt}
        className={`absolute inset-0 !h-full !w-full object-cover object-center ${
          isFallback ? 'scale-125' : ''
        }`}
        onError={() => setFailedSrc(normalizedSrc)}
      />
    </div>
  );
}

function buildApplicationPositions(
  applicationPage: ProjectApplicationPage | null,
  jobFields: JobFieldOption[],
): ApplicationPositionOption[] {
  if (!applicationPage || jobFields.length === 0) {
    return [];
  }

  return applicationPage.recruitments
    .filter((recruitment) => !recruitment.isClosed)
    .map((recruitment) => mapRecruitmentToPositionOption(recruitment, jobFields))
    .filter((option): option is ApplicationPositionOption => option !== null);
}

function mapRecruitmentToPositionOption(
  recruitment: ProjectApplicationPage['recruitments'][number],
  jobFields: JobFieldOption[],
) {
  const field = findProjectJobField(jobFields, recruitment.jobFieldName);

  if (!field) {
    return null;
  }

  const position = findProjectJobPosition(field, recruitment.jobPositionName);

  if (!position) {
    return null;
  }

  return {
    code: position.code,
    fieldName: recruitment.jobFieldName,
    positionName: recruitment.jobPositionName,
    label: formatJobRole(recruitment.jobFieldName, recruitment.jobPositionName),
    techStacks: recruitment.techStacks,
  };
}

export default function ProjectApplyPage({
  projectId,
  initialJobField,
  initialJobPosition,
  initialJobPositionCode,
}: ProjectApplyPageProps) {
  const router = useRouter();
  const showToast = useToastStore((state) => state.showToast);
  const handleAuthRequired = useAuthRequiredModal();
  const [applicationPage, setApplicationPage] = useState<ProjectApplicationPage | null>(null);
  const [project, setProject] = useState<ProjectRecord | null>(null);
  const [jobFields, setJobFields] = useState<JobFieldOption[]>([]);
  const [selectedJobPositionCode, setSelectedJobPositionCode] = useState('');
  const [motivation, setMotivation] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const positionOptions = useMemo(
    () => buildApplicationPositions(applicationPage, jobFields),
    [applicationPage, jobFields],
  );
  const selectedPosition = positionOptions.find(
    (option) => option.code === selectedJobPositionCode,
  );
  const applicant = applicationPage?.applicant;

  useEffect(() => {
    let active = true;

    const loadApplicationData = async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const [nextApplicationPage, nextProject, nextJobFields] = await Promise.all([
          fetchProjectApplicationPage(projectId),
          fetchProjectDetail(projectId),
          fetchJobOptions(),
        ]);

        if (!active) {
          return;
        }

        setApplicationPage(nextApplicationPage);
        setProject(nextProject);
        setJobFields(nextJobFields);
      } catch (error) {
        if (!active) {
          return;
        }

        if (handleAuthRequired(error, { redirectPath: `/projects/${projectId}/apply` })) {
          setErrorMessage(null);
          return;
        }

        setErrorMessage(
          error instanceof Error ? error.message : '지원 정보를 불러오지 못했습니다.',
        );
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadApplicationData();

    return () => {
      active = false;
    };
  }, [handleAuthRequired, projectId]);

  useEffect(() => {
    if (selectedJobPositionCode || positionOptions.length === 0) {
      return;
    }

    const queryMatchedOption = positionOptions.find(
      (option) =>
        option.code === initialJobPositionCode ||
        (option.fieldName === initialJobField && option.positionName === initialJobPosition),
    );

    setSelectedJobPositionCode(queryMatchedOption?.code ?? positionOptions[0].code);
  }, [
    initialJobField,
    initialJobPosition,
    initialJobPositionCode,
    positionOptions,
    selectedJobPositionCode,
  ]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const result = projectApplicationSchema.safeParse({
      jobPositionCode: selectedJobPositionCode,
      motivation,
    });

    if (!result.success) {
      setErrorMessage(result.error.issues[0]?.message ?? '지원 정보를 다시 확인해 주세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const application = await applyToProject(projectId, result.data);
      showToast({ tone: 'success', message: '지원서를 제출했습니다.' });
      router.push(`/projects/${projectId}/apply/${application.applicationId}`);
    } catch (error) {
      if (handleAuthRequired(error, { redirectPath: `/projects/${projectId}/apply` })) {
        return;
      }

      setErrorMessage(error instanceof Error ? error.message : '프로젝트 지원에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <section className="min-h-screen">
        <div className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 py-12">
          <div className="h-8 w-32 rounded-xl bg-mt-bg-soft" />
          <div className="h-8 w-48 rounded-xl bg-mt-bg-soft" />
          <div className="h-96 rounded-3xl border border-mt-border bg-mt-white" />
        </div>
      </section>
    );
  }

  if (!applicationPage) {
    return (
      <section className="min-h-screen">
        <ToastMessage message={errorMessage} />

        <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-12">
          <div className="rounded-3xl border border-mt-border bg-mt-white px-8 py-12 text-center shadow-sm">
            <h1 className="text-2xl leading-8 font-extrabold text-mt-text-primary">
              지원 정보를 불러오지 못했습니다.
            </h1>
            <p className="mt-2 text-sm leading-6 text-mt-text-secondary">
              {errorMessage ?? '프로젝트 상태를 확인한 뒤 다시 시도해 주세요.'}
            </p>
          </div>
        </div>
      </section>
    );
  }

  const universityName = findUniversityByEmail(applicant?.email)?.nameKo;

  return (
    <section className="min-h-screen">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-12">
        <header>
          <h1 className="text-2xl leading-8 font-extrabold text-mt-text-primary">
            프로젝트 지원하기
          </h1>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="rounded-3xl border border-mt-border bg-mt-white px-5 py-6 shadow-sm sm:px-8 sm:py-8">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm leading-5 font-extrabold text-mt-primary">
                  To. {getProjectTeamName(project)}
                </p>
                <h2 className="mt-2 text-2xl leading-8 font-extrabold text-mt-text-primary">
                  {getPositionTitle(selectedPosition)}에 지원합니다.
                </h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  <InfoChip label={getProjectCategoryLabel(project)} />
                  <InfoChip label={project?.releasePlatforms[0] ?? '플랫폼 미정'} />
                  <InfoChip label={getProjectDeadlineLabel(project)} />
                </div>
              </div>

              <ProjectApplyThumbnail
                src={project?.coverImageUrl}
                alt={project?.title ?? '프로젝트 이미지'}
                className="h-16 w-16 shrink-0 sm:h-20 sm:w-20"
              />
            </div>

            <div className="mt-6 space-y-3">
              <span data-cy="project-application-position" className="sr-only">
                {getPositionTitle(selectedPosition)}
              </span>
              <div className="space-y-2">
                <p className="text-sm leading-5 font-bold text-mt-text-primary">필요 기술</p>
                {selectedPosition?.techStacks.length ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedPosition.techStacks.map((techStack) => (
                      <SkillChip
                        key={techStack}
                        label={techStack}
                        variant="primary"
                        size="md"
                        className="border-mt-border font-bold"
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm leading-5 text-mt-text-secondary">
                    등록된 기술 스택이 없습니다.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-7 border-t border-mt-border pt-6">
              <div className="flex items-center gap-2">
                <MessageSquareText
                  className="h-4 w-4 text-mt-primary"
                  aria-hidden
                  strokeWidth={1.8}
                />
                <h2 className="text-base leading-6 font-extrabold text-mt-text-primary">
                  지원 메시지
                </h2>
              </div>

              <BaseTextarea
                rows={7}
                value={motivation}
                data-cy="project-application-motivation"
                onChange={(event) => setMotivation(event.target.value)}
                disabled={isSubmitting || positionOptions.length === 0}
                placeholder="팀에게 보낼 메시지를 입력해 주세요."
                maxLength={PROJECT_APPLICATION_MAX_LENGTH}
                className="mt-4 min-h-60 resize-none bg-mt-white text-base leading-7"
              />

              <div className="mt-3 flex justify-end">
                <p className="text-right text-xs leading-4 font-medium text-mt-text-secondary">
                  {motivation.length}/{PROJECT_APPLICATION_MAX_LENGTH}자
                </p>
              </div>
            </div>

            <div className="mt-7 border-t border-mt-border pt-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <ProfileAvatar
                    name={applicant?.name ?? 'M'}
                    imageUrl={applicant?.profileImageUrl}
                    sizeClassName="h-12 w-12"
                    shape="rounded"
                    textClassName="text-base"
                    className="bg-mt-bg-soft text-mt-text-secondary"
                  />
                  <div className="min-w-0">
                    <p className="text-sm leading-5 font-extrabold text-mt-primary">
                      From. {applicant?.name ?? '-'}
                    </p>
                    {universityName ? (
                      <p className="truncate text-sm leading-5 text-mt-text-secondary">
                        {universityName}
                      </p>
                    ) : null}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => router.push('/profile')}
                  className="inline-flex h-9 shrink-0 items-center justify-center self-start rounded-lg border border-mt-border bg-mt-white px-3 text-xs leading-4 font-bold text-mt-text-secondary shadow-sm transition-colors hover:bg-mt-bg-soft sm:self-auto"
                >
                  프로필 수정
                </button>
              </div>

              <div className="mt-5">
                <p className="text-sm leading-5 font-bold text-mt-text-primary">내 기술스택</p>
                {applicant?.techStacks.length ? (
                  <div
                    className="mt-2 flex flex-wrap gap-2"
                    data-cy="project-application-my-skills"
                  >
                    {applicant.techStacks.map((techStack) => (
                      <SkillChip
                        key={techStack.id}
                        label={techStack.name}
                        variant="outline"
                        size="md"
                      />
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm leading-5 text-mt-text-secondary">
                    프로필에 등록된 기술스택이 없습니다.
                  </p>
                )}
              </div>
            </div>
          </section>

          <ToastMessage message={errorMessage} />

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <BaseButton
              size="L"
              variant="gray"
              type="button"
              disabled={isSubmitting}
              className="w-full sm:w-fit"
              onClick={() => router.push(`/projects/${projectId}`)}
            >
              취소
            </BaseButton>

            <BaseButton
              size="L"
              variant="primary"
              type="submit"
              disabled={isSubmitting || positionOptions.length === 0}
              data-cy="project-application-submit"
              className="w-full px-7 sm:w-fit"
            >
              {isSubmitting ? '보내는 중' : '지원서 보내기'}
            </BaseButton>
          </div>
        </form>
      </div>
    </section>
  );
}
