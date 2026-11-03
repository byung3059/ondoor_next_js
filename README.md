# Ondoor — Next.js 버전

그누보드5 `theme/basic` 테마(ondoor.co.kr)를 Next.js 16(App Router)으로 옮긴 프로젝트입니다.
디자인 · 애니메이션은 원본과 같고, 페이지 이동은 새로고침 없이(`next/link`) 이루어집니다.

## 실행

```bash
npm install
npm run dev
```

브라우저에서 http://localhost:3000 을 엽니다.
로컬에서는 DB 설정 없이도 내장 DB(`data/pglite`)에 상담이 저장되고, 관리자(http://localhost:3000/admin)는 기본 비밀번호 `ondoor-admin`으로 들어갑니다.

## 페이지

| 주소 | 파일 | 원본 |
|---|---|---|
| `/` | `app/(site)/page.js` | `theme/basic/index.php` |
| `/page/ondoor` | `app/(site)/page/ondoor/page.js` | `theme/basic/page/ondoor.php` |
| `/page/contact` | `app/(site)/page/contact/page.js` | `theme/basic/page/contact.php` |
| `/admin` | `app/admin/` | 그누보드 관리자 > db_list 게시판 |

헤더 · 푸터 · 팝업 · 오른쪽 아래 빠른 상담칸은 `app/(site)/layout.js`에 있어 페이지를 오가도 그대로 남습니다.
관리자 화면은 `app/admin/layout.js`로 따로 그려집니다 (사이트 헤더 · 애니메이션 없음).

## 관리자 · DB

- **DB**: Neon Postgres (`lib/db.js`) — 표는 처음 쓸 때 자동으로 만들어짐 (`contacts` 상담 문의, `used_tokens` 자동등록방지 한 번만 쓰기)
- **관리자 `/admin`**: 비밀번호 로그인 → 문의 목록(상태 탭 · 검색 · 쪽 번호) → 상세(상태 새 문의 · 연락함 · 완료, 메모, 삭제) · CSV 내려받기
  - 로그인은 서명된 쿠키(7일), `proxy.js`가 앞단에서 막고 화면 · 동작마다 다시 확인 (`lib/admin-auth.js`)
- **자동 삭제**: 매일 새벽 3시(한국 시간) Vercel Cron이 `/api/cron/purge` 호출 → 완료한 날(완료 안 했으면 접수한 날)로부터 1년 지난 문의 삭제 (개인정보처리방침과 같게)
- **알림 메일 (선택)**: Resend 키를 넣으면 새 문의가 들어올 때 메일 발송 (`lib/notify.js`)

### Vercel 설정 순서

1. **DB 만들기**: Vercel 프로젝트 → Storage → Create Database → **Neon** → 이 프로젝트에 연결 (`DATABASE_URL`이 자동으로 들어감)
2. **환경 변수**: Settings → Environment Variables (값 설명은 `.env.example`)
   - `CONTACT_SECRET` · `ADMIN_PASSWORD` · `CRON_SECRET` — 각각 긴 임의의 문자열
   - (선택) `RESEND_API_KEY` · `NOTIFY_EMAIL` · `NOTIFY_FROM`
3. **다시 배포**: 환경 변수는 새 배포부터 적용됨 → Deployments에서 Redeploy (또는 `git push`)

## 폴더

| 폴더 | 내용 |
|---|---|
| `components/layout` | 헤더(메뉴), 푸터, 로고 · 메뉴 글자 SVG, 글자 굴림(RollText), 터치 스크롤 잠금, JSON-LD |
| `components/home` | 메인: 비주얼(Visual), 서비스(Service), We Are(`weare/` — 섹션 + 데모 5개), 주소 # 이동 |
| `components/about` | 회사소개: 유리 도형 배경, 소개 문장, 서비스 카드, 진행 과정, 역할, Blog · Contact 링크 |
| `components/sub` | 서브 페이지 스크롤 연출(SubFx — 원본 `js/sub.js`) |
| `components/contact` | 상담 폼(서버 토큰 + 클라이언트 폼), 커스텀 셀렉트, 자동등록방지, 빠른 상담칸 |
| `components/popup` | 팝업 틀 · 개인정보처리방침 · 이용약관 · 접수 완료 |
| `components/fx` | 3D 선 아이콘(LineFigure), 부드러운 스크롤(Lenis) |
| `components/text` | 글자 · 단어 나누기 (애니메이션용 `<i>` · `.w` 마크업) |
| `lib/fx` | 메인 유리 도형 WebGL(`glass.js` — 원본 `js/visual.js`), gsap 등록, 선 도형, 위치 이동, 데모 재생 제어 |
| `components/admin` | 관리자 머리, 로그인 폼, 상태 표시, 삭제 버튼 |
| `app/api` | 자동등록방지(`captcha`) · 상담 저장(`contact`) · 자동 삭제(`cron/purge`) |
| `lib` | DB(`db.js`), 상담 조회 · 수정(`contacts.js`), 자동등록방지 토큰(`captcha.js`), 관리자 로그인(`admin-*.js`), 알림 메일(`notify.js`) |
| `public/theme/basic` | 원본 CSS · 이미지 (CSS는 원본 그대로 링크) |

## 원본에서 바뀐 것

- **스크립트 → 컴포넌트**: 원본 `js/*.js`는 페이지를 열 때 한 번 실행되며 DOM을 직접 바꿨습니다.
  여기선 React가 처음부터 나뉜 마크업(글자 `<i>`, 데모 내용, `.weare_body` 등)을 그리고,
  각 컴포넌트의 effect(`useGSAP` 등)가 애니메이션만 붙였다가 페이지를 떠나면 이벤트 · ScrollTrigger · WebGL을 모두 정리합니다.
- **라이브러리**: CDN 대신 npm — `three@0.128.0` · `lenis@1.1.13`은 원본과 같은 버전으로 고정(셰이더 · 스크롤 느낌 동일), `gsap` + `@gsap/react`.
- **CSS**: `scss/visual.min.css`의 `html, body { background: #000 }`만 `:has(.visual)`로 메인에 한정
  (페이지를 오가도 CSS가 남아 있어 서브 페이지에 번지지 않게). `scss/visual.scss`도 같이 고침.
- **상담 저장**: 그누보드 db_list 게시판 대신 Postgres `contacts` 표. 스팸 방지 규칙(토큰 · 숨김 칸 · 3초 · 30초 · IP 10분 3건 · 자동등록방지)은 원본과 같음.
  Vercel은 요청마다 다른 서버가 받을 수 있어 세션 대신 서명된 토큰을 쓰고, 한 번만 써야 하는 것은 DB에 기록함.
  자동등록방지는 문제마다 확인이 한 번 (틀리면 새 문제 — 원본 화면 동작과 같음).
- **없는 것**: 블로그(워드프레스)는 실제 사이트 `https://ondoor.co.kr/blog/`로 연결. 관리자 팝업레이어 · GA4 · 서비스 워커는 넣지 않음.

## 환경 변수

`.env.example`에 모든 값과 설명이 있습니다. 로컬에서는 모두 비워 둬도 실행됩니다.
