import SubFx from "@/components/sub/SubFx";
import ContactForm from "@/components/contact/ContactForm";
import { MaskChars } from "@/components/text/Split";
import JsonLd from "@/components/layout/JsonLd";
import { THEME_URL, pageMetadata } from "@/lib/site";

/* 상담문의 — 주소: /page/contact (원본 theme/basic/page/contact.php)
   가운데 한 열: 제목 → 상담 폼 (메인 하단 폼과 같은 것), 오른쪽 아래 빠른 상담칸은 띄우지 않음 (ContactWidget)
   폼 페이지라 부드러운 스크롤(Lenis) 없이 기본 스크롤 */
export const metadata = pageMetadata({ title: "상담문의", path: "/page/contact" });

export default function ContactPage() {
	return (
		<>
			<link rel="stylesheet" href={`${THEME_URL}/scss/sub.min.css`} precedence="page" />
			<JsonLd title="상담문의" path="/page/contact" />
			<main id="wrap" className="is-sub">
				<SubFx className="ab ct" noLenis>
					<section className="ct_form" aria-labelledby="ct_tit">
						{/* 머리: 게시판과 같은 모양 — 작은 영문 라벨 + 큰 제목 */}
						<div className="ct_head">
							<p className="ct_lbl" data-rise="">
								Contact
							</p>
							<h1 className="ct_tit" id="ct_tit" data-split="">
								<MaskChars text="상담 문의" />
							</h1>
						</div>
						<div data-rise="">
							<ContactForm pre="ct_" />
						</div>
					</section>
				</SubFx>
			</main>
		</>
	);
}
