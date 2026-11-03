import { MaskChars } from "@/components/text/Split";

const NB = " ";

// 역할 — [이름, 한 줄 소개, 할 일들]
const ROLES = [
	["온도어", "한 팀에서 기획부터 운영까지", ["기획 · 디자인 · 개발 · SEO를 한 팀에서 진행해 전달 과정의 손실을 줄입니다", "디자인 규칙을 세워 오래 써도 흐트러지지 않는 화면을 만듭니다", "오픈 후에도 유지보수와 개선을 이어 갑니다"]],
	["고객", "목표와 브랜드를 함께 정리", [`사업 목표와 브랜드 자료(로고${NB}·${NB}사진${NB}·${NB}문구)를 공유합니다`, "단계마다 시안을 확인하고 의견을 남깁니다", "오픈 후 새 소식과 콘텐츠를 꾸준히 올립니다"]],
];

// ④ 함께 만드는 방식 — 역할 2단 (첫 칸이 온도어)
export default function AboutRole() {
	return (
		<section className="ab_sec ab_role">
			<h2 className="ab_tit" data-split="">
				<MaskChars text="함께 만드는 방식" />
			</h2>
			<div className="ab_role_cols">
				{ROLES.map(([name, lead, list], r) => (
					<div className={r === 0 ? "ab_role_col is-us" : "ab_role_col"} key={name}>
						<p className="ab_role_head" data-rise="">
							{name}
						</p>
						<div className="ab_role_body">
							<p className="ab_role_lead" data-rise="">
								{lead}
							</p>
							<ol className="ab_role_list">
								{list.map((txt, n) => (
									<li data-rise="" key={n}>
										<span className="n">{n + 1}</span>
										{txt}
									</li>
								))}
							</ol>
						</div>
					</div>
				))}
			</div>
		</section>
	);
}
