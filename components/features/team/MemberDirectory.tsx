'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { BriefcaseBusiness, Search, X } from 'lucide-react';
import ProfileAvatar from '@/components/features/profile/ProfileAvatar';
import { getMemberSummaries, type MemberSummary } from '@/components/features/profile/profileApi';
import BaseButton from '@/components/shared/BaseButton';
import SkeletonBlock from '@/components/shared/SkeletonBlock';

const ROLE_OPTIONS = [
  '전체',
  '프론트엔드',
  '백엔드',
  '디자이너',
  'PM/기획',
  'AI',
  '인프라/운영',
] as const;

export default function MemberDirectory() {
  const [members, setMembers] = useState<MemberSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [selectedRole, setSelectedRole] = useState<(typeof ROLE_OPTIONS)[number]>('전체');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [skillQuery, setSkillQuery] = useState('');
  const [sort, setSort] = useState<'projectCount' | 'name'>('projectCount');

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

  const availableSkills = useMemo(
    () => [...new Set(members.flatMap((member) => member.skills))].sort(),
    [members],
  );
  const suggestedSkills = availableSkills.filter(
    (skill) =>
      !selectedSkills.includes(skill) && skill.toLowerCase().includes(skillQuery.toLowerCase()),
  );
  const visibleMembers = useMemo(() => {
    const search = searchValue.trim().toLowerCase();
    return members
      .filter(
        (member) =>
          (!search || member.name.toLowerCase().includes(search)) &&
          (selectedRole === '전체' ||
            member.fieldCategory === (selectedRole === '디자이너' ? '디자인' : selectedRole)) &&
          selectedSkills.every((skill) => member.skills.includes(skill)),
      )
      .sort((a, b) =>
        sort === 'projectCount'
          ? b.participatedProjectCount - a.participatedProjectCount || a.name.localeCompare(b.name)
          : a.name.localeCompare(b.name),
      );
  }, [members, searchValue, selectedRole, selectedSkills, sort]);

  return (
    <section className="space-y-6 pb-10 pt-2">
      <h1 className="text-3xl font-bold leading-9 text-mt-text-primary">팀원 찾기</h1>

      <div className="space-y-6 pt-4">
        <label className="relative block">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-mt-text-secondary"
            aria-hidden
            strokeWidth={1.8}
          />
          <input
            type="search"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="이름으로 검색하세요."
            aria-label="팀원 이름 검색"
            className="h-14 w-full rounded-xl border border-mt-border bg-mt-white py-4 pl-12 pr-5 text-base text-mt-text-primary shadow-sm outline-none placeholder:text-mt-text-secondary focus:border-mt-logo-blue focus:ring-2 focus:ring-mt-logo-blue/15"
          />
        </label>

        <div className="space-y-6 rounded-2xl border border-mt-border bg-mt-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-8">
            <span className="w-16 shrink-0 text-sm font-semibold text-mt-text-primary">분야</span>
            <div className="flex flex-wrap gap-2">
              {ROLE_OPTIONS.map((role) => (
                <button
                  key={role}
                  type="button"
                  aria-pressed={selectedRole === role}
                  onClick={() => setSelectedRole(role)}
                  className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                    selectedRole === role
                      ? 'border-mt-border bg-mt-white font-bold text-mt-primary shadow-sm'
                      : 'border-transparent text-mt-text-secondary hover:bg-mt-badge-bg'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px w-full bg-mt-border" />

          <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-8">
            <span className="w-16 shrink-0 pt-3 text-sm font-semibold text-mt-text-primary">
              기술 스택
            </span>
            <div className="w-full max-w-md space-y-2">
              <input
                type="search"
                value={skillQuery}
                onChange={(event) => setSkillQuery(event.target.value)}
                placeholder="기술 스택을 추가해보세요"
                aria-label="기술 스택 검색"
                className="h-11 w-full rounded-xl border border-mt-border bg-mt-white px-4 text-sm outline-none focus:border-mt-logo-blue"
              />
              {skillQuery && suggestedSkills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {suggestedSkills.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => {
                        setSelectedSkills((current) => [...current, skill]);
                        setSkillQuery('');
                      }}
                      className="rounded-lg border border-mt-border bg-mt-bg-soft px-3 py-1 text-xs text-mt-text-primary"
                    >
                      + {skill}
                    </button>
                  ))}
                </div>
              )}
              {selectedSkills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedSkills.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() =>
                        setSelectedSkills((current) => current.filter((item) => item !== skill))
                      }
                      className="inline-flex items-center gap-1 rounded-lg bg-mt-badge-bg px-3 py-1 text-xs font-semibold text-mt-primary"
                      aria-label={`${skill} 필터 제거`}
                    >
                      {skill} <X className="h-3 w-3" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {!isLoading && !error && (
        <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-base font-semibold text-mt-text-nav">
            총 <span className="text-mt-primary">{visibleMembers.length}</span>명의 팀원
          </p>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as 'projectCount' | 'name')}
            aria-label="팀원 정렬 기준"
            className="h-10 rounded-xl border border-mt-border bg-mt-white px-3 text-sm text-mt-text-primary"
          >
            <option value="projectCount">참여 프로젝트 많은 순</option>
            <option value="name">이름순</option>
          </select>
        </div>
      )}

      {isLoading ? (
        <div
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
          aria-label="팀원 목록 불러오는 중"
        >
          {Array.from({ length: 5 }, (_, index) => (
            <SkeletonBlock key={index} className="h-72 w-full" />
          ))}
        </div>
      ) : error ? (
        <div className="space-y-4 rounded-2xl border border-mt-border bg-mt-white p-8 text-center">
          <p role="alert" className="text-sm text-mt-danger">
            {error}
          </p>
          <BaseButton onClick={() => void load()}>다시 불러오기</BaseButton>
        </div>
      ) : visibleMembers.length === 0 ? (
        <div className="rounded-2xl border border-mt-border bg-mt-white px-6 py-12 text-center text-sm text-mt-text-secondary shadow-sm">
          <p className="font-bold text-mt-text-primary">조건에 맞는 팀원이 아직 없어요.</p>
          <p className="mt-2">다른 검색어나 기술 스택으로 다시 찾아보세요.</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {visibleMembers.map((member) => (
            <li key={member.memberId}>
              <Link
                href={`/profile/${member.memberId}`}
                className="group block h-full min-h-72 rounded-2xl border border-mt-border bg-mt-white px-6 pb-10 pt-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="relative h-16 w-full">
                  <ProfileAvatar
                    name={member.name}
                    src={member.profileImageUrl}
                    sizeClassName="h-16 w-16"
                    shape="rounded"
                  />
                  <span className="absolute right-0 top-0 rounded-lg bg-mt-badge-bg px-2 py-1 text-xs font-medium text-mt-primary">
                    {member.representativePosition || member.fieldCategory}
                  </span>
                </div>
                <div className="mt-6 space-y-1">
                  <h2 className="text-base font-bold text-mt-text-primary">{member.name}</h2>
                  <div className="flex items-center gap-1.5 text-xs text-mt-text-secondary">
                    <BriefcaseBusiness className="h-3.5 w-3.5" aria-hidden strokeWidth={1.8} />
                    참여 프로젝트 {member.participatedProjectCount}개
                  </div>
                </div>
                <div className="mt-5">
                  <p className="mb-2 text-xs font-semibold text-mt-text-secondary">기술 스택</p>
                  <div className="flex flex-wrap gap-2">
                    {member.skills.slice(0, 3).map((skill) => (
                      <span
                        key={skill}
                        className="rounded-lg bg-mt-badge-bg px-2 py-1 text-xs text-mt-primary"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
