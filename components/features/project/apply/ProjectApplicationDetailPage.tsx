'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { ApiError } from '@/components/features/auth/authApi';
import {
  getMyApplications,
  getApplicationDetail,
  cancelApplication,
  applicationStatusLabel,
  applicationErrorMessage,
} from '../applicationApi';
import { useProjectRequest } from '../useProjectRequest';
import ProjectRequestError from '../ProjectRequestError';
import BaseButton from '@/components/shared/BaseButton';
import BaseModal from '@/components/shared/BaseModal';
import SkeletonBlock from '@/components/shared/SkeletonBlock';
import { useToastStore } from '@/stores/useToastStore';

export default function ProjectApplicationDetailPage({
  projectId,
  applicationId,
}: {
  projectId: number;
  applicationId: number;
}) {
  const load = useCallback(async () => {
    const applications = await getMyApplications();
    const summary = applications.find(
      (item) => item.projectId === projectId && item.applicationId === applicationId,
    );
    if (!summary) throw new ApiError('본인의 지원서를 찾을 수 없습니다.', 404);
    try {
      return {
        summary,
        detail: await getApplicationDetail(projectId, applicationId),
        limited: false,
      };
    } catch (error) {
      if (error instanceof ApiError && error.status === 403)
        return { summary, detail: null, limited: true };
      throw error;
    }
  }, [projectId, applicationId]);
  const { data, error, loading, retry } = useProjectRequest(load);
  const [confirm, setConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const showToast = useToastStore((state) => state.showToast);
  if (loading) return <SkeletonBlock className="h-96 w-full" />;
  if (error || !data) return <ProjectRequestError error={error} retry={retry} />;
  const status = cancelled ? 'CANCELLED' : data.summary.status;
  async function handleCancel() {
    if (cancelling) return;
    setCancelling(true);
    setCancelError('');
    try {
      await cancelApplication(applicationId);
      setCancelled(true);
      setConfirm(false);
      showToast({ tone: 'success', message: '지원을 취소했습니다.' });
      retry();
    } catch (cause) {
      const message = applicationErrorMessage(cause);
      setCancelError(message);
      showToast({ message });
      setConfirm(false);
    } finally {
      setCancelling(false);
    }
  }
  return (
    <section className="mx-auto w-full max-w-4xl space-y-6 pb-16">
      <Link href="/profile/applications" className="text-sm text-mt-primary">
        내 지원 현황으로
      </Link>
      <article className="space-y-6 rounded-3xl border border-mt-border bg-mt-white p-6 sm:p-8">
        <header>
          <p className="font-bold text-mt-primary">내 지원서 · {applicationStatusLabel(status)}</p>
          <h1 className="mt-2 text-2xl font-bold">{data.summary.projectName}</h1>
          <p className="mt-2 text-mt-text-secondary">
            {data.summary.jobPositionName} · {data.summary.appliedAt.slice(0, 10)} 지원
          </p>
        </header>
        {data.limited ? (
          <p role="status" className="rounded-xl bg-mt-bg-soft p-4 text-sm text-mt-text-secondary">
            현재 서비스에서는 지원 동기 상세 조회가 제한되어 있습니다. 지원 상태 확인과 대기 중인
            지원 취소는 이용할 수 있습니다.
          </p>
        ) : (
          <section>
            <h2 className="font-bold">지원 동기</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7">{data.detail?.motivation}</p>
          </section>
        )}
        {cancelError && (
          <p role="alert" className="text-sm text-mt-danger">
            {cancelError}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-4">
          <Link href={`/projects/${projectId}`} className="text-sm text-mt-primary underline">
            프로젝트 상세
          </Link>
          {status === 'PENDING' && (
            <BaseButton variant="gray" onClick={() => setConfirm(true)} disabled={cancelling}>
              지원 취소
            </BaseButton>
          )}
        </div>
      </article>
      <BaseModal
        isOpen={confirm}
        onClose={() => {
          if (!cancelling) setConfirm(false);
        }}
      >
        <section className="space-y-5 rounded-2xl bg-mt-white p-6">
          <h2 className="text-xl font-bold">지원을 취소할까요?</h2>
          <p className="text-sm text-mt-text-secondary">
            취소한 지원서는 대기 목록에서 제외되며 같은 프로젝트에 재지원할 수 없습니다.
          </p>
          <div className="flex gap-3">
            <BaseButton variant="gray" disabled={cancelling} onClick={() => setConfirm(false)}>
              돌아가기
            </BaseButton>
            <BaseButton disabled={cancelling} onClick={() => void handleCancel()}>
              {cancelling ? '취소 중…' : '지원 취소하기'}
            </BaseButton>
          </div>
        </section>
      </BaseModal>
    </section>
  );
}
