'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import SkeletonBlock from '@/components/shared/SkeletonBlock';
import ProfileAvatar from '@/components/features/profile/ProfileAvatar';
import {
  getMemberDetail,
  type MemberDetailResponse,
} from '@/components/features/profile/profileApi';
import { useAuthStore } from '@/stores/useAuthStore';

export default function PublicProfile({ userId }: { userId: string }) {
  const myId = useAuthStore((state) => state.user?.memberId);
  const [profile, setProfile] = useState<MemberDetailResponse | null>(null);
  const [error, setError] = useState('');
  const memberId = Number(userId);
  const isValidId = Number.isSafeInteger(memberId) && memberId > 0;

  useEffect(() => {
    if (!isValidId) return;
    let active = true;
    getMemberDetail(memberId)
      .then((result) => {
        if (active) {
          setProfile(result);
          setError('');
        }
      })
      .catch((reason: unknown) => {
        if (active)
          setError(reason instanceof Error ? reason.message : '프로필을 불러오지 못했습니다.');
      });
    return () => {
      active = false;
    };
  }, [isValidId, memberId]);

  if (!isValidId) {
    return (
      <p
        role="alert"
        className="rounded-2xl border border-mt-border bg-mt-white p-6 text-mt-danger"
      >
        유효하지 않은 프로필 주소입니다.
      </p>
    );
  }

  if (error && profile?.memberId !== memberId) {
    return (
      <p
        role="alert"
        className="rounded-2xl border border-mt-border bg-mt-white p-6 text-mt-danger"
      >
        {error}
      </p>
    );
  }

  if (!profile || profile.memberId !== memberId) {
    return (
      <section className="space-y-4" aria-label="공개 프로필 불러오는 중">
        <SkeletonBlock className="h-10 w-48" />
        <SkeletonBlock className="h-48 w-full" />
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-3xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <ProfileAvatar name={profile.name} src={profile.profileImageUrl} />
          <div>
            <p className="text-sm font-semibold text-mt-primary">공개 프로필</p>
            <h1 className="mt-1 text-3xl font-bold">{profile.name}</h1>
            <p className="mt-2 text-mt-text-secondary">
              {profile.representativePosition || profile.jobPositions.join(' · ') || '직군 미등록'}
            </p>
          </div>
        </div>
        {myId === profile.memberId && (
          <Link
            href="/profile"
            className="rounded-xl border border-mt-border px-4 py-2 text-sm font-bold text-mt-primary"
          >
            내 프로필 수정
          </Link>
        )}
      </header>
      <div className="space-y-6 rounded-2xl border border-mt-border bg-mt-white p-6">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-mt-badge-bg px-3 py-1 text-sm text-mt-primary">
            {profile.isParticipating ? '프로젝트 참여 가능' : '현재 참여 어려움'}
          </span>
          <span className="rounded-full bg-mt-bg-soft px-3 py-1 text-sm text-mt-text-secondary">
            참여 프로젝트 {profile.participatedProjectCount ?? 0}개
          </span>
        </div>
        <div>
          <h2 className="text-lg font-bold">자기소개</h2>
          <p className="mt-2 whitespace-pre-wrap text-mt-text-secondary">
            {profile.introduce || '아직 자기소개가 없습니다.'}
          </p>
        </div>
        <div>
          <h2 className="text-lg font-bold">관심 직군</h2>
          <p className="mt-2 text-mt-text-secondary">
            {profile.jobPositions.join(', ') || '등록된 직군이 없습니다.'}
          </p>
        </div>
        <div>
          <h2 className="text-lg font-bold">기술 스택</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {profile.skills.length ? (
              profile.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full border border-mt-border px-3 py-1 text-sm"
                >
                  {skill}
                </span>
              ))
            ) : (
              <p className="text-mt-text-secondary">등록된 기술 스택이 없습니다.</p>
            )}
          </div>
        </div>
        {(profile.githubUrl || profile.blogUrl) && (
          <div className="flex flex-wrap gap-4 border-t border-mt-border pt-5">
            {[
              ['GitHub', profile.githubUrl],
              ['블로그', profile.blogUrl],
            ].map(([label, url]) =>
              url && /^https?:\/\//.test(url) ? (
                <a
                  key={label}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-mt-primary"
                >
                  {label} <ExternalLink className="h-4 w-4" />
                </a>
              ) : null,
            )}
          </div>
        )}
      </div>
    </section>
  );
}
