import type { JobFieldOption, JobPositionOption } from '@/types/auth';

const JOB_FIELD_LABELS: Record<string, string> = {
  PLANNING: '기획',
  DESIGN: '디자인',
  FRONTEND: '프론트엔드',
  BACKEND: '백엔드',
  AI: 'AI',
  INFRA_OPERATION: '인프라/운영',
};

const JOB_POSITION_LABELS: Record<string, string> = {
  PRODUCT_MANAGER: 'PM 프로덕트 매니저',
  PRODUCT_OWNER: 'PO 프로덕트 오너',
  SERVICE_PLANNER: '서비스 기획',
  UI_UX_DESIGNER: 'UI/UX 디자이너',
  MOTION_DESIGNER: '모션 디자이너',
  BX_BRAND_DESIGNER: 'BX 브랜드 디자이너',
  WEB_FRONTEND: '웹 프론트엔드',
  IOS: 'iOS',
  ANDROID: '안드로이드',
  CROSS_PLATFORM: '크로스플랫폼',
  JAVA_SPRING: 'Java/Spring',
  KOTLIN_SPRING: 'Kotlin/Spring',
  NODE_NESTJS: 'Node.js/NestJS',
  PYTHON_BACKEND: 'Python Backend',
  MACHINE_LEARNING: '머신 러닝',
  DEEP_LEARNING: '딥러닝',
  LLM: 'LLM',
  MLOPS: 'MLOps',
  DEVOPS_ARCHITECT: 'DevOps 엔지니어/아키텍처',
  QA: 'QA',
  CLOUD_ENGINEER: 'Cloud 엔지니어',
};

const JOB_FIELD_NAME_ALIASES: Record<string, string[]> = {
  PLANNING: ['기획', 'PM/기획'],
  DESIGN: ['디자인'],
  FRONTEND: ['프론트엔드', '프론트'],
  BACKEND: ['백엔드'],
  AI: ['AI'],
  INFRA_OPERATION: ['인프라/운영'],
};

const JOB_POSITION_NAME_ALIASES: Record<string, string[]> = {
  PRODUCT_MANAGER: ['PM 프로덕트 매니저', '프로덕트 매니저/오너'],
  PRODUCT_OWNER: ['PO 프로덕트 오너'],
  SERVICE_PLANNER: ['서비스 기획'],
  UI_UX_DESIGNER: ['UI/UX 디자이너', 'UI/UX디자인'],
  MOTION_DESIGNER: ['모션 디자이너', '모션 디자인'],
  BX_BRAND_DESIGNER: ['BX 브랜드 디자이너', '그래픽디자인'],
  WEB_FRONTEND: ['웹 프론트엔드', '웹프론트엔드'],
  IOS: ['iOS'],
  ANDROID: ['안드로이드', 'Android'],
  CROSS_PLATFORM: ['크로스플랫폼', '크로스 플랫폼'],
  JAVA_SPRING: ['Java/Spring', '웹 서버'],
  KOTLIN_SPRING: ['Kotlin/Spring'],
  NODE_NESTJS: ['Node.js/NestJS'],
  PYTHON_BACKEND: ['Python Backend'],
  MACHINE_LEARNING: ['머신 러닝'],
  DEEP_LEARNING: ['딥러닝'],
  LLM: ['LLM', 'AI'],
  MLOPS: ['MLOps'],
  DEVOPS_ARCHITECT: ['DevOps 엔지니어/아키텍처'],
  QA: ['QA'],
  CLOUD_ENGINEER: ['Cloud 엔지니어'],
};

function normalizeOptionLabel(value: string) {
  return value.replace(/\s+/g, '').trim().toLowerCase();
}

export function getProjectJobFieldLabel(field: JobFieldOption) {
  return JOB_FIELD_LABELS[field.code] ?? field.name;
}

export function getProjectJobPositionLabel(position: JobPositionOption) {
  return JOB_POSITION_LABELS[position.code] ?? position.name;
}

export function findProjectJobField(jobFields: JobFieldOption[], label: string) {
  const normalizedLabel = normalizeOptionLabel(label);

  return (
    jobFields.find((field) => {
      const aliases = JOB_FIELD_NAME_ALIASES[field.code] ?? [];
      const candidates = [field.name, getProjectJobFieldLabel(field), ...aliases];

      return candidates.some((candidate) => normalizeOptionLabel(candidate) === normalizedLabel);
    }) ?? null
  );
}

export function findProjectJobPosition(field: JobFieldOption, label: string) {
  const normalizedLabel = normalizeOptionLabel(label);

  return (
    field.positions.find((position) => {
      const aliases = JOB_POSITION_NAME_ALIASES[position.code] ?? [];
      const candidates = [position.name, getProjectJobPositionLabel(position), ...aliases];

      return candidates.some((candidate) => normalizeOptionLabel(candidate) === normalizedLabel);
    }) ?? null
  );
}
