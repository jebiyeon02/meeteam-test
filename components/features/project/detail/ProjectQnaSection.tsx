'use client';

import { type FormEvent, useEffect, useState } from 'react';
import { Check, Lock, MessageCircle } from 'lucide-react';
import { useAuthRequiredModal } from '@/components/features/auth/useAuthRequiredModal';
import BaseButton from '@/components/shared/BaseButton';
import BaseTextarea from '@/components/shared/BaseTextarea';
import ProfileAvatar from '@/components/shared/ProfileAvatar';
import SkeletonBlock from '@/components/shared/SkeletonBlock';
import ToastMessage from '@/components/shared/ToastMessage';
import { useAuthStore } from '@/stores/useAuthStore';
import type { ProjectRecord } from '@/types/project';
import {
  createProjectQnaAnswer,
  createProjectQnaQuestion,
  fetchProjectQnas,
  type ProjectQna,
  type ProjectQnaAnswer,
} from './projectQnaApi';

const QNA_PAGE_SIZE = 10;

function formatQnaDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function Avatar({
  name,
  imageUrl,
  sizeClassName = 'h-10 w-10',
}: {
  name: string;
  imageUrl: string;
  sizeClassName?: string;
}) {
  return (
    <ProfileAvatar
      name={name}
      imageUrl={imageUrl}
      sizeClassName={sizeClassName}
      textClassName="text-sm"
      className="bg-mt-border text-mt-text-secondary"
    />
  );
}

function QnaAnswerItem({ answer }: { answer: ProjectQnaAnswer }) {
  return (
    <div className="flex w-full items-start gap-3 rounded-xl bg-mt-bg-soft px-4 py-3">
      <Avatar
        name={answer.writerName}
        imageUrl={answer.writerProfileImageUrl}
        sizeClassName="h-6 w-6 text-xs"
      />

      <div className="flex min-w-0 flex-1 flex-col gap-0.5 self-stretch">
        <div className="flex w-full items-center gap-2">
          <p className="text-xs leading-4 font-bold text-mt-primary">
            {answer.isLeader ? '팀장' : answer.writerName}
          </p>
          <p className="text-xs leading-4 font-normal text-mt-text-secondary">
            {formatQnaDate(answer.createdAt)}
          </p>
        </div>
        <p className="text-sm leading-5 font-normal whitespace-pre-wrap text-mt-text-nav">
          {answer.content}
        </p>
      </div>
    </div>
  );
}

function ProjectQnaSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <article
          key={`qna-skeleton-${index}`}
          className="rounded-2xl border border-mt-border bg-mt-white px-5 py-4 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <SkeletonBlock className="h-9 w-9 rounded-full" />
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <div className="flex items-center gap-2">
                <SkeletonBlock className="h-5 w-24" />
                <SkeletonBlock className="h-4 w-20" />
              </div>
              <SkeletonBlock className="h-5 w-full" />
              <SkeletonBlock className="h-5 w-4/5" />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function AnswerComposer({
  value,
  isSubmitting,
  onChange,
  onCancel,
  onSubmit,
}: {
  value: string;
  isSubmitting: boolean;
  onChange: (value: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="w-full rounded-xl border border-mt-border bg-mt-white px-4 py-3">
      <BaseTextarea
        textareaSize="S"
        rows={2}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-20 resize-none border-transparent bg-transparent px-0 py-0 focus:border-transparent focus:ring-0"
        placeholder="답변을 입력해 주세요."
        disabled={isSubmitting}
      />
      <div className="mt-3 flex justify-end gap-2 border-t border-mt-bg-soft pt-3">
        <BaseButton
          type="button"
          size="XS"
          variant="gray"
          onClick={onCancel}
          disabled={isSubmitting}
          className="h-8 rounded-md px-3 text-xs font-semibold shadow-none hover:bg-mt-bg-soft hover:text-mt-text-primary"
        >
          취소
        </BaseButton>
        <BaseButton
          size="XS"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="h-8 rounded-md border-none bg-mt-text-primary px-3.5 text-xs font-semibold text-mt-white shadow-none hover:bg-mt-text-primary"
        >
          {isSubmitting ? '등록 중' : '답변 등록'}
        </BaseButton>
      </div>
    </div>
  );
}

function QuestionComposer({
  value,
  isSecret,
  isSubmitting,
  onChange,
  onSecretChange,
  onSubmit,
}: {
  value: string;
  isSecret: boolean;
  isSubmitting: boolean;
  onChange: (value: string) => void;
  onSecretChange: (value: boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form
      className="rounded-2xl border border-mt-border bg-mt-white px-5 py-4 shadow-sm"
      onSubmit={onSubmit}
    >
      <div className="flex items-center gap-2 text-sm leading-5 font-bold text-mt-text-primary">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-mt-badge-bg text-mt-primary">
          <MessageCircle className="h-4 w-4" aria-hidden strokeWidth={1.8} />
        </span>
        <span>질문 작성</span>
      </div>
      <BaseTextarea
        textareaSize="M"
        rows={2}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-3 min-h-20 w-full resize-none rounded-none border-transparent bg-transparent px-0 py-0 text-sm text-mt-text-primary placeholder:text-mt-text-secondary focus:border-transparent focus:ring-0"
        placeholder="프로젝트에 대해 궁금한 점을 남겨주세요."
        disabled={isSubmitting}
      />

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-mt-bg-soft pt-3">
        <label
          className={`inline-flex cursor-pointer select-none items-center gap-2 text-xs leading-4 font-bold ${
            isSecret ? 'text-mt-primary' : 'text-mt-text-secondary'
          }`}
        >
          <input
            type="checkbox"
            checked={isSecret}
            onChange={(event) => onSecretChange(event.target.checked)}
            className="peer sr-only"
            disabled={isSubmitting}
          />
          <span
            className={`flex size-4 items-center justify-center rounded-sm border p-px transition peer-focus-visible:ring-2 peer-focus-visible:ring-mt-logo-blue/30 ${
              isSecret ? 'border-mt-primary bg-mt-primary' : 'border-mt-border bg-mt-white'
            }`}
          >
            <Check
              className={`size-3.5 text-mt-white transition-opacity ${
                isSecret ? 'opacity-100' : 'opacity-0'
              }`}
              strokeWidth={3}
              aria-hidden="true"
            />
          </span>
          <span className="inline-flex items-center gap-1">
            <Lock className="size-3.5" aria-hidden strokeWidth={1.8} />
            비밀글
          </span>
        </label>
        <BaseButton
          type="submit"
          size="XS"
          disabled={isSubmitting || !value.trim()}
          className="h-8 rounded-md border-none bg-mt-text-primary px-3.5 text-xs font-semibold text-mt-white shadow-none hover:bg-mt-text-primary disabled:bg-mt-shadow-blue"
        >
          {isSubmitting ? '등록 중' : '등록'}
        </BaseButton>
      </div>
    </form>
  );
}

function AuthRequiredQuestionPrompt() {
  return (
    <div className="rounded-2xl border border-mt-border bg-mt-white px-5 py-5 shadow-sm">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-mt-badge-bg text-mt-primary">
          <Lock className="h-4 w-4" aria-hidden strokeWidth={1.8} />
        </span>
        <p className="min-w-0 text-sm leading-5 font-bold text-mt-text-primary">
          로그인 후 Q&A를 작성할 수 있어요.
        </p>
      </div>
    </div>
  );
}

function canWriteAnswer(project: ProjectRecord, qna: ProjectQna, memberId: number | null) {
  if (!memberId) {
    return false;
  }

  return memberId === qna.questionerId || memberId === project.leaderProfileId;
}

export default function ProjectQnaSection({ project }: { project: ProjectRecord }) {
  const handleAuthRequired = useAuthRequiredModal();
  const memberId = useAuthStore((state) => state.memberId);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [qnas, setQnas] = useState<ProjectQna[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [questionDraft, setQuestionDraft] = useState('');
  const [isSecretQuestion, setIsSecretQuestion] = useState(false);
  const [answerDrafts, setAnswerDrafts] = useState<Record<number, string>>({});
  const [activeAnswerQnaId, setActiveAnswerQnaId] = useState<number | null>(null);
  const [isQuestionSubmitting, setIsQuestionSubmitting] = useState(false);
  const [submittingAnswerId, setSubmittingAnswerId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadQnas = async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const result = await fetchProjectQnas(project.id, 0, QNA_PAGE_SIZE);

        if (!active) {
          return;
        }

        setQnas(result.qnas);
        setPage(result.page);
        setHasMore(result.hasMore);
      } catch (error) {
        if (!active) {
          return;
        }

        setErrorMessage(error instanceof Error ? error.message : 'Q&A 목록을 불러오지 못했습니다.');
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadQnas();

    return () => {
      active = false;
    };
  }, [project.id]);

  const replaceQna = (nextQna: ProjectQna) => {
    setQnas((current) => current.map((qna) => (qna.id === nextQna.id ? nextQna : qna)));
  };

  const handleQuestionSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isAuthenticated) {
      handleAuthRequired(new Error('로그인이 필요합니다.'), {
        redirectPath: `/projects/${project.id}`,
      });
      return;
    }

    const question = questionDraft.trim();

    if (!question) {
      setErrorMessage('질문 내용을 입력해 주세요.');
      return;
    }

    try {
      setIsQuestionSubmitting(true);
      setErrorMessage(null);

      const nextQna = await createProjectQnaQuestion(project.id, question, isSecretQuestion);

      setQnas((current) => [nextQna, ...current]);
      setQuestionDraft('');
      setIsSecretQuestion(false);
    } catch (error) {
      if (handleAuthRequired(error, { redirectPath: `/projects/${project.id}` })) {
        return;
      }

      setErrorMessage(error instanceof Error ? error.message : '질문 등록 중 오류가 발생했습니다.');
    } finally {
      setIsQuestionSubmitting(false);
    }
  };

  const handleAnswerSubmit = async (qnaId: number) => {
    const answer = answerDrafts[qnaId]?.trim() ?? '';

    if (!answer) {
      setErrorMessage('답변 내용을 입력해 주세요.');
      return;
    }

    try {
      setSubmittingAnswerId(qnaId);
      setErrorMessage(null);

      const nextQna = await createProjectQnaAnswer(project.id, qnaId, answer);

      replaceQna(nextQna);
      setAnswerDrafts((current) => ({ ...current, [qnaId]: '' }));
      setActiveAnswerQnaId(null);
    } catch (error) {
      if (handleAuthRequired(error, { redirectPath: `/projects/${project.id}` })) {
        return;
      }

      setErrorMessage(error instanceof Error ? error.message : '답변 등록 중 오류가 발생했습니다.');
    } finally {
      setSubmittingAnswerId(null);
    }
  };

  const handleLoadMore = async () => {
    if (!hasMore || isLoadingMore) {
      return;
    }

    try {
      setIsLoadingMore(true);
      setErrorMessage(null);

      const result = await fetchProjectQnas(project.id, page + 1, QNA_PAGE_SIZE);

      setQnas((current) => [...current, ...result.qnas]);
      setPage(result.page);
      setHasMore(result.hasMore);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Q&A 목록을 더 불러오지 못했습니다.',
      );
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <section className="flex w-full flex-col gap-8" data-node-id="97:1090">
      <ToastMessage message={errorMessage} />

      {isLoading ? (
        <ProjectQnaSkeleton />
      ) : qnas.length > 0 ? (
        <div className="space-y-3">
          {qnas.map((qna) => {
            const canAnswer = canWriteAnswer(project, qna, memberId);
            const isAnswerComposerOpen = activeAnswerQnaId === qna.id;

            return (
              <article
                key={qna.id}
                className="rounded-2xl border border-mt-border bg-mt-white px-5 py-4 shadow-sm"
                data-node-id="97:1455"
              >
                <div className="flex items-start gap-3" data-node-id="97:1458">
                  <Avatar
                    name={qna.questionerName}
                    imageUrl={qna.questionerProfileImageUrl}
                    sizeClassName="h-9 w-9"
                  />

                  <div className="min-w-0 flex-1">
                    <div
                      className="flex flex-wrap items-center gap-x-2 gap-y-1"
                      data-node-id="97:1459"
                    >
                      <p
                        className="text-sm leading-5 font-bold text-mt-text-primary"
                        data-node-id="97:1461"
                      >
                        {qna.questionerName}
                      </p>
                      <p
                        className="text-xs leading-4 font-normal text-mt-text-secondary"
                        data-node-id="97:1463"
                      >
                        {formatQnaDate(qna.createdAt)}
                      </p>
                      {qna.answers.length > 0 ? (
                        <span className="rounded-full bg-mt-badge-bg px-2 py-0.5 text-[10px] leading-4 font-bold text-mt-primary">
                          답변 {qna.answers.length}
                        </span>
                      ) : null}
                      {qna.isSecret ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-mt-bg-soft px-2 py-0.5 text-[10px] leading-4 font-bold text-mt-text-secondary">
                          <Lock className="size-3" aria-hidden strokeWidth={2} />
                          비밀글
                        </span>
                      ) : null}
                    </div>

                    <p
                      className="mt-2 w-full text-sm leading-6 font-normal whitespace-pre-wrap text-mt-text-nav"
                      data-node-id="97:1465"
                    >
                      {qna.question}
                    </p>
                  </div>
                </div>

                {qna.answers.length > 0 ? (
                  <div className="mt-4 space-y-2 border-t border-mt-border pt-3">
                    {qna.answers.map((answer) => (
                      <QnaAnswerItem key={answer.id} answer={answer} />
                    ))}
                  </div>
                ) : null}

                {canAnswer ? (
                  <div className="mt-3 flex justify-end">
                    {isAnswerComposerOpen ? (
                      <AnswerComposer
                        value={answerDrafts[qna.id] ?? ''}
                        isSubmitting={submittingAnswerId === qna.id}
                        onChange={(value) =>
                          setAnswerDrafts((current) => ({ ...current, [qna.id]: value }))
                        }
                        onCancel={() => setActiveAnswerQnaId(null)}
                        onSubmit={() => void handleAnswerSubmit(qna.id)}
                      />
                    ) : (
                      <BaseButton
                        size="XS"
                        variant="gray"
                        onClick={() => setActiveAnswerQnaId(qna.id)}
                        className="h-8 rounded-md px-3 text-xs font-semibold shadow-none hover:bg-mt-bg-soft hover:text-mt-text-primary"
                      >
                        답변하기
                      </BaseButton>
                    )}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-mt-border bg-mt-white px-6 py-12 text-center shadow-sm">
          <MessageCircle
            className="mx-auto h-8 w-8 text-mt-primary"
            aria-hidden
            strokeWidth={1.8}
          />
          <p className="mt-3 text-base leading-6 font-bold text-mt-text-primary">
            아직 등록된 Q&A가 없습니다.
          </p>
          <p className="mt-1 text-sm leading-5 text-mt-text-secondary">
            프로젝트에 대해 궁금한 점을 가장 먼저 남겨보세요.
          </p>
        </div>
      )}

      {hasMore ? (
        <BaseButton
          size="S"
          variant="gray"
          onClick={() => void handleLoadMore()}
          disabled={isLoadingMore}
          className="mx-auto"
        >
          {isLoadingMore ? '불러오는 중' : 'Q&A 더보기'}
        </BaseButton>
      ) : null}

      {isAuthenticated ? (
        <QuestionComposer
          value={questionDraft}
          isSecret={isSecretQuestion}
          isSubmitting={isQuestionSubmitting}
          onChange={setQuestionDraft}
          onSecretChange={setIsSecretQuestion}
          onSubmit={handleQuestionSubmit}
        />
      ) : (
        <AuthRequiredQuestionPrompt />
      )}
    </section>
  );
}
