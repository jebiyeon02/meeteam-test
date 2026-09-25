'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BriefcaseBusiness, Camera, Github, Link2 } from 'lucide-react';
import BaseButton from '@/components/shared/BaseButton';
import BaseField from '@/components/shared/BaseField';
import BaseInput from '@/components/shared/BaseInput';
import BaseTextarea from '@/components/shared/BaseTextarea';
import SkeletonBlock from '@/components/shared/SkeletonBlock';
import ProfileAvatar from '@/components/features/profile/ProfileAvatar';
import ProfileView from '@/components/features/profile/ProfileView';
import {
  getJobOptions,
  getMemberDetail,
  getMyProfile,
  updateMyProfile,
  type JobOption,
  type MyProfileResponse,
} from '@/components/features/profile/profileApi';
import {
  profileFormSchema,
  profileImageSchema,
  type ProfileFormValues,
} from '@/components/features/profile/schema';
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
  const [isEditing, setIsEditing] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!image) {
      setImagePreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(image);
    setImagePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

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
      setIsEditing(false);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : '프로필을 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedField = useMemo(
    () =>
      options?.fields.find((field) =>
        field.positions.some((position) => position.id === form?.jobPositionIds[0]),
      ),
    [options, form?.jobPositionIds],
  );
  const isDirty = Boolean(form && original && (!isSameForm(form, original) || image));

  function change<K extends keyof ProfileFormValues>(key: K, value: ProfileFormValues[K]) {
    setForm((current) => (current ? { ...current, [key]: value } : current));
    setErrors((current) => ({ ...current, [key]: '' }));
  }

  function changeImage(file: File | null) {
    if (!file) {
      setImage(null);
      setErrors((current) => ({ ...current, image: '' }));
      return;
    }
    const parsed = profileImageSchema.safeParse(file);
    if (!parsed.success) {
      setImage(null);
      setErrors((current) => ({ ...current, image: parsed.error.issues[0].message }));
      if (imageInputRef.current) imageInputRef.current.value = '';
      return;
    }
    setImage(parsed.data);
    setErrors((current) => ({ ...current, image: '' }));
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
      const result = await updateMyProfile(
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
      if (imageInputRef.current) imageInputRef.current.value = '';
      setProfile((current) =>
        current
          ? { ...current, name: parsed.data.name, profileImageUrl: result.profileImageUrl }
          : current,
      );
      setUser({ memberId: profile!.memberId, name: parsed.data.name });
      setIsEditing(false);
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

  const role =
    selectedField?.positions.find((item) => item.id === form.jobPositionIds[0])?.name ??
    profile.representativePosition;
  const selectedSkillNames = form.techStackIds
    .map(
      (id) =>
        options?.fields.flatMap((field) => field.techStacks).find((skill) => skill.id === id)?.name,
    )
    .filter((name): name is string => Boolean(name));

  if (!isEditing) {
    return (
      <ProfileView
        name={form.name}
        imageUrl={profile.profileImageUrl}
        role={role}
        skills={selectedSkillNames}
        isParticipating={form.isParticipating}
        introduction={form.introduction}
        projectCount={profile.projectCount}
        projects={profile.projectCards ?? []}
        githubUrl={form.githubUrl}
        blogUrl={form.blogUrl}
        onEdit={() => setIsEditing(true)}
        showTeammatesLink
      />
    );
  }

  return (
    <form
      onSubmit={(event) => void handleSave(event)}
      noValidate
      className="bg-mt-white px-4 py-6 sm:px-6 sm:py-8"
    >
      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="min-w-0 space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div className="relative mx-auto h-40 w-40 rounded-full border-4 border-mt-white bg-mt-white shadow-lg sm:h-44 sm:w-44 lg:h-56 lg:w-56">
            <ProfileAvatar
              name={form.name}
              src={imagePreviewUrl ?? profile.profileImageUrl}
              sizeClassName="h-full w-full"
            />
            <label
              htmlFor="profile-image"
              className="absolute bottom-3 right-2 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-2 border-mt-white bg-mt-primary text-mt-white shadow-sm"
              aria-label="프로필 이미지 수정"
            >
              <Camera className="h-5 w-5" aria-hidden />
            </label>
            <input
              ref={imageInputRef}
              id="profile-image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => changeImage(event.target.files?.[0] ?? null)}
              className="sr-only"
            />
          </div>
          {errors.image && (
            <p role="alert" className="text-center text-sm text-mt-danger">
              {errors.image}
            </p>
          )}
          {image && (
            <p className="truncate text-center text-xs text-mt-text-secondary">{image.name}</p>
          )}
          <BaseField label="이름" htmlFor="profile-name" errorText={errors.name}>
            <BaseInput
              id="profile-name"
              value={form.name}
              onChange={(event) => change('name', event.target.value)}
            />
          </BaseField>

          <section className="space-y-3 border-t border-mt-border pt-4">
            <h2 className="text-base font-bold">프로젝트 참여 설정</h2>
            <label className="flex items-center justify-between gap-4 text-sm font-bold">
              {form.isParticipating ? '프로젝트 참여 가능' : '프로젝트 참여 불가'}
              <input
                type="checkbox"
                role="switch"
                checked={form.isParticipating}
                onChange={(event) => change('isParticipating', event.target.checked)}
                className="h-5 w-5 accent-mt-primary"
              />
            </label>
          </section>

          <section className="space-y-3 border-t border-mt-border pt-4">
            <h2 className="text-base font-bold">기본 정보</h2>
            <BaseField label="나이" htmlFor="profile-age" errorText={errors.age}>
              <BaseInput
                id="profile-age"
                inputMode="numeric"
                value={form.age}
                onChange={(event) => change('age', event.target.value)}
              />
            </BaseField>
            <BaseField label="성별" htmlFor="profile-gender" errorText={errors.gender}>
              <select
                id="profile-gender"
                value={form.gender}
                onChange={(event) =>
                  change('gender', event.target.value as ProfileFormValues['gender'])
                }
                className="h-11 w-full rounded-xl border border-mt-border bg-mt-white px-3 text-sm"
              >
                <option value="MALE">남성</option>
                <option value="FEMALE">여성</option>
              </select>
            </BaseField>
            <BaseField
              label="이메일"
              htmlFor="profile-email"
              hintText="이메일은 수정할 수 없습니다."
            >
              <BaseInput id="profile-email" value={profile.email} disabled />
            </BaseField>
            <BaseField
              label="직군 대분류"
              htmlFor="profile-field"
              errorText={errors.jobPositionIds}
            >
              <select
                id="profile-field"
                value={selectedField?.code ?? ''}
                onChange={(event) => {
                  const nextField = options?.fields.find(
                    (field) => field.code === event.target.value,
                  );
                  change(
                    'jobPositionIds',
                    nextField?.positions[0] ? [nextField.positions[0].id] : [],
                  );
                  change('techStackIds', []);
                }}
                className="h-11 w-full rounded-xl border border-mt-border bg-mt-white px-3 text-sm"
              >
                <option value="">선택해 주세요</option>
                {options?.fields.map((field) => (
                  <option key={field.code} value={field.code}>
                    {field.name}
                  </option>
                ))}
              </select>
            </BaseField>
            <BaseField label="직군 세부 분야" htmlFor="profile-position">
              <select
                id="profile-position"
                value={form.jobPositionIds[0] ?? 0}
                onChange={(event) => change('jobPositionIds', [Number(event.target.value)])}
                className="h-11 w-full rounded-xl border border-mt-border bg-mt-white px-3 text-sm"
              >
                {selectedField?.positions.map((position) => (
                  <option key={position.id} value={position.id}>
                    {position.name}
                  </option>
                ))}
              </select>
            </BaseField>
          </section>

          <section className="space-y-3 border-t border-mt-border pt-4">
            <h2 className="text-base font-bold">외부 링크</h2>
            <BaseField
              label="GitHub"
              htmlFor="profile-github"
              required={false}
              errorText={errors.githubUrl}
            >
              <BaseInput
                id="profile-github"
                type="url"
                leftIcon={<Github className="h-4 w-4" />}
                value={form.githubUrl}
                onChange={(event) => change('githubUrl', event.target.value)}
                placeholder="https://github.com/..."
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
                leftIcon={<Link2 className="h-4 w-4" />}
                value={form.blogUrl}
                onChange={(event) => change('blogUrl', event.target.value)}
                placeholder="https://..."
              />
            </BaseField>
          </section>

          <fieldset className="space-y-3 border-t border-mt-border pt-4">
            <legend className="text-base font-bold">기술 스택</legend>
            <div className="flex flex-wrap gap-2">
              {selectedField?.techStacks.map((skill) => (
                <label
                  key={skill.id}
                  className={`cursor-pointer rounded-lg border px-3 py-1.5 text-sm ${form.techStackIds.includes(skill.id) ? 'border-mt-primary bg-mt-badge-bg text-mt-primary' : 'border-mt-border text-mt-text-secondary'}`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={form.techStackIds.includes(skill.id)}
                    onChange={() => change('techStackIds', toggleId(form.techStackIds, skill.id))}
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
        </aside>

        <div className="flex min-w-0 flex-col gap-8">
          <section className="space-y-4">
            <h2 className="text-xl font-bold leading-7">자기소개</h2>
            <div className="overflow-hidden rounded-2xl border border-mt-border bg-mt-white">
              <BaseTextarea
                id="profile-introduction"
                value={form.introduction}
                onChange={(event) => change('introduction', event.target.value)}
                maxLength={1000}
                rows={8}
                placeholder="관심 있는 분야, 잘하는 역할, 함께하고 싶은 프로젝트를 적어주세요."
                className="min-h-56 resize-none rounded-none border-0 px-5 py-5 text-base leading-7"
              />
              <div className="flex justify-between border-t border-mt-border bg-mt-bg-soft px-4 py-3 text-sm text-mt-text-secondary">
                <span>프로필에 나타낼 짧은 소개를 작성해 주세요.</span>
                <span>{form.introduction.length} / 1000자</span>
              </div>
            </div>
            {errors.introduction && (
              <p role="alert" className="text-sm text-mt-danger">
                {errors.introduction}
              </p>
            )}
          </section>
          <section className="space-y-4">
            <div className="flex items-baseline gap-2">
              <h2 className="text-xl font-bold">참여 프로젝트</h2>
              <span className="text-lg text-mt-text-secondary">{profile.projectCount}</span>
            </div>
            <div className="flex min-h-76 flex-col items-center justify-center rounded-2xl border border-dashed border-mt-border bg-mt-bg-soft/50 px-6 py-16 text-center opacity-70">
              <BriefcaseBusiness className="h-8 w-8 text-mt-primary" aria-hidden />
              <p className="mt-4 text-sm text-mt-text-secondary">
                수정 중에는 참여 프로젝트를 변경할 수 없습니다.
              </p>
            </div>
          </section>
        </div>
      </div>

      <div className="sticky bottom-4 z-10 mx-auto mt-8 flex w-fit items-center gap-3 rounded-2xl border border-mt-border bg-mt-white p-3 shadow-2xl">
        {errors.form && (
          <p role="alert" className="mr-2 text-sm text-mt-danger">
            {errors.form}
          </p>
        )}
        <BaseButton
          variant="gray"
          onClick={() => {
            setForm(original);
            setImage(null);
            if (imageInputRef.current) imageInputRef.current.value = '';
            setErrors({});
            setIsEditing(false);
          }}
          disabled={isSaving}
        >
          취소
        </BaseButton>
        <BaseButton type="submit" disabled={!isDirty || isSaving}>
          {isSaving ? '저장 중...' : '저장하기'}
        </BaseButton>
      </div>
    </form>
  );
}
