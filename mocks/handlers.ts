import { delay, http, HttpResponse } from 'msw';
import { z } from 'zod';
import { profileImageSchema } from '@/components/features/profile/schema';
import { JOB_OPTIONS, type MockMember } from '@/mocks/fixtures';
import {
  clearSession,
  getMembers,
  getSessionMember,
  saveMember,
  setSession,
} from '@/mocks/storage';

const LOGIN_ID = '20260001';
const NEW_MEMBER_ID = '20260002';
const DEMO_PASSWORD = 'demo1234';
const REGISTER_CODE = 'week4-demo-registration';

const loginRequestSchema = z.object({
  studentId: z.string().min(1),
  password: z.string().min(1),
});

const profileUpdateSchema = z.object({
  name: z.string().trim().min(1).max(50),
  age: z.number().int().min(1).max(150),
  gender: z.enum(['MALE', 'FEMALE']),
  jobPositionIds: z.array(z.number().int()).min(1),
  techStacks: z
    .array(z.object({ id: z.number().int(), displayOrder: z.number().int().min(1) }))
    .min(1),
  isParticipating: z.boolean(),
  introduction: z.string().max(1000),
  githubUrl: z.string(),
  blogUrl: z.string(),
});

const registrationSchema = z.object({
  code: z.literal(REGISTER_CODE),
  name: z.string().trim().min(1),
  birthDate: z.iso.date(),
  gender: z.enum(['MALE', 'FEMALE']),
  jobPositions: z
    .array(
      z.object({
        jobFieldCode: z.string(),
        jobPositionCode: z.string(),
        techStacks: z.array(z.object({ id: z.number(), displayOrder: z.number() })),
      }),
    )
    .min(1),
  githubUrl: z.string(),
  blogUrl: z.string(),
});

function success<T>(result: T) {
  return HttpResponse.json({ code: 'COMMON200', message: '요청에 성공했습니다.', result });
}

function failure(status: number, message: string) {
  return HttpResponse.json({ code: 'MOCK_ERROR', message, result: null }, { status });
}

function positionById(id: number) {
  return JOB_OPTIONS.fields
    .flatMap((field) => field.positions)
    .find((position) => position.id === id);
}

function positionByCode(code: string) {
  return JOB_OPTIONS.fields
    .flatMap((field) => field.positions)
    .find((position) => position.code === code);
}

function skillById(id: number) {
  return JOB_OPTIONS.fields.flatMap((field) => field.techStacks).find((skill) => skill.id === id);
}

function getAge(birthDate: string) {
  const [year, month, day] = birthDate.split('-').map(Number);
  const now = new Date();
  return (
    now.getFullYear() -
    year -
    (now.getMonth() + 1 < month || (now.getMonth() + 1 === month && now.getDate() < day) ? 1 : 0)
  );
}

function birthDateForAge(age: number) {
  const today = new Date();
  return `${today.getFullYear() - age}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

function toMyProfile(member: MockMember) {
  return {
    memberId: member.memberId,
    name: member.name,
    birthDate: member.birthDate,
    gender: member.gender,
    email: member.email,
    githubUrl: member.githubUrl,
    blogUrl: member.blogUrl,
    representativePosition: positionById(member.jobPositionIds[0])?.name ?? null,
    skills: member.techStackIds
      .map((id) => skillById(id)?.name)
      .filter((name): name is string => Boolean(name)),
    isParticipating: member.isParticipating,
    projectCount: member.projectCount,
    introduce: member.introduce,
    profileImageUrl: member.profileImageUrl,
    profileImageName: null,
    projectCards: [],
  };
}

function toPublicProfile(member: MockMember) {
  return {
    memberId: member.memberId,
    profileImageUrl: member.profileImageUrl,
    name: member.name,
    age: getAge(member.birthDate),
    gender: member.gender,
    representativePosition: positionById(member.jobPositionIds[0])?.name ?? null,
    jobPositions: member.jobPositionIds
      .map((id) => positionById(id)?.name)
      .filter((name): name is string => Boolean(name)),
    email: null,
    githubUrl: member.githubUrl,
    blogUrl: member.blogUrl,
    isParticipating: member.isParticipating,
    introduce: member.introduce,
    participatedProjectCount: member.projectCount,
    participatedProjects: [],
    skills: member.techStackIds
      .map((id) => skillById(id)?.name)
      .filter((name): name is string => Boolean(name)),
  };
}

async function jsonPart(data: FormData, name: string) {
  const part = data.get(name);
  if (!(part instanceof Blob)) return null;
  try {
    return JSON.parse(await part.text()) as unknown;
  } catch {
    return null;
  }
}

function imageDataUrl(file: File | null): Promise<string | null> {
  if (!file) return Promise.resolve(null);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
    reader.onerror = () => reject(new Error('프로필 이미지를 읽지 못했습니다.'));
    reader.readAsDataURL(file);
  });
}

export const handlers = [
  http.post('/api/v1/auth/login/sejong', async ({ request }) => {
    const parsed = loginRequestSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return failure(400, '학번과 비밀번호를 입력해 주세요.');
    if (parsed.data.password !== DEMO_PASSWORD)
      return failure(401, '데모 계정 정보를 확인해 주세요.');

    if (parsed.data.studentId === LOGIN_ID) {
      setSession(1);
      return success({ isNewMember: false, code: null });
    }
    if (parsed.data.studentId === NEW_MEMBER_ID) {
      return success({ isNewMember: true, code: REGISTER_CODE });
    }
    return failure(401, '데모 계정 정보를 확인해 주세요.');
  }),

  http.post('/api/v1/auth/register/sejong', async ({ request }) => {
    const data = await request.formData();
    const parsed = registrationSchema.safeParse(await jsonPart(data, 'request'));
    if (!parsed.success) return failure(400, '가입 정보를 확인해 주세요.');
    const file = data.get('file');
    if (file && !profileImageSchema.safeParse(file).success)
      return failure(400, 'JPG, PNG, WebP 이미지를 1MB 이하로 선택해 주세요.');
    const positionIds = parsed.data.jobPositions
      .map((position) => positionByCode(position.jobPositionCode)?.id)
      .filter((id): id is number => id !== undefined);
    if (positionIds.length !== parsed.data.jobPositions.length)
      return failure(400, '관심 직무를 확인해 주세요.');

    const member: MockMember = {
      memberId: 3,
      name: parsed.data.name,
      email: 'new-member@example.com',
      birthDate: parsed.data.birthDate,
      gender: parsed.data.gender,
      jobPositionIds: positionIds,
      techStackIds: parsed.data.jobPositions.flatMap((position) =>
        position.techStacks.map((skill) => skill.id),
      ),
      isParticipating: true,
      introduce: '',
      githubUrl: parsed.data.githubUrl,
      blogUrl: parsed.data.blogUrl,
      projectCount: 0,
      profileImageUrl: await imageDataUrl(file instanceof File ? file : null),
    };
    saveMember(member);
    setSession(member.memberId);
    return success(null);
  }),

  http.post('/api/v1/auth/refresh', () => {
    return getSessionMember()
      ? success('데모 세션을 갱신했습니다.')
      : failure(401, '로그인이 필요합니다.');
  }),

  http.post('/api/v1/auth/logout', () => {
    clearSession();
    return success('로그아웃이 완료되었습니다.');
  }),

  http.get('/api/v1/jobs/options', async () => {
    await delay(200);
    return success(JOB_OPTIONS);
  }),

  http.get('/api/v1/members/me', async () => {
    await delay(300);
    const member = getSessionMember();
    return member ? success(toMyProfile(member)) : failure(401, '로그인이 필요합니다.');
  }),

  http.put('/api/v1/members/me', async ({ request }) => {
    const member = getSessionMember();
    if (!member) return failure(401, '로그인이 필요합니다.');
    const data = await request.formData();
    const parsed = profileUpdateSchema.safeParse(await jsonPart(data, 'memberInfo'));
    if (!parsed.success) return failure(400, '프로필 입력값을 확인해 주세요.');
    const file = data.get('profileImage');
    if (file && !profileImageSchema.safeParse(file).success)
      return failure(400, 'JPG, PNG, WebP 이미지를 1MB 이하로 선택해 주세요.');
    if (parsed.data.name === '저장실패') return failure(500, '저장 중 서버 오류가 발생했습니다.');
    if (parsed.data.name === '네트워크오류') return HttpResponse.error();
    if (
      parsed.data.jobPositionIds.some((id) => !positionById(id)) ||
      parsed.data.techStacks.some((skill) => !skillById(skill.id))
    ) {
      return failure(400, '직군 또는 기술 스택을 확인해 주세요.');
    }

    const nextMember: MockMember = {
      ...member,
      name: parsed.data.name,
      birthDate: birthDateForAge(parsed.data.age),
      gender: parsed.data.gender,
      jobPositionIds: parsed.data.jobPositionIds,
      techStackIds: [...parsed.data.techStacks]
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((skill) => skill.id),
      isParticipating: parsed.data.isParticipating,
      introduce: parsed.data.introduction,
      githubUrl: parsed.data.githubUrl,
      blogUrl: parsed.data.blogUrl,
      profileImageUrl: file instanceof File ? await imageDataUrl(file) : member.profileImageUrl,
    };
    saveMember(nextMember);
    return success({
      memberId: member.memberId,
      name: parsed.data.name,
      message: '프로필이 성공적으로 수정되었습니다.',
      profileImageUrl: nextMember.profileImageUrl,
    });
  }),

  http.get('/api/v1/members/:memberId', async ({ params }) => {
    await delay(250);
    const member = getMembers().find((item) => item.memberId === Number(params.memberId));
    return member ? success(toPublicProfile(member)) : failure(404, '프로필을 찾을 수 없습니다.');
  }),
];
