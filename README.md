# 최태식의 iPhone

트위터 자캐 커뮤니티용 "남의 폰 훔쳐보기" 인터랙티브 웹. 서버 없이 정적 호스팅(GitHub Pages / Vercel / Cloudflare Pages / Netlify)으로 동작합니다.

- 폰 화면: `/` (PC는 아이폰 목업, 모바일은 전체화면)
- 편집 화면: `#/editor` (예: `https://주소/#/editor`) — 또는 PC 화면 오른쪽 아래 작은 "편집", 또는 상태바 시계를 1.6초 길게 누르기
- 방문자가 폰 안에서 바꾼 것(읽음 표시, 메모 수정, 체크리스트 등)은 그 사람 브라우저(LocalStorage)에 저장되어 새로고침해도 유지됩니다.

## 파일 구성

| 경로 | 내용 |
|---|---|
| `src/data.ts` | 기본 콘텐츠 (대화, 통화, 연락처, 메모, 일정, 은행, 사파리, 인스타 …) |
| `src/Phone.tsx` | 프레임, 상태바, 다이내믹 아일랜드, 잠금화면, 암호, 홈, 이벤트(배너·수신전화·배터리) |
| `src/apps/*` | 각 앱 (메시지, 카카오톡, Signal, 인스타그램, 전화/연락처, 메모, 사파리, 음악, 사진, 뱅킹, 캘린더·시계·날씨·계산기·지도·카메라·설정) |
| `src/Editor.tsx` | 제작자 편집 화면 |
| `src/photos.ts` | 사진 생성기 — 사진은 전부 코드로 그린 이미지(외부 이미지 0장, 저작권 문제 없음) |
| `src/icons.tsx` | 앱 아이콘 (SVG 직접 제작) |
| `src/cloud.ts` | 게시 데이터 불러오기 (phone-data.json / Supabase) |
| `src/ai.ts` | AI 콘텐츠 생성 (에디터 전용) |

## 실행

```bash
npm install
npm run dev          # 개발 서버 (http://localhost:5173)
npm run build        # dist/ 폴더 생성 → 이 폴더를 그대로 호스팅
npm run build:single # dist-single/index.html 한 파일로 전부 동작 (더블클릭해서 열어도 됨)
```

## 편집한 내용을 방문자 모두에게 보이게 하기

에디터에서 고친 내용은 우선 **내 브라우저에만** 저장됩니다. 공개하려면:

**방법 1 — 파일 (가장 쉬움)**
1. 에디터 → `백업 · 게시` → `phone-data.json 받기`
2. 그 파일을 `public/phone-data.json`에 넣고 다시 배포 (GitHub라면 커밋/푸시만 하면 자동 배포)
   - 이미 빌드된 `dist/`나 단일 HTML만 쓰는 경우엔 그 폴더(HTML 옆)에 넣으면 됩니다.

**방법 2 — Supabase (게시 버튼 한 번으로 즉시 반영)**
1. supabase.com에서 프로젝트 생성
2. SQL Editor에 에디터의 `Supabase 테이블 만들기 SQL`을 붙여넣고 실행
3. Authentication → Users → `Add user`로 제작자 계정(이메일/비번) 생성, 그리고 Authentication → Sign In / Providers에서 회원가입(Allow new users to sign up) 끄기
4. Project Settings → API 의 `Project URL`, `anon public` 키를
   - 로컬: `.env` 파일에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`로 저장 후 빌드
   - GitHub Pages: 저장소 Settings → Secrets and variables → Actions → **Variables** 탭에 같은 이름으로 등록 후 다시 배포
5. 에디터 → `백업 · 게시` → 로그인 → `지금 게시`

## 호스팅

- **GitHub Pages**: 이 저장소를 push하면 `.github/workflows/deploy.yml`이 자동 빌드·배포합니다. (Settings → Pages → Source: GitHub Actions)
- **Vercel / Cloudflare Pages / Netlify**: Build command `npm run build`, Output `dist`. (`vercel.json`, `public/_redirects` 포함)
- **아무 곳이나**: `dist-single/index.html` 하나만 올려도 됩니다.

## AI 생성

에디터 → `AI 생성`. 서버가 없는 정적 사이트라 제작자 본인의 Anthropic API 키로 브라우저에서 직접 호출합니다. 키는 그 브라우저에만 저장되고, 내보내기/게시 데이터에는 들어가지 않습니다. 방문자 화면에서는 호출되지 않습니다.

## 설정 규칙 (콘텐츠 작성 시)

- 최태식: 1인 해결사/청부업자, 조직·팀 없음, 수감 이력 없음, 최근 이유노 전담 경호
- 가족 관련 내용, 거주지 동·호수·운동 장소 등 신상 특정 정보 없음
- 말풍선 옆 시간 표기 없음 (상태바/잠금화면 시계는 방문자의 실제 현재 시각)
