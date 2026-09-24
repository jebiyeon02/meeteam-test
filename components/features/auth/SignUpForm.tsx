'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BaseButton from '@/components/shared/BaseButton';
import BaseField from '@/components/shared/BaseField';
import BaseInput from '@/components/shared/BaseInput';
import SkeletonBlock from '@/components/shared/SkeletonBlock';
import { registerSejong } from '@/components/features/auth/authApi';
import { registerSchema } from '@/components/features/auth/schema';
import {
  getJobOptions,
  getMyProfile,
  type JobOption,
} from '@/components/features/profile/profileApi';
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
  const [positionId, setPositionId] = useState(0);
  const [skillIds, setSkillIds] = useState<number[]>([]);
  const [githubUrl, setGithubUrl] = useState('');
  const [blogUrl, setBlogUrl] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    () =>
      options?.fields.find((field) =>
        field.positions.some((position) => position.id === positionId),
      ),
    [options, positionId],
  );
  const selectedPosition = selectedField?.positions.find((position) => position.id === positionId);

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
        <h1 className="text-xl font-bold">포털 인증이 필요합니다</h1>
        <p className="text-sm text-mt-text-secondary">먼저 세종대 포털 계정으로 로그인해 주세요.</p>
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
    <section className="mx-auto w-full max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold">프로필 만들기</h1>
        <p className="mt-2 text-sm text-mt-text-secondary">
          포털 인증을 완료했습니다. 기본 정보를 입력해 주세요.
        </p>
      </header>
      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="space-y-6 rounded-2xl border border-mt-border bg-mt-white p-6 sm:p-8"
        noValidate
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <BaseField label="이름" htmlFor="signup-name" errorText={errors.name}>
            <BaseInput
              id="signup-name"
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
        <BaseField label="성별" htmlFor="signup-gender" errorText={errors.gender}>
          <select
            id="signup-gender"
            value={gender}
            onChange={(event) => setGender(event.target.value)}
            className="w-full rounded-xl border border-mt-border bg-mt-white px-4 py-3 text-sm"
          >
            <option value="">선택해 주세요</option>
            <option value="MALE">남성</option>
            <option value="FEMALE">여성</option>
          </select>
        </BaseField>
        <BaseField label="관심 직무" htmlFor="signup-position" errorText={errors.positionId}>
          <select
            id="signup-position"
            value={positionId}
            onChange={(event) => {
              setPositionId(Number(event.target.value));
              setSkillIds([]);
            }}
            className="w-full rounded-xl border border-mt-border bg-mt-white px-4 py-3 text-sm"
          >
            <option value={0}>선택해 주세요</option>
            {options.fields.map((field) => (
              <optgroup key={field.code} label={field.name}>
                {field.positions.map((position) => (
                  <option key={position.id} value={position.id}>
                    {position.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </BaseField>
        {selectedField && (
          <fieldset className="space-y-3">
            <legend className="text-lg font-bold">
              기술 스택 <span className="text-sm font-normal text-mt-text-secondary">(선택)</span>
            </legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {selectedField.techStacks.map((skill) => (
                <label
                  key={skill.id}
                  className="flex items-center gap-2 rounded-xl border border-mt-border px-3 py-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={skillIds.includes(skill.id)}
                    onChange={() =>
                      setSkillIds((ids) =>
                        ids.includes(skill.id)
                          ? ids.filter((id) => id !== skill.id)
                          : [...ids, skill.id],
                      )
                    }
                    className="accent-mt-primary"
                  />
                  {skill.name}
                </label>
              ))}
            </div>
          </fieldset>
        )}
        <div className="grid gap-5 sm:grid-cols-2">
          <BaseField
            label="GitHub"
            htmlFor="signup-github"
            required={false}
            errorText={errors.githubUrl}
          >
            <BaseInput
              id="signup-github"
              type="url"
              placeholder="https://github.com/"
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
              placeholder="https://"
              value={blogUrl}
              onChange={(event) => setBlogUrl(event.target.value)}
            />
          </BaseField>
        </div>
        <BaseField label="프로필 이미지" htmlFor="signup-image" required={false}>
          <input
            id="signup-image"
            type="file"
            accept="image/*"
            onChange={(event) => setImage(event.target.files?.[0] ?? null)}
            className="block w-full text-sm text-mt-text-secondary file:mr-4 file:rounded-xl file:border-0 file:bg-mt-badge-bg file:px-4 file:py-2 file:font-semibold file:text-mt-primary"
          />
        </BaseField>
        {errors.form && (
          <p role="alert" className="text-sm text-mt-danger">
            {errors.form}
          </p>
        )}
        <BaseButton type="submit" full disabled={isSubmitting}>
          {isSubmitting ? '가입 중...' : '가입 완료'}
        </BaseButton>
      </form>
    </section>
  );
}
