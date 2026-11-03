import DemoBox from "./DemoBox";

// 같은 카드 2개: 왼쪽(BEFORE)은 그대로, 오른쪽(AFTER)은 컬러 · 굵기 · 모서리 · 간격 규칙을 처음부터 모두 적용 — 스타일 차이는 CSS(.cmp_col.s-*)
function Card() {
	return (
		<div className="cmp_card">
			<div className="c_thumb"></div>
			<span className="c_meta">CATEGORY</span>
			<strong className="c_h">카드 제목입니다</strong>
			<span className="c_sub">부제목 한 줄</span>
			<p className="c_p">
				본문 내용이 들어가는 자리입니다.
				<br />두 줄 정도 이어집니다.
			</p>
			<span className="c_btn">자세히 보기</span>
		</div>
	);
}

/* 데모 cmp: 규칙 없는 카드(#000 · 제각각 굵기 · 모서리 · 간격) vs 정돈된 같은 카드 — 애니메이션 없이 나란히 */
export default function DemoCMP({ control }) {
	return (
		<DemoBox kind="cmp" control={control}>
			<div className="cmp_wrap">
				<div className="cmp_col is-bad">
					<em>Before</em>
					<Card />
				</div>
				<div className="cmp_col is-good s-color s-weight s-radius s-space">
					<em>After</em>
					<Card />
				</div>
			</div>
		</DemoBox>
	);
}
