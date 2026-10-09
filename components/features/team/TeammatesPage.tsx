'use client';

import { TEAMMATE_PAGE_COPY } from './constants';
import { TeammateFinderPanel } from './TeammateFinderPanel';
import { TeammateListSection } from './TeammateListSection';
import { useTeammateFinder } from './useTeammateFinder';

export default function TeammatesPage() {
  const {
    searchValue,
    selectedRole,
    selectedSkills,
    sort,
    availableSkills,
    visibleTeammates,
    filteredTeammatesCount,
    isInitialLoading,
    isLoadingMore,
    errorMessage,
    hasMore,
    loadMoreRef,
    retrySearch,
    setSearchValue,
    setSelectedRole,
    setSelectedSkills,
    setSort,
  } = useTeammateFinder();

  return (
    <section className="space-y-6 pb-10 pt-2">
      <h1 className="text-3xl leading-9 font-bold text-mt-text-primary">
        {TEAMMATE_PAGE_COPY.title}
      </h1>

      <TeammateFinderPanel
        searchValue={searchValue}
        selectedRole={selectedRole}
        selectedSkills={selectedSkills}
        availableSkills={availableSkills}
        onSearchChange={setSearchValue}
        onRoleChange={setSelectedRole}
        onSelectedSkillsChange={setSelectedSkills}
      />

      <TeammateListSection
        teammates={visibleTeammates}
        totalCount={filteredTeammatesCount}
        sort={sort}
        isInitialLoading={isInitialLoading}
        isLoadingMore={isLoadingMore}
        hasMore={hasMore}
        errorMessage={errorMessage}
        loadMoreRef={loadMoreRef}
        onRetry={retrySearch}
        onSortChange={setSort}
      />
    </section>
  );
}
