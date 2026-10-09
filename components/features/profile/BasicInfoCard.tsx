'use client';

import type { LucideIcon } from 'lucide-react';

import { useState } from 'react';
import BaseDropdown from '@/components/shared/BaseDropdown';
import BaseInput from '@/components/shared/BaseInput';
import ProfileCard from '@/components/features/profile/ProfileCard';

interface EditableProfileFields {
  name: string;
  age: string;
  gender: string;
  fieldCategory: string;
  fieldRole: string;
  email: string;
  github: string;
  blog: string;
}

interface ProfileInfoItem {
  label: string;
  value: string;
}

interface ProfileContactItem {
  label: string;
  icon: LucideIcon;
  value: string;
  href: string;
}

interface BasicInfoCardProps {
  editable?: boolean;
  infoItems: ProfileInfoItem[];
  emailContact: ProfileContactItem;
  socialContacts: ProfileContactItem[];
  categoryOptions?: string[];
  roleOptions?: string[];
  formData?: EditableProfileFields;
  onFieldChange?: (field: keyof EditableProfileFields, value: string) => void;
}

export default function BasicInfoCard({
  editable = false,
  infoItems,
  emailContact,
  socialContacts,
  categoryOptions = [],
  roleOptions = [],
  formData,
  onFieldChange,
}: BasicInfoCardProps) {
  const EmailIcon = emailContact.icon;
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isRoleOpen, setIsRoleOpen] = useState(false);
  const visibleSocialContacts = socialContacts.filter((item) => item.href && item.value.trim());

  if (!editable || !formData || !onFieldChange) {
    return (
      <ProfileCard title="활동 및 링크">
        <div className="mt-4 space-y-5">
          <div>
            <h3 className="text-sm leading-5 font-bold text-mt-text-secondary">활동 정보</h3>
            <dl className="mt-3 space-y-4">
              {infoItems.map((item) => (
                <div key={item.label} className="flex items-start justify-between gap-4">
                  <dt className="text-sm leading-5 font-normal text-mt-text-secondary">
                    {item.label}
                  </dt>
                  <dd className="text-right text-sm leading-5 font-medium text-mt-text-primary">
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {visibleSocialContacts.length > 0 ? (
            <div className="space-y-3 border-t border-mt-border pt-4">
              <h3 className="text-sm leading-5 font-bold text-mt-text-secondary">외부 링크</h3>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {visibleSocialContacts.map((item) => (
                  <ProfileContactLink key={item.label} item={item} />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </ProfileCard>
    );
  }

  return (
    <ProfileCard className="min-h-122">
      <h2 className="text-lg leading-7 font-bold text-mt-text-primary">기본 정보 수정</h2>
      <p className="mt-1 text-sm leading-5 text-mt-text-secondary">
        이름, 나이, 성별, 이메일은 계정 정보에서 관리돼요.
      </p>

      <div className="mt-4 space-y-4">
        <dl className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <dt className="text-sm leading-5 font-normal text-mt-text-secondary">이름</dt>
            <dd className="text-right text-sm leading-5 font-medium text-mt-text-primary">
              {formData.name}
            </dd>
          </div>

          <div className="flex items-start justify-between gap-4">
            <dt className="text-sm leading-5 font-normal text-mt-text-secondary">나이</dt>
            <dd className="text-right text-sm leading-5 font-medium text-mt-text-primary">
              {formData.age}
            </dd>
          </div>

          <div className="flex items-start justify-between gap-4">
            <dt className="text-sm leading-5 font-normal text-mt-text-secondary">성별</dt>
            <dd className="text-right text-sm leading-5 font-medium text-mt-text-primary">
              {formData.gender}
            </dd>
          </div>

          <div className="space-y-2">
            <dt className="text-sm leading-5 font-normal text-mt-text-secondary">직군</dt>
            <dd className="space-y-2">
              <BaseDropdown
                value={formData.fieldCategory}
                placeholder="직군 대분류"
                open={isCategoryOpen}
                items={categoryOptions}
                dataCy="profile-field-category"
                onToggle={() => setIsCategoryOpen((current) => !current)}
                onSelect={(value) => {
                  onFieldChange('fieldCategory', value);
                  setIsCategoryOpen(false);
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
                onToggle={() => setIsRoleOpen((current) => !current)}
                onSelect={(value) => {
                  onFieldChange('fieldRole', value);
                  setIsRoleOpen(false);
                }}
                containerClassName="w-full"
                buttonClassName="items-center justify-between px-3 py-2.5"
                textClassName="text-sm leading-5 font-normal text-mt-text-nav"
              />
            </dd>
          </div>
        </dl>

        <div className="space-y-4 border-t border-mt-border pt-4">
          <div className="flex items-center gap-3 text-sm leading-5 font-medium text-mt-text-nav">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-mt-logo-blue/30 bg-mt-badge-bg text-mt-primary">
              <EmailIcon className="h-4 w-4" aria-hidden strokeWidth={1.8} />
            </span>
            <div className="min-w-0">
              <p className="text-xs leading-4 font-bold text-mt-text-secondary">이메일</p>
              <span className="block truncate">{formData.email}</span>
            </div>
          </div>

          {socialContacts.map((item, index) => {
            const Icon = item.icon;
            const field = index === 0 ? 'github' : 'blog';
            const label = field === 'github' ? 'GitHub 주소' : '블로그 주소';
            const placeholder =
              field === 'github' ? 'https://github.com/username' : 'https://your-blog.com';

            return (
              <div key={field} className="space-y-2">
                <label className="flex items-center gap-2 text-sm leading-5 font-bold text-mt-text-secondary">
                  <Icon className="h-4 w-4" aria-hidden strokeWidth={1.8} />
                  {label}
                </label>
                <BaseInput
                  inputSize="S"
                  value={formData[field]}
                  placeholder={placeholder}
                  data-cy={field === 'github' ? 'profile-github-input' : 'profile-blog-input'}
                  onChange={(event) => onFieldChange(field, event.target.value)}
                  className="rounded-lg text-sm leading-5 font-medium text-mt-text-nav"
                />
              </div>
            );
          })}
        </div>
      </div>
    </ProfileCard>
  );
}

function ProfileContactLink({ item }: { item: ProfileContactItem }) {
  const Icon = item.icon;

  return (
    <a
      href={item.href}
      className="inline-flex min-w-0 items-center gap-2 text-sm leading-5 font-medium text-mt-text-secondary transition-colors hover:text-mt-primary hover:underline"
      target="_blank"
      rel="noreferrer"
      aria-label={`${item.label} 링크 열기`}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden strokeWidth={1.8} />
      <span className="truncate">{item.label}</span>
    </a>
  );
}
