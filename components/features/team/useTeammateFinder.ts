'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useInfiniteScroll } from '@/components/shared/useInfiniteScroll';
import { fetchJobOptions } from '@/components/features/auth/signupApi';
import { collectTechStackNames } from '@/components/features/auth/jobOptionUtils';
import type { Teammate } from '@/types/team';
import { fetchTeammates, type TeammateSort } from './teamApi';
import { TEAMMATE_LIST_CONFIG, TEAMMATE_ROLE_OPTIONS } from './constants';

const TEAMMATE_LIST_ERROR_MESSAGE = '팀원 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.';
const TEAMMATE_LOAD_MORE_ERROR_MESSAGE = '팀원을 더 불러오지 못했어요. 잠시 후 다시 시도해 주세요.';

const JOB_FIELD_ID_BY_CODE: Record<string, number> = {
  PLANNING: 1,
  DESIGN: 2,
  FRONTEND: 3,
  BACKEND: 4,
  AI: 5,
  INFRA_OPERATION: 6,
};

const JOB_FIELD_CODE_BY_ROLE: Partial<Record<(typeof TEAMMATE_ROLE_OPTIONS)[number], string>> = {
  프론트엔드: 'FRONTEND',
  백엔드: 'BACKEND',
  디자이너: 'DESIGN',
  'PM/기획': 'PLANNING',
  AI: 'AI',
  '인프라/운영': 'INFRA_OPERATION',
};

export function useTeammateFinder() {
  const [teammates, setTeammates] = useState<Teammate[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [selectedRole, setSelectedRole] = useState<(typeof TEAMMATE_ROLE_OPTIONS)[number]>('전체');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [sort, setSort] = useState<TeammateSort>('projectCount');
  const [availableSkills, setAvailableSkills] = useState<string[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    let active = true;

    const loadSkillOptions = async () => {
      try {
        const nextJobFields = await fetchJobOptions();

        if (!active) {
          return;
        }

        setAvailableSkills(collectTechStackNames(nextJobFields));
      } catch {
        if (active) {
          setAvailableSkills([]);
        }
      }
    };

    void loadSkillOptions();

    return () => {
      active = false;
    };
  }, []);

  const selectedJobFieldId = useMemo(() => resolveJobFieldId(selectedRole), [selectedRole]);

  useEffect(() => {
    let active = true;

    const loadTeammates = async () => {
      try {
        if (!hasLoadedRef.current) {
          setIsInitialLoading(true);
        }

        setErrorMessage(null);

        const result = await fetchTeammates({
          name: searchValue,
          jobFieldId: selectedJobFieldId,
          techStackNames: selectedSkills,
          sort,
          page: 0,
          size: TEAMMATE_LIST_CONFIG.initialVisibleCount,
        });

        if (!active) {
          return;
        }

        setTeammates(result.teammates);
        setTotalCount(result.totalCount);
        setCurrentPage(result.page);
        setHasMore(!result.last);
        hasLoadedRef.current = true;
      } catch {
        if (!active) {
          return;
        }

        if (!hasLoadedRef.current) {
          setTeammates([]);
          setTotalCount(0);
          setHasMore(false);
        }

        setErrorMessage(TEAMMATE_LIST_ERROR_MESSAGE);
      } finally {
        if (active) {
          setIsInitialLoading(false);
        }
      }
    };

    void loadTeammates();

    return () => {
      active = false;
    };
  }, [retryKey, searchValue, selectedJobFieldId, selectedSkills, sort]);

  const handleLoadMore = useCallback(() => {
    if (!hasMore || isLoadingMore || isInitialLoading) {
      return;
    }

    const loadNextPage = async () => {
      try {
        setIsLoadingMore(true);
        setErrorMessage(null);

        const result = await fetchTeammates({
          name: searchValue,
          jobFieldId: selectedJobFieldId,
          techStackNames: selectedSkills,
          sort,
          page: currentPage + 1,
          size: TEAMMATE_LIST_CONFIG.initialVisibleCount,
        });

        setTeammates((current) => [...current, ...result.teammates]);
        setTotalCount(result.totalCount);
        setCurrentPage(result.page);
        setHasMore(!result.last);
      } catch {
        setErrorMessage(TEAMMATE_LOAD_MORE_ERROR_MESSAGE);
      } finally {
        setIsLoadingMore(false);
      }
    };

    void loadNextPage();
  }, [
    currentPage,
    hasMore,
    isInitialLoading,
    isLoadingMore,
    searchValue,
    selectedJobFieldId,
    selectedSkills,
    sort,
  ]);

  const loadMoreRef = useInfiniteScroll({
    hasMore,
    isLoading: isLoadingMore,
    onLoadMore: handleLoadMore,
  });

  const retrySearch = () => {
    setErrorMessage(null);
    setRetryKey((current) => current + 1);
  };

  return {
    searchValue,
    selectedRole,
    selectedSkills,
    sort,
    availableSkills,
    visibleTeammates: teammates,
    filteredTeammatesCount: totalCount,
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
  };
}

function resolveJobFieldId(role: (typeof TEAMMATE_ROLE_OPTIONS)[number]) {
  if (role === '전체') {
    return undefined;
  }

  const jobFieldCode = JOB_FIELD_CODE_BY_ROLE[role];

  if (!jobFieldCode) {
    return undefined;
  }

  return JOB_FIELD_ID_BY_CODE[jobFieldCode];
}
