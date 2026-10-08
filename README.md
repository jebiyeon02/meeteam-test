# meeTeam 프론트엔드 · 실제 API 연결

세종대 로그인·가입, 프로필 조회·수정, 팀원 찾기, 프로젝트 등록·탐색을 제공합니다. 기본 모드는 실제 API 연결이고 MSW 데모는 선택적으로 사용할 수 있습니다. 프로젝트 지원·관리, 알림 등은 아직 준비 화면입니다.

## 구조

- `app/(auth)`: 인증 화면의 공통 레이아웃과 경로
- `app/(with-nav)`: 내비게이션을 공유하는 화면과 동적 경로
- `components/features`: 도메인별 UI와 API 파일의 위치
- `components/shared`: 버튼, 입력창, 드롭다운, 모달, 태그, 스켈레톤, 토스트 등 공통 UI
- `stores`: 인증 상태와 공통 모달·토스트 상태
- `components/features/auth`: 실제 세션 복원, 로그인·가입, 보호 경로
- `components/features/profile`: 프로필 API, 입력 검증, 조회·수정 화면
- `mocks`: 선택적으로 실행할 수 있는 MSW 요청 핸들러와 데모 데이터
- `components/features/{domain}/store.ts`: 도메인별 클라이언트 UI 상태
- `app/globals.css`: Tailwind 색상 토큰
- `app/(with-nav)/showcase`: 배포된 웹에서 볼 수 있는 공통 UI 쇼케이스
- `stories`: 컴포넌트 상태와 화면 구조를 따로 살펴보는 Storybook 예시

기본 모드에서는 같은 출처의 `/api/v1/*` 경유 경로가 실제 서버로 요청을 전달합니다. 세종대 로그인 정보는 이 경로를 거쳐 서버로 전송하며 브라우저 `localStorage`에 저장하지 않습니다. API 주소는 서버 전용 `MEETEAM_API_BASE_URL`로 바꿀 수 있습니다. 설정하지 않으면 현재 제공받은 trycloudflare 임시 주소를 사용합니다. 터널이 종료되면 연결도 끊기므로 안정적인 서버 주소로 교체해야 합니다.

## 실행

```bash
npm ci
npm run dev
```

실제 로그인/가입은 세종대 포털 인증을 사용합니다. 백엔드가 빈 데이터를 반환하면 프로젝트와 팀원 목록에 빈 상태가 표시됩니다. 실제 API의 프로젝트 검색은 기술 스택 필터와 이름순 정렬을 지원하지 않으므로 해당 UI는 실제 모드에서 숨깁니다.

MSW 데모를 사용하려면 실행 전에 `NEXT_PUBLIC_API_MODE=mock`을 설정하세요. 이 모드에서는 `20260001` / `demo1234`로 로그인하고, `20260002` / `demo1234`로 가입을 체험할 수 있습니다. 데모 데이터는 브라우저 `localStorage`에만 저장됩니다.

브라우저에서 `/showcase`로 이동하면 3주차 공통 UI를 직접 눌러볼 수 있습니다.
Storybook은 다음 명령으로 실행합니다.

```bash
npm run storybook
```

Storybook 정적 산출물이 필요하면 `npm run build-storybook`을 사용합니다.
Vercel은 `jebiyeon02/meeteam-test` 저장소의 `main` 브랜치를 배포합니다.
