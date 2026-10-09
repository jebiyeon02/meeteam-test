import Image from 'next/image';

import type { UniversityId } from '@/types/university';

import { getUniversityLogo } from './universityLogoRegistry';

type UniversityLogoProps = {
  universityId: UniversityId;
  variant?: 'signature' | 'icon';
  className?: string;
  priority?: boolean;
};

export default function UniversityLogo({
  universityId,
  variant = 'signature',
  className = '',
  priority = false,
}: UniversityLogoProps) {
  const logo = getUniversityLogo(universityId);
  const src = variant === 'icon' ? logo.iconSrc : logo.signatureSrc;
  const width = variant === 'icon' ? logo.iconWidth : logo.signatureWidth;
  const height = variant === 'icon' ? logo.iconHeight : logo.signatureHeight;
  const alt = variant === 'icon' ? `${logo.nameKo} 아이콘` : `${logo.nameKo} 로고`;

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      className={className}
    />
  );
}
