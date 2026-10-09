'use client';

import { Camera } from 'lucide-react';
import { type ChangeEvent, useId, useRef, useState } from 'react';

import BaseButton from '@/components/shared/BaseButton';
import ImageCropModal from '@/components/shared/ImageCropModal';
import ProfileAvatar from '@/components/shared/ProfileAvatar';
import SkillChip from '@/components/shared/SkillChip';
import UniversityLogo from '@/components/shared/UniversityLogo';
import { findUniversityByEmail } from '@/components/shared/universityLogoRegistry';

interface ProfileHeaderProps {
  name: string;
  role: string;
  email?: string;
  profileImageUrl?: string | null;
  isParticipating?: boolean;
  projectCount?: number;
  skills?: string[];
  actionLabel?: string;
  isEditing?: boolean;
  onAction?: () => void;
  onCancel?: () => void;
  onImageChange?: (file: File | null) => void;
  actionDisabled?: boolean;
}

export default function ProfileHeader({
  name,
  role,
  email,
  profileImageUrl,
  isParticipating = false,
  projectCount = 0,
  skills = [],
  actionLabel = '프로필 수정',
  isEditing = false,
  onAction,
  onCancel,
  onImageChange,
  actionDisabled = false,
}: ProfileHeaderProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const university = findUniversityByEmail(email);
  const showActionButton = Boolean(onAction);
  const visibleSkills = skills.slice(0, 3);
  const hiddenSkillCount = Math.max(skills.length - visibleSkills.length, 0);

  const handleImageInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      return;
    }

    setCropFile(file);
  };

  const handleCloseCrop = () => {
    setCropFile(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <section className="overflow-hidden rounded-3xl border border-mt-border bg-mt-white shadow-md">
      <div className="h-24 bg-mt-bg-soft" />
      <div className="flex flex-col gap-5 px-8 pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="-mt-11 flex flex-col gap-6 sm:flex-row sm:items-end">
          <div className="relative h-32 w-32 rounded-full border-4 border-mt-white bg-mt-white shadow-lg">
            <ProfileAvatar
              name={name}
              imageUrl={profileImageUrl}
              sizeClassName="h-full w-full"
              shape="circle"
              textClassName="text-4xl"
            />

            {isEditing ? (
              <label
                htmlFor={inputId}
                className="absolute right-1 bottom-2 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-2 border-mt-white bg-mt-primary text-mt-white shadow-sm transition-colors hover:bg-mt-logo-blue"
                aria-label="프로필 이미지 수정"
              >
                <Camera className="h-5 w-5" aria-hidden strokeWidth={2} />
              </label>
            ) : null}
            <input
              ref={inputRef}
              id={inputId}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageInputChange}
            />
          </div>

          <div className="space-y-3 pb-1">
            <h1 className="text-3xl leading-9 font-bold tracking-tight text-mt-text-primary">
              {name}
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <p className="text-base leading-6 font-medium text-mt-text-secondary">{role}</p>
              {university ? (
                <>
                  <span className="h-1 w-1 rounded-full bg-mt-shadow-blue" aria-hidden />
                  <div className="inline-flex items-center gap-2.5">
                    <UniversityLogo
                      universityId={university.id}
                      variant="icon"
                      className="h-8 w-8 shrink-0"
                    />
                    <span className="text-base leading-6 font-semibold text-mt-text-primary">
                      {university.nameKo}
                    </span>
                  </div>
                </>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs leading-4 font-bold ${
                  isParticipating
                    ? 'bg-mt-mint text-mt-white'
                    : 'bg-mt-bg-soft text-mt-text-secondary'
                }`}
              >
                {isParticipating ? '프로젝트 참여 가능' : '프로젝트 참여 불가'}
              </span>
              <span className="inline-flex rounded-full bg-mt-bg-soft px-3 py-1 text-xs leading-4 font-bold text-mt-text-secondary">
                참여 프로젝트 {projectCount}개
              </span>
            </div>

            {skills.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {visibleSkills.map((skill) => (
                  <SkillChip key={skill} label={skill} variant="outline" />
                ))}
                {hiddenSkillCount > 0 ? (
                  <span className="inline-flex items-center rounded-md border border-mt-border bg-mt-bg-soft px-2.5 py-1 text-xs leading-4 font-medium text-mt-text-secondary">
                    +{hiddenSkillCount}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        {showActionButton && !isEditing ? (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {isEditing && onCancel ? (
              <BaseButton size="M" variant="gray" onClick={onCancel} disabled={actionDisabled}>
                취소
              </BaseButton>
            ) : null}
            <BaseButton
              size="M"
              variant="primary"
              onClick={onAction}
              disabled={actionDisabled}
              data-cy="profile-action-button"
              className="px-5 shadow-[0_4px_6px_-1px_var(--color-mt-border),0_2px_4px_-2px_var(--color-mt-border)]"
            >
              {actionLabel}
            </BaseButton>
          </div>
        ) : null}
      </div>

      <ImageCropModal
        file={cropFile}
        isOpen={Boolean(cropFile)}
        title="프로필 사진 조정"
        aspectRatio={1}
        outputWidth={512}
        outputHeight={512}
        cropShape="circle"
        onClose={handleCloseCrop}
        onConfirm={(file) => {
          onImageChange?.(file);
          setCropFile(null);
        }}
      />
    </section>
  );
}
