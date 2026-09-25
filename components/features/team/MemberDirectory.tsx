'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import ProfileAvatar from '@/components/features/profile/ProfileAvatar';
import { getMemberSummaries, type MemberSummary } from '@/components/features/profile/profileApi';
import BaseButton from '@/components/shared/BaseButton';
import SkeletonBlock from '@/components/shared/SkeletonBlock';
import { useAuthStore } from '@/stores/useAuthStore';

export default function MemberDirectory() {
  const myId = useAuthStore((state) => state.user?.memberId);
  const [members, setMembers] = useState<MemberSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      setMembers(await getMemberSummaries());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '팀원 목록을 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className="mx-auto w-full max-w-5xl space-y-6">
      <header>
        <p className="text-sm font-semibold text-mt-primary">프로필 탐색</p>
        <h1 className="mt-1 text-3xl font-bold">팀원 찾기</h1>
        <p className="mt-2 text-sm text-mt-text-secondary">
          데모 팀원의 공개 프로필을 확인할 수 있습니다. 개인정보와 수정 기능은 본인 프로필에만
          표시됩니다.
        </p>
      </header>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2" aria-label="팀원 목록 불러오는 중">
          <SkeletonBlock className="h-48 w-full" />
          <SkeletonBlock className="h-48 w-full" />
        </div>
      ) : error ? (
        <div className="space-y-4 rounded-2xl border border-mt-border bg-mt-white p-6">
          <p role="alert" className="text-sm text-mt-danger">
            {error}
          </p>
          <BaseButton onClick={() => void load()}>다시 시도</BaseButton>
        </div>
      ) : members.length === 0 ? (
        <p className="rounded-2xl border border-mt-border bg-mt-white p-6 text-mt-text-secondary">
          등록된 팀원이 없습니다.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {members.map((member) => (
            <Link
              key={member.memberId}
              href={`/profile/${member.memberId}`}
              className="group rounded-2xl border border-mt-border bg-mt-white p-6 transition-colors hover:bg-mt-bg-soft"
            >
              <div className="flex items-start gap-4">
                <ProfileAvatar name={member.name} src={member.profileImageUrl} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="truncate text-xl font-bold">
                      {member.name}
                      {member.memberId === myId && (
                        <span className="ml-2 text-xs font-normal text-mt-text-secondary">
                          내 프로필
                        </span>
                      )}
                    </h2>
                    <ArrowUpRight className="h-5 w-5 shrink-0 text-mt-primary" />
                  </div>
                  <p className="mt-1 text-sm text-mt-text-secondary">
                    {member.representativePosition || '직군 미등록'}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-mt-primary">
                    {member.isParticipating ? '프로젝트 참여 가능' : '현재 참여 어려움'}
                  </p>
                </div>
              </div>
              {member.skills.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {member.skills.slice(0, 3).map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-mt-border px-3 py-1 text-xs text-mt-text-secondary"
                    >
                      {skill}
                    </span>
                  ))}
                  {member.skills.length > 3 && (
                    <span className="px-2 py-1 text-xs text-mt-text-secondary">
                      +{member.skills.length - 3}
                    </span>
                  )}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
