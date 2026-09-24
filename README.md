# meeTeam 프론트엔드 · 4주차 기준

3주차 공통 UI 위에 인증 상태 복원, 보호 경로, 세종대 포털 로그인과 가입, 내 프로필 조회·수정, 공개 프로필 조회를 구현했습니다. 프로젝트 등록·지원·관리, 팀원 검색, 알림 등은 아직 준비 화면입니다.

## 구조

- `app/(auth)`: 인증 화면의 공통 레이아웃과 경로
- `app/(with-nav)`: 내비게이션을 공유하는 화면과 동적 경로
- `components/features`: 도메인별 UI와 API 파일의 위치
- `components/shared`: 버튼, 입력창, 드롭다운, 모달, 태그, 스켈레톤, 토스트 등 공통 UI
- `stores`: 인증 상태와 공통 모달·토스트 상태
- `components/features/auth`: 쿠키 기반 세션 복원, 로그인·가입, 보호 경로
- `components/features/profile`: 프로필 API, 입력 검증, 조회·수정 화면
- `components/features/{domain}/store.ts`: 도메인별 클라이언트 UI 상태
- `app/globals.css`: Tailwind 색상 토큰
- `app/(with-nav)/showcase`: 배포된 웹에서 볼 수 있는 공통 UI 쇼케이스
- `stories`: 컴포넌트 상태와 화면 구조를 따로 살펴보는 Storybook 예시

인증은 백엔드의 HttpOnly 쿠키를 사용합니다. Next.js의 `/api/*` 경유 경로가 백엔드 요청을 전달하고 쿠키 도메인을 현재 프론트엔드 도메인으로 맞춥니다. 페이지를 다시 열면 `/api/v1/members/me`를 조회하고, 만료된 세션은 `/api/v1/auth/refresh`로 한 번 갱신합니다. 프로필 수정은 백엔드의 multipart `memberInfo`/`profileImage` 형식으로 전송합니다.

## 실행

```bash
npm ci
npm run dev
```

로컬에서는 `.env`에 `API_BASE_URL` 또는 기존 `NEXT_PUBLIC_API_BASE_URL`을 설정합니다. 설정하지 않으면 `https://api.meeteam.alom-sejong.com`을 사용합니다. 실제 로그인과 프로필 저장에는 해당 API가 가동 중이어야 합니다.

브라우저에서 `/showcase`로 이동하면 3주차 공통 UI를 직접 눌러볼 수 있습니다.
Storybook은 다음 명령으로 실행합니다.

```bash
npm run storybook
```

Storybook 정적 산출물이 필요하면 `npm run build-storybook`을 사용합니다.
Vercel은 `jebiyeon02/meeteam-test` 저장소의 `main` 브랜치를 배포합니다.
