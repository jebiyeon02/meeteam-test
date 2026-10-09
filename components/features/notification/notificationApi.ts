import type { ApiEnvelope } from '@/types/auth';

import { API_BASE_URL, apiFetch } from '@/components/features/auth/apiClient';
import { createApiError } from '@/components/features/auth/authError';
import { extractApiData } from '@/components/features/auth/signupTransform';

import type { NotificationCardVariant, NotificationItem, NotificationType } from './types';

export const NOTIFICATION_API_BASE_URL = API_BASE_URL;

const NOTIFICATION_PAGE_SIZE = 20;

export const NOTIFICATION_EVENT_TYPES = [
  'PROJECT_APPLY',
  'PROJECT_MY_APPLY',
  'PROJECT_APPROVE',
  'PROJECT_REJECT',
  'PROJECT_END',
] satisfies NotificationType[];

type BackendNotificationPayload = {
  projectId?: number | null;
  projectName?: string | null;
  receiverId?: number | null;
  receiverName?: string | null;
  applicationId?: number | null;
  applicantId?: number | null;
  applicantName?: string | null;
  memberId?: number | null;
  approvalResult?: 'APPROVED' | 'REJECTED' | string | null;
  date?: string | null;
  localDate?: string | null;
  occurredAt?: string | null;
};

type BackendNotificationResponse = {
  id: number;
  type: NotificationType;
  message?: string | null;
  isRead?: boolean;
  read?: boolean;
  createdAt: string;
  applicationId?: number | null;
  payload?: BackendNotificationPayload | null;
};

type BackendNotificationSlice = {
  content: BackendNotificationResponse[];
  last: boolean;
  first?: boolean;
  number: number;
  size?: number;
  numberOfElements?: number;
  empty?: boolean;
};

type BackendNotificationUnreadCountResponse = {
  unReadCount?: number;
  unreadCount?: number;
};

type BackendSseEnvelope = {
  type?: NotificationType | null;
  data?: BackendNotificationPayload | null;
  createdAt?: string | null;
};

export type NotificationListResult = {
  notifications: NotificationItem[];
  page: number;
  hasMore: boolean;
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

export async function fetchNotifications(page = 0, size = NOTIFICATION_PAGE_SIZE) {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  });

  const response = await apiFetch(`${NOTIFICATION_API_BASE_URL}/api/v1/notifications?${params}`, {
    method: 'GET',
    cache: 'no-store',
  });

  const result = await readEnvelope<BackendNotificationSlice>(
    response,
    '알림 목록을 불러오지 못했습니다.',
  );

  return {
    notifications: result.content.map(mapBackendNotification),
    page: result.number,
    hasMore: !result.last,
  } satisfies NotificationListResult;
}

export async function fetchUnreadNotificationCount() {
  const response = await apiFetch(
    `${NOTIFICATION_API_BASE_URL}/api/v1/notifications/unread/count`,
    {
      method: 'GET',
      cache: 'no-store',
    },
  );

  const result = await readEnvelope<BackendNotificationUnreadCountResponse>(
    response,
    '읽지 않은 알림 수를 불러오지 못했습니다.',
  );

  return result.unReadCount ?? result.unreadCount ?? 0;
}

export function mapNotificationEvent(event: MessageEvent<string>): NotificationItem | null {
  const envelope = parseNotificationEnvelope(event.data);
  const type = envelope?.type;

  if (!type || !isNotificationType(type)) {
    return null;
  }

  const payload = envelope.data ?? {};
  const createdAt =
    envelope.createdAt ?? payload.date ?? payload.localDate ?? payload.occurredAt ?? '';
  const timestamp = formatNotificationTimestamp(createdAt);
  const copy = getNotificationCopy(type, payload);

  return {
    id: event.lastEventId || `${type}-${Date.now()}`,
    type,
    createdAt,
    applicationId: payload.applicationId ?? null,
    unread: true,
    timestamp,
    ...copy,
  };
}

function parseNotificationEnvelope(data: string) {
  try {
    return JSON.parse(data) as BackendSseEnvelope;
  } catch {
    return null;
  }
}

function mapBackendNotification(notification: BackendNotificationResponse): NotificationItem {
  const payload = notification.payload ?? {};
  const copy = getNotificationCopy(notification.type, payload, notification.message);
  const isRead = notification.isRead ?? notification.read ?? false;

  return {
    id: String(notification.id),
    type: notification.type,
    createdAt: notification.createdAt,
    applicationId: notification.applicationId ?? payload.applicationId ?? null,
    unread: !isRead,
    timestamp: formatNotificationTimestamp(notification.createdAt),
    ...copy,
  };
}

function isNotificationType(value: string): value is NotificationType {
  return NOTIFICATION_EVENT_TYPES.some((type) => type === value);
}

function getNotificationCopy(
  type: NotificationType,
  payload: BackendNotificationPayload,
  message?: string | null,
): {
  title: string;
  description: string;
  variant: NotificationCardVariant;
  actionHref?: string;
  actionLabel?: string;
} {
  const projectName = payload.projectName?.trim() || '프로젝트';
  const projectHref = payload.projectId ? `/projects/${payload.projectId}` : '/projects';

  switch (type) {
    case 'PROJECT_APPLY': {
      const applicantName = payload.applicantName?.trim() || '새 지원자';

      return {
        title: '새로운 지원자가 있습니다.',
        description:
          message ??
          `${applicantName}님이 '${projectName}' 프로젝트에 지원했습니다. 프로필과 지원서를 확인해보세요.`,
        variant: 'applicant',
        actionHref: payload.projectId
          ? `/projects/${payload.projectId}/manage/applicants`
          : '/projects',
        actionLabel: '지원자 확인',
      };
    }
    case 'PROJECT_MY_APPLY':
      return {
        title: '지원이 완료되었습니다.',
        description:
          message ??
          `'${projectName}' 프로젝트 지원이 접수되었습니다. 결과는 알림으로 알려드릴게요.`,
        variant: 'submitted',
        actionHref: projectHref,
        actionLabel: '프로젝트 보기',
      };
    case 'PROJECT_APPROVE':
      return {
        title: '프로젝트 합류가 승인되었습니다.',
        description:
          message ??
          `'${projectName}' 프로젝트 지원이 승인되었습니다. 팀 리더와 대화를 시작해보세요.`,
        variant: 'welcome',
        actionHref: projectHref,
        actionLabel: '프로젝트 보기',
      };
    case 'PROJECT_REJECT':
      return {
        title: '지원 결과 안내',
        description:
          message ??
          `'${projectName}' 프로젝트 지원이 아쉽게도 거절되었습니다. 다른 멋진 팀들이 기다리고 있어요.`,
        variant: 'rejected',
        actionHref: '/projects',
        actionLabel: '다른 프로젝트 보기',
      };
    case 'PROJECT_END':
      return {
        title: '프로젝트가 종료되었습니다.',
        description: message ?? `'${projectName}' 프로젝트가 종료되었습니다.`,
        variant: 'ended',
        actionHref: '/projects',
        actionLabel: '프로젝트 찾기',
      };
  }
}

function formatNotificationTimestamp(value: string) {
  if (!value) {
    return '방금 전';
  }

  const date = new Date(value.includes('T') ? value : `${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const targetStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diffDays = Math.floor((todayStart - targetStart) / 86_400_000);

  if (diffDays <= 0) {
    return '오늘';
  }

  if (diffDays === 1) {
    return '어제';
  }

  if (diffDays < 7) {
    return `${diffDays}일 전`;
  }

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}
