'use client';

import { Heart, Share2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { isAuthRequiredError } from '@/components/features/auth/authError';
import { useAuthRequiredModal } from '@/components/features/auth/useAuthRequiredModal';
import {
  fetchProjectLikeStatus,
  toggleProjectLike,
} from '@/components/features/project/projectApi';
import ToastMessage from '@/components/shared/ToastMessage';
import { useToastStore } from '@/stores/useToastStore';

interface ProjectActionButtonsProps {
  projectId: string | number;
  projectTitle?: string;
  initialLikeCount: number;
  initialLiked: boolean;
}

export default function ProjectActionButtons({
  projectId,
  projectTitle,
  initialLikeCount,
  initialLiked,
}: ProjectActionButtonsProps) {
  const openAuthRequiredModal = useAuthRequiredModal();
  const showToast = useToastStore((state) => state.showToast);
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isToggling, setIsToggling] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const formattedLikeCount = likeCount.toLocaleString('ko-KR');

  useEffect(() => {
    setLiked(initialLiked);
    setLikeCount(initialLikeCount);
    setErrorMessage(null);
  }, [initialLikeCount, initialLiked, projectId]);

  useEffect(() => {
    let active = true;

    const loadLikeStatus = async () => {
      try {
        const status = await fetchProjectLikeStatus(projectId);

        if (active) {
          setLiked(status.isLiked);
        }
      } catch (error) {
        if (!active || isAuthRequiredError(error)) {
          return;
        }

        setErrorMessage(
          error instanceof Error ? error.message : '좋아요 상태를 불러오지 못했습니다.',
        );
      }
    };

    void loadLikeStatus();

    return () => {
      active = false;
    };
  }, [projectId]);

  const handleLikeToggle = async () => {
    if (isToggling) {
      return;
    }

    try {
      setIsToggling(true);
      setErrorMessage(null);

      const result = await toggleProjectLike(projectId);

      setLiked(result.liked);
      setLikeCount(result.likeCount);
    } catch (error) {
      if (openAuthRequiredModal(error)) {
        return;
      }

      setErrorMessage(
        error instanceof Error ? error.message : '좋아요 처리 중 오류가 발생했습니다.',
      );
    } finally {
      setIsToggling(false);
    }
  };

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : `/projects/${projectId}`;

    try {
      await navigator.clipboard.writeText(url);
      showToast({
        tone: 'success',
        message: projectTitle
          ? `'${projectTitle}' 프로젝트 링크를 복사했어요.`
          : '프로젝트 링크를 복사했어요.',
      });
    } catch {
      showToast({ message: '프로젝트 링크를 복사하지 못했습니다. 다시 시도해 주세요.' });
    }
  };

  return (
    <div className="space-y-2">
      <ToastMessage message={errorMessage} />

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <button
          type="button"
          aria-label={`${liked ? '프로젝트 좋아요 취소' : '프로젝트 좋아요'}, 현재 좋아요 ${formattedLikeCount}개`}
          aria-pressed={liked}
          disabled={isToggling}
          data-cy="project-like-button"
          onClick={handleLikeToggle}
          className={`inline-flex h-11 min-w-0 items-center justify-center gap-1.5 rounded-xl border border-mt-border px-3 text-sm leading-5 font-bold shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-70 sm:gap-2 sm:px-4
            ${
              liked
                ? 'bg-mt-badge-bg text-mt-hero-blue'
                : 'bg-mt-white text-mt-text-nav hover:bg-mt-badge-bg'
            }`}
        >
          <Heart
            className={`h-5 w-5 ${liked ? 'fill-current' : ''}`}
            aria-hidden
            strokeWidth={1.8}
          />
          <span className="min-w-0 truncate">좋아요 {formattedLikeCount}</span>
        </button>

        <button
          className="inline-flex h-11 min-w-0 items-center justify-center gap-1.5 rounded-xl border border-mt-border bg-mt-white px-3 text-sm leading-5 font-bold text-mt-text-nav shadow-sm transition-colors hover:bg-mt-badge-bg sm:gap-2 sm:px-4"
          type="button"
          onClick={handleShare}
          aria-label="프로젝트 링크 복사"
        >
          <Share2 className="h-5 w-5" aria-hidden strokeWidth={1.8} />
          공유
        </button>
      </div>
    </div>
  );
}
