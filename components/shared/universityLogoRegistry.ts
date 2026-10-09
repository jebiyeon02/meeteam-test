import type { UniversityId, UniversityLogoAsset } from '@/types/university';

export const UNIVERSITY_LOGOS: Record<UniversityId, UniversityLogoAsset> = {
  sejong: {
    id: 'sejong',
    nameKo: '세종대학교',
    nameEn: 'Sejong University',
    domains: ['sju.ac.kr', 'sejong.ac.kr'],
    signatureSrc: '/universities/sejong/signature-en.png',
    signatureWidth: 463,
    signatureHeight: 61,
    signatureSourceUrl: 'https://pr.sejong.ac.kr/_res/sejong/news/img/promotion/img-logo05.png',
    iconSrc: '/universities/sejong/icon.png',
    iconWidth: 1254,
    iconHeight: 1254,
    iconSourceUrl:
      '/Users/yeonjun/.codex/generated_images/019dbb29-19fe-7ac0-9ef3-4833770d1a2e/ig_0e80cad3f9a4e7500169ea851127588191a08d78e471644dad.png',
    sourcePageUrl: 'https://pr.sejong.ac.kr/news/promotion/basic-element.do',
  },
};

export function getUniversityLogo(universityId: UniversityId) {
  return UNIVERSITY_LOGOS[universityId];
}

export function findUniversityByEmail(email: string | null | undefined) {
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    return null;
  }

  const domain = normalizedEmail.split('@').at(1);

  if (!domain) {
    return null;
  }

  return (
    Object.values(UNIVERSITY_LOGOS).find((university) => university.domains.includes(domain)) ??
    null
  );
}
