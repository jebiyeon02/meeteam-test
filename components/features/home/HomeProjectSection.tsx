'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ProjectCard } from '@/components/features/project/ProjectCard';
import { ProjectCardSkeleton } from '@/components/features/project/ProjectCardSkeleton';
import { PROJECT_CATEGORIES } from '@/components/features/project/constants';
import {
  fetchHomeProjectsPage,
  type HomeProjectCard,
  type HomeProjectCategory,
} from '@/components/features/home/homeApi';
import ToastMessage from '@/components/shared/ToastMessage';

const CATEGORY_CHIPS: HomeProjectCategory[] = [
  '전체',
  ...PROJECT_CATEGORIES.map((category) => category.label as HomeProjectCategory),
];
const PROJECT_WINDOW_SIZE = 4;

function getProjectVisibleCount() {
  if (typeof window === 'undefined') {
    return PROJECT_WINDOW_SIZE;
  }

  if (window.matchMedia('(min-width: 1280px)').matches) {
    return 4;
  }

  if (window.matchMedia('(min-width: 768px)').matches) {
    return 2;
  }

  return 1;
}

export default function HomeProjectSection() {
  const [selectedCategory, setSelectedCategory] = useState<HomeProjectCategory>('전체');
  const [projects, setProjects] = useState<HomeProjectCard[]>([]);
  const [visibleStart, setVisibleStart] = useState(0);
  const [visibleCount, setVisibleCount] = useState(PROJECT_WINDOW_SIZE);
  const [loadedPage, setLoadedPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    const updateVisibleCount = () => {
      setVisibleCount(getProjectVisibleCount());
    };

    updateVisibleCount();
    window.addEventListener('resize', updateVisibleCount);

    return () => window.removeEventListener('resize', updateVisibleCount);
  }, []);

  useEffect(() => {
    setVisibleStart((current) => Math.min(current, Math.max(projects.length - visibleCount, 0)));
  }, [projects.length, visibleCount]);

  useEffect(() => {
    let active = true;

    const loadProjects = async () => {
      try {
        if (!hasLoadedRef.current) {
          setIsInitialLoading(true);
        } else {
          setIsRefreshing(true);
        }

        setErrorMessage(null);

        const result = await fetchHomeProjectsPage(PROJECT_WINDOW_SIZE, selectedCategory, 0);

        if (!active) {
          return;
        }

        setProjects(result.items);
        setVisibleStart(0);
        setLoadedPage(result.page);
        setHasMore(result.hasMore);
        hasLoadedRef.current = true;
      } catch (error) {
        if (!active) {
          return;
        }

        setErrorMessage(
          error instanceof Error ? error.message : '메인 프로젝트 목록을 불러오지 못했습니다.',
        );
      } finally {
        if (active) {
          setIsInitialLoading(false);
          setIsRefreshing(false);
        }
      }
    };

    void loadProjects();

    return () => {
      active = false;
    };
  }, [selectedCategory]);

  const handleSelectCategory = (category: HomeProjectCategory) => {
    if (category === selectedCategory) {
      return;
    }

    setSelectedCategory(category);
    setVisibleStart(0);
    setLoadedPage(0);
  };

  const handleGoPrev = () => {
    setVisibleStart((current) => Math.max(current - 1, 0));
  };

  const handleGoNext = async () => {
    if (isInitialLoading || isRefreshing) {
      return;
    }

    const nextStart = visibleStart + 1;

    if (nextStart + visibleCount <= projects.length) {
      setVisibleStart(nextStart);
      return;
    }

    if (!hasMore) {
      return;
    }

    try {
      setIsRefreshing(true);
      setErrorMessage(null);

      const result = await fetchHomeProjectsPage(
        PROJECT_WINDOW_SIZE,
        selectedCategory,
        loadedPage + 1,
      );

      if (result.items.length === 0) {
        setHasMore(false);
        return;
      }

      setProjects((current) => [...current, ...result.items]);
      setLoadedPage(result.page);
      setHasMore(result.hasMore);
      setVisibleStart(nextStart);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : '메인 프로젝트 목록을 더 불러오지 못했습니다.',
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  const canGoPrev = visibleStart > 0 && !isInitialLoading && !isRefreshing;
  const canGoNext =
    (visibleStart + visibleCount < projects.length || hasMore) &&
    !isInitialLoading &&
    !isRefreshing;

  return (
    <section className="space-y-6">
      <ToastMessage message={errorMessage} />

      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-extrabold text-mt-text-primary">프로젝트</h2>
          <Link href="/projects" className="text-sm leading-5 font-semibold text-mt-primary">
            전체보기 &gt;
          </Link>
        </div>

        <div className="overflow-x-auto pb-1" role="tablist" aria-label="프로젝트 카테고리">
          <div className="flex min-w-max gap-2">
            {CATEGORY_CHIPS.map((category) => {
              const selected = selectedCategory === category;

              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => handleSelectCategory(category)}
                  aria-selected={selected}
                  role="tab"
                  className={`inline-flex shrink-0 items-center justify-center rounded-full px-3.5 py-1.5 text-sm leading-5 transition-all ${
                    selected
                      ? 'bg-mt-primary font-medium text-mt-white shadow-sm'
                      : 'font-normal text-mt-text-secondary hover:bg-mt-badge-bg hover:text-mt-text-primary'
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="relative">
        {canGoPrev ? (
          <button
            type="button"
            onClick={handleGoPrev}
            className="absolute left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-mt-border bg-mt-white text-mt-primary shadow-lg transition-transform hover:-translate-x-1 hover:scale-105 sm:-left-5 lg:-left-6 xl:-left-8 2xl:-left-14"
            aria-label="이전 프로젝트 보기"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden strokeWidth={2.2} />
          </button>
        ) : null}

        {canGoNext ? (
          <button
            type="button"
            onClick={() => void handleGoNext()}
            className="absolute right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-mt-border bg-mt-white text-mt-primary shadow-lg transition-transform hover:translate-x-1 hover:scale-105 sm:-right-5 lg:-right-6 xl:-right-8 2xl:-right-14"
            aria-label="다음 프로젝트 보기"
          >
            <ChevronRight className="h-5 w-5" aria-hidden strokeWidth={2.2} />
          </button>
        ) : null}

        {isInitialLoading ? (
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: PROJECT_WINDOW_SIZE }).map((_, index) => (
              <li key={`home-project-skeleton-${index}`}>
                <ProjectCardSkeleton />
              </li>
            ))}
          </ul>
        ) : projects.length > 0 ? (
          <div
            className="overflow-hidden [--home-gap:1rem] [--visible-count:1] md:[--visible-count:2] xl:[--visible-count:4]"
            aria-busy={isRefreshing}
          >
            <ul
              className="flex gap-4 transition-transform duration-500 ease-out will-change-transform"
              style={{
                transform: `translateX(calc(${visibleStart} * -1 * ((100% - (var(--visible-count) - 1) * var(--home-gap)) / var(--visible-count) + var(--home-gap))))`,
              }}
            >
              {projects.map((project) => (
                <li
                  key={project.id}
                  className="min-w-0 shrink-0 basis-[calc((100%-(var(--visible-count)-1)*var(--home-gap))/var(--visible-count))]"
                >
                  <ProjectCard project={project} />
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="rounded-2xl border border-mt-border bg-mt-white px-6 py-16 text-center shadow-sm">
            <p className="text-lg font-bold text-mt-text-primary">아직 프로젝트가 없어요.</p>
            <p className="mt-2 text-sm leading-5 text-mt-text-secondary">
              다른 카테고리를 선택해 프로젝트를 찾아보세요.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
