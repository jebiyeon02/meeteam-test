export const JOB_OPTIONS = {
  fields: [
    {
      code: 'FRONTEND',
      name: '프론트엔드',
      positions: [
        { id: 1, code: 'WEB_FRONTEND', name: '웹 프론트엔드' },
        { id: 2, code: 'CROSS_PLATFORM', name: '크로스 플랫폼' },
      ],
      techStacks: [
        { id: 1, name: 'React' },
        { id: 2, name: 'TypeScript' },
        { id: 3, name: 'Next.js' },
        { id: 4, name: 'Flutter' },
      ],
    },
    {
      code: 'BACKEND',
      name: '백엔드',
      positions: [
        { id: 3, code: 'JAVA_SPRING', name: 'Java/Spring' },
        { id: 4, code: 'NODE_SERVER', name: 'Node.js 서버' },
      ],
      techStacks: [
        { id: 5, name: 'Java' },
        { id: 6, name: 'Spring Boot' },
        { id: 7, name: 'MySQL' },
        { id: 8, name: 'Node.js' },
      ],
    },
    {
      code: 'DESIGN',
      name: '디자인',
      positions: [{ id: 5, code: 'UI_UX_DESIGN', name: 'UI/UX 디자인' }],
      techStacks: [{ id: 9, name: 'Figma' }],
    },
  ],
};

export type MockMember = {
  memberId: number;
  name: string;
  email: string;
  birthDate: string;
  gender: 'MALE' | 'FEMALE';
  jobPositionIds: number[];
  techStackIds: number[];
  isParticipating: boolean;
  introduce: string;
  githubUrl: string;
  blogUrl: string;
  projectCount: number;
  profileImageUrl: string | null;
};

export type MockProjectCard = {
  id: number;
  title: string;
  category: string;
  leader: string;
  currentMembers: number;
  maxMembers: number;
};

export const DEMO_PROJECTS: Record<number, MockProjectCard[]> = {
  1: [
    {
      id: 101,
      title: '캠퍼스 메이커스',
      category: '창의학기제',
      leader: '김민지',
      currentMembers: 4,
      maxMembers: 6,
    },
    {
      id: 102,
      title: '스터디 매칭 서비스',
      category: '동아리',
      leader: '김민지',
      currentMembers: 3,
      maxMembers: 5,
    },
  ],
  2: [
    {
      id: 103,
      title: 'API 챌린지',
      category: '캡스톤',
      leader: '이준호',
      currentMembers: 2,
      maxMembers: 4,
    },
  ],
};

export const INITIAL_MEMBERS: MockMember[] = [
  {
    memberId: 1,
    name: '김민지',
    email: 'minji@example.com',
    birthDate: '2002-05-14',
    gender: 'FEMALE',
    jobPositionIds: [1],
    techStackIds: [1, 2, 3],
    isParticipating: true,
    introduce:
      '사용자 경험을 고민하는 프론트엔드 개발자입니다. 함께 배우며 만드는 프로젝트를 좋아해요.',
    githubUrl: 'https://github.com/',
    blogUrl: '',
    projectCount: 2,
    profileImageUrl: null,
  },
  {
    memberId: 2,
    name: '이준호',
    email: 'junho@example.com',
    birthDate: '2001-11-03',
    gender: 'MALE',
    jobPositionIds: [3],
    techStackIds: [5, 6, 7],
    isParticipating: false,
    introduce: '안정적인 API와 데이터 모델링에 관심이 있습니다.',
    githubUrl: '',
    blogUrl: '',
    projectCount: 1,
    profileImageUrl: null,
  },
];

const PROJECT_SEEDS = [
  ['캠퍼스 메이커스', 'CAPSTONE', 'WEB', 'FRONTEND', 1, 1],
  ['스터디 매칭 서비스', 'CLUB', 'WEB', 'BACKEND', 3, 5],
  ['API 챌린지', 'CAPSTONE', 'WEB', 'BACKEND', 4, 8],
  ['세종 맛집 지도', 'CREATIVE_SEMESTER', 'IOS', 'DESIGN', 5, 9],
  ['학교 일정 한눈에', 'ETC', 'ANDROID', 'FRONTEND', 2, 4],
  ['학습 기록 대시보드', 'CLUB', 'WEB', 'FRONTEND', 1, 2],
  ['캠퍼스 중고 거래', 'CAPSTONE', 'WEB', 'BACKEND', 3, 6],
  ['동아리 행사 캘린더', 'CREATIVE_SEMESTER', 'IOS', 'DESIGN', 5, 9],
  ['AI 아이디어 노트', 'ETC', 'WEB', 'FRONTEND', 1, 3],
  ['코딩 테스트 스터디', 'CLUB', 'WEB', 'BACKEND', 4, 8],
  ['교내 셔틀 도우미', 'CAPSTONE', 'ANDROID', 'FRONTEND', 2, 4],
  ['전시회 큐레이션', 'CREATIVE_SEMESTER', 'WEB', 'DESIGN', 5, 9],
] as const;

export const INITIAL_PROJECTS: ProjectRecord[] = PROJECT_SEEDS.map(
  ([name, category, platform, field, positionId, skillId], index) => {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 14 + index * 3);
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - index);
    return {
      id: 101 + index,
      name,
      category,
      platform,
      description: `${name} 프로젝트에서 함께 문제를 해결할 팀원을 모집합니다. 관심 있는 분은 프로젝트에 참여해 주세요.`,
      githubUrl: '',
      communicationUrl: '',
      leaderPositionId: positionId,
      recruitments: [
        { jobFieldCode: field, jobPositionId: positionId, count: 3, techStackIds: [skillId] },
      ],
      deadline: deadline.toISOString().slice(0, 10),
      closeWhenFull: false,
      leaderId: index % 2 === 0 ? 1 : 2,
      leaderName: index % 2 === 0 ? '김민지' : '이준호',
      imageUrl: null,
      createdAt: createdAt.toISOString(),
      currentMembers: 1,
    };
  },
);
import type { ProjectRecord } from '@/components/features/project/projectApi';
