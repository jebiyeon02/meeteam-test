import type {
  FINDER_CATEGORY_OPTIONS,
  FINDER_FIELD_OPTIONS,
  FINDER_PLATFORM_OPTIONS,
} from '@/components/features/project/constants';

export type PlatformFilter = (typeof FINDER_PLATFORM_OPTIONS)[number];
export type FieldFilter = (typeof FINDER_FIELD_OPTIONS)[number];
export type RecruitFilter = 'all' | 'recruiting';
export type SortFilter = 'latest' | 'deadline';
export type CategoryFilter = (typeof FINDER_CATEGORY_OPTIONS)[number];

export type ProjectFinderFilters = {
  searchValue: string;
  category: CategoryFilter;
  recruitOnly: RecruitFilter;
  platform: PlatformFilter;
  field: FieldFilter;
  sort: SortFilter;
};
