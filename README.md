# meeTeam 프론트엔드 · 4주차 기준

3주차 공통 UI 위에 인증 상태 복원, 보호 경로, 데모 로그인과 가입, 내 프로필 조회·수정, 팀원 목록과 공개 프로필 조회를 구현했습니다. 4주차 API는 배포되지 않았으므로 MSW로 응답을 재현합니다. 프로젝트 등록·지원·관리, 알림 등은 아직 준비 화면입니다.

## 구조

- `app/(auth)`: 인증 화면의 공통 레이아웃과 경로
- `app/(with-nav)`: 내비게이션을 공유하는 화면과 동적 경로
- `components/features`: 도메인별 UI와 API 파일의 위치
- `components/shared`: 버튼, 입력창, 드롭다운, 모달, 태그, 스켈레톤, 토스트 등 공통 UI
- `stores`: 인증 상태와 공통 모달·토스트 상태
- `components/features/auth`: 데모 세션 복원, 로그인·가입, 보호 경로
- `components/features/profile`: 프로필 API, 입력 검증, 조회·수정 화면
- `mocks`: MSW 요청 핸들러와 데모 데이터
- `components/features/{domain}/store.ts`: 도메인별 클라이언트 UI 상태
- `app/globals.css`: Tailwind 색상 토큰
- `app/(with-nav)/showcase`: 배포된 웹에서 볼 수 있는 공통 UI 쇼케이스
- `stories`: 컴포넌트 상태와 화면 구조를 따로 살펴보는 Storybook 예시

브라우저에서 MSW가 `/api/v1/auth/*`, `/api/v1/members/*`, `/api/v1/jobs/options` 요청을 가로챕니다. 화면은 백엔드 계약과 같은 요청 형식을 사용하지만 실제 서버에는 연결되지 않습니다. 데모 로그인 상태와 프로필 변경값은 브라우저 `localStorage`에 저장됩니다. 실제 인증이나 계정 정보가 아니며, 저장 데이터는 이 브라우저에만 남습니다.

## 실행

```bash
npm ci
npm run dev
```

데모 계정은 `20260001` / `demo1234`입니다. 세종대 가입 흐름은 `20260002` / `demo1234`로 시작하며 `/auth/sign-up/sejong`에서 진행합니다. 실제 세종대 포털 비밀번호는 입력하지 마세요. 프로필 이름을 `저장실패`로 저장하면 서버 오류, `네트워크오류`로 저장하면 네트워크 오류 상태를 확인할 수 있습니다.

브라우저에서 `/showcase`로 이동하면 3주차 공통 UI를 직접 눌러볼 수 있습니다.
Storybook은 다음 명령으로 실행합니다.

```bash
npm run storybook
```

Storybook 정적 산출물이 필요하면 `npm run build-storybook`을 사용합니다.
Vercel은 `jebiyeon02/meeteam-test` 저장소의 `main` 브랜치를 배포합니다.
