'use client';

import Link from 'next/link';
import {
  ChevronRight,
  CircleAlert,
  CircleCheck,
  CircleX,
  Clock3,
  UserRoundPlus,
} from 'lucide-react';
import type { NotificationCardProps, NotificationCardVariant } from './types';

const CARD_VARIANT_STYLES: Record<
  NotificationCardVariant,
  {
    containerClassName: string;
    iconWrapperClassName: string;
    icon: typeof CircleCheck;
    iconClassName: string;
    titleClassName: string;
    descriptionClassName: string;
  }
> = {
  welcome: {
    containerClassName: 'border-mt-border shadow-sm',
    iconWrapperClassName: 'bg-mt-border',
    icon: CircleCheck,
    iconClassName: 'text-mt-mint',
    titleClassName: 'text-mt-text-primary',
    descriptionClassName: 'text-mt-text-nav',
  },
  applicant: {
    containerClassName: 'border-mt-border shadow-sm',
    iconWrapperClassName: 'bg-mt-border',
    icon: UserRoundPlus,
    iconClassName: 'text-mt-primary',
    titleClassName: 'text-mt-text-primary',
    descriptionClassName: 'text-mt-text-nav',
  },
  rejected: {
    containerClassName: 'border-mt-border opacity-80',
    iconWrapperClassName: 'bg-mt-badge-bg',
    icon: CircleX,
    iconClassName: 'text-mt-hero-blue',
    titleClassName: 'text-mt-text-nav',
    descriptionClassName: 'text-mt-text-secondary',
  },
  submitted: {
    containerClassName: 'border-mt-border opacity-80',
    iconWrapperClassName: 'bg-mt-border',
    icon: Clock3,
    iconClassName: 'text-mt-text-secondary',
    titleClassName: 'text-mt-text-nav',
    descriptionClassName: 'text-mt-text-secondary',
  },
  ended: {
    containerClassName: 'border-mt-border opacity-80',
    iconWrapperClassName: 'bg-mt-border',
    icon: CircleAlert,
    iconClassName: 'text-mt-text-nav',
    titleClassName: 'text-mt-text-nav',
    descriptionClassName: 'text-mt-text-secondary',
  },
};

export function NotificationCard({
  title,
  description,
  timestamp,
  variant,
  unread = false,
  actionHref,
  actionLabel,
}: NotificationCardProps) {
  const {
    containerClassName,
    iconWrapperClassName,
    icon,
    iconClassName,
    titleClassName,
    descriptionClassName,
  } = CARD_VARIANT_STYLES[variant];
  const Icon = icon;

  return (
    <article
      className={`relative flex items-start gap-4 rounded-2xl border bg-mt-white p-5 ${containerClassName}`}
    >
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${iconWrapperClassName}`}
      >
        <Icon className={`h-6 w-6 ${iconClassName}`} aria-hidden strokeWidth={1.8} />
      </div>

      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex items-start justify-between gap-4 pr-4">
          <h2 className={`text-base leading-6 font-bold ${titleClassName}`}>{title}</h2>
          <div className="relative shrink-0 pt-1 pr-4">
            <span className="text-xs leading-4 font-medium text-mt-text-secondary">
              {timestamp}
            </span>

            {unread ? (
              <span
                className="absolute right-0 top-0 block h-2.5 w-2.5 rounded-full bg-mt-hero-blue"
                aria-hidden
              />
            ) : null}
          </div>
        </div>

        <p className={`mt-1 text-sm leading-6.5 ${descriptionClassName}`}>{description}</p>

        {actionHref && actionLabel ? (
          <Link
            href={actionHref}
            className="mt-3 inline-flex items-center gap-0.5 text-sm leading-5 font-bold text-mt-primary transition-colors hover:text-mt-primary"
          >
            {actionLabel}
            <ChevronRight className="h-4 w-4" aria-hidden strokeWidth={1.8} />
          </Link>
        ) : null}
      </div>
    </article>
  );
}
