'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import { getMyApplications, applicationStatusLabel } from '../applicationApi';
import { useProjectRequest } from '../useProjectRequest';
import ProjectRequestError from '../ProjectRequestError';
import SkeletonBlock from '@/components/shared/SkeletonBlock';

export default function MyApplicationsPage() {
  const load = useCallback(() => getMyApplications(), []);
  const { data, error, loading, retry } = useProjectRequest(load);
  if (loading) return <SkeletonBlock className="h-80 w-full" />;
  if (error || !data) return <ProjectRequestError error={error} retry={retry} />;
  return (
    <section className="mx-auto w-full max-w-4xl space-y-6 pb-16">
      <h1 className="text-2xl font-bold">내 지원 현황</h1>
      {!data.length ? (
        <p className="rounded-2xl border border-mt-border p-8 text-center text-mt-text-secondary">
          아직 지원한 프로젝트가 없습니다.
        </p>
      ) : (
        <ul className="space-y-4">
          {data.map((item) => (
            <li key={item.applicationId}>
              <Link
                href={`/projects/${item.projectId}/apply/${item.applicationId}`}
                className="block space-y-2 rounded-2xl border border-mt-border bg-mt-white p-6 hover:border-mt-primary"
              >
                <span className="text-sm font-bold text-mt-primary">
                  {applicationStatusLabel(item.status)}
                </span>
                <h2 className="text-lg font-bold">{item.projectName}</h2>
                <p className="text-sm text-mt-text-secondary">
                  {item.jobPositionName} · {item.appliedAt.slice(0, 10)} 지원
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Link href="/projects" className="text-sm text-mt-primary underline">
        프로젝트 찾기
      </Link>
    </section>
  );
}
