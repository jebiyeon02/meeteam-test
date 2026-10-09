'use client';

import { useCallback, useEffect, useState } from 'react';
import { RotateCw } from 'lucide-react';
import SkeletonBlock from '@/components/shared/SkeletonBlock';
import ToastMessage from '@/components/shared/ToastMessage';
import { NotificationCard } from './NotificationCard';
import { fetchNotifications } from './notificationApi';
import { useNotificationStore } from './store';
import type { NotificationItem } from './types';

const NOTIFICATION_PAGE_SIZE = 20;

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const latestNotification = useNotificationStore((state) => state.latestNotification);
  const setGlobalUnreadCount = useNotificationStore((state) => state.setUnreadCount);
  const unreadCount = notifications.filter((notification) => notification.unread).length;

  const loadNotifications = useCallback(
    async (nextPage = 0) => {
      const isFirstPage = nextPage === 0;

      try {
        if (isFirstPage) {
          setIsLoading(true);
        } else {
          setIsLoadingMore(true);
        }

        setErrorMessage(null);

        const result = await fetchNotifications(nextPage, NOTIFICATION_PAGE_SIZE);

        setNotifications((current) =>
          isFirstPage ? result.notifications : [...current, ...result.notifications],
        );
        setPage(result.page);
        setHasMore(result.hasMore);

        if (isFirstPage) {
          setGlobalUnreadCount(0);
        }
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : '알림 목록을 불러오지 못했습니다.',
        );
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [setGlobalUnreadCount],
  );

  useEffect(() => {
    void loadNotifications(0);
  }, [loadNotifications]);

  useEffect(() => {
    if (!latestNotification) {
      return;
    }

    setNotifications((current) => {
      if (current.some((notification) => notification.id === latestNotification.id)) {
        return current;
      }

      return [latestNotification, ...current];
    });
  }, [latestNotification]);

  const handleMarkAllRead = () => {
    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        unread: false,
      })),
    );
    setGlobalUnreadCount(0);
  };

  return (
    <section className="px-4 py-6 sm:px-6 sm:py-8">
      <ToastMessage message={errorMessage} />

      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl leading-9 font-bold text-mt-text-primary">알림 센터</h1>
            <span className="inline-flex items-center rounded-full border border-mt-border bg-mt-white px-3 py-1 text-sm leading-5 font-medium text-mt-text-secondary">
              {unreadCount}개의 안 읽은 알림
            </span>
          </div>

          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            className="w-fit text-sm leading-5 font-semibold text-mt-primary transition-colors hover:text-mt-primary"
          >
            모두 읽음 처리
          </button>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <>
              <SkeletonBlock className="h-30 w-full rounded-2xl" />
              <SkeletonBlock className="h-30 w-full rounded-2xl" />
              <SkeletonBlock className="h-30 w-full rounded-2xl" />
            </>
          ) : null}

          {!isLoading && notifications.length === 0 ? (
            <div className="rounded-2xl border border-mt-border bg-mt-white px-5 py-12 text-center">
              <p className="text-base leading-6 font-bold text-mt-text-primary">
                도착한 알림이 없습니다.
              </p>
              <p className="mt-2 text-sm leading-5 text-mt-text-secondary">
                프로젝트 지원과 팀 합류 소식이 생기면 이곳에 표시됩니다.
              </p>
            </div>
          ) : null}

          {!isLoading
            ? notifications.map((notification) => (
                <NotificationCard key={notification.id} {...notification} />
              ))
            : null}
        </div>

        {hasMore && !isLoading ? (
          <button
            type="button"
            onClick={() => void loadNotifications(page + 1)}
            disabled={isLoadingMore}
            className="mx-auto inline-flex h-10 w-fit items-center justify-center gap-2 rounded-xl border border-mt-border bg-mt-white px-4 text-sm leading-5 font-bold text-mt-text-secondary shadow-sm transition-colors hover:text-mt-text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RotateCw className="h-4 w-4" aria-hidden strokeWidth={1.8} />
            {isLoadingMore ? '불러오는 중' : '더보기'}
          </button>
        ) : null}
      </div>
    </section>
  );
}
