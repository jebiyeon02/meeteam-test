'use client';

import type { RefObject } from 'react';
import { ProjectCard } from '@/components/features/project/ProjectCard';
import { ProjectCardSkeleton } from '@/components/features/project/ProjectCardSkeleton';
import SortSelect from '@/components/shared/SortSelect';
import ToastMessage from '@/components/shared/ToastMessage';
import { PROJECT_SORT_OPTIONS } from './projectFinder';
import type { ProjectSearchCard } from './projectFindApi';
import type { SortFilter } from './types';

type ProjectFindResultsProps = {
  projects: ProjectSearchCard[];
  countLabel: string;
  sort: SortFilter;
  isInitialLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  hasActiveFilters: boolean;
  errorMessage: string | null;
  loadMoreRef: RefObject<HTMLDivElement | null>;
  onSortChange: (value: SortFilter) => void;
  onResetFilters: () => void;
  onRetry: () => void;
};

export function ProjectFindResults({
  projects,
  countLabel,
  sort,
  isInitialLoading,
  isLoadingMore,
  hasMore,
  hasActiveFilters,
  errorMessage,
  loadMoreRef,
  onSortChange,
  onResetFilters,
  onRetry,
}: ProjectFindResultsProps) {
  const shouldShowErrorOnly = !isInitialLoading && Boolean(errorMessage) && projects.length === 0;

  return (
    <>
      <ToastMessage message={shouldShowErrorOnly ? null : errorMessage} />

      {!shouldShowErrorOnly ? (
        <div className="flex flex-col gap-4 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p
            data-cy="project-total-count"
            className="text-base leading-6 font-semibold text-mt-text-nav"
          >
            총 <span className="text-mt-primary">{countLabel}</span>개의 프로젝트
          </p>

          <SortSelect
            value={sort}
            options={PROJECT_SORT_OPTIONS}
            onChange={onSortChange}
            dataCy="project-sort-select"
          />
        </div>
      ) : null}

      {isInitialLoading ? (
        <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <li key={`project-initial-skeleton-${index}`}>
              <ProjectCardSkeleton />
            </li>
          ))}
        </ul>
      ) : shouldShowErrorOnly ? (
        <div
          data-cy="project-error-state"
          className="rounded-2xl border border-mt-border bg-mt-white px-6 py-16 text-center shadow-sm"
          role="alert"
        >
          <p className="text-lg font-bold text-mt-text-primary">{errorMessage}</p>
          <p className="mt-2 text-sm leading-5 text-mt-text-secondary">
            네트워크 상태를 확인한 뒤 다시 시도해 주세요.
          </p>
          <button
            type="button"
            onClick={onRetry}
            data-cy="project-retry-button"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-xl border border-mt-border px-5 text-sm font-semibold text-mt-text-primary transition-colors hover:bg-mt-bg-soft"
          >
            다시 불러오기
          </button>
        </div>
      ) : projects.length > 0 ? (
        <ul data-cy="project-list" className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {projects.map((project) => (
            <li key={project.id}>
              <ProjectCard project={project} />
            </li>
          ))}
        </ul>
      ) : (
        <div
          data-cy="project-empty-state"
          className="rounded-2xl border border-mt-border bg-mt-white px-6 py-16 text-center shadow-sm"
        >
          <p className="text-lg font-bold text-mt-text-primary">
            조건에 맞는 프로젝트가 아직 없어요.
          </p>
          <p className="mt-2 text-sm leading-5 text-mt-text-secondary">
            검색어 또는 필터를 조금 넓혀서 다시 찾아보세요.
          </p>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={onResetFilters}
              data-cy="project-reset-filters"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-xl border border-mt-border px-5 text-sm font-semibold text-mt-text-primary transition-colors hover:bg-mt-bg-soft"
            >
              필터 초기화
            </button>
          ) : null}
        </div>
      )}

      {isLoadingMore ? (
        <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <li key={`project-skeleton-${index}`}>
              <ProjectCardSkeleton />
            </li>
          ))}
        </ul>
      ) : null}

      {hasMore ? (
        <div
          ref={loadMoreRef}
          data-cy="project-load-more-trigger"
          className="h-6 w-full"
          aria-hidden
        />
      ) : null}
    </>
  );
}
