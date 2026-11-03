import { MaskChars } from "@/components/text/Split";

const NB = " "; // 좁은 화면에서 단어 묶음이 줄 끝에서 갈라지지 않게
const nb = (...words) => words.join(NB);

function FlowBox({ end, tag, title, desc, pill }) {
	return (
		<div className={end ? "ab_flow_box is-end" : "ab_flow_box"} data-rise="">
			{tag && <em className="ab_flow_tag">{tag}</em>}
			<strong>{title}</strong>
			<span>{desc}</span>
			{pill && <em className="ab_flow_pill">{pill}</em>}
		</div>
	);
}
const Line = () => <i className="ab_flow_line" aria-hidden="true"></i>;

// ③ 진행 과정 흐름도 — 점선 화살표가 스크롤에 따라 위에서 아래로 그어짐 (SubFx)
export default function AboutFlow() {
	return (
		<section className="ab_sec ab_flow">
			<h2 className="ab_tit" data-split="">
				<MaskChars text="진행 과정" />
			</h2>
			<div className="ab_flow_panel">
				<FlowBox title="고객" desc={`${nb("사업", "목표")}${NB}· ${nb("브랜드", "자료")}${NB}· ${nb("일정과", "예산")}`} pill="상담 요청" />
				<FlowBox title="온도어" desc={`기획${NB}· 디자인${NB}· 개발${NB}· SEO 한${NB}팀`} pill="제안 · 견적" />
				<Line />
				<Line />
				<div className="ab_flow_bar" data-rise="">
					<b>프로젝트 진행</b>
					<ol>
						<li>기획</li>
						<li>디자인</li>
						<li>개발</li>
						<li>검수</li>
					</ol>
				</div>
				<Line />
				<Line />
				<FlowBox end tag="오픈" title="사이트 공개" desc={`${nb("검색엔진", "등록")}${NB}· ${nb("방문", "분석", "연결")}`} />
				<FlowBox end tag="운영" title="유지보수 · 개선" desc={`${nb("콘텐츠", "수정")}${NB}· ${nb("서버", "관리")}${NB}· ${nb("성과", "개선")}`} />
			</div>
		</section>
	);
}
