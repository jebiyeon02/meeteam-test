import type { Metadata } from 'next';
import { Jua } from 'next/font/google';
import AuthSessionBootstrap from '@/components/features/auth/AuthSessionBootstrap';
import LoginPromptModal from '@/components/features/auth/LoginPromptModal';
import ToastViewport from '@/components/shared/ToastViewport';
import ApiProvider from '@/components/features/auth/ApiProvider';

import './globals.css';

const jua = Jua({
  variable: '--font-brand-display',
  subsets: ['latin'],
  weight: '400',
});

const DEFAULT_SITE_URL = 'https://meeteam.alom-sejong.com';
const SITE_NAME = '미팀 - meeTeam';
const SITE_DESCRIPTION = '대학생 전용 팀빌딩 플랫폼';
const OG_IMAGE = '/brand/meeteam_logo_hat.png';

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

export const metadata: Metadata = {
  metadataBase: new URL(getSiteOrigin()),
  applicationName: SITE_NAME,
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: '/',
    siteName: SITE_NAME,
    type: 'website',
    locale: 'ko_KR',
    images: [
      {
        url: OG_IMAGE,
        width: 1536,
        height: 1024,
        alt: 'meeTeam 로고',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${jua.variable} antialiased`}>
        <ApiProvider>
          <AuthSessionBootstrap />
          {children}
          <LoginPromptModal />
          <ToastViewport />
        </ApiProvider>
      </body>
    </html>
  );
}
