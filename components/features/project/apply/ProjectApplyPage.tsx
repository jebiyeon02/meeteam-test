'use client';

import { useCallback, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getJobOptions } from '@/components/features/profile/profileApi';
import { getProject } from '../projectApi';
import {
  getApplicationPage,
  getMyApplications,
  submitApplication,
  isProjectOpen,
  applicationErrorMessage,
} from '../applicationApi';
import { useProjectRequest } from '../useProjectRequest';
import ProjectRequestError from '../ProjectRequestError';
import { projectApplicationSchema } from './schema';
import BaseButton from '@/components/shared/BaseButton';
import BaseTextarea from '@/components/shared/BaseTextarea';
import SkeletonBlock from '@/components/shared/SkeletonBlock';
import { useAuthStore } from '@/stores/useAuthStore';
import { useToastStore } from '@/stores/useToastStore';
import { useLoginModalStore } from '@/stores/useLoginModalStore';
import { ApiError } from '@/components/features/auth/authApi';

export default function ProjectApplyPage({ projectId }: { projectId: number }) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const showToast = useToastStore((state) => state.showToast);
  const openLoginModal = useLoginModalStore((state) => state.openLoginModal);
  const load = useCallback(async () => {
    const [project, options, applications] = await Promise.all([
      getProject(projectId),
      getJobOptions(),
      getMyApplications(),
    ]);
    const existing = applications.find((item) => item.projectId === projectId);
    if (
      existing ||
      !isProjectOpen(project) ||
      project.leaderId === user?.memberId ||
      project.memberIds?.includes(user?.memberId ?? -1)
    )
      return { project, options, existing, page: null };
    return { project, options, existing, page: await getApplicationPage(projectId) };
  }, [projectId, user?.memberId]);
  const { data, loading, error, retry } = useProjectRequest(load);
  const [positionCode, setPositionCode] = useState('');
  const [motivation, setMotivation] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <SkeletonBlock className="h-96 w-full" />;
  if (error || !data) return <ProjectRequestError error={error} retry={retry} />;
  if (data.existing)
    return (
      <section className="space-y-4 rounded-2xl border border-mt-border p-8">
        <h1 className="text-xl font-bold">이미 지원한 프로젝트입니다</h1>
        <p>취소된 지원을 포함해 같은 프로젝트에는 다시 지원할 수 없습니다.</p>
        <Link
          className="text-mt-primary underline"
          href={`/projects/${projectId}/apply/${data.existing.applicationId}`}
        >
          내 지원서 확인
        </Link>
      </section>
    );
  if (!data.page)
    return (
      <section className="space-y-4 rounded-2xl border border-mt-border p-8">
        <h1 className="text-xl font-bold">현재 지원할 수 없습니다</h1>
        <p>모집이 마감되었거나 이미 이 프로젝트에 참여 중입니다.</p>
        <Link className="text-mt-primary underline" href={`/projects/${projectId}`}>
          프로젝트 상세로
        </Link>
      </section>
    );
  const page = data.page;
  const positions = page.recruitments
    .filter((item) => !item.isClosed)
    .map((item) => {
      const field = data.options.fields.find((field) => field.name === item.jobFieldName);
      const position = field?.positions.find((position) => position.name === item.jobPositionName);
      return { ...item, code: position?.code ?? '' };
    })
    .filter((item) => item.code);
  const selected = positions.find((item) => item.code === positionCode);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    const parsed = projectApplicationSchema.safeParse({
      jobPositionCode: positionCode,
      motivation,
    });
    if (!parsed.success) {
      setErrors(
        Object.fromEntries(
          parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message]),
        ),
      );
      return;
    }
    if (!positions.some((item) => item.code === parsed.data.jobPositionCode)) {
      setErrors({ jobPositionCode: '현재 모집 중인 직무를 선택해 주세요.' });
      return;
    }
    setErrors({});
    setSubmitError('');
    setSubmitting(true);
    try {
      const result = await submitApplication(projectId, parsed.data);
      showToast({ tone: 'success', message: '지원서를 제출했습니다.' });
      router.push(`/projects/${projectId}/apply/${result.applicationId}`);
    } catch (cause) {
      const message = applicationErrorMessage(cause);
      setSubmitError(message);
      showToast({ message });
      if (cause instanceof ApiError && cause.status === 401)
        openLoginModal({ redirectPath: `/projects/${projectId}/apply` });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-4xl space-y-6 pb-16">
      <Link href={`/projects/${projectId}`} className="text-sm text-mt-primary">
        프로젝트 상세로
      </Link>
      <h1 className="text-2xl font-bold">프로젝트 지원하기</h1>
      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-3xl border border-mt-border bg-mt-white p-6 sm:p-8"
      >
        <header>
          <p className="text-sm font-bold text-mt-primary">To. {data.project.name}</p>
          <h2 className="mt-2 text-xl font-bold">함께할 모집 직무를 선택해 주세요</h2>
        </header>
        <div>
          <label htmlFor="application-position" className="text-sm font-bold">
            모집 직무
          </label>
          <select
            id="application-position"
            aria-invalid={!!errors.jobPositionCode}
            aria-describedby="position-error"
            value={positionCode}
            onChange={(event) => setPositionCode(event.target.value)}
            disabled={submitting}
            className="mt-2 h-12 w-full rounded-xl border border-mt-border bg-mt-white px-4"
          >
            <option value="">직무 선택</option>
            {positions.map((item) => (
              <option key={item.id} value={item.code}>
                {item.jobFieldName} · {item.jobPositionName}
              </option>
            ))}
          </select>
          <p id="position-error" className="mt-2 text-sm text-mt-danger">
            {errors.jobPositionCode}
          </p>
        </div>
        {selected && (
          <p className="text-sm text-mt-text-secondary">
            필요 기술: {selected.techStacks.join(', ') || '등록된 기술 없음'}
          </p>
        )}
        {!positions.length && (
          <p role="alert" className="text-mt-danger">
            현재 지원 가능한 모집 직무가 없습니다.
          </p>
        )}
        <div>
          <label htmlFor="application-motivation" className="text-sm font-bold">
            지원 동기
          </label>
          <BaseTextarea
            id="application-motivation"
            value={motivation}
            onChange={(event) => setMotivation(event.target.value)}
            maxLength={1000}
            rows={7}
            disabled={submitting}
            aria-invalid={!!errors.motivation}
            aria-describedby="motivation-error"
            placeholder="팀에 전할 지원 동기를 10자 이상 작성해 주세요."
            className="mt-2 w-full"
          />
          <p className="text-right text-xs text-mt-text-secondary">{motivation.length}/1000자</p>
          <p id="motivation-error" className="text-sm text-mt-danger">
            {errors.motivation}
          </p>
        </div>
        <section className="space-y-2 border-t border-mt-border pt-5">
          <p className="font-bold">From. {page.applicant.name}</p>
          <p className="text-sm text-mt-text-secondary">{page.applicant.email}</p>
          <p className="text-sm">
            내 기술:{' '}
            {page.applicant.techStacks?.map((item) => item.name).join(', ') || '등록된 기술 없음'}
          </p>
          <Link href="/profile" className="text-sm text-mt-primary underline">
            프로필 수정
          </Link>
        </section>
        {submitError && (
          <p role="alert" className="text-sm text-mt-danger">
            {submitError}
          </p>
        )}
        <BaseButton type="submit" disabled={submitting || !positions.length}>
          {submitting ? '제출 중…' : '지원서 보내기'}
        </BaseButton>
      </form>
    </section>
  );
}
