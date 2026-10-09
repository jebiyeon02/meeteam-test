import type { Metadata } from 'next';

import ProjectDetailPage from '@/components/features/project/detail/ProjectDetailPage';
import { fetchProjectDetail } from '@/components/features/project/projectApi';
import { PROJECT_DETAIL_FALLBACK_IMAGE_SRC } from '@/components/features/project/projectImage';

const DEFAULT_SITE_URL = 'https://meeteam.alom-sejong.com';
const SITE_NAME = 'meeTeam';

type ProjectDetailPageParams = {
  params: Promise<{ projectId: string }>;
};

function getSiteOrigin() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (configuredUrl) {
    return configuredUrl;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return DEFAULT_SITE_URL;
}

function toAbsoluteUrl(pathOrUrl: string) {
  return new URL(pathOrUrl, getSiteOrigin()).toString();
}

function buildDescription(description: string) {
  const normalizedDescription = description.replace(/\s+/g, ' ').trim();

  if (!normalizedDescription) {
    return 'meeTeam에서 함께할 프로젝트 팀원을 확인해보세요.';
  }

  return normalizedDescription.length > 120
    ? `${normalizedDescription.slice(0, 120).trim()}...`
    : normalizedDescription;
}

export async function generateMetadata({ params }: ProjectDetailPageParams): Promise<Metadata> {
  const { projectId } = await params;

  try {
    const project = await fetchProjectDetail(
      projectId,
      process.env.MEETEAM_API_BASE_URL ??
        'https://remedy-wrapping-mileage-circuits.trycloudflare.com',
    );
    const title = `${project.title} | ${SITE_NAME}`;
    const description = buildDescription(project.description);
    const pageUrl = toAbsoluteUrl(`/projects/${projectId}`);
    const imageUrl = toAbsoluteUrl(project.coverImageUrl || PROJECT_DETAIL_FALLBACK_IMAGE_SRC);

    return {
      metadataBase: new URL(getSiteOrigin()),
      title,
      description,
      alternates: {
        canonical: pageUrl,
      },
      openGraph: {
        title,
        description,
        url: pageUrl,
        siteName: SITE_NAME,
        type: 'website',
        images: [
          {
            url: imageUrl,
            alt: project.title,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [imageUrl],
      },
    };
  } catch {
    const title = `프로젝트 상세 | ${SITE_NAME}`;
    const description = 'meeTeam에서 함께할 프로젝트 팀원을 확인해보세요.';
    const pageUrl = toAbsoluteUrl(`/projects/${projectId}`);
    const imageUrl = toAbsoluteUrl(PROJECT_DETAIL_FALLBACK_IMAGE_SRC);

    return {
      metadataBase: new URL(getSiteOrigin()),
      title,
      description,
      alternates: {
        canonical: pageUrl,
      },
      openGraph: {
        title,
        description,
        url: pageUrl,
        siteName: SITE_NAME,
        type: 'website',
        images: [
          {
            url: imageUrl,
            alt: SITE_NAME,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [imageUrl],
      },
    };
  }
}

export default async function Page({ params }: ProjectDetailPageParams) {
  const { projectId } = await params;

  return <ProjectDetailPage projectId={projectId} />;
}
