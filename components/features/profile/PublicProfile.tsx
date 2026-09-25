'use client';

import { useEffect, useState } from 'react';
import SkeletonBlock from '@/components/shared/SkeletonBlock';
import ProfileView from '@/components/features/profile/ProfileView';
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
    <ProfileView
      name={profile.name}
      imageUrl={profile.profileImageUrl}
      role={profile.representativePosition || profile.jobPositions.join(' · ') || null}
      skills={profile.skills}
      isParticipating={profile.isParticipating ?? false}
      introduction={profile.introduce ?? ''}
      projectCount={profile.participatedProjectCount ?? 0}
      projects={profile.participatedProjects ?? []}
      githubUrl={profile.githubUrl}
      blogUrl={profile.blogUrl}
      editHref={myId === profile.memberId ? '/profile' : undefined}
    />
  );
}
