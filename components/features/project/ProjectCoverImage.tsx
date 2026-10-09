'use client';

import { useState } from 'react';

import { getProjectDetailImageSrc, PROJECT_DETAIL_FALLBACK_IMAGE_SRC } from './projectImage';

type ProjectCoverImageProps = {
  src?: string | null;
  alt: string;
  priority?: boolean;
  className?: string;
  imageClassName?: string;
  fallbackImageClassName?: string;
  overlayClassName?: string;
  roundedClassName?: string;
};

export default function ProjectCoverImage({
  src,
  alt,
  priority = false,
  className = '',
  imageClassName = '',
  fallbackImageClassName = '',
  overlayClassName = '',
  roundedClassName = 'rounded-4xl',
}: ProjectCoverImageProps) {
  const requestedSrc = getProjectDetailImageSrc(src);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const resolvedSrc = failedSrc === requestedSrc ? PROJECT_DETAIL_FALLBACK_IMAGE_SRC : requestedSrc;
  const isFallbackImage = resolvedSrc === PROJECT_DETAIL_FALLBACK_IMAGE_SRC;

  return (
    <div
      className={`relative aspect-[1200/630] w-full overflow-hidden bg-mt-bg-soft ${roundedClassName} ${className}`}
    >
      <img
        src={resolvedSrc}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        className={`absolute inset-0 !h-full !w-full object-cover ${imageClassName} ${
          isFallbackImage ? fallbackImageClassName : ''
        }`}
        onError={() => {
          if (!isFallbackImage) {
            setFailedSrc(requestedSrc);
          }
        }}
      />

      {overlayClassName && !isFallbackImage ? (
        <div className={`pointer-events-none absolute inset-0 ${overlayClassName}`} />
      ) : null}
    </div>
  );
}
