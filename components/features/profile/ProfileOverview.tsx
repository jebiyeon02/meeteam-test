'use client';

import { Github, Link2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { useAuthRequiredModal } from '@/components/features/auth/useAuthRequiredModal';
import AuthRequiredFallback from '@/components/features/auth/AuthRequiredFallback';
import { fetchJobOptions } from '@/components/features/auth/signupApi';
import IntroductionCard from '@/components/features/profile/IntroductionCard';
import JoinedProjectCard from '@/components/features/profile/JoinedProjectCard';
import ProfileOverviewSkeleton from '@/components/features/profile/ProfileOverviewSkeleton';
import ProfileSidebar from '@/components/features/profile/ProfileSidebar';
import ToastMessage from '@/components/shared/ToastMessage';
import {
  fetchMemberProfile,
  fetchMyProfile,
  findPositionByName,
  type MemberProfileResponse,
  type ProfileGender,
  updateMyProfile,
} from '@/components/features/profile/profileApi';
import { useAuthStore } from '@/stores/useAuthStore';
import { useToastStore } from '@/stores/useToastStore';
import type { JobFieldOption, JobPositionOption } from '@/types/auth';

interface ProfileOverviewProps {
  memberId?: number;
  editable?: boolean;
  actionLabel?: string;
}

interface ProfileFormState {
  name: string;
  age: string;
  gender: string;
  fieldCategory: string;
  fieldRole: string;
  email: string;
  github: string;
  blog: string;
  introduction: string;
  isParticipating: boolean;
  profileImageUrl: string | null;
  profileImageFile: File | null;
}

export default function ProfileOverview({
  memberId,
  editable = true,
  actionLabel = '제안 보내기',
}: ProfileOverviewProps) {
  const handleAuthRequired = useAuthRequiredModal();
  const showToast = useToastStore((state) => state.showToast);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAuthBlocked, setIsAuthBlocked] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [profile, setProfile] = useState<MemberProfileResponse | null>(null);
  const [jobFields, setJobFields] = useState<JobFieldOption[]>([]);
  const [profileForm, setProfileForm] = useState<ProfileFormState | null>(null);
  const [originalForm, setOriginalForm] = useState<ProfileFormState | null>(null);
  const [viewSkillGroups, setViewSkillGroups] = useState<
    Array<{ category?: string; role?: string; skills: string[] }>
  >([]);
  const [editableSkills, setEditableSkills] = useState<string[]>([]);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const canEdit = editable && !memberId;
  const hasChanges =
    Boolean(profileForm?.profileImageFile) ||
    JSON.stringify(profileForm) !== JSON.stringify(originalForm) ||
    JSON.stringify(editableSkills) !== JSON.stringify(profile?.skills ?? []);

  useEffect(() => {
    if (!profileForm?.profileImageFile) {
      setImagePreviewUrl(null);
      return undefined;
    }

    const nextPreviewUrl = URL.createObjectURL(profileForm.profileImageFile);
    setImagePreviewUrl(nextPreviewUrl);

    return () => URL.revokeObjectURL(nextPreviewUrl);
  }, [profileForm?.profileImageFile]);

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      try {
        setIsLoading(true);
        setIsAuthBlocked(false);
        setErrorMessage(null);

        if (memberId) {
          const nextProfile = await fetchMemberProfile(memberId);

          if (!active) {
            return;
          }

          applyProfile(nextProfile, []);
          return;
        }

        if (!isAuthenticated) {
          return;
        }

        const [nextProfile, nextJobFields] = await Promise.all([
          fetchMyProfile(),
          fetchJobOptions(),
        ]);

        if (!active) {
          return;
        }

        applyProfile(nextProfile, nextJobFields);
      } catch (error) {
        if (!active) {
          return;
        }

        if (
          handleAuthRequired(error, {
            redirectPath: memberId ? `/profile/${memberId}` : '/profile',
          })
        ) {
          setIsAuthBlocked(true);
          setErrorMessage(null);
          return;
        }

        setErrorMessage(error instanceof Error ? error.message : '프로필을 불러오지 못했습니다.');
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      active = false;
    };
  }, [handleAuthRequired, isAuthenticated, memberId]);

  const currentActionLabel = canEdit ? (isEditing ? '저장하기' : '프로필 수정') : actionLabel;
  const categoryOptions = useMemo(() => jobFields.map((field) => field.name), [jobFields]);
  const currentField = useMemo(
    () => jobFields.find((field) => field.name === profileForm?.fieldCategory),
    [jobFields, profileForm?.fieldCategory],
  );
  const roleOptions = useMemo(
    () => currentField?.positions.map((position) => position.name) ?? [],
    [currentField],
  );
  const availableSkills = useMemo(
    () => currentField?.techStacks.map((techStack) => techStack.name) ?? [],
    [currentField],
  );
  const editableSkillGroups = useMemo(
    () =>
      profileForm
        ? [
            {
              category: profileForm.fieldCategory,
              role: profileForm.fieldRole,
              skills: editableSkills,
            },
          ]
        : [],
    [editableSkills, profileForm],
  );

  function applyProfile(nextProfile: MemberProfileResponse, nextJobFields: JobFieldOption[]) {
    const primaryPosition = findPrimaryPosition(nextProfile, nextJobFields);

    setProfile(nextProfile);
    setJobFields(nextJobFields);
    setViewSkillGroups([{ skills: nextProfile.skills }]);

    const ageLabel =
      typeof nextProfile.age === 'number'
        ? `${nextProfile.age}세`
        : nextProfile.birthDate
          ? `${calculateAge(nextProfile.birthDate)}세`
          : '-';

    setEditableSkills(nextProfile.skills);
    const nextForm: ProfileFormState = {
      name: nextProfile.name,
      age: ageLabel,
      gender: nextProfile.gender === 'FEMALE' ? '여성' : '남성',
      fieldCategory: primaryPosition?.field.name ?? '',
      fieldRole: primaryPosition?.position.name ?? nextProfile.representativePosition ?? '',
      email: nextProfile.email,
      github: nextProfile.githubUrl ?? '',
      blog: nextProfile.blogUrl ?? '',
      introduction: nextProfile.introduce ?? '',
      isParticipating: nextProfile.isParticipating,
      profileImageUrl: nextProfile.profileImageUrl,
      profileImageFile: null,
    };
    setProfileForm(nextForm);
    setOriginalForm(nextForm);
  }

  const handleAction = () => {
    if (!canEdit) {
      return;
    }

    if (!isEditing) {
      setErrorMessage(null);
      setIsEditing(true);
      return;
    }

    void handleSave();
  };

  const handleCancelEdit = () => {
    if (profile) {
      applyProfile(profile, jobFields);
    }

    setErrorMessage(null);
    setIsEditing(false);
  };

  const handleFieldChange = (field: keyof ProfileFormState, value: string) => {
    if (!profileForm) {
      return;
    }

    if (field === 'fieldCategory') {
      const nextField = jobFields.find((item) => item.name === value);
      setProfileForm((current) =>
        current
          ? {
              ...current,
              fieldCategory: value,
              fieldRole: nextField?.positions[0]?.name ?? '',
            }
          : current,
      );
      setEditableSkills([]);
      return;
    }

    setProfileForm((current) => ({
      ...(current ?? profileForm),
      [field]: value,
    }));
  };

  const handleToggleParticipation = () => {
    setProfileForm((current) =>
      current
        ? {
            ...current,
            isParticipating: !current.isParticipating,
          }
        : current,
    );
  };

  const handleImageChange = (file: File | null) => {
    setProfileForm((current) =>
      current
        ? {
            ...current,
            profileImageFile: file,
          }
        : current,
    );
  };

  async function handleSave() {
    if (isSaving || !hasChanges || !canEdit || !isAuthenticated || !profileForm || !profile) {
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage(null);

      const position = findPositionByName(
        jobFields,
        profileForm.fieldCategory,
        profileForm.fieldRole,
      );
      if (!position) {
        throw new Error('선택한 직군 정보를 확인할 수 없습니다.');
      }

      const techStacks = editableSkills.map((skill, index) => {
        const techStack = currentField?.techStacks.find((item) => item.name === skill);

        if (!techStack) {
          throw new Error(`'${skill}' 기술 스택을 옵션에서 찾을 수 없습니다.`);
        }

        return {
          id: techStack.id,
          displayOrder: index + 1,
        };
      });

      await updateMyProfile({
        name: profileForm.name,
        age: parseInt(profileForm.age.replace(/\D/g, ''), 10),
        gender: mapGenderLabelToValue(profileForm.gender),
        jobPositionIds: [position.id],
        techStacks,
        isParticipating: profileForm.isParticipating,
        introduction: profileForm.introduction,
        githubUrl: profileForm.github,
        blogUrl: profileForm.blog,
        profileImage: profileForm.profileImageFile,
      });

      const [nextProfile, nextJobFields] = await Promise.all([fetchMyProfile(), fetchJobOptions()]);
      applyProfile(nextProfile, nextJobFields);
      setIsEditing(false);
      showToast({ tone: 'success', message: '프로필을 저장했습니다.' });
    } catch (error) {
      if (handleAuthRequired(error, { redirectPath: '/profile' })) {
        setErrorMessage(null);
        return;
      }

      setErrorMessage(error instanceof Error ? error.message : '프로필 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  }

  const githubUrl = profileForm?.github.trim() ?? '';
  const blogUrl = profileForm?.blog.trim() ?? '';

  const socialContacts = [
    {
      label: 'GitHub',
      icon: Github,
      value: githubUrl,
      href: githubUrl ? ensureUrl(githubUrl) : '',
    },
    {
      label: '블로그',
      icon: Link2,
      value: blogUrl,
      href: blogUrl ? ensureUrl(blogUrl) : '',
    },
  ];

  const joinedProjects =
    profile?.projectCards.map((project) => ({
      id: project.projectId,
      title: project.projectName,
      category: project.categoryName,
      leader: project.creatorName,
      currentMembers: project.currentCount,
      maxMembers: project.recruitmentCount,
      imageUrl: project.imageUrl,
      leaderImageUrl: project.creatorImageUrl,
    })) ?? [];

  const roleLabel =
    profile?.representativePositionEn ??
    profile?.representativePosition ??
    profileForm?.fieldRole ??
    '';

  if (isAuthBlocked) {
    return <AuthRequiredFallback />;
  }

  if (isLoading) {
    return <ProfileOverviewSkeleton />;
  }

  if (!profileForm || !profile) {
    return (
      <section className="bg-mt-white px-4 py-6 sm:px-6 sm:py-8">
        <ToastMessage message={errorMessage} />

        <div className="mx-auto w-full max-w-5xl rounded-2xl border border-mt-border bg-mt-white px-6 py-8 text-sm leading-6 text-mt-hero-blue shadow-sm">
          {errorMessage ?? '프로필을 불러오지 못했습니다.'}
        </div>
      </section>
    );
  }

  return (
    <section className="bg-mt-white px-4 py-6 sm:px-6 sm:py-8">
      <ToastMessage message={errorMessage} />

      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        <ProfileSidebar
          name={profileForm.name}
          role={roleLabel}
          email={profileForm.email}
          profileImageUrl={imagePreviewUrl ?? profileForm.profileImageUrl}
          isParticipating={profileForm.isParticipating}
          skills={editableSkills.length > 0 ? editableSkills : profile.skills}
          socialContacts={socialContacts}
          actionLabel={currentActionLabel}
          isEditing={isEditing}
          onAction={canEdit ? handleAction : undefined}
          onImageChange={handleImageChange}
          actionDisabled={isSaving}
          onToggleParticipation={handleToggleParticipation}
          categoryOptions={categoryOptions}
          roleOptions={roleOptions}
          formData={profileForm}
          onFieldChange={handleFieldChange}
          skillGroups={isEditing ? editableSkillGroups : viewSkillGroups}
          availableSkills={availableSkills}
          onSkillsChange={(_groupIndex, nextSkills) => setEditableSkills(nextSkills)}
        />

        <div className="flex min-w-0 flex-col gap-8">
          <IntroductionCard
            editable={isEditing}
            value={profileForm.introduction}
            onChange={(value) => handleFieldChange('introduction', value)}
          />
          <JoinedProjectCard projects={joinedProjects} disabled={isEditing} />
        </div>

        {isEditing ? (
          <div className="fixed right-8 bottom-8 z-50 rounded-2xl border border-mt-border bg-mt-white/95 p-3 shadow-2xl backdrop-blur">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="inline-flex h-11 min-w-20 items-center justify-center rounded-xl border border-mt-border bg-mt-white px-5 text-sm font-bold text-mt-text-secondary disabled:cursor-not-allowed disabled:opacity-60"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={isSaving || !hasChanges}
                className="inline-flex h-11 min-w-26 items-center justify-center rounded-xl bg-mt-primary px-5 text-sm font-bold text-mt-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? '저장 중' : '저장하기'}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function calculateAge(birthDate: string) {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }

  return age;
}

function mapGenderLabelToValue(gender: string): ProfileGender {
  return gender === '여성' ? 'FEMALE' : 'MALE';
}

function ensureUrl(value: string) {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function findPrimaryPosition(
  profile: MemberProfileResponse,
  jobFields: JobFieldOption[],
): { field: JobFieldOption; position: JobPositionOption } | null {
  if (jobFields.length === 0) {
    return null;
  }

  const positionNames = [profile.representativePosition, profile.representativePositionEn].filter(
    (positionName): positionName is string => Boolean(positionName),
  );

  for (const field of jobFields) {
    const position = field.positions.find((item) => positionNames.includes(item.name));

    if (position) {
      return { field, position };
    }
  }

  const fallbackField = jobFields[0];
  const fallbackPosition = fallbackField?.positions[0];

  return fallbackField && fallbackPosition
    ? { field: fallbackField, position: fallbackPosition }
    : null;
}
