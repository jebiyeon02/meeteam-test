'use client';

import { useCallback, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, CalendarDays, ExternalLink, Users } from 'lucide-react';
import SkeletonBlock from '@/components/shared/SkeletonBlock';
import { getJobOptions } from '@/components/features/profile/profileApi';
import { categoryLabel, getProject, platformLabel } from '@/components/features/project/projectApi';
import ProjectRequestError from '../ProjectRequestError';
import { useProjectRequest } from '../useProjectRequest';
import ProjectActionButtons from './ProjectActionButtons';
import ProjectQnaSection from './ProjectQnaSection';
import { isRecruitmentOpen, isProjectOpen } from '../applicationApi';
import { useAuthStore } from '@/stores/useAuthStore';

export default function ProjectSummaryPage({ projectId }: { projectId: number }) {
  const [tab, setTab] = useState('intro');
  const userId = useAuthStore((state) => state.user?.memberId);
  const load = useCallback(async () => {
    const [project, options] = await Promise.all([getProject(projectId), getJobOptions()]);
    return { project, options };
  }, [projectId]);
  const { data, error, loading, retry } = useProjectRequest(load);
  if (loading) return <SkeletonBlock className="h-96 w-full" />;
  if (error || !data) return <ProjectRequestError error={error} retry={retry} />;
  const { project, options } = data;

  const positions = options.fields.flatMap((field) => field.positions);
  const skills = options.fields.flatMap((field) => field.techStacks);

  return (
    <article className="mx-auto max-w-5xl space-y-7 pb-16">
      <Link
        href="/projects"
        className="inline-flex items-center gap-2 text-sm text-mt-text-secondary hover:text-mt-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        프로젝트 찾기로
      </Link>
      <div className="relative flex min-h-60 flex-col justify-end overflow-hidden rounded-3xl bg-linear-to-br from-mt-primary to-mt-logo-blue p-8 text-mt-white">
        {project.imageUrl && (
          <Image src={project.imageUrl} alt="" fill unoptimized className="object-cover" />
        )}
        <div className="relative z-10">
          <span className="rounded-full bg-mt-white px-3 py-1 text-xs font-bold text-mt-primary">
            {categoryLabel(project.category)}
          </span>
          <h1 className="mt-4 text-3xl font-bold">{project.name}</h1>
          <p className="mt-2 text-sm">
            {platformLabel(project.platform)} ·{' '}
            <Link href={`/profile/${project.leaderId}`} className="underline">
              리더 {project.leaderName}
            </Link>{' '}
            · {isProjectOpen(project) ? '모집 중' : '모집 마감'}
          </p>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-6">
          <div
            role="tablist"
            aria-label="프로젝트 상세"
            className="flex gap-2 border-b border-mt-border"
          >
            {[
              ['intro', '프로젝트 소개'],
              ['recruit', '모집 정보'],
              ['qna', 'Q&A'],
            ].map(([value, label]) => (
              <button
                key={value}
                role="tab"
                id={`tab-${value}`}
                aria-selected={tab === value}
                aria-controls={`panel-${value}`}
                onClick={() => setTab(value)}
                className={`border-b-2 px-4 py-3 text-sm font-bold ${tab === value ? 'border-mt-primary text-mt-primary' : 'border-transparent text-mt-text-secondary'}`}
              >
                {label}
              </button>
            ))}
          </div>
          {tab === 'intro' && (
            <section
              role="tabpanel"
              id="panel-intro"
              aria-labelledby="tab-intro"
              className="rounded-2xl border border-mt-border bg-mt-white p-6"
            >
              <h2 className="text-xl font-bold">프로젝트 소개</h2>
              <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-mt-text-secondary">
                {project.description}
              </p>
            </section>
          )}
          {tab === 'recruit' && (
            <section
              role="tabpanel"
              id="panel-recruit"
              aria-labelledby="tab-recruit"
              className="rounded-2xl border border-mt-border bg-mt-white p-6"
            >
              <h2 className="text-xl font-bold">모집 정보</h2>
              <div className="mt-5 space-y-4">
                {project.recruitments.map((item, index) => (
                  <div
                    key={`${item.jobPositionId}-${index}`}
                    className="rounded-xl bg-mt-bg-soft p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-bold">
                        {item.jobPositionName ??
                          positions.find((position) => position.id === item.jobPositionId)?.name ??
                          '모집 직무'}
                      </h3>
                      <span className="text-sm text-mt-text-secondary">
                        {item.currentCount ?? 0}/{item.count}명 ·{' '}
                        {isProjectOpen(project) && isRecruitmentOpen(item) ? '모집 중' : '마감'}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(item.techStackNames?.length
                        ? item.techStackNames
                        : item.techStackIds.map(
                            (id) => skills.find((skill) => skill.id === id)?.name ?? '기술',
                          )
                      ).map((name, index) => (
                        <span
                          key={`${name}-${index}`}
                          className="rounded-full bg-mt-badge-bg px-3 py-1 text-xs text-mt-primary"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
          {tab === 'qna' && (
            <div role="tabpanel" id="panel-qna" aria-labelledby="tab-qna">
              <ProjectQnaSection key={`${projectId}-${userId}`} projectId={projectId} />
            </div>
          )}
        </div>
        <aside className="h-fit space-y-4 rounded-2xl border border-mt-border bg-mt-white p-6">
          <p className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-mt-primary" />
            현재 {project.currentMembers}명 참여
          </p>
          <p className="flex items-center gap-2 text-sm">
            <CalendarDays className="h-4 w-4 text-mt-primary" />
            {project.closeWhenFull ? '정원 충족 시 자동 마감' : `${project.deadline} 모집 마감`}
          </p>
          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-mt-primary"
            >
              <ExternalLink className="h-4 w-4" />
              GitHub 저장소
            </a>
          )}
          {project.communicationUrl && (
            <a
              href={project.communicationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-mt-primary"
            >
              <ExternalLink className="h-4 w-4" />
              소통 채널
            </a>
          )}
          <ProjectActionButtons key={`${projectId}-${userId}`} project={project} />
        </aside>
      </div>
    </article>
  );
}
