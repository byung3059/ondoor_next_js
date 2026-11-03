import LineFigure from "@/components/fx/LineFigure";
import { Words } from "@/components/text/Split";

const NB = " "; // 좁은 화면에서 단어 묶음이 줄 끝에서 갈라지지 않게

// 서비스 카드 — [제목, 설명, 3D 선 아이콘 모양(메인 서비스 카드와 같은 도형)]
const WORKS = [
	["반응형 홈페이지 제작", "PC · 태블릿 · 모바일 어디서나 같은 품질로 보이는 기업 · 브랜드 사이트를 만듭니다.", "devices"],
	["쇼핑몰 제작", "상품 탐색부터 결제까지 끊김 없이 이어지는 구매 흐름을 설계합니다.", "gem"],
	["브랜딩 · UI/UX 디자인", "서체 · 간격 · 색의 규칙을 세워 오래 봐도 편한 화면을 만듭니다.", "cube"],
	["SEO/GEO 최적화", `검색엔진과 AI 검색 모두에서 잘${NB}찾히도록 구조와 콘텐츠를 다듬습니다.`, "globe"],
	["인터랙티브 · 모션", "GSAP · WebGL로 브랜드를 기억하게 만드는 움직임을 더합니다.", "ico"],
	["유지보수 · 운영", "오픈 이후에도 콘텐츠 수정 · 서버 관리 · 개선을 함께합니다.", "hex"],
];
const MSG = ["브랜드의 첫인상을 설계하고,", { br: "" }, "검색과 성과로 이어지는", { br: "ab_br_m" }, " 홈페이지를 만듭니다."];

// ② 서비스 카드 + 문장 — 가운데 문장 위로 카드 6장이 아래에서 올라와 덮음 (SubFx)
export default function AboutWorks() {
	return (
		<section className="ab_works">
			<div className="ab_works_stage">
				<div className="ab_works_msg">
					<h2 className="ab_works_tit">
						<Words parts={MSG} />
					</h2>
				</div>
				<ul className="ab_works_grid">
					{WORKS.map(([tit, desc, shape], i) => (
						<li className="ab_work" key={tit}>
							<span className="num">{String(i + 1).padStart(2, "0")}</span>
							<h3>{tit}</h3>
							<p>{desc}</p>
							<LineFigure shape={shape} index={i} hoverSel=".ab_work" />
						</li>
					))}
				</ul>
			</div>
		</section>
	);
}
