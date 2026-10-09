'use client';

import { useState } from 'react';

interface ProfileAvatarProps {
  name: string;
  imageUrl?: string | null;
  sizeClassName?: string;
  shape?: 'circle' | 'rounded';
  textClassName?: string;
  className?: string;
  imageClassName?: string;
}

export default function ProfileAvatar({
  name,
  imageUrl,
  sizeClassName = 'h-9 w-9',
  shape = 'circle',
  textClassName = 'text-base',
  className = '',
  imageClassName = '',
}: ProfileAvatarProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const fallbackLabel = name.trim().slice(0, 1) || '?';
  const shapeClassName = shape === 'rounded' ? 'rounded-3xl' : 'rounded-full';
  const resolvedImageUrl = imageUrl && imageUrl !== failedUrl ? imageUrl : null;

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden bg-mt-badge-bg text-mt-primary ${sizeClassName} ${shapeClassName} ${className}`}
      aria-hidden
    >
      {resolvedImageUrl ? (
        <img
          alt={name}
          className={`h-full w-full object-cover ${imageClassName}`}
          src={resolvedImageUrl}
          onError={() => setFailedUrl(resolvedImageUrl)}
        />
      ) : (
        <span className={`font-bold leading-none ${textClassName}`}>{fallbackLabel}</span>
      )}
    </span>
  );
}
