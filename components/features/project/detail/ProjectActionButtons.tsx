'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { ApiError } from '@/components/features/auth/authApi';
import {
  getMyApplications,
  getProjectLike,
  toggleProjectLike,
  isProjectOpen,
  applicationErrorMessage,
} from '../applicationApi';
import type { ProjectRecord } from '../projectApi';
import { useProjectRequest } from '../useProjectRequest';
import BaseButton from '@/components/shared/BaseButton';
import { useAuthStore } from '@/stores/useAuthStore';
import { useLoginModalStore } from '@/stores/useLoginModalStore';
import { useToastStore } from '@/stores/useToastStore';

export default function ProjectActionButtons({ project }: { project: ProjectRecord }) {
  const { user, isAuthenticated, isSessionReady, sessionError } = useAuthStore();
  const openLoginModal = useLoginModalStore((state) => state.openLoginModal);
  const showToast = useToastStore((state) => state.showToast);
  const [likeOverride, setLikeOverride] = useState<{ liked: boolean; likeCount: number } | null>(
    null,
  );
  const [saving, setSaving] = useState(false);
  const load = useCallback(async () => {
    if (!isSessionReady || !isAuthenticated) return null;
    const [like, applications] = await Promise.all([
      getProjectLike(project.id),
      getMyApplications(),
    ]);
    return { like, application: applications.find((item) => item.projectId === project.id) };
  }, [isSessionReady, isAuthenticated, project.id]);
  const { data, error, loading, retry } = useProjectRequest(load);
  const liked =
    isAuthenticated &&
    (likeOverride?.liked ?? data?.like.isLiked ?? data?.like.liked ?? project.isLiked ?? false);
  const leader = isAuthenticated && project.leaderId === user?.memberId;
  const member = isAuthenticated && project.memberIds?.includes(user?.memberId ?? -1);
  async function handleLike() {
    if (!isAuthenticated) {
      openLoginModal({ redirectPath: `/projects/${project.id}` });
      return;
    }
    if (saving) return;
    setSaving(true);
    try {
      setLikeOverride(await toggleProjectLike(project.id));
    } catch (cause) {
      showToast({ message: applicationErrorMessage(cause) });
      if (cause instanceof ApiError && cause.status === 401)
        openLoginModal({ redirectPath: `/projects/${project.id}` });
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="space-y-3 border-t border-mt-border pt-4">
      <BaseButton
        variant="gray"
        full
        disabled={!isSessionReady || saving || (isAuthenticated && loading)}
        onClick={() => void handleLike()}
        aria-pressed={liked}
      >
        <Heart className="mr-2 h-4 w-4" fill={liked ? 'currentColor' : 'none'} />
        {liked ? '관심 등록됨' : '관심 등록'} · {likeOverride?.likeCount ?? project.likeCount ?? 0}
      </BaseButton>
      {sessionError ? (
        <p role="alert" className="text-sm text-mt-danger">
          {sessionError}
        </p>
      ) : !isSessionReady || (isAuthenticated && loading) ? (
        <p role="status" className="text-sm text-mt-text-secondary">
          지원 상태 확인 중…
        </p>
      ) : error ? (
        <div role="alert">
          <p className="text-sm text-mt-danger">지원 상태를 확인하지 못했습니다.</p>
          <BaseButton variant="gray" onClick={retry}>
            다시 시도
          </BaseButton>
        </div>
      ) : leader ? (
        <Link
          className="block rounded-xl bg-mt-primary px-4 py-3 text-center text-sm font-bold text-mt-white"
          href={`/projects/${project.id}/manage`}
        >
          프로젝트 관리
        </Link>
      ) : member ? (
        <p className="text-sm text-mt-text-secondary">참여 중인 프로젝트입니다.</p>
      ) : data?.application ? (
        <Link
          href={`/projects/${project.id}/apply/${data.application.applicationId}`}
          className="block rounded-xl bg-mt-primary px-4 py-3 text-center text-sm font-bold text-mt-white"
        >
          내 지원서 확인
        </Link>
      ) : !isProjectOpen(project) ? (
        <p className="text-sm text-mt-text-secondary">모집이 마감되어 지원할 수 없습니다.</p>
      ) : !isAuthenticated ? (
        <BaseButton
          full
          onClick={() => openLoginModal({ redirectPath: `/projects/${project.id}/apply` })}
        >
          로그인 후 지원하기
        </BaseButton>
      ) : (
        <Link
          href={`/projects/${project.id}/apply`}
          className="block rounded-xl bg-mt-primary px-4 py-3 text-center text-sm font-bold text-mt-white"
        >
          지원하기
        </Link>
      )}
      <Link
        href="/profile/applications"
        className="block text-center text-xs text-mt-primary underline"
      >
        내 지원 현황
      </Link>
    </div>
  );
}
