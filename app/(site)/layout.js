import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import TouchScrollLock from "@/components/layout/TouchScrollLock";
import Tracker from "@/components/fx/Tracker";
import PopupProvider from "@/components/popup/PopupProvider";
import ContactWidget from "@/components/contact/ContactWidget";
import ContactForm from "@/components/contact/ContactForm";
import { BLOG_URL, CF_TITLE, THEME_URL } from "@/lib/site";

/* 사이트 공통 틀 (원본: head.sub.php + head.php + tail.php)
   헤더 · 푸터 · 팝업 · 오른쪽 아래 문의칸은 페이지를 오가도 그대로 남음
   CSS 순서: default.css → 페이지 CSS(visual · sub, 각 page.js) → layout.min.css (원본 add_stylesheet 순서) */
export default function SiteLayout({ children }) {
	return (
		<>
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
			<Tracker />
			<link rel="stylesheet" href={`${THEME_URL}/scss/layout.min.css`} precedence="theme" />
		</>
	);
}
