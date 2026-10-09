'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { fetchHomeMembersPage, type HomeMemberCard } from '@/components/features/home/homeApi';
import SkeletonBlock from '@/components/shared/SkeletonBlock';
import ToastMessage from '@/components/shared/ToastMessage';
import UserCard from '@/components/shared/UserCard';

const MEMBER_PAGE_SIZE = 5;

function getMemberVisibleCount() {
  if (typeof window === 'undefined') {
    return MEMBER_PAGE_SIZE;
  }

  if (window.matchMedia('(min-width: 1280px)').matches) {
    return 5;
  }

  if (window.matchMedia('(min-width: 1024px)').matches) {
    return 3;
  }

  if (window.matchMedia('(min-width: 640px)').matches) {
    return 2;
  }

  return 1;
}

export default function HomeMemberSection() {
  const [members, setMembers] = useState<HomeMemberCard[]>([]);
  const [visibleStart, setVisibleStart] = useState(0);
  const [visibleCount, setVisibleCount] = useState(MEMBER_PAGE_SIZE);
  const [loadedPage, setLoadedPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    const updateVisibleCount = () => {
      setVisibleCount(getMemberVisibleCount());
    };

    updateVisibleCount();
    window.addEventListener('resize', updateVisibleCount);

    return () => window.removeEventListener('resize', updateVisibleCount);
  }, []);

  useEffect(() => {
    setVisibleStart((current) => Math.min(current, Math.max(members.length - visibleCount, 0)));
  }, [members.length, visibleCount]);

  useEffect(() => {
    let active = true;

    const loadMembers = async () => {
      try {
        if (!hasLoadedRef.current) {
          setIsInitialLoading(true);
        } else {
          setIsRefreshing(true);
        }

        setErrorMessage(null);

        const result = await fetchHomeMembersPage(MEMBER_PAGE_SIZE, 0);

        if (!active) {
          return;
        }

        setMembers(result.items);
        setVisibleStart(0);
        setLoadedPage(result.page);
        setHasMore(result.hasMore);
        hasLoadedRef.current = true;
      } catch (error) {
        if (!active) {
          return;
        }

        setErrorMessage(
          error instanceof Error ? error.message : '메인 팀원 목록을 불러오지 못했습니다.',
        );
      } finally {
        if (active) {
          setIsInitialLoading(false);
          setIsRefreshing(false);
        }
      }
    };

    void loadMembers();

    return () => {
      active = false;
    };
  }, []);

  const handleGoPrev = () => {
    setVisibleStart((current) => Math.max(current - 1, 0));
  };

  const handleGoNext = async () => {
    if (isInitialLoading || isRefreshing) {
      return;
    }

    const nextStart = visibleStart + 1;

    if (nextStart + visibleCount <= members.length) {
      setVisibleStart(nextStart);
      return;
    }

    if (!hasMore) {
      return;
    }

    try {
      setIsRefreshing(true);
      setErrorMessage(null);

      const result = await fetchHomeMembersPage(MEMBER_PAGE_SIZE, loadedPage + 1);

      if (result.items.length === 0) {
        setHasMore(false);
        return;
      }

      setMembers((current) => [...current, ...result.items]);
      setLoadedPage(result.page);
      setHasMore(result.hasMore);
      setVisibleStart(nextStart);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : '메인 팀원 목록을 더 불러오지 못했습니다.',
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  const canGoPrev = visibleStart > 0 && !isInitialLoading && !isRefreshing;
  const canGoNext =
    (visibleStart + visibleCount < members.length || hasMore) && !isInitialLoading && !isRefreshing;

  return (
    <section className="mt-12 space-y-6 md:mt-16">
      <ToastMessage message={errorMessage} />

      <div className="flex items-end justify-between">
        <h2 className="text-2xl font-extrabold text-mt-text-primary">팀을 구해요!</h2>
        <Link href="/teammates" className="text-sm font-semibold text-mt-primary">
          더 많은 멤버 보기 &gt;
        </Link>
      </div>

      <div className="relative">
        {canGoPrev ? (
          <button
            type="button"
            onClick={handleGoPrev}
            className="absolute left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-mt-border bg-mt-white text-mt-primary shadow-lg transition-transform hover:-translate-x-1 hover:scale-105 sm:-left-5 lg:-left-6 xl:-left-8 2xl:-left-14"
            aria-label="이전 팀원 보기"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden strokeWidth={2.2} />
          </button>
        ) : null}

        {canGoNext ? (
          <button
            type="button"
            onClick={() => void handleGoNext()}
            className="absolute right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-mt-border bg-mt-white text-mt-primary shadow-lg transition-transform hover:translate-x-1 hover:scale-105 sm:-right-5 lg:-right-6 xl:-right-8 2xl:-right-14"
            aria-label="다음 팀원 보기"
          >
            <ChevronRight className="h-5 w-5" aria-hidden strokeWidth={2.2} />
          </button>
        ) : null}

        {isInitialLoading ? (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {Array.from({ length: MEMBER_PAGE_SIZE }).map((_, index) => (
              <li
                key={`home-member-skeleton-${index}`}
                className="rounded-2xl border border-mt-border bg-mt-white px-6 pt-6 pb-14 shadow-sm"
              >
                <SkeletonBlock className="h-16 w-16" />
                <SkeletonBlock className="mt-6 h-6 w-28" />
                <SkeletonBlock className="mt-3 h-4 w-36" />
                <div className="mt-7 flex gap-2">
                  <SkeletonBlock className="h-7 w-16" />
                  <SkeletonBlock className="h-7 w-20" />
                </div>
              </li>
            ))}
          </ul>
        ) : members.length > 0 ? (
          <div
            className="overflow-hidden [--home-gap:1rem] [--visible-count:1] sm:[--visible-count:2] lg:[--visible-count:3] xl:[--visible-count:5]"
            aria-busy={isRefreshing}
          >
            <ul
              className="flex gap-4 transition-transform duration-500 ease-out will-change-transform"
              style={{
                transform: `translateX(calc(${visibleStart} * -1 * ((100% - (var(--visible-count) - 1) * var(--home-gap)) / var(--visible-count) + var(--home-gap))))`,
              }}
            >
              {members.map((teammate) => (
                <li
                  key={teammate.userId}
                  className="min-w-0 shrink-0 basis-[calc((100%-(var(--visible-count)-1)*var(--home-gap))/var(--visible-count))]"
                >
                  <UserCard
                    userId={teammate.userId}
                    name={teammate.name}
                    role={teammate.role}
                    experience={teammate.experience}
                    skills={teammate.skills}
                    imageUrl={teammate.imageUrl}
                  />
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="rounded-2xl border border-mt-border bg-mt-white px-6 py-16 text-center shadow-sm">
            <p className="text-lg font-bold text-mt-text-primary">아직 팀원이 없어요.</p>
            <p className="mt-2 text-sm leading-5 text-mt-text-secondary">
              조금 뒤에 다시 확인해 주세요.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
