import { Words } from "@/components/text/Split";

// ① 첫 화면 + 소개 문장 — 고정된 채 제목이 위로 빠지고 문장이 단어마다 밝아짐 (SubFx)
const STATEMENT = ["고객이 브랜드를 처음 만나는 곳, 홈페이지.", { br: "" }, "온도어는 그 첫 문을", { br: "ab_br_m" }, " 기획부터 운영까지", { br: "ab_br_s" }, " 함께 엽니다."];

export default function AboutIntro() {
	return (
		<section className="ab_intro">
			<div className="ab_intro_stage">
				<div className="ab_hero">
					{/* 제목은 유리 도형(AboutGlass)이 캔버스에 메인 타이틀과 같은 효과로 그림 — DOM 글자는 투명하게 자리 · 검색용 */}
					<h1 className="ab_hero_tit" data-glass-title="">
						About Us
					</h1>
				</div>
				{/* 스크롤 안내 꺾쇠 — 메인 .scroll_arrow와 같은 모양 · 자리 */}
				<svg className="ab_scroll" width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
					<path d="M5 12L20 28L35 12" strokeWidth="4" stroke="white" />
				</svg>
				{/* 문장을 span 하나로 감쌈 — 고정 장면에서 p가 가운데 맞춤용 flex가 되면 단어 사이 띄어쓰기가 사라지므로 */}
				<p className="ab_statement">
					<span className="ab_statement_in">
						<Words parts={STATEMENT} />
					</span>
				</p>
			</div>
		</section>
	);
}
