'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Camera, CheckCircle2, Github, Link2, X } from 'lucide-react';
import BaseButton from '@/components/shared/BaseButton';
import BaseField from '@/components/shared/BaseField';
import BaseInput from '@/components/shared/BaseInput';
import SkeletonBlock from '@/components/shared/SkeletonBlock';
import AppLogo from '@/components/shared/AppLogo';
import ProfileAvatar from '@/components/features/profile/ProfileAvatar';
import { registerSejong } from '@/components/features/auth/authApi';
import { registerSchema } from '@/components/features/auth/schema';
import {
  getJobOptions,
  getMyProfile,
  type JobOption,
} from '@/components/features/profile/profileApi';
import { profileImageSchema } from '@/components/features/profile/schema';
import { useAuthStore } from '@/stores/useAuthStore';
import { useToastStore } from '@/stores/useToastStore';

export default function SignUpForm() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const showToast = useToastStore((state) => state.showToast);
  const [code, setCode] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [options, setOptions] = useState<JobOption | null>(null);
  const [loadError, setLoadError] = useState('');
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');
  const [fieldCode, setFieldCode] = useState('');
  const [positionId, setPositionId] = useState(0);
  const [skillIds, setSkillIds] = useState<number[]>([]);
  const [skillQuery, setSkillQuery] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [blogUrl, setBlogUrl] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedCode = sessionStorage.getItem('sejongRegistrationCode');
    setCode(savedCode);
    setIsReady(true);
    if (savedCode) {
      getJobOptions()
        .then(setOptions)
        .catch((error: unknown) =>
          setLoadError(error instanceof Error ? error.message : '선택 목록을 불러오지 못했습니다.'),
        );
    }
  }, []);

  const selectedField = useMemo(
    () => options?.fields.find((field) => field.code === fieldCode),
    [options, fieldCode],
  );
  const selectedPosition = selectedField?.positions.find((position) => position.id === positionId);
  const suggestedSkills =
    selectedField?.techStacks.filter(
      (skill) =>
        !skillIds.includes(skill.id) && skill.name.toLowerCase().includes(skillQuery.toLowerCase()),
    ) ?? [];

  useEffect(() => {
    if (!image) {
      setImagePreviewUrl('');
      return;
    }
    const url = URL.createObjectURL(image);
    setImagePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!code) return;
    const parsed = registerSchema.safeParse({
      name,
      birthDate,
      gender,
      positionId,
      githubUrl,
      blogUrl,
    });
    if (!parsed.success) {
      setErrors(
        Object.fromEntries(parsed.error.issues.map((issue) => [issue.path[0], issue.message])),
      );
      return;
    }
    if (!selectedField || !selectedPosition) {
      setErrors({ positionId: '관심 직무를 선택해 주세요.' });
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      await registerSejong(
        {
          code,
          name: parsed.data.name,
          birthDate: parsed.data.birthDate,
          gender: parsed.data.gender,
          jobPositions: [
            {
              jobFieldCode: selectedField.code,
              jobPositionCode: selectedPosition.code,
              techStacks: skillIds.map((id, index) => ({ id, displayOrder: index + 1 })),
            },
          ],
          githubUrl: parsed.data.githubUrl,
          blogUrl: parsed.data.blogUrl,
        },
        image,
      );
      sessionStorage.removeItem('sejongRegistrationCode');
      showToast({ tone: 'success', message: '가입이 완료되었습니다.' });
      try {
        const profile = await getMyProfile();
        setUser({ memberId: profile.memberId, name: profile.name });
        router.replace('/profile');
      } catch {
        router.replace('/auth/login');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '가입에 실패했습니다.';
      setErrors({ form: message });
      showToast({ tone: 'error', message });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isReady) return <SkeletonBlock className="mx-auto h-64 w-full max-w-2xl" />;
  if (!code) {
    return (
      <section className="mx-auto max-w-md space-y-4 rounded-2xl border border-mt-border bg-mt-white p-8 text-center">
        <h1 className="text-xl font-bold">데모 로그인이 필요합니다</h1>
        <p className="text-sm text-mt-text-secondary">
          먼저 신규 가입 데모 계정으로 로그인해 주세요.
        </p>
        <Link
          href="/auth/login"
          className="inline-flex rounded-xl bg-mt-primary px-4 py-2 text-sm font-bold text-mt-white"
        >
          로그인으로 이동
        </Link>
      </section>
    );
  }
  if (loadError)
    return (
      <p
        role="alert"
        className="mx-auto max-w-2xl rounded-xl border border-mt-border bg-mt-white p-6 text-mt-danger"
      >
        {loadError}
      </p>
    );
  if (!options) return <SkeletonBlock className="mx-auto h-64 w-full max-w-2xl" />;

  return (
    <div className="flex w-full max-w-150 flex-col gap-5">
      <Link href="/" aria-label="메인 페이지로 이동" className="mx-auto block sm:mx-0">
        <AppLogo className="h-9 w-40" priority />
      </Link>
      <section className="rounded-3xl border border-mt-border bg-mt-white shadow-sm">
        <header className="border-b border-mt-border px-6 py-6 sm:px-8">
          <h1 className="text-3xl font-extrabold leading-9 text-mt-text-primary">
            세종대 회원가입
          </h1>
          <p className="mt-2 text-sm text-mt-text-secondary">
            MSW 데모 계정의 프로필을 완성해 주세요. 실제 포털 정보는 입력하지 마세요.
          </p>
        </header>
        <form
          onSubmit={(event) => void handleSubmit(event)}
          className="flex flex-col gap-5 px-6 py-7 sm:px-8"
          noValidate
        >
          <div className="grid gap-4 md:grid-cols-2">
            <BaseField label="이름" htmlFor="signup-name" errorText={errors.name}>
              <BaseInput
                id="signup-name"
                placeholder="실명 입력"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </BaseField>
            <BaseField label="생년월일" htmlFor="signup-birth" errorText={errors.birthDate}>
              <BaseInput
                id="signup-birth"
                type="date"
                value={birthDate}
                onChange={(event) => setBirthDate(event.target.value)}
              />
            </BaseField>
          </div>

          <BaseField label="성별" errorText={errors.gender}>
            <div className="flex h-13 rounded-xl bg-mt-bg-soft p-1">
              {(
                [
                  ['MALE', '남성'],
                  ['FEMALE', '여성'],
                ] as const
              ).map(([value, label]) => (
                <label key={value} className="flex-1 cursor-pointer">
                  <input
                    type="radio"
                    name="signup-gender"
                    value={value}
                    checked={gender === value}
                    onChange={() => setGender(value)}
                    className="peer sr-only"
                  />
                  <span className="flex h-11 items-center justify-center rounded-lg font-bold text-mt-text-secondary peer-checked:border peer-checked:border-mt-border peer-checked:bg-mt-white peer-checked:text-mt-primary peer-checked:shadow-sm">
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </BaseField>

          <div className="space-y-2">
            <p className="text-lg font-bold text-mt-text-primary">분야</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <select
                value={fieldCode}
                onChange={(event) => {
                  setFieldCode(event.target.value);
                  setPositionId(0);
                  setSkillIds([]);
                }}
                aria-label="직군 대분류"
                className="h-12 w-full rounded-xl border border-mt-border bg-mt-white px-4 text-sm text-mt-text-nav"
              >
                <option value="">직군 대분류</option>
                {options.fields.map((field) => (
                  <option key={field.code} value={field.code}>
                    {field.name}
                  </option>
                ))}
              </select>
              <select
                value={positionId}
                onChange={(event) => {
                  setPositionId(Number(event.target.value));
                  setSkillIds([]);
                }}
                disabled={!selectedField}
                aria-label="직군 세부 분야"
                className="h-12 w-full rounded-xl border border-mt-border bg-mt-white px-4 text-sm text-mt-text-nav disabled:bg-mt-bg-soft"
              >
                <option value={0}>직군 세부 분야</option>
                {selectedField?.positions.map((position) => (
                  <option key={position.id} value={position.id}>
                    {position.name}
                  </option>
                ))}
              </select>
            </div>
            {errors.positionId && (
              <p role="alert" className="text-sm text-mt-hero-blue">
                {errors.positionId}
              </p>
            )}
          </div>

          <BaseField
            label="기술 스택"
            htmlFor="signup-skill"
            required={false}
            hintText="상위 3개 기술 스택이 프로필에 먼저 보여요."
          >
            <input
              id="signup-skill"
              type="search"
              value={skillQuery}
              onChange={(event) => setSkillQuery(event.target.value)}
              disabled={!selectedField}
              placeholder={selectedField ? '기술 스택을 검색해보세요' : '분야를 먼저 선택해 주세요'}
              className="h-12 w-full rounded-xl border border-mt-border bg-mt-white px-4 text-sm outline-none disabled:bg-mt-bg-soft"
            />
            {selectedField && (
              <div className="flex flex-wrap gap-2">
                {suggestedSkills.map((skill) => (
                  <button
                    key={skill.id}
                    type="button"
                    onClick={() => {
                      setSkillIds((current) => [...current, skill.id]);
                      setSkillQuery('');
                    }}
                    className="rounded-lg border border-mt-border px-3 py-1.5 text-xs text-mt-text-secondary hover:bg-mt-badge-bg"
                  >
                    + {skill.name}
                  </button>
                ))}
              </div>
            )}
            {skillIds.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {skillIds.map((id) => {
                  const skill = selectedField?.techStacks.find((item) => item.id === id);
                  return skill ? (
                    <button
                      key={id}
                      type="button"
                      onClick={() =>
                        setSkillIds((current) => current.filter((item) => item !== id))
                      }
                      className="inline-flex items-center gap-1 rounded-lg bg-mt-badge-bg px-3 py-1.5 text-xs font-semibold text-mt-primary"
                      aria-label={`${skill.name} 삭제`}
                    >
                      {skill.name} <X className="h-3 w-3" />
                    </button>
                  ) : null;
                })}
              </div>
            )}
          </BaseField>

          <div className="grid gap-4 sm:grid-cols-2">
            <BaseField
              label="GitHub"
              htmlFor="signup-github"
              required={false}
              errorText={errors.githubUrl}
            >
              <BaseInput
                id="signup-github"
                type="url"
                leftIcon={<Github className="h-5 w-5" />}
                placeholder="https://github.com/..."
                value={githubUrl}
                onChange={(event) => setGithubUrl(event.target.value)}
              />
            </BaseField>
            <BaseField
              label="블로그"
              htmlFor="signup-blog"
              required={false}
              errorText={errors.blogUrl}
            >
              <BaseInput
                id="signup-blog"
                type="url"
                leftIcon={<Link2 className="h-5 w-5" />}
                placeholder="https://..."
                value={blogUrl}
                onChange={(event) => setBlogUrl(event.target.value)}
              />
            </BaseField>
          </div>

          <BaseField
            label="프로필 사진"
            htmlFor="signup-image"
            required={false}
            errorText={errors.image}
          >
            <input
              ref={imageInputRef}
              id="signup-image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => changeImage(event.target.files?.[0] ?? null)}
              className="sr-only"
            />
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-mt-border bg-mt-bg-soft p-5">
              <div className="flex min-w-0 items-center gap-4">
                {imagePreviewUrl ? (
                  <ProfileAvatar
                    name={name || '프로필'}
                    src={imagePreviewUrl}
                    sizeClassName="h-12 w-12"
                  />
                ) : (
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border border-mt-border bg-mt-white">
                    <Camera className="h-5 w-5 text-mt-text-secondary" />
                  </span>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-mt-text-primary">
                    {image ? '프로필 사진 등록 완료' : '나를 표현하는 사진을 올려주세요'}
                  </p>
                  <p className="truncate text-xs text-mt-text-secondary">
                    {image ? (
                      <>
                        <CheckCircle2 className="mr-1 inline h-3 w-3 text-mt-primary" />
                        {image.name}
                      </>
                    ) : (
                      'JPG, PNG, WebP (데모 최대 1MB)'
                    )}
                  </p>
                </div>
              </div>
              <label
                htmlFor="signup-image"
                className="shrink-0 cursor-pointer rounded-lg border border-mt-border bg-mt-white px-4 py-2 text-xs font-bold text-mt-text-nav"
              >
                {image ? '사진 변경' : '업로드'}
              </label>
            </div>
          </BaseField>

          {errors.form && (
            <p role="alert" className="text-sm text-mt-danger">
              {errors.form}
            </p>
          )}
          <BaseButton size="L" type="submit" full disabled={isSubmitting}>
            {isSubmitting ? '가입 중...' : '회원가입 완료'}
          </BaseButton>
        </form>
      </section>
    </div>
  );
}
