import Link from 'next/link';
import { ApiError } from '@/components/features/auth/authApi';
import BaseButton from '@/components/shared/BaseButton';

export default function ProjectRequestError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <section
      role="alert"
      className="space-y-4 rounded-2xl border border-mt-border bg-mt-white p-8 text-center"
    >
      <h1 className="text-xl font-bold">
        {error instanceof ApiError && error.status === 404
          ? '존재하지 않는 프로젝트 또는 지원서입니다'
          : '정보를 불러오지 못했습니다'}
      </h1>
      <p className="text-sm text-mt-text-secondary">
        {error instanceof Error ? error.message : '네트워크 연결을 확인해 주세요.'}
      </p>
      <BaseButton onClick={retry}>다시 시도</BaseButton>
      <Link href="/projects" className="ml-4 text-sm text-mt-primary underline">
        프로젝트 찾기로
      </Link>
    </section>
  );
}
