'use client';

import { type FormEvent, useEffect, useState } from 'react';
import { MessageCircle, Plus } from 'lucide-react';
import GithubLoginIcon from '@/assets/GithubLogin.svg';
import { OPTIONS } from '@/constants/interest';
import type { Interest, JobFieldOption } from '@/types/auth';
import type { ProjectFormValues, RecruitInterest, ReleasePlatform } from '@/types/project';
import TechStackSection from '@/components/features/auth/TechStackSection';
import { fetchJobOptions } from '@/components/features/auth/signupApi';
import CategoryBox from '@/components/features/project/create/CategoryBox';
import CoverImageUploader from '@/components/features/project/create/CoverImageUploader';
import ProjectFormSectionNav from '@/components/features/project/create/ProjectFormSectionNav';
import {
  projectFormSchema,
  type ProjectFormFieldErrors,
} from '@/components/features/project/create/schema';
import RecruitDeadlineField from '@/components/features/project/create/RecruitDeadlineField';
import { PROJECT_CATEGORIES, RELEASE_PLATFORMS } from '@/components/features/project/constants';
import {
  findProjectJobField,
  getProjectJobFieldLabel,
  getProjectJobPositionLabel,
} from '@/components/features/project/projectJobOptions';
import BaseButton from '@/components/shared/BaseButton';
import BaseDropdown from '@/components/shared/BaseDropdown';
import BaseField from '@/components/shared/BaseField';
import BaseInput from '@/components/shared/BaseInput';
import BaseTag from '@/components/shared/BaseTag';
import MarkdownEditor from '@/components/shared/MarkdownEditor';
import ToastMessage from '@/components/shared/ToastMessage';

type OpenDropdownKey = 'major' | 'minor' | null;
type ProjectFormVariant = 'create' | 'edit';
type ProjectFormStepField = keyof ProjectFormFieldErrors;

interface ProjectFormProps {
  variant?: ProjectFormVariant;
  initialValues?: ProjectFormValues;
  initialCoverImageUrl?: string;
  editable?: boolean;
  notEditableReason?: string | null;
  onSubmit?: (
    values: ProjectFormValues,
    context: { jobFields: JobFieldOption[] },
  ) => void | Promise<void>;
}

const DEFAULT_FORM_VALUES: ProjectFormValues = {
  projectName: '',
  githubUrl: '',
  communicationUrl: '',
  categoryId: '',
  description: '',
  releasePlatforms: ['웹'],
  myInterest: { major: '', minor: '' },
  recruitInterests: [{ major: '', minor: '', count: 1 }],
  recruitTechStacks: {},
  recruitDeadline: '',
  isRecruitUntilComplete: false,
  coverImage: null,
};

const CREATE_STEPS = [
  { title: '기본 정보', description: '프로젝트의 첫인상을 정해요.' },
  { title: '프로젝트 소개', description: '소개와 연결 링크를 입력해요.' },
  { title: '모집 역할', description: '리더와 모집 포지션을 정해요.' },
  { title: '기술 스택과 마감', description: '필요 기술과 마감 방식을 정해요.' },
] as const;

const CREATE_STEP_FIELDS: ProjectFormStepField[][] = [
  ['projectName', 'categoryId', 'releasePlatforms'],
  ['description', 'githubUrl', 'communicationUrl'],
  ['myInterest', 'recruitInterests'],
  ['recruitTechStacks', 'recruitDeadline', 'form'],
];

const EDIT_SECTIONS = [
  { title: '프로젝트 정보', description: '이름, 카테고리, 플랫폼, 커버 이미지' },
  { title: '소개와 링크', description: '소개글, 외부 연결 정보' },
  { title: '역할과 모집', description: '리더 분야, 모집 포지션' },
  { title: '기술 스택과 마감', description: '분야별 기술 스택, 마감 방식' },
] as const;

function buildOptionalUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return '';
  }

  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function isValidUrl(value: string) {
  const url = buildOptionalUrl(value);

  if (!url) {
    return true;
  }

  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
}

function isValidGithubRepositoryUrl(value: string) {
  const url = buildOptionalUrl(value);

  if (!url) {
    return true;
  }

  try {
    const parsedUrl = new URL(url);
    const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);

    return (
      parsedUrl.hostname.toLowerCase() === 'github.com' &&
      pathSegments.length >= 2 &&
      pathSegments.every((segment) => /^[A-Za-z0-9._-]+$/.test(segment))
    );
  } catch {
    return false;
  }
}

function getRecruitmentMinimumCount(interest: RecruitInterest) {
  return Math.max(1, interest.minRecruitmentCount ?? 1);
}

export default function ProjectForm({
  variant = 'create',
  initialValues,
  initialCoverImageUrl = '',
  editable = true,
  notEditableReason,
  onSubmit,
}: ProjectFormProps) {
  const messageIcon = <MessageCircle className="h-5 w-5 text-mt-text-secondary" />;
  const githubIcon = <GithubLoginIcon className="h-5 w-5 text-mt-text-secondary" aria-hidden />;
  const isEdit = variant === 'edit';
  const isCreate = !isEdit;
  const hydratedInitialValues = initialValues ?? DEFAULT_FORM_VALUES;

  const [projectName, setProjectName] = useState(hydratedInitialValues.projectName);
  const [githubUrl, setGithubUrl] = useState(hydratedInitialValues.githubUrl);
  const [communicationUrl, setCommunicationUrl] = useState(hydratedInitialValues.communicationUrl);
  const [description, setDescription] = useState(hydratedInitialValues.description);
  const [recruitDeadline, setRecruitDeadline] = useState(hydratedInitialValues.recruitDeadline);
  const [isRecruitUntilComplete, setIsRecruitUntilComplete] = useState(
    hydratedInitialValues.isRecruitUntilComplete,
  );
  const [projectCategoryId, setProjectCategoryId] = useState(hydratedInitialValues.categoryId);
  const [selectedPlatforms, setSelectedPlatforms] = useState<ReleasePlatform[]>(
    hydratedInitialValues.releasePlatforms,
  );
  const [myInterest, setMyInterest] = useState<Interest>(hydratedInitialValues.myInterest);
  const [myOpenDropdown, setMyOpenDropdown] = useState<OpenDropdownKey>(null);
  const [recruitInterests, setRecruitInterests] = useState<RecruitInterest[]>(
    hydratedInitialValues.recruitInterests,
  );
  const [recruitTechStacks, setRecruitTechStacks] = useState<Record<string, string[]>>(
    hydratedInitialValues.recruitTechStacks,
  );
  const [coverImage, setCoverImage] = useState<File | null>(
    hydratedInitialValues.coverImage ?? null,
  );
  const [openRecruitDropdown, setOpenRecruitDropdown] = useState<{
    index: number;
    key: Exclude<OpenDropdownKey, null>;
  } | null>(null);
  const [jobFields, setJobFields] = useState<JobFieldOption[]>([]);
  const [isLoadingJobOptions, setIsLoadingJobOptions] = useState(true);
  const [jobOptionsError, setJobOptionsError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<ProjectFormFieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createStepIndex, setCreateStepIndex] = useState(0);
  const [hasAttemptedFinalCreateSubmit, setHasAttemptedFinalCreateSubmit] = useState(false);
  const [editSectionIndex, setEditSectionIndex] = useState(0);

  useEffect(() => {
    let active = true;

    const loadJobOptions = async () => {
      try {
        const nextJobFields = await fetchJobOptions();

        if (!active) {
          return;
        }

        setJobFields(nextJobFields);
        setJobOptionsError('');
      } catch (error) {
        if (!active) {
          return;
        }

        setJobOptionsError(
          error instanceof Error ? error.message : '기술 스택 옵션을 불러오지 못했습니다.',
        );
      } finally {
        if (active) {
          setIsLoadingJobOptions(false);
        }
      }
    };

    void loadJobOptions();

    return () => {
      active = false;
    };
  }, []);

  const majorOptions =
    jobFields.length > 0
      ? jobFields.map((field) => getProjectJobFieldLabel(field))
      : OPTIONS.map((item) => item.major);

  const getMinors = (major: string) => {
    if (jobFields.length === 0) {
      return OPTIONS.find((item) => item.major === major)?.minor ?? [];
    }

    const selectedField = findProjectJobField(jobFields, major);
    return selectedField?.positions.map((position) => getProjectJobPositionLabel(position)) ?? [];
  };

  const clearError = (...keys: Array<keyof ProjectFormFieldErrors>) => {
    setFieldErrors((prev) => {
      const next = { ...prev };

      keys.forEach((key) => {
        delete next[key];
      });

      delete next.form;

      return next;
    });
  };

  const handlePlatformToggle = (platform: ReleasePlatform) => {
    setSelectedPlatforms([platform]);
    clearError('releasePlatforms');
  };

  const addRecruitInterest = () => {
    setRecruitInterests((prev) => [...prev, { major: '', minor: '', count: 1 }]);
    clearError('recruitInterests');
  };

  const updateRecruitInterest = (index: number, next: Interest) => {
    setRecruitInterests((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index ? { ...item, major: next.major, minor: next.minor } : item,
      ),
    );
    clearError('recruitInterests', 'recruitTechStacks');
  };

  const removeRecruitInterest = (index: number) => {
    setRecruitInterests((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
    setOpenRecruitDropdown((prev) => {
      if (!prev) return prev;
      if (prev.index === index) return null;
      if (prev.index > index) return { ...prev, index: prev.index - 1 };
      return prev;
    });
    clearError('recruitInterests', 'recruitTechStacks');
  };

  const updateRecruitCount = (index: number, delta: number) => {
    setRecruitInterests((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index
          ? { ...item, count: Math.max(getRecruitmentMinimumCount(item), item.count + delta) }
          : item,
      ),
    );
    clearError('recruitInterests');
  };

  const toggleMyDropdown = (key: Exclude<OpenDropdownKey, null>) => {
    setMyOpenDropdown((prev) => (prev === key ? null : key));
  };

  const toggleRecruitDropdown = (index: number, key: Exclude<OpenDropdownKey, null>) => {
    setOpenRecruitDropdown((prev) =>
      prev && prev.index === index && prev.key === key ? null : { index, key },
    );
  };

  const buildValidationErrors = () => {
    const result = projectFormSchema.safeParse({
      projectName,
      categoryId: projectCategoryId,
      description,
      releasePlatforms: selectedPlatforms,
      myInterest,
      recruitInterests,
      recruitDeadline,
      isRecruitUntilComplete,
    });

    const nextErrors: ProjectFormFieldErrors = {};

    if (!result.success) {
      const flattened = result.error.flatten().fieldErrors;

      nextErrors.projectName = flattened.projectName?.[0];
      nextErrors.categoryId = flattened.categoryId?.[0];
      nextErrors.description = flattened.description?.[0];
      nextErrors.releasePlatforms = flattened.releasePlatforms?.[0];
      nextErrors.myInterest = flattened.myInterest?.[0];
      nextErrors.recruitInterests = flattened.recruitInterests?.[0];
      nextErrors.recruitDeadline = flattened.recruitDeadline?.[0];
    }

    if (!isValidGithubRepositoryUrl(githubUrl)) {
      nextErrors.githubUrl = 'GitHub 레포지토리 주소 형식이 올바르지 않아요.';
    }

    if (!isValidUrl(communicationUrl)) {
      nextErrors.communicationUrl = '소통 채널 주소 형식이 올바르지 않아요.';
    }

    const hasMissingRecruitTechStacks = recruitInterests
      .filter((interest) => interest.major && interest.minor)
      .some((interest) => {
        const techStacks = recruitTechStacks[`${interest.major} - ${interest.minor}`] ?? [];
        return techStacks.length === 0;
      });

    if (hasMissingRecruitTechStacks) {
      nextErrors.recruitTechStacks = '각 모집 분야별 기술 스택을 1개 이상 선택해 주세요.';
    }

    if (!isEdit && jobFields.length === 0) {
      nextErrors.form =
        '프로젝트 등록 옵션을 아직 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.';
    }

    if (!nextErrors.form) {
      nextErrors.form = Object.values(nextErrors).find(Boolean);
    }

    return nextErrors;
  };

  const validateForm = () => {
    const nextErrors = buildValidationErrors();
    setFieldErrors(nextErrors);

    return Object.values(nextErrors).every((value) => !value);
  };

  const validateCreateStep = () => {
    const nextErrors = buildValidationErrors();
    const stepFields = CREATE_STEP_FIELDS[createStepIndex];
    const stepErrors = stepFields.reduce<ProjectFormFieldErrors>((errors, key) => {
      if (nextErrors[key]) {
        return { ...errors, [key]: nextErrors[key] };
      }

      return errors;
    }, {});
    const firstStepError = stepFields.map((key) => nextErrors[key]).find(Boolean);

    if (firstStepError) {
      stepErrors.form = firstStepError;
    }

    setFieldErrors(stepErrors);

    return !firstStepError;
  };

  const handleNextStep = () => {
    if (!validateCreateStep()) {
      return;
    }

    setFieldErrors({});
    setHasAttemptedFinalCreateSubmit(false);
    setCreateStepIndex((prev) => Math.min(prev + 1, CREATE_STEPS.length - 1));
  };

  const handlePreviousStep = () => {
    setCreateStepIndex((prev) => Math.max(prev - 1, 0));
    setHasAttemptedFinalCreateSubmit(false);
    clearError('form');
  };

  const isVisibleSection = (sectionIndex: number) =>
    isEdit ? editSectionIndex === sectionIndex : createStepIndex === sectionIndex;

  const submitProject = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      clearError('form');

      await onSubmit?.(
        {
          projectName,
          githubUrl,
          communicationUrl,
          categoryId: projectCategoryId,
          description,
          releasePlatforms: selectedPlatforms,
          myInterest,
          recruitInterests,
          recruitTechStacks,
          recruitDeadline,
          isRecruitUntilComplete,
          coverImage,
        },
        { jobFields },
      );
    } catch (error) {
      setFieldErrors((prev) => ({
        ...prev,
        form:
          error instanceof Error
            ? error.message
            : isEdit
              ? '프로젝트 수정 중 오류가 발생했습니다.'
              : '프로젝트 등록 중 오류가 발생했습니다.',
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isCreate) {
      return;
    }

    await submitProject();
  };

  const handleCreateSubmit = async () => {
    setHasAttemptedFinalCreateSubmit(true);
    await submitProject();
  };

  useEffect(() => {
    if (!isCreate || createStepIndex !== CREATE_STEPS.length - 1 || hasAttemptedFinalCreateSubmit) {
      return;
    }

    setFieldErrors((prev) => {
      if (!prev.recruitTechStacks && !prev.recruitDeadline) {
        return prev;
      }

      const rest = { ...prev };
      delete rest.recruitTechStacks;
      delete rest.recruitDeadline;

      return rest;
    });
  }, [createStepIndex, hasAttemptedFinalCreateSubmit, isCreate]);

  const minRecruitDeadline = new Date().toISOString().slice(0, 10);
  const shouldShowFinalStepErrors =
    isEdit || createStepIndex !== CREATE_STEPS.length - 1 || hasAttemptedFinalCreateSubmit;

  return (
    <section
      className={`mx-auto w-full ${
        isEdit
          ? 'max-w-6xl'
          : 'flex max-w-3xl flex-col rounded-3xl bg-mt-white p-5 shadow-xl sm:p-8 md:p-10'
      }`}
    >
      {!isEdit ? (
        <header>
          <h1 className="text-2xl leading-8 font-extrabold text-mt-text-primary">프로젝트 등록</h1>
          <div className="mt-6 space-y-3">
            <div className="grid grid-cols-4 gap-2">
              {CREATE_STEPS.map((step, index) => {
                const active = index <= createStepIndex;
                const current = index === createStepIndex;

                return (
                  <div key={step.title} className="min-w-0">
                    <div
                      className={`h-1.5 rounded-full transition-colors ${
                        active ? 'bg-mt-primary' : 'bg-mt-border'
                      }`}
                    />
                    <p
                      className={`mt-2 truncate text-xs leading-4 font-bold ${
                        current ? 'text-mt-primary' : 'text-mt-text-secondary'
                      }`}
                    >
                      {index + 1}. {step.title}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </header>
      ) : null}

      <div
        className={
          isEdit
            ? 'grid min-w-0 gap-4 sm:gap-6 lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-start'
            : ''
        }
      >
        {isEdit ? (
          <ProjectFormSectionNav
            sections={EDIT_SECTIONS}
            activeIndex={editSectionIndex}
            onSelect={(index) => {
              setEditSectionIndex(index);
              clearError('form');
            }}
          />
        ) : null}

        <div
          className={
            isEdit
              ? 'min-w-0 rounded-3xl border border-mt-border bg-mt-white px-4 py-6 shadow-sm sm:px-6 sm:py-8 md:px-12 md:py-10'
              : ''
          }
        >
          <form
            className={`${isEdit ? 'space-y-9' : 'mt-8 flex flex-col gap-8'}`}
            onSubmit={handleSubmit}
          >
            {!editable && notEditableReason ? (
              <div className="rounded-2xl border border-mt-border bg-mt-bg-soft px-5 py-4 text-sm leading-6 font-medium text-mt-text-nav">
                {notEditableReason}
              </div>
            ) : null}

            {isVisibleSection(0) ? (
              <>
                <BaseField
                  errorText={fieldErrors.projectName}
                  hintText=""
                  label="프로젝트 명"
                  required
                >
                  <BaseInput
                    value={projectName}
                    data-cy="project-form-name"
                    onChange={(event) => {
                      setProjectName(event.target.value);
                      clearError('projectName');
                    }}
                    placeholder="프로젝트 이름을 입력해주세요 (예: 여행 기록 공유 플랫폼, 트립로그)"
                  />
                </BaseField>

                <BaseField errorText={fieldErrors.categoryId} hintText="" label="프로젝트 카테고리">
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {PROJECT_CATEGORIES.map((category) => (
                      <CategoryBox
                        key={category.id}
                        label={category.label}
                        selected={projectCategoryId === category.id}
                        dataCy={`project-form-category-${category.id}`}
                        onClick={() => {
                          setProjectCategoryId(category.id);
                          clearError('categoryId');
                        }}
                      />
                    ))}
                  </div>
                </BaseField>

                <BaseField errorText={fieldErrors.releasePlatforms} hintText="" label="출시 플랫폼">
                  <div className="flex flex-wrap gap-2">
                    {RELEASE_PLATFORMS.map((platform) => {
                      const selected = selectedPlatforms.includes(platform);

                      return (
                        <BaseTag
                          key={platform}
                          selected={selected}
                          role="button"
                          tabIndex={0}
                          onClick={() => handlePlatformToggle(platform)}
                          data-cy={`project-form-platform-${platform}`}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              handlePlatformToggle(platform);
                            }
                          }}
                          className="min-h-10"
                          aria-pressed={selected}
                        >
                          {platform === '웹' ? 'Web' : platform}
                        </BaseTag>
                      );
                    })}
                  </div>
                </BaseField>

                <BaseField errorText="" hintText="" label="프로젝트 커버 이미지">
                  <CoverImageUploader
                    value={coverImage}
                    initialPreviewUrl={initialCoverImageUrl}
                    onChange={setCoverImage}
                  />
                </BaseField>
              </>
            ) : null}

            {isVisibleSection(1) ? (
              <>
                <BaseField errorText={fieldErrors.description} hintText="" label="프로젝트 소개 글">
                  <MarkdownEditor
                    value={description}
                    dataCy="project-form-description"
                    onChange={(nextDescription) => {
                      setDescription(nextDescription);
                      clearError('description');
                    }}
                    placeholder="프로젝트 소개 글을 입력해 주세요."
                    rows={isEdit ? 8 : 7}
                    previewEmptyText="프로젝트 이야기를 적으면, 팀원들이 이 모습으로 읽게 돼요."
                  />
                </BaseField>

                <BaseField
                  errorText={fieldErrors.githubUrl}
                  hintText=""
                  label="GitHub 레포지토리 주소"
                  required={false}
                >
                  <BaseInput
                    value={githubUrl}
                    data-cy="project-form-github"
                    onChange={(event) => {
                      setGithubUrl(event.target.value);
                      clearError('githubUrl');
                    }}
                    placeholder="https://github.com/username/repository"
                    leftIcon={githubIcon}
                    error={Boolean(fieldErrors.githubUrl)}
                    aria-invalid={Boolean(fieldErrors.githubUrl)}
                  />
                </BaseField>

                <BaseField
                  errorText={fieldErrors.communicationUrl}
                  hintText=""
                  label="소통 채널 주소"
                  required={false}
                >
                  <BaseInput
                    value={communicationUrl}
                    data-cy="project-form-communication"
                    onChange={(event) => {
                      setCommunicationUrl(event.target.value);
                      clearError('communicationUrl');
                    }}
                    placeholder="슬랙, 디스코드, 오픈카톡방 등 초대 링크"
                    leftIcon={messageIcon}
                    error={Boolean(fieldErrors.communicationUrl)}
                    aria-invalid={Boolean(fieldErrors.communicationUrl)}
                  />
                </BaseField>
              </>
            ) : null}

            {isVisibleSection(2) ? (
              <>
                <div className="w-full">
                  <BaseField errorText={fieldErrors.myInterest} hintText="" label="나의 분야">
                    <div className="flex w-full flex-col gap-2 sm:flex-row">
                      <BaseDropdown
                        value={myInterest.major}
                        placeholder="직군 선택"
                        open={myOpenDropdown === 'major'}
                        items={majorOptions}
                        dataCy="project-form-my-major"
                        onToggle={() => toggleMyDropdown('major')}
                        onSelect={(selectedMajor) => {
                          setMyInterest({ major: selectedMajor, minor: '' });
                          setMyOpenDropdown(null);
                          clearError('myInterest');
                        }}
                        containerClassName="w-full sm:basis-2/5 md:basis-1/3"
                        buttonClassName="justify-between px-4 py-3.5"
                        textClassName="min-w-0 truncate text-sm font-medium"
                      />

                      <BaseDropdown
                        value={myInterest.minor}
                        placeholder="상세 분야 선택"
                        open={myOpenDropdown === 'minor'}
                        items={getMinors(myInterest.major)}
                        dataCy="project-form-my-minor"
                        onToggle={() => myInterest.major && toggleMyDropdown('minor')}
                        onSelect={(selectedMinor) => {
                          setMyInterest((prev) => ({ ...prev, minor: selectedMinor }));
                          setMyOpenDropdown(null);
                          clearError('myInterest');
                        }}
                        disabled={!myInterest.major}
                        containerClassName="w-full min-w-0 sm:flex-1"
                        buttonClassName="justify-between px-4 py-3.5"
                        textClassName="min-w-0 truncate text-sm font-normal"
                      />
                    </div>
                  </BaseField>
                </div>

                <div className="flex w-full flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-base leading-6 font-bold text-mt-text-primary sm:text-lg sm:leading-7">
                      모집 분야
                    </label>
                    <button
                      type="button"
                      onClick={addRecruitInterest}
                      className="inline-flex items-center gap-1 text-xs leading-4 font-bold text-mt-primary"
                    >
                      <Plus className="h-4 w-4" aria-hidden strokeWidth={1.8} />
                      추가하기
                    </button>
                  </div>

                  <div className="flex flex-col gap-2">
                    {recruitInterests.map((interest, index) => (
                      <div
                        key={`${index}-${interest.major}-${interest.minor}`}
                        className="space-y-1"
                      >
                        <div className="flex flex-col gap-2 md:flex-row md:items-center">
                          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row">
                            <BaseDropdown
                              value={interest.major}
                              placeholder="직군 선택"
                              open={
                                openRecruitDropdown?.index === index &&
                                openRecruitDropdown.key === 'major'
                              }
                              items={majorOptions}
                              dataCy={`project-form-recruit-major-${index}`}
                              onToggle={() => toggleRecruitDropdown(index, 'major')}
                              onSelect={(selectedMajor) => {
                                updateRecruitInterest(index, { major: selectedMajor, minor: '' });
                                setOpenRecruitDropdown(null);
                              }}
                              containerClassName="w-full sm:basis-2/5 md:basis-1/3"
                              buttonClassName="justify-between px-4 py-3.5"
                              textClassName="min-w-0 truncate text-sm font-medium"
                            />

                            <BaseDropdown
                              value={interest.minor}
                              placeholder="상세 분야 선택"
                              open={
                                openRecruitDropdown?.index === index &&
                                openRecruitDropdown.key === 'minor'
                              }
                              items={getMinors(interest.major)}
                              dataCy={`project-form-recruit-minor-${index}`}
                              onToggle={() =>
                                interest.major && toggleRecruitDropdown(index, 'minor')
                              }
                              onSelect={(selectedMinor) => {
                                updateRecruitInterest(index, {
                                  major: interest.major,
                                  minor: selectedMinor,
                                });
                                setOpenRecruitDropdown(null);
                              }}
                              disabled={!interest.major}
                              containerClassName="w-full min-w-0 sm:flex-1"
                              buttonClassName="justify-between px-4 py-3.5"
                              textClassName="min-w-0 truncate text-sm font-normal"
                            />
                          </div>

                          <div className="flex h-12 w-full items-center justify-center self-start rounded-xl border border-mt-border bg-mt-white px-2 text-sm font-medium text-mt-text-secondary sm:w-auto md:self-auto">
                            <button
                              type="button"
                              onClick={() => updateRecruitCount(index, -1)}
                              disabled={interest.count <= getRecruitmentMinimumCount(interest)}
                              title={
                                interest.count <= getRecruitmentMinimumCount(interest)
                                  ? '현재 승인된 인원보다 적게 설정할 수 없습니다.'
                                  : undefined
                              }
                              data-cy={`project-form-recruit-decrement-${index}`}
                              className="flex h-8 w-7 items-center justify-center rounded-md hover:bg-mt-bg-soft disabled:cursor-not-allowed disabled:opacity-40"
                              aria-label="인원수 감소"
                            >
                              -
                            </button>
                            <span className="w-6 text-center text-mt-text-primary">
                              {interest.count}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateRecruitCount(index, 1)}
                              data-cy={`project-form-recruit-increment-${index}`}
                              className="flex h-8 w-7 items-center justify-center rounded-md hover:bg-mt-bg-soft"
                              aria-label="인원수 증가"
                            >
                              +
                            </button>
                          </div>

                          {recruitInterests.length > 1 ? (
                            <button
                              type="button"
                              onClick={() => removeRecruitInterest(index)}
                              disabled={interest.deletable === false}
                              title={interest.notDeletableReason ?? undefined}
                              data-cy={`project-form-recruit-delete-${index}`}
                              className="self-start text-xs font-bold text-mt-hero-blue disabled:cursor-not-allowed disabled:text-mt-text-secondary md:self-auto"
                              aria-label="모집 분야 삭제"
                            >
                              삭제
                            </button>
                          ) : null}
                        </div>

                        {isEdit &&
                        ((interest.currentCount ?? 0) > 0 ||
                          (interest.pendingApplicationCount ?? 0) > 0) ? (
                          <p className="text-xs leading-4 text-mt-text-secondary">
                            승인 {interest.currentCount ?? 0}명
                            {(interest.pendingApplicationCount ?? 0) > 0
                              ? ` · 대기 지원 ${interest.pendingApplicationCount}명`
                              : ''}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>

                  {fieldErrors.recruitInterests ? (
                    <p className="text-sm leading-5 text-mt-hero-blue">
                      {fieldErrors.recruitInterests}
                    </p>
                  ) : null}
                </div>
              </>
            ) : null}

            {isVisibleSection(3) ? (
              <>
                <TechStackSection
                  label={isEdit ? '필요 기술 스택' : '기술 스택'}
                  jobFields={jobFields}
                  interests={recruitInterests}
                  value={recruitTechStacks}
                  onChange={(nextValue) => {
                    setRecruitTechStacks(nextValue);
                    clearError('recruitTechStacks');
                  }}
                  errorText={
                    (shouldShowFinalStepErrors ? fieldErrors.recruitTechStacks : undefined) ??
                    jobOptionsError
                  }
                  disabled={isLoadingJobOptions}
                />

                <RecruitDeadlineField
                  deadline={recruitDeadline}
                  onDeadlineChange={(nextValue) => {
                    setRecruitDeadline(nextValue);
                    clearError('recruitDeadline');
                  }}
                  untilComplete={isRecruitUntilComplete}
                  onUntilCompleteChange={(nextValue) => {
                    setIsRecruitUntilComplete(nextValue);
                    if (nextValue) {
                      setRecruitDeadline('');
                    }
                    clearError('recruitDeadline');
                  }}
                  minDate={minRecruitDeadline}
                  errorText={shouldShowFinalStepErrors ? fieldErrors.recruitDeadline : undefined}
                />
              </>
            ) : null}

            <ToastMessage message={fieldErrors.form} />

            {isEdit ? (
              <div className="flex justify-center pt-2">
                <BaseButton
                  size="XL"
                  variant="primary"
                  type="submit"
                  disabled={!editable || isSubmitting || isLoadingJobOptions}
                  data-cy="project-form-submit"
                  className="w-full max-w-md shadow-xl shadow-mt-logo-blue/40"
                >
                  {isSubmitting ? '저장 중...' : '저장하기'}
                </BaseButton>
              </div>
            ) : null}

            {isCreate ? (
              <div className="flex flex-col gap-3 pt-8 sm:flex-row sm:items-center sm:justify-between">
                <BaseButton
                  size="L"
                  variant="gray"
                  type="button"
                  disabled={createStepIndex === 0 || isSubmitting}
                  onClick={handlePreviousStep}
                  className="w-full sm:w-36"
                >
                  이전
                </BaseButton>

                {createStepIndex < CREATE_STEPS.length - 1 ? (
                  <BaseButton
                    size="L"
                    variant="primary"
                    type="button"
                    disabled={
                      !editable || isSubmitting || (createStepIndex >= 2 && isLoadingJobOptions)
                    }
                    onClick={handleNextStep}
                    className="w-full sm:w-44"
                  >
                    다음
                  </BaseButton>
                ) : (
                  <BaseButton
                    size="XL"
                    variant="primary"
                    type="button"
                    onClick={() => void handleCreateSubmit()}
                    disabled={!editable || isSubmitting || isLoadingJobOptions}
                    data-cy="project-form-submit"
                    className="w-full shadow-xl shadow-mt-logo-blue/40 sm:max-w-md"
                  >
                    {isSubmitting ? '프로젝트 등록 중...' : '프로젝트 등록하기'}
                  </BaseButton>
                )}
              </div>
            ) : null}
          </form>
        </div>
      </div>
    </section>
  );
}
