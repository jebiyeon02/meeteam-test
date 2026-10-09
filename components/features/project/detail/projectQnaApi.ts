import type { ApiEnvelope } from '@/types/auth';

import { API_BASE_URL, apiFetch } from '@/components/features/auth/apiClient';
import { createApiError } from '@/components/features/auth/authError';
import { extractApiData } from '@/components/features/auth/signupTransform';

type BackendQnaAnswerResponse = {
  answerId: number;
  writerId: number;
  writerName: string;
  writerProfileImageUrl: string | null;
  isLeader?: boolean;
  leader?: boolean;
  content: string;
  createdAt: string;
};

type BackendProjectQnaResponse = {
  qnaId: number;
  questionerId: number;
  questionerName: string;
  questionerProfileImageUrl: string | null;
  question: string;
  createdAt: string;
  isSecret: boolean;
  answers: BackendQnaAnswerResponse[];
};

type BackendProjectQnaPage = {
  content: BackendProjectQnaResponse[];
  last: boolean;
  number: number;
  totalElements?: number;
};

export type ProjectQnaAnswer = {
  id: number;
  writerId: number;
  writerName: string;
  writerProfileImageUrl: string;
  isLeader: boolean;
  content: string;
  createdAt: string;
};

export type ProjectQna = {
  id: number;
  questionerId: number;
  questionerName: string;
  questionerProfileImageUrl: string;
  question: string;
  createdAt: string;
  isSecret: boolean;
  answers: ProjectQnaAnswer[];
};

export type ProjectQnaListResult = {
  qnas: ProjectQna[];
  page: number;
  hasMore: boolean;
  totalCount: number;
};

async function readEnvelope<T>(response: Response, fallbackMessage: string) {
  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!response.ok) {
    throw createApiError(response, payload, fallbackMessage);
  }

  if (!payload) {
    throw new Error('응답 형식을 해석할 수 없습니다.');
  }

  return extractApiData(payload);
}

function mapQnaAnswer(answer: BackendQnaAnswerResponse): ProjectQnaAnswer {
  return {
    id: answer.answerId,
    writerId: answer.writerId,
    writerName: answer.writerName,
    writerProfileImageUrl: answer.writerProfileImageUrl ?? '',
    isLeader: answer.isLeader ?? answer.leader ?? false,
    content: answer.content,
    createdAt: answer.createdAt,
  };
}

function mapQna(qna: BackendProjectQnaResponse): ProjectQna {
  return {
    id: qna.qnaId,
    questionerId: qna.questionerId,
    questionerName: qna.questionerName,
    questionerProfileImageUrl: qna.questionerProfileImageUrl ?? '',
    question: qna.question,
    createdAt: qna.createdAt,
    isSecret: qna.isSecret,
    answers: qna.answers.map(mapQnaAnswer),
  };
}

export async function fetchProjectQnas(
  projectId: string | number,
  page = 0,
  size = 10,
): Promise<ProjectQnaListResult> {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
    sort: 'createdAt,desc',
  });
  const response = await apiFetch(`${API_BASE_URL}/api/v1/projects/${projectId}/qna?${params}`, {
    method: 'GET',
    cache: 'no-store',
  });

  const result = await readEnvelope<BackendProjectQnaPage>(
    response,
    'Q&A 목록을 불러오지 못했습니다.',
  );

  return {
    qnas: result.content.map(mapQna),
    page: result.number,
    hasMore: !result.last,
    totalCount: result.totalElements ?? result.content.length,
  };
}

export async function createProjectQnaQuestion(
  projectId: string | number,
  question: string,
  isSecret = false,
) {
  const response = await apiFetch(`${API_BASE_URL}/api/v1/projects/${projectId}/qna`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ question, isSecret }),
  });

  const qna = await readEnvelope<BackendProjectQnaResponse>(
    response,
    '질문 등록 중 오류가 발생했습니다.',
  );

  return mapQna(qna);
}

export async function createProjectQnaAnswer(
  projectId: string | number,
  qnaId: string | number,
  answer: string,
) {
  const response = await apiFetch(
    `${API_BASE_URL}/api/v1/projects/${projectId}/qna/${qnaId}/answer`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ answer }),
    },
  );

  const qna = await readEnvelope<BackendProjectQnaResponse>(
    response,
    '답변 등록 중 오류가 발생했습니다.',
  );

  return mapQna(qna);
}
