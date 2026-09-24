'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import BaseButton from '@/components/shared/BaseButton';
import BaseField from '@/components/shared/BaseField';
import BaseInput from '@/components/shared/BaseInput';
import BaseTextarea from '@/components/shared/BaseTextarea';
import SkeletonBlock from '@/components/shared/SkeletonBlock';
import {
  getJobOptions,
  getMemberDetail,
  getMyProfile,
  updateMyProfile,
  type JobOption,
  type MyProfileResponse,
} from '@/components/features/profile/profileApi';
import { profileFormSchema, type ProfileFormValues } from '@/components/features/profile/schema';
import { useAuthStore } from '@/stores/useAuthStore';
import { useToastStore } from '@/stores/useToastStore';

function ageFromBirthDate(value: string | null) {
  if (!value) return '';
  const [year, month, day] = value.split('-').map(Number);
  const now = new Date();
  const age =
    now.getFullYear() -
    year -
    (now.getMonth() + 1 < month || (now.getMonth() + 1 === month && now.getDate() < day) ? 1 : 0);
  return String(age);
}

function toggleId(ids: number[], id: number) {
  return ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id];
}

function isSameForm(a: ProfileFormValues, b: ProfileFormValues) {
  return (
    a.name === b.name &&
    a.age === b.age &&
    a.gender === b.gender &&
    a.isParticipating === b.isParticipating &&
    a.introduction === b.introduction &&
    a.githubUrl === b.githubUrl &&
    a.blogUrl === b.blogUrl &&
    [...a.jobPositionIds].sort().join(',') === [...b.jobPositionIds].sort().join(',') &&
    [...a.techStackIds].sort().join(',') === [...b.techStackIds].sort().join(',')
  );
}

export default function ProfileEditor() {
  const showToast = useToastStore((state) => state.showToast);
  const setUser = useAuthStore((state) => state.setUser);
  const [profile, setProfile] = useState<MyProfileResponse | null>(null);
  const [options, setOptions] = useState<JobOption | null>(null);
  const [form, setForm] = useState<ProfileFormValues | null>(null);
  const [original, setOriginal] = useState<ProfileFormValues | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadError, setLoadError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const [myProfile, jobOptions] = await Promise.all([getMyProfile(), getJobOptions()]);
      const detail = await getMemberDetail(myProfile.memberId);
      const positions = jobOptions.fields.flatMap((field) => field.positions);
      const skills = [
        ...new Map(
          jobOptions.fields.flatMap((field) => field.techStacks).map((skill) => [skill.id, skill]),
        ).values(),
      ];
      const jobPositionIds = detail.jobPositions
        .map((name) => positions.find((position) => position.name === name)?.id)
        .filter((id): id is number => id !== undefined);
      const techStackIds = myProfile.skills
        .map((name) => skills.find((skill) => skill.name === name)?.id)
        .filter((id): id is number => id !== undefined);

      if (
        jobPositionIds.length !== detail.jobPositions.length ||
        techStackIds.length !== myProfile.skills.length
      ) {
        throw new Error(
          '프로필의 직군 또는 기술 스택을 선택 목록과 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.',
        );
      }

      const nextForm: ProfileFormValues = {
        name: myProfile.name,
        age: ageFromBirthDate(myProfile.birthDate) || String(detail.age ?? ''),
        gender: myProfile.gender ?? 'MALE',
        jobPositionIds,
        techStackIds,
        isParticipating: myProfile.isParticipating ?? false,
        introduction: myProfile.introduce ?? '',
        githubUrl: myProfile.githubUrl ?? '',
        blogUrl: myProfile.blogUrl ?? '',
      };
      setProfile(myProfile);
      setOptions(jobOptions);
      setForm(nextForm);
      setOriginal(nextForm);
      setImage(null);
      setErrors({});
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : '프로필을 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const positionOptions = useMemo(
    () => options?.fields.flatMap((field) => field.positions) ?? [],
    [options],
  );
  const skillOptions = useMemo(
    () => [
      ...new Map(
        (options?.fields.flatMap((field) => field.techStacks) ?? []).map((skill) => [
          skill.id,
          skill,
        ]),
      ).values(),
    ],
    [options],
  );
  const isDirty = Boolean(form && original && (!isSameForm(form, original) || image));

  function change<K extends keyof ProfileFormValues>(key: K, value: ProfileFormValues[K]) {
    setForm((current) => (current ? { ...current, [key]: value } : current));
    setErrors((current) => ({ ...current, [key]: '' }));
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form || !isDirty) return;
    const parsed = profileFormSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(
        Object.fromEntries(parsed.error.issues.map((issue) => [issue.path[0], issue.message])),
      );
      return;
    }

    setErrors({});
    setIsSaving(true);
    try {
      await updateMyProfile(
        {
          name: parsed.data.name,
          age: Number(parsed.data.age),
          gender: parsed.data.gender,
          jobPositionIds: parsed.data.jobPositionIds,
          techStacks: parsed.data.techStackIds.map((id, index) => ({
            id,
            displayOrder: index + 1,
          })),
          isParticipating: parsed.data.isParticipating,
          introduction: parsed.data.introduction,
          githubUrl: parsed.data.githubUrl,
          blogUrl: parsed.data.blogUrl,
        },
        image,
      );
      setForm({ ...parsed.data });
      setOriginal({ ...parsed.data });
      setImage(null);
      setUser({ memberId: profile!.memberId, name: parsed.data.name });
      showToast({ tone: 'success', message: '프로필을 저장했습니다.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : '프로필 저장에 실패했습니다.';
      setErrors({ form: message });
      showToast({ tone: 'error', message });
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <section className="mx-auto w-full max-w-3xl space-y-4" aria-label="프로필 불러오는 중">
        <SkeletonBlock className="h-10 w-48" />
        <SkeletonBlock className="h-40 w-full" />
        <SkeletonBlock className="h-64 w-full" />
      </section>
    );
  }

  if (loadError || !form || !profile) {
    return (
      <section className="mx-auto max-w-lg space-y-4 rounded-2xl border border-mt-border bg-mt-white p-8 text-center">
        <h1 className="text-xl font-bold">프로필을 불러오지 못했습니다</h1>
        <p role="alert" className="text-sm text-mt-danger">
          {loadError}
        </p>
        <BaseButton onClick={() => void load()}>다시 시도</BaseButton>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-3xl space-y-6">
      <header>
        <p className="text-sm font-semibold text-mt-primary">내 프로필</p>
        <h1 className="mt-1 text-3xl font-bold">프로필 수정</h1>
        <p className="mt-2 text-sm text-mt-text-secondary">
          내 정보와 프로젝트 참여 상태를 관리할 수 있습니다.
        </p>
      </header>
      <form
        onSubmit={(event) => void handleSave(event)}
        className="space-y-8 rounded-2xl border border-mt-border bg-mt-white p-6 sm:p-8"
        noValidate
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <BaseField label="이름" htmlFor="profile-name" errorText={errors.name}>
            <BaseInput
              id="profile-name"
              value={form.name}
              onChange={(event) => change('name', event.target.value)}
              aria-invalid={Boolean(errors.name)}
            />
          </BaseField>
          <BaseField
            label="이메일"
            htmlFor="profile-email"
            hintText="이메일은 여기서 수정할 수 없습니다."
          >
            <BaseInput id="profile-email" value={profile.email} disabled />
          </BaseField>
          <BaseField label="나이" htmlFor="profile-age" errorText={errors.age}>
            <BaseInput
              id="profile-age"
              inputMode="numeric"
              value={form.age}
              onChange={(event) => change('age', event.target.value)}
              aria-invalid={Boolean(errors.age)}
            />
          </BaseField>
          <BaseField label="성별" htmlFor="profile-gender" errorText={errors.gender}>
            <select
              id="profile-gender"
              value={form.gender}
              onChange={(event) =>
                change('gender', event.target.value as ProfileFormValues['gender'])
              }
              className="w-full rounded-xl border border-mt-border bg-mt-white px-4 py-3 text-sm"
            >
              <option value="MALE">남성</option>
              <option value="FEMALE">여성</option>
            </select>
          </BaseField>
        </div>
        <BaseField
          label="프로필 이미지"
          htmlFor="profile-image"
          required={false}
          hintText={image?.name || '변경할 이미지를 선택해 주세요.'}
        >
          <input
            id="profile-image"
            type="file"
            accept="image/*"
            onChange={(event) => setImage(event.target.files?.[0] ?? null)}
            className="block w-full text-sm text-mt-text-secondary file:mr-4 file:rounded-xl file:border-0 file:bg-mt-badge-bg file:px-4 file:py-2 file:font-semibold file:text-mt-primary"
          />
        </BaseField>
        <fieldset className="space-y-3">
          <legend className="text-lg font-bold">관심 직군</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {positionOptions.map((position) => (
              <label
                key={position.id}
                className="flex items-center gap-2 rounded-xl border border-mt-border px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={form.jobPositionIds.includes(position.id)}
                  onChange={() =>
                    change('jobPositionIds', toggleId(form.jobPositionIds, position.id))
                  }
                  className="accent-mt-primary"
                />
                {position.name}
              </label>
            ))}
          </div>
          {errors.jobPositionIds && (
            <p role="alert" className="text-sm text-mt-danger">
              {errors.jobPositionIds}
            </p>
          )}
        </fieldset>
        <fieldset className="space-y-3">
          <legend className="text-lg font-bold">기술 스택</legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {skillOptions.map((skill) => (
              <label
                key={skill.id}
                className="flex items-center gap-2 rounded-xl border border-mt-border px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={form.techStackIds.includes(skill.id)}
                  onChange={() => change('techStackIds', toggleId(form.techStackIds, skill.id))}
                  className="accent-mt-primary"
                />
                {skill.name}
              </label>
            ))}
          </div>
          {errors.techStackIds && (
            <p role="alert" className="text-sm text-mt-danger">
              {errors.techStackIds}
            </p>
          )}
        </fieldset>
        <BaseField
          label="자기소개"
          htmlFor="profile-introduction"
          required={false}
          errorText={errors.introduction}
        >
          <BaseTextarea
            id="profile-introduction"
            value={form.introduction}
            onChange={(event) => change('introduction', event.target.value)}
            maxLength={1000}
          />
        </BaseField>
        <div className="grid gap-5 sm:grid-cols-2">
          <BaseField
            label="GitHub"
            htmlFor="profile-github"
            required={false}
            errorText={errors.githubUrl}
          >
            <BaseInput
              id="profile-github"
              type="url"
              placeholder="https://github.com/"
              value={form.githubUrl}
              onChange={(event) => change('githubUrl', event.target.value)}
              aria-invalid={Boolean(errors.githubUrl)}
            />
          </BaseField>
          <BaseField
            label="블로그"
            htmlFor="profile-blog"
            required={false}
            errorText={errors.blogUrl}
          >
            <BaseInput
              id="profile-blog"
              type="url"
              placeholder="https://"
              value={form.blogUrl}
              onChange={(event) => change('blogUrl', event.target.value)}
              aria-invalid={Boolean(errors.blogUrl)}
            />
          </BaseField>
        </div>
        <label className="flex items-center gap-3 rounded-xl bg-mt-bg-soft p-4 text-sm font-semibold">
          <input
            type="checkbox"
            checked={form.isParticipating}
            onChange={(event) => change('isParticipating', event.target.checked)}
            className="accent-mt-primary"
          />
          프로젝트 참여 가능
        </label>
        {errors.form && (
          <p role="alert" className="text-sm text-mt-danger">
            {errors.form}
          </p>
        )}
        <div className="flex justify-end gap-3">
          <BaseButton
            variant="gray"
            onClick={() => {
              setForm(original);
              setImage(null);
              setErrors({});
            }}
            disabled={!isDirty || isSaving}
          >
            변경 취소
          </BaseButton>
          <BaseButton type="submit" disabled={!isDirty || isSaving}>
            {isSaving ? '저장 중...' : '변경 사항 저장'}
          </BaseButton>
        </div>
      </form>
    </section>
  );
}
