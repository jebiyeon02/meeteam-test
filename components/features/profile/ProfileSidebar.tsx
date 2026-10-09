'use client';

import { Camera, CheckCircle2, CircleSlash2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { type ChangeEvent, useId, useRef, useState } from 'react';

import BaseButton from '@/components/shared/BaseButton';
import BaseDropdown from '@/components/shared/BaseDropdown';
import BaseInput from '@/components/shared/BaseInput';
import ImageCropModal from '@/components/shared/ImageCropModal';
import ProfileAvatar from '@/components/shared/ProfileAvatar';
import SkillChip from '@/components/shared/SkillChip';
import TechStackPicker from '@/components/shared/TechStackPicker';
import UniversityLogo from '@/components/shared/UniversityLogo';
import { findUniversityByEmail } from '@/components/shared/universityLogoRegistry';

interface SidebarFormData {
  name: string;
  age: string;
  gender: string;
  fieldCategory: string;
  fieldRole: string;
  email: string;
  github: string;
  blog: string;
}

interface SidebarContactItem {
  label: string;
  icon: LucideIcon;
  value: string;
  href: string;
}

interface SidebarSkillGroup {
  category?: string;
  role?: string;
  skills: string[];
}

interface ProfileSidebarProps {
  name: string;
  role: string;
  email: string;
  profileImageUrl?: string | null;
  isParticipating: boolean;
  skills: string[];
  socialContacts: SidebarContactItem[];
  actionLabel?: string;
  isEditing?: boolean;
  actionDisabled?: boolean;
  onAction?: () => void;
  onImageChange?: (file: File | null) => void;
  onToggleParticipation?: () => void;
  categoryOptions?: string[];
  roleOptions?: string[];
  formData?: SidebarFormData;
  onFieldChange?: (field: keyof SidebarFormData, value: string) => void;
  skillGroups?: SidebarSkillGroup[];
  availableSkills?: string[];
  onSkillsChange?: (groupIndex: number, skills: string[]) => void;
}

export default function ProfileSidebar({
  name,
  role,
  email,
  profileImageUrl,
  isParticipating,
  skills,
  socialContacts,
  actionLabel = '프로필 수정',
  isEditing = false,
  actionDisabled = false,
  onAction,
  onImageChange,
  onToggleParticipation,
  categoryOptions = [],
  roleOptions = [],
  formData,
  onFieldChange,
  skillGroups = [],
  availableSkills = [],
  onSkillsChange,
}: ProfileSidebarProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isRoleOpen, setIsRoleOpen] = useState(false);
  const university = findUniversityByEmail(email);
  const visibleSocialContacts = socialContacts.filter((item) => item.href && item.value.trim());
  const visibleSkills = skills.filter(Boolean);
  const editableSkillGroup = skillGroups[0] ?? { skills: [] };
  const showActionButton = Boolean(onAction) && !isEditing;
  const canEditDetails = isEditing && formData && onFieldChange;

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
    <aside className="min-w-0 space-y-5 lg:sticky lg:top-24 lg:self-start">
      <div className="space-y-4">
        <div className="relative mx-auto h-40 w-40 rounded-full border-4 border-mt-white bg-mt-white shadow-lg sm:h-44 sm:w-44 lg:h-56 lg:w-56">
          <ProfileAvatar
            name={name}
            imageUrl={profileImageUrl}
            sizeClassName="h-full w-full"
            shape="circle"
            textClassName="text-5xl"
          />

          {isEditing ? (
            <label
              htmlFor={inputId}
              className="absolute right-2 bottom-3 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-2 border-mt-white bg-mt-primary text-mt-white shadow-sm transition-colors hover:bg-mt-logo-blue"
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

        <div className="text-center lg:text-left">
          <h1 className="text-2xl leading-8 font-bold text-mt-text-primary">{name}</h1>
          {!isEditing && role ? (
            <p className="mt-1 text-base leading-6 font-medium text-mt-text-secondary">{role}</p>
          ) : null}
        </div>

        {showActionButton ? (
          <BaseButton
            size="M"
            variant="primary"
            full
            onClick={onAction}
            disabled={actionDisabled}
            data-cy="profile-action-button"
          >
            {actionLabel}
          </BaseButton>
        ) : null}
      </div>

      {canEditDetails ? (
        <ProfileSidebarEditor
          formData={formData}
          isParticipating={isParticipating}
          categoryOptions={categoryOptions}
          roleOptions={roleOptions}
          socialContacts={socialContacts}
          skillGroup={editableSkillGroup}
          availableSkills={availableSkills}
          isCategoryOpen={isCategoryOpen}
          isRoleOpen={isRoleOpen}
          onToggleParticipation={onToggleParticipation}
          onFieldChange={onFieldChange}
          onCategoryOpenChange={setIsCategoryOpen}
          onRoleOpenChange={setIsRoleOpen}
          onSkillsChange={onSkillsChange}
        />
      ) : (
        <ProfileSidebarDetails
          isParticipating={isParticipating}
          university={university}
          socialContacts={visibleSocialContacts}
          skills={visibleSkills}
        />
      )}

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
    </aside>
  );
}

function ProfileSidebarDetails({
  isParticipating,
  university,
  socialContacts,
  skills,
}: {
  isParticipating: boolean;
  university: ReturnType<typeof findUniversityByEmail>;
  socialContacts: SidebarContactItem[];
  skills: string[];
}) {
  const StatusIcon = isParticipating ? CheckCircle2 : CircleSlash2;

  return (
    <div className="space-y-4">
      <div className="space-y-2 border-t border-mt-border pt-4">
        {university ? (
          <div className="flex min-w-0 items-center gap-3 text-sm leading-5 font-medium text-mt-text-primary">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden">
              <UniversityLogo
                universityId={university.id}
                variant="icon"
                className="h-10 w-10 max-w-none shrink-0 object-cover"
              />
            </span>
            <span className="min-w-0 truncate">{university.nameKo}</span>
          </div>
        ) : null}
        <SidebarMetaRow icon={StatusIcon}>
          {isParticipating ? '프로젝트 참여 가능' : '프로젝트 참여 불가'}
        </SidebarMetaRow>
      </div>

      {socialContacts.length > 0 ? (
        <div className="flex flex-col items-start gap-2 border-t border-mt-border pt-4">
          {socialContacts.map((item) => (
            <SidebarLink key={item.label} item={item} />
          ))}
        </div>
      ) : null}

      <div className="space-y-3 border-t border-mt-border pt-4">
        <h2 className="text-base leading-6 font-bold text-mt-text-primary">기술 스택</h2>
        {skills.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, index) => (
              <SkillChip key={`${skill}-${index}`} label={skill} size="md" />
            ))}
          </div>
        ) : (
          <p className="text-sm leading-5 text-mt-text-secondary">등록된 기술 스택이 없습니다.</p>
        )}
      </div>
    </div>
  );
}

function ProfileSidebarEditor({
  formData,
  isParticipating,
  categoryOptions,
  roleOptions,
  socialContacts,
  skillGroup,
  availableSkills,
  isCategoryOpen,
  isRoleOpen,
  onToggleParticipation,
  onFieldChange,
  onCategoryOpenChange,
  onRoleOpenChange,
  onSkillsChange,
}: {
  formData: SidebarFormData;
  isParticipating: boolean;
  categoryOptions: string[];
  roleOptions: string[];
  socialContacts: SidebarContactItem[];
  skillGroup: SidebarSkillGroup;
  availableSkills: string[];
  isCategoryOpen: boolean;
  isRoleOpen: boolean;
  onToggleParticipation?: () => void;
  onFieldChange: (field: keyof SidebarFormData, value: string) => void;
  onCategoryOpenChange: (value: boolean) => void;
  onRoleOpenChange: (value: boolean) => void;
  onSkillsChange?: (groupIndex: number, skills: string[]) => void;
}) {
  return (
    <div className="space-y-5">
      <section className="space-y-3 border-t border-mt-border pt-4">
        <SectionTitle>프로젝트 참여 설정</SectionTitle>
        <div className="flex items-center justify-between gap-4">
          <span
            className={`text-sm leading-5 font-bold ${
              isParticipating ? 'text-mt-text-primary' : 'text-mt-text-secondary'
            }`}
          >
            {isParticipating ? '프로젝트 참여 가능' : '프로젝트 참여 불가'}
          </span>
          <button
            type="button"
            onClick={onToggleParticipation}
            data-cy="profile-participation-toggle"
            className={`flex h-7 w-12 items-center rounded-full px-1 transition-colors ${
              isParticipating ? 'bg-mt-primary' : 'bg-mt-shadow-blue'
            }`}
            aria-label={isParticipating ? '프로젝트 참여 가능' : '프로젝트 참여 불가'}
            role="switch"
            aria-checked={isParticipating}
          >
            <span
              className={`h-5 w-5 rounded-full bg-mt-white shadow-sm transition-transform ${
                isParticipating ? 'ml-auto' : ''
              }`}
            />
          </button>
        </div>
      </section>

      <section className="space-y-3 border-t border-mt-border pt-4">
        <SectionTitle>기본 정보</SectionTitle>
        <dl className="space-y-2">
          <EditableInfoRow label="나이" value={formData.age} />
          <EditableInfoRow label="성별" value={formData.gender} />
          <EditableInfoRow label="이메일" value={formData.email} />
        </dl>

        <div className="space-y-2">
          <BaseDropdown
            value={formData.fieldCategory}
            placeholder="직군 대분류"
            open={isCategoryOpen}
            items={categoryOptions}
            dataCy="profile-field-category"
            onToggle={() => onCategoryOpenChange(!isCategoryOpen)}
            onSelect={(value) => {
              onFieldChange('fieldCategory', value);
              onCategoryOpenChange(false);
            }}
            containerClassName="w-full"
            buttonClassName="items-center justify-between px-3 py-2.5"
            textClassName="text-sm leading-5 font-normal text-mt-text-nav"
          />

          <BaseDropdown
            value={formData.fieldRole}
            placeholder="직군 세부 분야"
            open={isRoleOpen}
            items={roleOptions}
            dataCy="profile-field-role"
            onToggle={() => onRoleOpenChange(!isRoleOpen)}
            onSelect={(value) => {
              onFieldChange('fieldRole', value);
              onRoleOpenChange(false);
            }}
            containerClassName="w-full"
            buttonClassName="items-center justify-between px-3 py-2.5"
            textClassName="text-sm leading-5 font-normal text-mt-text-nav"
          />
        </div>
      </section>

      <section className="space-y-3 border-t border-mt-border pt-4">
        <SectionTitle>외부 링크</SectionTitle>
        {socialContacts.map((item, index) => {
          const Icon = item.icon;
          const field: 'github' | 'blog' = index === 0 ? 'github' : 'blog';
          const placeholder =
            field === 'github' ? 'https://github.com/username' : 'https://your-blog.com';

          return (
            <label key={field} className="block space-y-2">
              <span className="flex items-center gap-2 text-sm leading-5 font-bold text-mt-text-secondary">
                <Icon className="h-4 w-4" aria-hidden strokeWidth={1.8} />
                {item.label}
              </span>
              <BaseInput
                inputSize="S"
                value={formData[field]}
                placeholder={placeholder}
                data-cy={field === 'github' ? 'profile-github-input' : 'profile-blog-input'}
                onChange={(event) => onFieldChange(field, event.target.value)}
                className="rounded-lg text-sm leading-5 font-medium text-mt-text-nav"
              />
            </label>
          );
        })}
      </section>

      <section className="space-y-3 border-t border-mt-border pt-4">
        <SectionTitle>기술 스택</SectionTitle>
        <TechStackPicker
          inputId="profile-skills-0"
          inputDataCy="profile-skills-input-0"
          options={availableSkills}
          value={skillGroup.skills}
          onChange={(nextSkills) => onSkillsChange?.(0, nextSkills)}
          placeholder="기술 스택 검색"
          enableSelectedChipReorder={true}
          rankedChipCount={3}
          selectedChipsDataCy="profile-skills-selected-0"
        />
      </section>
    </div>
  );
}

function SidebarMetaRow({ icon: Icon, children }: { icon: LucideIcon; children: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2 text-sm leading-5 font-medium text-mt-text-primary">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center">
        <Icon className="h-4 w-4 text-mt-text-secondary" aria-hidden strokeWidth={1.8} />
      </span>
      <span className="min-w-0 truncate">{children}</span>
    </div>
  );
}

function SidebarLink({ item }: { item: SidebarContactItem }) {
  const Icon = item.icon;

  return (
    <a
      href={item.href}
      className="flex max-w-full items-center gap-3 text-sm leading-5 font-medium text-mt-text-primary transition-colors hover:text-mt-primary hover:underline"
      target="_blank"
      rel="noreferrer"
      aria-label={`${item.label} 링크 열기`}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center">
        <Icon className="h-4 w-4 text-mt-text-secondary" aria-hidden strokeWidth={1.8} />
      </span>
      <span className="truncate">{item.label}</span>
    </a>
  );
}

function EditableInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm leading-5">
      <dt className="font-normal text-mt-text-secondary">{label}</dt>
      <dd className="text-right font-medium text-mt-text-primary">{value}</dd>
    </div>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <h2 className="text-base leading-6 font-bold text-mt-text-primary">{children}</h2>;
}
