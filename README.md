# Ondoor — Next.js 버전

그누보드5 `theme/basic` 테마(ondoor.co.kr)를 Next.js 16(App Router)으로 옮긴 프로젝트입니다.
디자인 · 애니메이션은 원본과 같고, 페이지 이동은 새로고침 없이(`next/link`) 이루어집니다.

## 실행

```bash
npm install
npm run dev
```

브라우저에서 http://localhost:3000 을 엽니다.

## 페이지

| 주소 | 파일 | 원본 |
|---|---|---|
| `/` | `app/page.js` | `theme/basic/index.php` |
| `/page/ondoor` | `app/page/ondoor/page.js` | `theme/basic/page/ondoor.php` |
| `/page/contact` | `app/page/contact/page.js` | `theme/basic/page/contact.php` |

헤더 · 푸터 · 팝업 · 오른쪽 아래 빠른 상담칸은 `app/layout.js`에 있어 페이지를 오가도 그대로 남습니다.

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
| `app/api` | 자동등록방지(`captcha`) · 상담 저장(`contact`) |
| `public/theme/basic` | 원본 CSS · 이미지 (CSS는 원본 그대로 링크) |

## 원본에서 바뀐 것

- **스크립트 → 컴포넌트**: 원본 `js/*.js`는 페이지를 열 때 한 번 실행되며 DOM을 직접 바꿨습니다.
  여기선 React가 처음부터 나뉜 마크업(글자 `<i>`, 데모 내용, `.weare_body` 등)을 그리고,
  각 컴포넌트의 effect(`useGSAP` 등)가 애니메이션만 붙였다가 페이지를 떠나면 이벤트 · ScrollTrigger · WebGL을 모두 정리합니다.
- **라이브러리**: CDN 대신 npm — `three@0.128.0` · `lenis@1.1.13`은 원본과 같은 버전으로 고정(셰이더 · 스크롤 느낌 동일), `gsap` + `@gsap/react`.
- **CSS**: `scss/visual.min.css`의 `html, body { background: #000 }`만 `:has(.visual)`로 메인에 한정
  (페이지를 오가도 CSS가 남아 있어 서브 페이지에 번지지 않게). `scss/visual.scss`도 같이 고침.
- **상담 저장**: DB(db_list 게시판) 대신 `data/contacts.json`. 스팸 방지 규칙(토큰 · 숨김 칸 · 3초 · 30초 · IP 10분 3건 · 자동등록방지)은 원본과 같음.
- **없는 것**: 블로그(워드프레스)는 실제 사이트 `https://ondoor.co.kr/blog/`로 연결. 관리자 팝업레이어 · GA4 · 서비스 워커는 넣지 않음.

## 설정 (선택)

`.env.local`

```
NEXT_PUBLIC_SITE_URL=https://ondoor.co.kr   # canonical · OG · JSON-LD 주소 (기본값)
CONTACT_SECRET=임의의-긴-문자열              # 폼 토큰 서명 키 (없으면 서버 시작 때마다 새로 만듦)
```
