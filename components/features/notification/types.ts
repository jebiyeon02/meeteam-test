export type NotificationType =
  | 'PROJECT_APPLY'
  | 'PROJECT_MY_APPLY'
  | 'PROJECT_APPROVE'
  | 'PROJECT_REJECT'
  | 'PROJECT_END';

export type NotificationCardVariant = 'welcome' | 'applicant' | 'rejected' | 'submitted' | 'ended';

export interface NotificationCardProps {
  title: string;
  description: string;
  timestamp: string;
  variant: NotificationCardVariant;
  unread?: boolean;
  actionHref?: string;
  actionLabel?: string;
}

export interface NotificationItem extends NotificationCardProps {
  id: string;
  type: NotificationType;
  createdAt: string;
  applicationId?: number | null;
}
