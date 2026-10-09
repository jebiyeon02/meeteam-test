'use client';

import { useCallback, type ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { searchProjects } from '@/components/features/project/projectApi';
import { ProjectCard } from '@/components/features/project/find/ProjectFindPage';
import { useProjectRequest } from '@/components/features/project/useProjectRequest';
import ProfileAvatar from '@/components/features/profile/ProfileAvatar';
import BaseButton from '@/components/shared/BaseButton';
import SkeletonBlock from '@/components/shared/SkeletonBlock';
import { getHomeMembers } from './homeApi';

function HomeSection({
  title,
  description,
  href,
  children,
}: {
  title: string;
  description: string;
  href: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="mt-2 text-sm text-mt-text-secondary">{description}</p>
        </div>
        <Link
          href={href}
          className="inline-flex items-center gap-1 text-sm font-bold text-mt-primary"
        >
          전체 보기 <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </header>
      {children}
    </section>
  );
}

function LoadingCards() {
  return (
    <div aria-label="목록 불러오는 중" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }, (_, index) => (
        <SkeletonBlock key={index} className="h-60 w-full rounded-2xl" />
      ))}
    </div>
  );
}

function LoadError({ message, retry }: { message: string; retry: () => void }) {
  return (
    <div role="alert" className="space-y-4 rounded-2xl border border-mt-border p-8 text-center">
      <p className="text-sm text-mt-text-secondary">{message}</p>
      <BaseButton variant="gray" onClick={retry}>
        다시 시도
      </BaseButton>
    </div>
  );
}

export function HomeProjectsSection() {
  const load = useCallback(
    () =>
      searchProjects(
        { keyword: '', category: '', jobField: '', techStackId: null, sort: 'latest' },
        0,
        4,
      ),
    [],
  );
  const { data, loading, error, retry } = useProjectRequest(load);
  return (
    <HomeSection
      title="새로 등록된 프로젝트"
      description="새로운 도전을 함께할 프로젝트를 찾아보세요."
      href="/projects"
    >
      {loading ? (
        <LoadingCards />
      ) : error ? (
        <LoadError
          message="프로젝트를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."
          retry={retry}
        />
      ) : data?.content.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {data.content.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="space-y-3 rounded-2xl border border-mt-border bg-mt-bg-soft p-8 text-center">
          <p className="font-bold">첫 프로젝트의 리더가 되어보세요</p>
          <p className="text-sm text-mt-text-secondary">
            아직 등록된 프로젝트가 없습니다. 아이디어를 소개하고 함께할 팀원을 모집해 보세요.
          </p>
          <Link
            href="/projects/create"
            className="inline-flex text-sm font-bold text-mt-primary underline"
          >
            프로젝트 등록하기
          </Link>
        </div>
      )}
    </HomeSection>
  );
}

export function HomeMembersSection() {
  const load = useCallback(() => getHomeMembers(), []);
  const { data, loading, error, retry } = useProjectRequest(load);
  return (
    <HomeSection
      title="함께할 팀원"
      description="다양한 관심 분야와 기술을 가진 팀원을 만나보세요."
      href="/teammates"
    >
      {loading ? (
        <LoadingCards />
      ) : error ? (
        <LoadError
          message="팀원 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요."
          retry={retry}
        />
      ) : data?.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {data.map((member) => (
            <Link
              key={member.memberId}
              href={`/profile/${member.memberId}`}
              className="flex min-w-0 flex-col gap-4 rounded-2xl border border-mt-border bg-mt-white p-5 transition-shadow hover:shadow-lg"
            >
              <div className="flex items-center gap-3">
                <ProfileAvatar
                  name={member.name}
                  src={member.profileImageUrl}
                  sizeClassName="h-12 w-12"
                />
                <div className="min-w-0">
                  <h3 className="truncate font-bold">{member.name}</h3>
                  <p className="truncate text-sm text-mt-text-secondary">
                    {member.representativePosition || '관심 분야 미등록'}
                  </p>
                </div>
              </div>
              <p className="text-xs text-mt-text-secondary">
                참여 프로젝트 {member.participatedProjectCount}개
              </p>
              <div className="flex flex-wrap gap-2">
                {member.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full bg-mt-badge-bg px-3 py-1 text-xs text-mt-primary"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="space-y-3 rounded-2xl border border-mt-border bg-mt-bg-soft p-8 text-center">
          <p className="font-bold">새로운 만남을 준비하고 있어요</p>
          <p className="text-sm text-mt-text-secondary">
            아직 등록된 팀원이 없습니다. 프로필을 작성하고 함께할 동료를 기다려 보세요.
          </p>
          <Link href="/profile" className="inline-flex text-sm font-bold text-mt-primary underline">
            내 프로필 작성하기
          </Link>
        </div>
      )}
    </HomeSection>
  );
}
