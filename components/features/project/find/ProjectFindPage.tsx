'use client';

import { ProjectFindFilters } from './ProjectFindFilters';
import { ProjectFindResults } from './ProjectFindResults';
import { useProjectFinder } from './useProjectFinder';

export default function ProjectFindPage() {
  const {
    filters,
    projects,
    countLabel,
    hasMore,
    isInitialLoading,
    isLoadingMore,
    errorMessage,
    hasActiveFilters,
    loadMoreRef,
    setSearchValue,
    setCategory,
    setRecruitOnly,
    setPlatform,
    setField,
    setSort,
    resetFilters,
    retrySearch,
  } = useProjectFinder();

  return (
    <section className="space-y-6 pb-16 pt-2">
      <h1 className="text-3xl leading-9 font-bold text-mt-text-primary">프로젝트 찾기</h1>

      <ProjectFindFilters
        searchValue={filters.searchValue}
        category={filters.category}
        recruitOnly={filters.recruitOnly}
        platform={filters.platform}
        field={filters.field}
        onSearchValueChange={setSearchValue}
        onCategoryChange={setCategory}
        onRecruitOnlyChange={setRecruitOnly}
        onPlatformChange={setPlatform}
        onFieldChange={setField}
      />

      <ProjectFindResults
        projects={projects}
        countLabel={countLabel}
        sort={filters.sort}
        isInitialLoading={isInitialLoading}
        isLoadingMore={isLoadingMore}
        hasMore={hasMore}
        hasActiveFilters={hasActiveFilters}
        errorMessage={errorMessage}
        loadMoreRef={loadMoreRef}
        onSortChange={setSort}
        onResetFilters={resetFilters}
        onRetry={retrySearch}
      />
    </section>
  );
}
