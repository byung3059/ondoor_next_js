import SmoothScroll from "@/components/fx/SmoothScroll";
import Visual from "@/components/home/Visual";
import Service from "@/components/home/Service";
import Weare from "@/components/home/weare/Weare";
import HashJump from "@/components/home/HashJump";
import ContactForm from "@/components/contact/ContactForm";
import JsonLd from "@/components/layout/JsonLd";
import { THEME_URL, pageMetadata } from "@/lib/site";

export const metadata = pageMetadata({ path: "/" });

/* 메인 (원본: theme/basic/index.php)
   비주얼(인트로 + 유리 도형) → What We Do → We Are(+ 상담 폼)
   연출은 앞에서부터 차례로 준비됨 (형제 컴포넌트는 앞에서부터 effect가 돎): 부드러운 스크롤 → 비주얼 → 서비스 → We Are → 주소 # 위치 이동 */
export default function Home() {
	return (
		<>
			<link rel="stylesheet" href={`${THEME_URL}/scss/visual.min.css`} precedence="page" />
			<JsonLd path="/" />
			<SmoothScroll />
			<main id="wrap">
				<h1 className="blind">Ondoor(온도어) — 기업·브랜드 홈페이지 제작 웹에이전시</h1>
				<Visual />
				<Service />
				<Weare contactForm={<ContactForm pre="cf_" />} />
			</main>
			<HashJump />
		</>
	);
}
