import SmoothScroll from "@/components/fx/SmoothScroll";
import SubFx from "@/components/sub/SubFx";
import AboutGlass from "@/components/about/AboutGlass";
import AboutIntro from "@/components/about/AboutIntro";
import AboutWorks from "@/components/about/AboutWorks";
import AboutFlow from "@/components/about/AboutFlow";
import AboutRole from "@/components/about/AboutRole";
import SubLinks from "@/components/about/SubLinks";
import JsonLd from "@/components/layout/JsonLd";
import { BLOG_URL, THEME_URL, pageMetadata } from "@/lib/site";

/* 회사소개 — 주소: /page/ondoor (원본 theme/basic/page/ondoor.php)
   ① 검정 첫 화면(뒤에서 유리 도형이 돎) + ABOUT US → 고정된 채 소개 문장이 단어마다 밝아짐
   ② 가운데 문장 위로 서비스 카드 6장이 아래에서 올라와 덮음 ③ 진행 과정 흐름도 ④ 역할 2단 ⑤ Blog · Contact
   첫 화면이 검정 → 헤더는 흰 글자로 시작, 흰 구간([data-hd-light])에서 #444 (SiteHeader) */
export const metadata = pageMetadata({ title: "회사소개", path: "/page/ondoor" });

export default function AboutPage() {
	return (
		<>
			<link rel="stylesheet" href={`${THEME_URL}/scss/sub.min.css`} precedence="page" />
			<JsonLd title="회사소개" path="/page/ondoor" />
			<SmoothScroll respectReduce />
			<main id="wrap" className="is-sub">
				<SubFx className="ab" hdAuto>
					{/* 검정 구간: 첫 화면 · 서비스 카드 · 그라데이션 — 뒤에 유리 도형 캔버스가 화면에 고정 */}
					<div className="ab_dark">
						<AboutGlass />
						<AboutIntro />
						<AboutWorks />
						{/* 투명 → 흰색 그라데이션 한 화면 — 뒤 유리 도형을 덮으며 흰 구간으로, 다 덮이면 유리 도형이 그리기를 멈춤 */}
						<div className="ab_grad" data-glass-cover="" aria-hidden="true"></div>
					</div>

					{/* ③ ~ ⑤ 흰 구간 (헤더 로고 #444) */}
					<div className="ab_light" data-hd-light="">
						<AboutFlow />
						<AboutRole />
						<SubLinks blogUrl={BLOG_URL} />
					</div>
				</SubFx>
			</main>
		</>
	);
}
