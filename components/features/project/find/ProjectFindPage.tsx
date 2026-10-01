'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  useInfiniteQuery,
  useQuery,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { ArrowRight, CalendarDays, Plus, Search, Users } from 'lucide-react';
import SkeletonBlock from '@/components/shared/SkeletonBlock';
import { getJobOptions } from '@/components/features/profile/profileApi';
import {
  categoryLabel,
  platformLabel,
  PROJECT_CATEGORIES,
  searchProjects,
  todayLocalDate,
  type ProjectCategory,
  type ProjectRecord,
  type ProjectSearchFilters,
} from '@/components/features/project/projectApi';

const INITIAL_FILTERS: ProjectSearchFilters = {
  keyword: '',
  category: '',
  jobField: '',
  techStackId: null,
  sort: 'latest',
};

const SELECT_CLASS =
  'h-12 w-full rounded-xl border border-mt-border bg-mt-white px-4 text-sm text-mt-text-primary outline-none focus:border-mt-primary';

function isRecruiting(project: ProjectRecord) {
  const totalCapacity = 1 + project.recruitments.reduce((sum, item) => sum + item.count, 0);
  return (
    (!project.deadline || project.deadline >= todayLocalDate()) &&
    (!project.closeWhenFull || project.currentMembers < totalCapacity)
  );
}

function ProjectCard({ project }: { project: ProjectRecord }) {
  const stackIds = [...new Set(project.recruitments.flatMap((item) => item.techStackIds))];
  return (
    <Link
      href={`/projects/${project.id}`}
      className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-mt-border bg-mt-white shadow-sm transition-shadow hover:shadow-lg"
    >
      <div className="relative flex h-40 items-end bg-linear-to-br from-mt-primary to-mt-logo-blue p-4">
        {project.imageUrl && (
          <Image src={project.imageUrl} alt="" fill unoptimized className="object-cover" />
        )}
        <span className="relative z-10 rounded-full bg-mt-white px-3 py-1 text-xs font-bold text-mt-primary">
          {categoryLabel(project.category)}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs text-mt-text-secondary">
          <span className="rounded-md bg-mt-bg-soft px-2 py-1">
            {platformLabel(project.platform)}
          </span>
          <span className={isRecruiting(project) ? 'text-mt-primary' : 'text-mt-text-secondary'}>
            {isRecruiting(project) ? '모집 중' : '마감'}
          </span>
        </div>
        <h2 className="mt-3 line-clamp-2 text-lg font-bold text-mt-text-primary group-hover:text-mt-primary">
          {project.name}
        </h2>
        <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-mt-text-secondary">
          {project.description}
        </p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {project.recruitments.map((item, index) => (
            <span
              key={`${item.jobPositionId}-${index}`}
              className="rounded-md bg-mt-badge-bg px-2 py-1 text-xs text-mt-primary"
            >
              {item.jobFieldCode === 'FRONTEND'
                ? '프론트엔드'
                : item.jobFieldCode === 'BACKEND'
                  ? '백엔드'
                  : '디자인'}{' '}
              · {item.count}명
            </span>
          ))}
          {stackIds.length > 0 && (
            <span className="rounded-md bg-mt-bg-soft px-2 py-1 text-xs text-mt-text-secondary">
              기술 {stackIds.length}개
            </span>
          )}
        </div>
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-mt-border pt-4 text-xs text-mt-text-secondary">
          <span className="truncate">{project.leaderName}</span>
          <span className="inline-flex shrink-0 items-center gap-1">
            <Users className="h-3 w-3" />
            {project.currentMembers}/
            {1 + project.recruitments.reduce((sum, item) => sum + item.count, 0)}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-1 text-xs text-mt-text-secondary">
          <CalendarDays className="h-3 w-3" />
          {project.closeWhenFull ? '정원 충족 시 마감' : `${project.deadline} 마감`}
        </div>
      </div>
    </Link>
  );
}

function ProjectFindContent() {
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState<ProjectSearchFilters>(INITIAL_FILTERS);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const optionsQuery = useQuery({
    queryKey: ['project-job-options'],
    queryFn: getJobOptions,
    retry: false,
  });
  const projectQuery = useInfiniteQuery({
    queryKey: ['project-search', filters],
    queryFn: ({ pageParam, signal }) => searchProjects(filters, pageParam, 8, signal),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    retry: false,
  });
  const { fetchNextPage, hasNextPage, isFetchingNextPage } = projectQuery;

  useEffect(() => {
    const timer = window.setTimeout(
      () => setFilters((current) => ({ ...current, keyword: searchInput })),
      300,
    );
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const element = sentinelRef.current;
    if (!element || !hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) void fetchNextPage();
      },
      { rootMargin: '300px' },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  function updateFilter<K extends keyof ProjectSearchFilters>(
    key: K,
    value: ProjectSearchFilters[K],
  ) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  const projects = projectQuery.data?.pages.flatMap((page) => page.content) ?? [];
  const totalCount = projectQuery.data?.pages[0]?.totalElements ?? 0;
  const options = optionsQuery.data?.fields ?? [];
  const selectedField = options.find((field) => field.code === filters.jobField);
  const skills = filters.jobField
    ? (selectedField?.techStacks ?? [])
    : [
        ...new Map(
          options.flatMap((field) => field.techStacks).map((skill) => [skill.id, skill]),
        ).values(),
      ];
  const loadError =
    projectQuery.error instanceof Error
      ? projectQuery.error.message
      : '프로젝트 목록을 불러오지 못했습니다.';

  return (
    <section className="space-y-7 pb-16">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-mt-text-primary">프로젝트 찾기</h1>
          <p className="mt-2 text-sm text-mt-text-secondary">
            관심 있는 프로젝트를 찾아 함께해 보세요.
          </p>
        </div>
        <Link
          href="/projects/create"
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-mt-primary px-5 text-sm font-bold text-mt-white"
        >
          <Plus className="h-4 w-4" />
          프로젝트 등록
        </Link>
      </header>

      <div className="space-y-5 rounded-2xl border border-mt-border bg-mt-white p-5 shadow-sm sm:p-6">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
          <label className="relative">
            <span className="sr-only">프로젝트 검색</span>
            <Search className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-mt-text-secondary" />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="프로젝트 이름 또는 리더 이름으로 검색하세요"
              className="h-12 w-full rounded-xl border border-mt-border bg-mt-white pl-12 pr-4 text-sm outline-none focus:border-mt-primary"
            />
          </label>
          <label>
            <span className="sr-only">카테고리</span>
            <select
              value={filters.category}
              onChange={(event) =>
                updateFilter('category', event.target.value as ProjectCategory | '')
              }
              className={SELECT_CLASS}
            >
              <option value="">모든 카테고리</option>
              {PROJECT_CATEGORIES.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-mt-border pt-5">
          <span className="mr-3 text-sm font-bold">모집 직군</span>
          <button
            type="button"
            aria-pressed={!filters.jobField}
            onClick={() => {
              updateFilter('jobField', '');
              updateFilter('techStackId', null);
            }}
            className={`rounded-full px-4 py-2 text-sm ${!filters.jobField ? 'bg-mt-badge-bg font-bold text-mt-primary' : 'text-mt-text-secondary'}`}
          >
            전체
          </button>
          {options.map((field) => (
            <button
              key={field.code}
              type="button"
              aria-pressed={filters.jobField === field.code}
              onClick={() =>
                setFilters((current) => ({ ...current, jobField: field.code, techStackId: null }))
              }
              className={`rounded-full px-4 py-2 text-sm ${filters.jobField === field.code ? 'bg-mt-badge-bg font-bold text-mt-primary' : 'text-mt-text-secondary'}`}
            >
              {field.name}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3 border-t border-mt-border pt-5">
          <label htmlFor="project-skill" className="text-sm font-bold">
            기술 스택
          </label>
          <select
            id="project-skill"
            value={filters.techStackId ?? ''}
            onChange={(event) =>
              updateFilter('techStackId', event.target.value ? Number(event.target.value) : null)
            }
            className={`${SELECT_CLASS} max-w-60`}
            disabled={optionsQuery.isPending}
          >
            <option value="">전체 기술</option>
            {skills.map((skill) => (
              <option key={skill.id} value={skill.id}>
                {skill.name}
              </option>
            ))}
          </select>
          {optionsQuery.isError && (
            <span role="alert" className="text-sm text-mt-danger">
              기술 목록을 불러오지 못했어요.
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-mt-text-secondary">
          총 <span className="text-mt-primary">{totalCount}</span>개의 프로젝트
        </p>
        <label className="flex items-center gap-2 text-sm text-mt-text-secondary">
          정렬
          <select
            value={filters.sort}
            onChange={(event) =>
              updateFilter('sort', event.target.value as ProjectSearchFilters['sort'])
            }
            className={`${SELECT_CLASS} w-36`}
          >
            <option value="latest">최신순</option>
            <option value="deadline">마감 임박순</option>
            <option value="name">이름순</option>
          </select>
        </label>
      </div>

      {projectQuery.isPending ? (
        <div aria-label="프로젝트 조회 중" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <SkeletonBlock key={index} className="h-80 w-full" />
          ))}
        </div>
      ) : null}
      {projectQuery.isError && projects.length === 0 ? (
        <div
          role="alert"
          className="rounded-2xl border border-mt-border bg-mt-white px-6 py-16 text-center"
        >
          <p className="font-bold">{loadError}</p>
          <button
            type="button"
            onClick={() => void projectQuery.refetch()}
            className="mt-5 rounded-xl bg-mt-primary px-5 py-2 text-sm font-bold text-mt-white"
          >
            다시 불러오기
          </button>
        </div>
      ) : null}
      {!projectQuery.isPending && !projectQuery.isError && projects.length === 0 ? (
        <div className="rounded-2xl border border-mt-border bg-mt-white px-6 py-16 text-center">
          <p className="font-bold">조건에 맞는 프로젝트가 아직 없어요.</p>
          <p className="mt-2 text-sm text-mt-text-secondary">검색어 또는 필터를 바꿔 보세요.</p>
          <button
            type="button"
            onClick={() => {
              setSearchInput('');
              setFilters(INITIAL_FILTERS);
            }}
            className="mt-5 rounded-xl border border-mt-border px-5 py-2 text-sm font-bold"
          >
            필터 초기화
          </button>
        </div>
      ) : null}
      {projects.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
      {projectQuery.isFetchingNextPage && (
        <div
          aria-label="다음 프로젝트 조회 중"
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          {Array.from({ length: 4 }, (_, index) => (
            <SkeletonBlock key={index} className="h-80 w-full" />
          ))}
        </div>
      )}
      {projectQuery.isFetchNextPageError && (
        <div role="alert" className="text-center text-sm text-mt-danger">
          다음 페이지를 불러오지 못했습니다.{' '}
          <button
            type="button"
            className="font-bold underline"
            onClick={() => void projectQuery.fetchNextPage()}
          >
            다시 시도
          </button>
        </div>
      )}
      {projectQuery.hasNextPage && (
        <div ref={sentinelRef} className="flex h-10 items-center justify-center" aria-hidden>
          <ArrowRight className="h-4 w-4 rotate-90 text-mt-text-secondary" />
        </div>
      )}
    </section>
  );
}

export default function ProjectFindPage() {
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } }),
  );
  return (
    <QueryClientProvider client={client}>
      <ProjectFindContent />
    </QueryClientProvider>
  );
}
