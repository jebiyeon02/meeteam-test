'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, CalendarDays, ExternalLink, Users } from 'lucide-react';
import SkeletonBlock from '@/components/shared/SkeletonBlock';
import { getJobOptions, type JobOption } from '@/components/features/profile/profileApi';
import {
  categoryLabel,
  getProject,
  platformLabel,
  type ProjectRecord,
} from '@/components/features/project/projectApi';

export default function ProjectSummaryPage({ projectId }: { projectId: number }) {
  const [project, setProject] = useState<ProjectRecord | null>(null);
  const [options, setOptions] = useState<JobOption | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    Promise.all([getProject(projectId), getJobOptions()])
      .then(([nextProject, nextOptions]) => {
        if (active) {
          setProject(nextProject);
          setOptions(nextOptions);
        }
      })
      .catch((cause: unknown) => {
        if (active)
          setError(cause instanceof Error ? cause.message : '프로젝트를 불러오지 못했습니다.');
      });
    return () => {
      active = false;
    };
  }, [projectId]);

  if (error)
    return (
      <div
        role="alert"
        className="rounded-2xl border border-mt-border p-8 text-center text-mt-danger"
      >
        {error}
        <div className="mt-4">
          <Link href="/projects" className="text-sm underline">
            프로젝트 찾기로
          </Link>
        </div>
      </div>
    );
  if (!project || !options) return <SkeletonBlock className="h-96 w-full" />;

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
            {platformLabel(project.platform)} · 리더 {project.leaderName}
          </p>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-mt-border bg-mt-white p-6">
            <h2 className="text-xl font-bold">프로젝트 소개</h2>
            <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-mt-text-secondary">
              {project.description}
            </p>
          </section>
          <section className="rounded-2xl border border-mt-border bg-mt-white p-6">
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
                    <span className="text-sm text-mt-text-secondary">{item.count}명 모집</span>
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
          <p className="border-t border-mt-border pt-4 text-xs text-mt-text-secondary">
            지원·상세 모집 기능은 다음 주차에 연결될 예정입니다.
          </p>
        </aside>
      </div>
    </article>
  );
}
