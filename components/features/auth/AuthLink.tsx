'use client';

import Link from 'next/link';
import type { ComponentProps } from 'react';

import { isProtectedPath, normalizeProtectedPath } from './protectedPaths';
import { useProtectedNavigation } from './useProtectedNavigation';

type AuthLinkProps = Omit<ComponentProps<typeof Link>, 'href'> & {
  href: string;
};

export default function AuthLink({ href, onClick, ...props }: AuthLinkProps) {
  const { hydrated, isAuthenticated, isSessionRestoring, navigateWithProtection } =
    useProtectedNavigation();

  const handleClick: ComponentProps<typeof Link>['onClick'] = (event) => {
    onClick?.(event);

    if (event.defaultPrevented) {
      return;
    }

    const normalizedHref = normalizeProtectedPath(href);

    if (!isProtectedPath(normalizedHref) || !hydrated || isSessionRestoring || isAuthenticated) {
      return;
    }

    event.preventDefault();
    void navigateWithProtection(href);
  };

  return <Link href={href} onClick={handleClick} {...props} />;
}
