import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import TouchScrollLock from "@/components/layout/TouchScrollLock";
import PopupProvider from "@/components/popup/PopupProvider";
import ContactWidget from "@/components/contact/ContactWidget";
import ContactForm from "@/components/contact/ContactForm";
import { BLOG_URL, CF_TITLE, SITE_URL, THEME_URL, od } from "@/lib/site";

export const metadata = {
	metadataBase: new URL(SITE_URL),
	icons: {
		icon: `${THEME_URL}/img/favicon.png`,
		apple: `${THEME_URL}/img/pwa/apple-touch-icon.png`,
	},
	manifest: "/manifest.webmanifest",
	appleWebApp: { title: od.name, statusBarStyle: "black" },
};

export const viewport = {
	width: "device-width",
	initialScale: 1,
	themeColor: "#000000",
};

// 화면이 그려지기 전에 실행 (처음 들어올 때만 — 페이지를 오갈 땐 각 페이지 컴포넌트가 붙임)
// - 메인: 새로고침 때 스크롤 위치 복원 막기, intro-lock(인트로 동안 스크롤 잠금 · 아래 섹션 숨김) · is-hint(문의칸 숨김)
// - 회사소개 · 상담문의: sub-wait (연출이 준비될 때까지 움직일 글자 · 카드 숨김)
// - 실패해도 잠긴 채 남지 않게 자동 해제 (메인 20초 · 서브 4초) — 타이머는 페이지 컴포넌트가 이어받아 지움
const PRE_PAINT = `(function(){var p=location.pathname,c=document.documentElement.classList;
if(p==="/"){"scrollRestoration"in history&&(history.scrollRestoration="manual");c.add("intro-lock","is-hint");window.__introSafety=setTimeout(function(){c.remove("intro-lock","is-hint")},2e4)}
else if(p==="/page/ondoor"||p==="/page/contact"){c.add("sub-wait");setTimeout(function(){c.remove("sub-wait")},4e3)}})();`;

/* 모든 페이지 공통 틀 (원본: head.sub.php + head.php + tail.php)
   헤더 · 푸터 · 팝업 · 오른쪽 아래 문의칸은 페이지를 오가도 그대로 남음
   CSS 순서: default.css → 페이지 CSS(visual · sub, 각 page.js) → layout.min.css (원본 add_stylesheet 순서) */
export default function RootLayout({ children }) {
	return (
		<html lang="ko" suppressHydrationWarning>
			<head>
				<script dangerouslySetInnerHTML={{ __html: PRE_PAINT }} />
			</head>
			<body suppressHydrationWarning>
				<link rel="stylesheet" href={`${THEME_URL}/css/default.css`} precedence="base" />
				<PopupProvider>
					<SiteHeader title={CF_TITLE} blogUrl={BLOG_URL} />
					{children}
					<SiteFooter />
					<ContactWidget>
						<ContactForm pre="cw_" quick />
					</ContactWidget>
				</PopupProvider>
				<TouchScrollLock />
				<link rel="stylesheet" href={`${THEME_URL}/scss/layout.min.css`} precedence="theme" />
			</body>
		</html>
	);
}
