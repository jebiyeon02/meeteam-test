import { getProjectCategoryLabel } from '@/components/features/project/constants';
import type { ProjectRecord } from '@/types/project';
import type { ProjectFinderFilters } from './types';

type ProjectCardData = {
  id: string;
  title: string;
  imageUrl: string;
  category: string;
  deadline: string;
  currentMembers: number;
  maxMembers: number;
  leader: {
    name: string;
    avatar: string;
  };
};

export const INITIAL_VISIBLE_COUNT = 8;
export const LOAD_MORE_COUNT = 4;
export const LOAD_DELAY_MS = 800;

export const RECRUIT_STATUS_OPTIONS = ['전체 상태', '모집 중만 보기'] as const;

export const PROJECT_SORT_OPTIONS = [
  { label: '최신순', value: 'latest' },
  { label: '마감임박순', value: 'deadline' },
] as const;

export function getProjectLeader(project: ProjectRecord) {
  return project.members.find((member) => member.isLeader) ?? project.members[0];
}

export function getSortedProjects(projectsById: Record<string, ProjectRecord>) {
  return Object.values(projectsById).sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  );
}

export function getFilteredProjects(projects: ProjectRecord[], filters: ProjectFinderFilters) {
  const normalizedSearch = filters.searchValue.trim().toLowerCase();

  return projects
    .filter((project) => {
      const leader = getProjectLeader(project);
      const categoryLabel = getProjectCategoryLabel(project.categoryId);
      const recruitFields = project.recruitInterests.map((item) => item.major);

      const matchesSearch =
        normalizedSearch.length === 0 ||
        project.title.toLowerCase().includes(normalizedSearch) ||
        leader?.name.toLowerCase().includes(normalizedSearch);
      const matchesCategory =
        filters.category === '모든 카테고리' || categoryLabel === filters.category;
      const matchesRecruit = filters.recruitOnly === 'all' || project.status === 'recruiting';
      const matchesPlatform =
        filters.platform === '전체' || project.releasePlatforms.includes(filters.platform);
      const matchesField = filters.field === '전체' || recruitFields.includes(filters.field);

      return matchesSearch && matchesCategory && matchesRecruit && matchesPlatform && matchesField;
    })
    .sort((left, right) => {
      if (filters.sort === 'deadline') {
        return left.recruitDeadline.localeCompare(right.recruitDeadline);
      }

      return right.createdAt.localeCompare(left.createdAt);
    });
}

export function toProjectCardData(project: ProjectRecord): ProjectCardData {
  const leader = getProjectLeader(project);

  return {
    id: project.id,
    title: project.title,
    imageUrl: project.coverImageUrl,
    category: getProjectCategoryLabel(project.categoryId),
    deadline: project.recruitDeadline,
    currentMembers: project.members.length,
    maxMembers: project.targetMemberCount,
    leader: {
      name: leader?.name ?? '팀장',
      avatar: leader?.avatarUrl ?? '',
    },
  };
}

export function hasActiveProjectFilters(filters: ProjectFinderFilters) {
  return (
    filters.searchValue.length > 0 ||
    filters.category !== '모든 카테고리' ||
    filters.recruitOnly !== 'all' ||
    filters.platform !== '전체' ||
    filters.field !== '전체' ||
    filters.sort !== 'latest'
  );
}
