'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import BaseButton from '@/components/shared/BaseButton';
import ToastMessage from '@/components/shared/ToastMessage';
import type { Interest, JobFieldOption, OnboardingFormValues } from '@/types/auth';
import { useAuthStore } from '@/stores/useAuthStore';
import { fetchMyProfile } from '@/components/features/profile/profileApi';

import InterestSection from '@/components/features/auth/InterestSection';
import ProfileExtraSection from '@/components/features/auth/ProfileExtraSection';
import ProfileSection from '@/components/features/auth/ProfileSection';
import SignupTechStackSection from '@/components/features/auth/SignupTechStackSection';

import { onboardingFormSchema, type OnboardingFieldErrors } from './schema';
import { clearSejongOnboardingCode, readSejongOnboardingCode } from './sejongOnboardingStorage';
import { fetchJobOptions, registerSejongMember } from './signupApi';
import { buildSejongRegisterRequestPayload, getInterestKey } from './signupTransform';

const INITIAL_INTEREST: Interest = { major: '', minor: '' };

const INITIAL_FORM_VALUES: OnboardingFormValues = {
  name: '',
  birth: '',
  gender: 'male',
  interests: [INITIAL_INTEREST],
  techStacksByInterest: {},
  githubUrl: '',
  blogUrl: '',
  profileImage: null,
};

export default function SejongSignupForm() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);

  const [formValues, setFormValues] = useState<OnboardingFormValues>(INITIAL_FORM_VALUES);
  const [jobFields, setJobFields] = useState<JobFieldOption[]>([]);
  const [fieldErrors, setFieldErrors] = useState<OnboardingFieldErrors>({});
  const [jobOptionsError, setJobOptionsError] = useState('');
  const [isCodeReady, setIsCodeReady] = useState(false);
  const [onboardingCode, setOnboardingCode] = useState('');
  const [isLoadingJobOptions, setIsLoadingJobOptions] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileImagePreviewUrl, setProfileImagePreviewUrl] = useState('');

  useEffect(() => {
    setOnboardingCode(readSejongOnboardingCode());
    setIsCodeReady(true);
  }, []);

  useEffect(() => {
    if (!isCodeReady || !onboardingCode) {
      setIsLoadingJobOptions(false);
      return;
    }

    let isMounted = true;

    async function loadJobOptions() {
      try {
        const nextJobFields = await fetchJobOptions();
        if (!isMounted) {
          return;
        }

        setJobFields(nextJobFields);
        setJobOptionsError('');
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setJobOptionsError(
          error instanceof Error ? error.message : '기술 스택 옵션을 불러오지 못했습니다.',
        );
      } finally {
        if (isMounted) {
          setIsLoadingJobOptions(false);
        }
      }
    }

    void loadJobOptions();

    return () => {
      isMounted = false;
    };
  }, [isCodeReady, onboardingCode]);

  useEffect(() => {
    if (!formValues.profileImage) {
      setProfileImagePreviewUrl('');
      return;
    }

    const previewUrl = URL.createObjectURL(formValues.profileImage);
    setProfileImagePreviewUrl(previewUrl);

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [formValues.profileImage]);

  const updateField = <K extends keyof OnboardingFormValues>(
    key: K,
    value: OnboardingFormValues[K],
  ) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, form: undefined }));
  };

  const buildValidationErrors = () => {
    const result = onboardingFormSchema.safeParse(formValues);

    const nextErrors: OnboardingFieldErrors = {};

    if (!result.success) {
      const flattened = result.error.flatten().fieldErrors;
      nextErrors.name = flattened.name?.[0];
      nextErrors.birth = flattened.birth?.[0];
    }

    const filledInterests = formValues.interests.filter(
      (interest) => interest.major && interest.minor,
    );
    if (filledInterests.length === 0) {
      nextErrors.interests = '분야를 선택해 주세요.';
    }

    if (!nextErrors.form) {
      nextErrors.form = Object.values(nextErrors).find(Boolean);
    }

    return nextErrors;
  };

  const updateInterest = (index: number, next: Interest) => {
    setFormValues((prev) => {
      const currentInterest = prev.interests[index];
      const nextTechStacksByInterest = { ...prev.techStacksByInterest };

      if (currentInterest) {
        delete nextTechStacksByInterest[getInterestKey(currentInterest)];
      }

      if (!next.major || !next.minor) {
        delete nextTechStacksByInterest[getInterestKey(next)];
      }

      return {
        ...prev,
        interests: [next],
        techStacksByInterest: nextTechStacksByInterest,
      };
    });

    setFieldErrors((prev) => ({ ...prev, interests: undefined, form: undefined }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = buildValidationErrors();

    if (Object.values(nextErrors).some(Boolean)) {
      setFieldErrors(nextErrors);
      return;
    }

    if (!hasSelectedTechStacks) {
      setFieldErrors((prev) => ({
        ...prev,
        form: '기술 스택을 1개 이상 선택해 주세요.',
      }));
      return;
    }

    if (!onboardingCode) {
      setFieldErrors((prev) => ({
        ...prev,
        form: '인증 코드가 없습니다. 로그인부터 다시 진행해 주세요.',
      }));
      return;
    }

    if (jobFields.length === 0) {
      setFieldErrors((prev) => ({
        ...prev,
        form: '회원가입 옵션이 아직 준비되지 않았습니다. 잠시 후 다시 시도해 주세요.',
      }));
      return;
    }

    try {
      setIsSubmitting(true);
      setFieldErrors((prev) => ({ ...prev, form: undefined }));

      const payload = buildSejongRegisterRequestPayload(formValues, jobFields, onboardingCode);
      await registerSejongMember(payload, formValues.profileImage);

      clearSejongOnboardingCode();

      const profile = await fetchMyProfile();
      setSession({
        memberId: profile.memberId,
        name: profile.name,
        email: profile.email,
      });

      router.replace('/');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '세종대 회원가입 중 오류가 발생했습니다.';

      if (message.includes('인증 코드')) {
        clearSejongOnboardingCode();
        setOnboardingCode('');
      }

      setFieldErrors((prev) => ({
        ...prev,
        form: message,
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isCodeReady) {
    return <p className="text-sm leading-6 font-medium text-mt-text-secondary">불러오는 중...</p>;
  }

  if (!onboardingCode) {
    return (
      <section className="flex flex-col gap-4">
        <ToastMessage message="세종대 포털 인증 정보가 없습니다. 로그인부터 다시 진행해 주세요." />
        <Link
          href="/auth/login"
          className="inline-flex h-12 items-center justify-center rounded-xl bg-mt-primary px-5 text-sm font-bold text-mt-white"
        >
          로그인으로 돌아가기
        </Link>
      </section>
    );
  }

  const selectedInterest = formValues.interests.find(
    (interest) => interest.major && interest.minor,
  );
  const selectedInterestKey = selectedInterest ? getInterestKey(selectedInterest) : '';
  const hasSelectedTechStacks = selectedInterestKey
    ? (formValues.techStacksByInterest[selectedInterestKey]?.length ?? 0) > 0
    : false;

  return (
    <form
      className="flex w-full flex-col gap-5"
      onSubmit={handleSubmit}
      data-cy="sejong-signup-form"
    >
      <ProfileSection
        name={formValues.name}
        birth={formValues.birth}
        gender={formValues.gender}
        onChangeName={(event) => {
          updateField('name', event.target.value);
          setFieldErrors((prev) => ({ ...prev, name: undefined }));
        }}
        onChangeBirth={(value) => {
          updateField('birth', value);
          setFieldErrors((prev) => ({ ...prev, birth: undefined }));
        }}
        onChangeGender={(event) =>
          updateField('gender', event.target.value as OnboardingFormValues['gender'])
        }
        nameError={fieldErrors.name}
        birthError={fieldErrors.birth}
      />

      <InterestSection
        jobFields={jobFields}
        interests={formValues.interests}
        onChange={updateInterest}
        errorText={fieldErrors.interests || jobOptionsError}
        disabled={isLoadingJobOptions}
      />

      <SignupTechStackSection
        jobFields={jobFields}
        interests={formValues.interests}
        value={formValues.techStacksByInterest}
        onChange={(next) => updateField('techStacksByInterest', next)}
        disabled={isLoadingJobOptions}
      />

      <ProfileExtraSection
        githubLink={formValues.githubUrl}
        blogLink={formValues.blogUrl}
        onChangeGithubLink={(event) => updateField('githubUrl', event.target.value)}
        onChangeBlogLink={(event) => updateField('blogUrl', event.target.value)}
        onChangeProfileImage={(file) => updateField('profileImage', file)}
        onRemoveProfileImage={() => updateField('profileImage', null)}
        profileImageName={formValues.profileImage?.name ?? ''}
        profileImagePreviewUrl={profileImagePreviewUrl}
      />

      <ToastMessage message={fieldErrors.form} />

      <BaseButton
        size="L"
        full={true}
        type="submit"
        disabled={isSubmitting || isLoadingJobOptions}
        data-cy="sejong-signup-submit"
      >
        <span className="font-bold">{isSubmitting ? '가입 중...' : '회원가입 완료'}</span>
      </BaseButton>
    </form>
  );
}
