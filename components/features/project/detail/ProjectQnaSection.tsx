'use client';

import { useCallback, useState } from 'react';
import { getProjectQnas, type ProjectQna } from '../applicationApi';
import { useProjectRequest } from '../useProjectRequest';
import ProjectRequestError from '../ProjectRequestError';
import BaseButton from '@/components/shared/BaseButton';
import SkeletonBlock from '@/components/shared/SkeletonBlock';

export default function ProjectQnaSection({ projectId }: { projectId: number }) {
  const [page, setPage] = useState(0);
  const [previous, setPrevious] = useState<ProjectQna[]>([]);
  const load = useCallback(() => getProjectQnas(projectId, page), [projectId, page]);
  const { data, error, loading, retry } = useProjectRequest(load);
  const qnas = [...previous, ...(data?.content ?? [])];
  return (
    <section className="space-y-4 rounded-2xl border border-mt-border bg-mt-white p-6">
      <h2 className="text-xl font-bold">Q&A</h2>
      {qnas.map((item) => (
        <article key={item.qnaId} className="space-y-3 rounded-xl bg-mt-bg-soft p-4">
          <p className="text-sm font-bold">{item.questionerName}</p>
          <p className="whitespace-pre-wrap text-sm">
            {item.question ?? (item.isSecret ? '비밀 질문입니다.' : '질문 내용이 없습니다.')}
          </p>
          {item.answers?.map((answer) => (
            <div key={answer.answerId} className="border-l-2 border-mt-primary pl-4">
              <p className="text-xs font-bold">{answer.writerName}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm">{answer.content}</p>
            </div>
          ))}
        </article>
      ))}
      {loading ? (
        <SkeletonBlock className="h-28 w-full" />
      ) : error ? (
        <ProjectRequestError error={error} retry={retry} />
      ) : !qnas.length ? (
        <p className="text-sm text-mt-text-secondary">아직 등록된 질문이 없습니다.</p>
      ) : data && !data.last ? (
        <BaseButton
          variant="gray"
          onClick={() => {
            setPrevious(qnas);
            setPage(data.number + 1);
          }}
        >
          더 보기
        </BaseButton>
      ) : null}
    </section>
  );
}
