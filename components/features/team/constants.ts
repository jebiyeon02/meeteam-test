export const TEAMMATE_PAGE_COPY = {
  title: '팀원 찾기',
  searchPlaceholder: '이름으로 검색하세요.',
  skillPlaceholder: '기술 스택을 추가해보세요',
  emptyTitle: '조건에 맞는 팀원이 아직 없어요.',
  emptyDescription: '다른 검색어나 기술 스택으로 다시 찾아보세요.',
} as const;

export const TEAMMATE_ROLE_OPTIONS = [
  '전체',
  '프론트엔드',
  '백엔드',
  '디자이너',
  'PM/기획',
  'AI',
  '인프라/운영',
] as const;

export const TEAMMATE_SORT_OPTIONS = [
  { label: '참여 프로젝트 많은 순', value: 'projectCount' },
  { label: '이름순', value: 'name' },
] as const;

export const TEAMMATE_LIST_CONFIG = {
  initialVisibleCount: 15,
  loadMoreCount: 15,
  loadDelayMs: 800,
} as const;
