'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, ImagePlus, Plus, Trash2 } from 'lucide-react';
import BaseButton from '@/components/shared/BaseButton';
import BaseField from '@/components/shared/BaseField';
import BaseInput from '@/components/shared/BaseInput';
import BaseTextarea from '@/components/shared/BaseTextarea';
import SkeletonBlock from '@/components/shared/SkeletonBlock';
import { getJobOptions, type JobOption } from '@/components/features/profile/profileApi';
import {
  buildProjectCreateRequest,
  createProject,
  PROJECT_CATEGORIES,
  PROJECT_PLATFORMS,
  todayLocalDate,
  type ProjectCreateRequest,
} from '@/components/features/project/projectApi';
import { projectCoverSchema, projectCreateSchema } from './schema';
import { useToastStore } from '@/stores/useToastStore';

const STEPS = [
  { title: '기본 정보', description: '프로젝트의 첫인상을 정해요.' },
  { title: '프로젝트 소개', description: '소개와 링크를 입력해요.' },
  { title: '모집 역할', description: '함께할 팀원을 정해요.' },
  { title: '기술 스택과 마감', description: '필요 기술과 마감을 정해요.' },
] as const;

const STEP_FIELDS = [
  ['name', 'category', 'platform'],
  ['description', 'githubUrl', 'communicationUrl'],
  ['leaderPositionId', 'recruitments'],
  ['deadline', 'recruitments'],
] as const;

const SELECT_CLASS =
  'h-12 w-full rounded-xl border border-mt-border bg-mt-white px-4 text-sm text-mt-text-primary outline-none focus:border-mt-primary';

const DEFAULT_VALUES: ProjectCreateRequest = {
  name: '',
  category: 'CAPSTONE',
  platform: 'WEB',
  description: '',
  githubUrl: '',
  communicationUrl: '',
  leaderPositionId: 0,
  recruitments: [{ jobFieldCode: '', jobPositionId: 0, count: 1, techStackIds: [] }],
  deadline: null,
  closeWhenFull: false,
};

type FieldErrors = Record<string, string>;

export default function ProjectCreatePage() {
  const router = useRouter();
  const showToast = useToastStore((state) => state.showToast);
  const [options, setOptions] = useState<JobOption | null>(null);
  const [loadError, setLoadError] = useState('');
  const [values, setValues] = useState<ProjectCreateRequest>(DEFAULT_VALUES);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    getJobOptions()
      .then((response) => {
        if (active) setOptions(response);
      })
      .catch((error: unknown) => {
        if (active)
          setLoadError(error instanceof Error ? error.message : '선택 목록을 불러오지 못했습니다.');
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  function update<K extends keyof ProjectCreateRequest>(key: K, value: ProjectCreateRequest[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: '' }));
  }

  function updateRecruitment(
    index: number,
    patch: Partial<ProjectCreateRequest['recruitments'][number]>,
  ) {
    setValues((current) => ({
      ...current,
      recruitments: current.recruitments.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
      ),
    }));
    setErrors((current) => ({ ...current, recruitments: '' }));
  }

  function selectImage(file: File | null) {
    if (!file) return;
    const parsed = projectCoverSchema.safeParse(file);
    if (!parsed.success) {
      setErrors((current) => ({ ...current, coverImage: parsed.error.issues[0].message }));
      if (fileRef.current) fileRef.current.value = '';
      return;
    }
    setCoverImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    setErrors((current) => ({ ...current, coverImage: '' }));
  }

  function validate(targetStep?: number) {
    const parsed = projectCreateSchema.safeParse(values);
    if (parsed.success) {
      setErrors({});
      return true;
    }
    const nextErrors: FieldErrors = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0]);
      if (targetStep === 2 && key === 'recruitments' && issue.path.includes('techStackIds'))
        continue;
      if (
        targetStep === undefined ||
        (STEP_FIELDS[targetStep] as readonly string[]).includes(key)
      ) {
        nextErrors[key] ??= issue.message;
      }
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function nextStep() {
    if (validate(step)) {
      setStep((current) => Math.min(current + 1, STEPS.length - 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step < STEPS.length - 1) {
      nextStep();
      return;
    }
    if (!validate()) {
      const parsed = projectCreateSchema.safeParse(values);
      const firstKey = parsed.success ? '' : String(parsed.error.issues[0]?.path[0]);
      const invalidStep = STEP_FIELDS.findIndex((fields) =>
        (fields as readonly string[]).includes(firstKey),
      );
      if (invalidStep >= 0) setStep(invalidStep);
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await createProject(buildProjectCreateRequest(values), coverImage);
      showToast({ tone: 'success', message: '프로젝트를 등록했습니다.' });
      router.push(`/projects/${result.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : '프로젝트를 등록하지 못했습니다.';
      setErrors((current) => ({ ...current, form: message }));
      showToast({ tone: 'error', message });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loadError)
    return (
      <div role="alert" className="rounded-2xl border border-mt-border p-8 text-mt-danger">
        {loadError}
      </div>
    );
  if (!options) return <SkeletonBlock className="h-96 w-full" />;

  const allPositions = options.fields.flatMap((field) => field.positions);

  return (
    <section className="pb-20">
      <Link
        href="/projects"
        className="inline-flex items-center gap-2 text-sm text-mt-text-secondary hover:text-mt-primary"
      >
        <ArrowLeft className="h-4 w-4" /> 프로젝트 찾기로
      </Link>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-mt-text-primary">프로젝트 등록하기</h1>
          <p className="mt-2 text-sm text-mt-text-secondary">
            팀원을 모집할 프로젝트 정보를 단계별로 입력해 주세요.
          </p>
        </div>
        <span className="rounded-full bg-mt-badge-bg px-4 py-2 text-sm font-bold text-mt-primary">
          {step + 1} / {STEPS.length} 단계
        </span>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
        <nav
          aria-label="등록 단계"
          className="h-fit rounded-2xl border border-mt-border bg-mt-white p-4 lg:sticky lg:top-24"
        >
          {STEPS.map((item, index) => (
            <button
              key={item.title}
              type="button"
              onClick={() => {
                setStep(index);
                setErrors({});
              }}
              aria-current={step === index ? 'step' : undefined}
              className={`flex w-full items-start gap-3 rounded-xl p-3 text-left ${step === index ? 'bg-mt-badge-bg' : 'hover:bg-mt-bg-soft'}`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${step === index ? 'bg-mt-primary text-mt-white' : 'bg-mt-bg-soft text-mt-text-secondary'}`}
              >
                {index < step ? <Check className="h-4 w-4" /> : index + 1}
              </span>
              <span>
                <span className="block text-sm font-bold text-mt-text-primary">{item.title}</span>
                <span className="mt-1 block text-xs text-mt-text-secondary">
                  {item.description}
                </span>
              </span>
            </button>
          ))}
        </nav>

        <form
          onSubmit={(event) => void submit(event)}
          className="min-w-0 rounded-2xl border border-mt-border bg-mt-white p-5 shadow-sm sm:p-8"
          noValidate
        >
          <header className="mb-7 border-b border-mt-border pb-5">
            <h2 className="text-2xl font-bold text-mt-text-primary">{STEPS[step].title}</h2>
            <p className="mt-1 text-sm text-mt-text-secondary">{STEPS[step].description}</p>
          </header>

          {step === 0 && (
            <div className="space-y-6">
              <BaseField label="프로젝트명" htmlFor="project-name" errorText={errors.name}>
                <BaseInput
                  id="project-name"
                  value={values.name}
                  onChange={(event) => update('name', event.target.value)}
                  placeholder="프로젝트 이름을 입력해 주세요"
                  maxLength={60}
                />
              </BaseField>
              <fieldset>
                <legend className="mb-3 text-sm font-bold text-mt-text-primary">
                  프로젝트 카테고리
                </legend>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {PROJECT_CATEGORIES.map((category) => (
                    <button
                      key={category.code}
                      type="button"
                      onClick={() => update('category', category.code)}
                      aria-pressed={values.category === category.code}
                      className={`h-16 rounded-xl border text-sm font-bold ${values.category === category.code ? 'border-mt-primary bg-mt-badge-bg text-mt-primary' : 'border-mt-border text-mt-text-secondary hover:bg-mt-bg-soft'}`}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend className="mb-3 text-sm font-bold text-mt-text-primary">출시 플랫폼</legend>
                <div className="flex flex-wrap gap-2">
                  {PROJECT_PLATFORMS.map((platform) => (
                    <button
                      key={platform.code}
                      type="button"
                      onClick={() => update('platform', platform.code)}
                      aria-pressed={values.platform === platform.code}
                      className={`rounded-full border px-5 py-2 text-sm font-semibold ${values.platform === platform.code ? 'border-mt-primary bg-mt-badge-bg text-mt-primary' : 'border-mt-border text-mt-text-secondary'}`}
                    >
                      {platform.label}
                    </button>
                  ))}
                </div>
              </fieldset>
              <div>
                <p className="mb-3 text-sm font-bold text-mt-text-primary">
                  커버 이미지 <span className="font-normal text-mt-text-secondary">(선택)</span>
                </p>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(event) => selectImage(event.target.files?.[0] ?? null)}
                  aria-label="커버 이미지 선택"
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="relative flex h-52 w-full items-center justify-center overflow-hidden rounded-2xl border border-dashed border-mt-border bg-mt-bg-soft text-mt-text-secondary"
                >
                  {previewUrl ? (
                    <Image
                      src={previewUrl}
                      alt="커버 이미지 미리보기"
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <span className="flex flex-col items-center gap-2">
                      <ImagePlus className="h-8 w-8" />
                      <span className="text-sm">이미지 선택 · JPG/PNG/WebP, 최대 2MB</span>
                    </span>
                  )}
                </button>
                {errors.coverImage && (
                  <p role="alert" className="mt-2 text-sm text-mt-danger">
                    {errors.coverImage}
                  </p>
                )}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <BaseField
                label="프로젝트 소개"
                htmlFor="project-description"
                errorText={errors.description}
              >
                <BaseTextarea
                  id="project-description"
                  rows={10}
                  value={values.description}
                  onChange={(event) => update('description', event.target.value)}
                  placeholder="어떤 문제를 해결하고 어떤 팀원과 함께하고 싶은지 소개해 주세요."
                  maxLength={5000}
                />
              </BaseField>
              <p className="-mt-4 text-right text-xs text-mt-text-secondary">
                {values.description.length} / 5000
              </p>
              <BaseField
                label="GitHub 저장소 링크 (선택)"
                htmlFor="project-github"
                errorText={errors.githubUrl}
              >
                <BaseInput
                  id="project-github"
                  type="url"
                  value={values.githubUrl}
                  onChange={(event) => update('githubUrl', event.target.value)}
                  placeholder="https://github.com/조직/저장소"
                />
              </BaseField>
              <BaseField
                label="소통 채널 링크 (선택)"
                htmlFor="project-communication"
                errorText={errors.communicationUrl}
              >
                <BaseInput
                  id="project-communication"
                  type="url"
                  value={values.communicationUrl}
                  onChange={(event) => update('communicationUrl', event.target.value)}
                  placeholder="https://..."
                />
              </BaseField>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <BaseField
                label="리더의 직무"
                htmlFor="project-leader"
                errorText={errors.leaderPositionId}
              >
                <select
                  id="project-leader"
                  className={SELECT_CLASS}
                  value={values.leaderPositionId}
                  onChange={(event) => update('leaderPositionId', Number(event.target.value))}
                >
                  <option value={0}>직무 선택</option>
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
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">모집 직무</h3>
                <button
                  type="button"
                  onClick={() =>
                    update('recruitments', [
                      ...values.recruitments,
                      { jobFieldCode: '', jobPositionId: 0, count: 1, techStackIds: [] },
                    ])
                  }
                  className="inline-flex items-center gap-1 text-sm font-bold text-mt-primary"
                >
                  <Plus className="h-4 w-4" />
                  모집 직무 추가
                </button>
              </div>
              {values.recruitments.map((recruitment, index) => {
                const selectedField = options.fields.find(
                  (field) => field.code === recruitment.jobFieldCode,
                );
                return (
                  <div
                    key={index}
                    className="space-y-4 rounded-2xl border border-mt-border bg-mt-bg-soft p-4 sm:p-5"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold">모집 직무 {index + 1}</h4>
                      <button
                        type="button"
                        aria-label={`모집 직무 ${index + 1} 삭제`}
                        disabled={values.recruitments.length === 1}
                        onClick={() =>
                          update(
                            'recruitments',
                            values.recruitments.filter((_, itemIndex) => itemIndex !== index),
                          )
                        }
                        className="text-mt-text-secondary disabled:opacity-30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <label className="text-sm font-semibold">
                        직군
                        <select
                          className={`${SELECT_CLASS} mt-2`}
                          value={recruitment.jobFieldCode}
                          onChange={(event) =>
                            updateRecruitment(index, {
                              jobFieldCode: event.target.value,
                              jobPositionId: 0,
                              techStackIds: [],
                            })
                          }
                        >
                          <option value="">선택</option>
                          {options.fields.map((field) => (
                            <option key={field.code} value={field.code}>
                              {field.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="text-sm font-semibold">
                        상세 직무
                        <select
                          className={`${SELECT_CLASS} mt-2`}
                          value={recruitment.jobPositionId}
                          onChange={(event) =>
                            updateRecruitment(index, { jobPositionId: Number(event.target.value) })
                          }
                        >
                          <option value={0}>선택</option>
                          {selectedField?.positions.map((position) => (
                            <option key={position.id} value={position.id}>
                              {position.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="text-sm font-semibold">
                        모집 인원
                        <input
                          type="number"
                          min={1}
                          max={20}
                          className={`${SELECT_CLASS} mt-2`}
                          value={recruitment.count}
                          onChange={(event) =>
                            updateRecruitment(index, { count: Number(event.target.value) })
                          }
                        />
                      </label>
                    </div>
                  </div>
                );
              })}
              {errors.recruitments && (
                <p role="alert" className="text-sm text-mt-danger">
                  {errors.recruitments}
                </p>
              )}
              <p className="text-xs text-mt-text-secondary">
                현재 선택한 기술 스택은 다음 단계에서 입력합니다.
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-7">
              <div className="space-y-4">
                <h3 className="text-lg font-bold">모집 기술 스택</h3>
                {values.recruitments.map((recruitment, index) => {
                  const field = options.fields.find(
                    (item) => item.code === recruitment.jobFieldCode,
                  );
                  const role =
                    allPositions.find((item) => item.id === recruitment.jobPositionId)?.name ??
                    `모집 직무 ${index + 1}`;
                  return (
                    <div key={index} className="rounded-2xl border border-mt-border p-5">
                      <p className="mb-3 text-sm font-bold">{role}</p>
                      <div className="flex flex-wrap gap-2">
                        {field?.techStacks.map((stack) => {
                          const selected = recruitment.techStackIds.includes(stack.id);
                          return (
                            <button
                              type="button"
                              key={stack.id}
                              aria-pressed={selected}
                              onClick={() =>
                                updateRecruitment(index, {
                                  techStackIds: selected
                                    ? recruitment.techStackIds.filter((id) => id !== stack.id)
                                    : [...recruitment.techStackIds, stack.id],
                                })
                              }
                              className={`rounded-full border px-4 py-2 text-sm ${selected ? 'border-mt-primary bg-mt-badge-bg font-bold text-mt-primary' : 'border-mt-border text-mt-text-secondary'}`}
                            >
                              {stack.name}
                            </button>
                          );
                        }) ?? (
                          <p className="text-sm text-mt-text-secondary">
                            먼저 모집 직군을 선택해 주세요.
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
                {errors.recruitments && (
                  <p role="alert" className="text-sm text-mt-danger">
                    {errors.recruitments}
                  </p>
                )}
              </div>
              <label className="flex items-center gap-3 rounded-xl border border-mt-border p-4 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={values.closeWhenFull}
                  onChange={(event) => {
                    update('closeWhenFull', event.target.checked);
                    if (event.target.checked) update('deadline', null);
                  }}
                  className="h-4 w-4 accent-mt-primary"
                />
                모집 인원이 모두 차면 자동 마감
              </label>
              {!values.closeWhenFull && (
                <BaseField
                  label="모집 마감일"
                  htmlFor="project-deadline"
                  errorText={errors.deadline}
                >
                  <BaseInput
                    id="project-deadline"
                    type="date"
                    min={todayLocalDate()}
                    value={values.deadline ?? ''}
                    onChange={(event) => update('deadline', event.target.value || null)}
                  />
                </BaseField>
              )}
            </div>
          )}

          {errors.form && (
            <p
              role="alert"
              className="mt-6 rounded-xl bg-mt-danger-soft p-4 text-sm text-mt-danger"
            >
              {errors.form}
            </p>
          )}
          <div className="mt-9 flex items-center justify-between border-t border-mt-border pt-6">
            <BaseButton
              variant="gray"
              disabled={step === 0 || isSubmitting}
              onClick={() => {
                setStep(step - 1);
                setErrors({});
              }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              이전
            </BaseButton>
            <BaseButton type="submit" disabled={isSubmitting}>
              {step === STEPS.length - 1 ? (isSubmitting ? '등록 중...' : '프로젝트 등록') : '다음'}
              {step < STEPS.length - 1 && <ArrowRight className="ml-2 h-4 w-4" />}
            </BaseButton>
          </div>
        </form>
      </div>
    </section>
  );
}
