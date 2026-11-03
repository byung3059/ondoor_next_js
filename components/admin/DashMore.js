import Link from "next/link";

// 카드 오른쪽 위 더보기(점 3개) — 마우스를 올리면 점이 차례로 튀어 오름 (원본 dash_more)
export default function DashMore({ href, label, external }) {
	const inner = (
		<>
			<span className="adm_dots" aria-hidden="true">
				<i></i>
				<i></i>
				<i></i>
			</span>
			<span className="sound_only">{label}</span>
		</>
	);
	return external ? (
		<a href={href} className="dash_more" title={label} target="_blank" rel="noopener">
			{inner}
		</a>
	) : (
		<Link href={href} className="dash_more" title={label}>
			{inner}
		</Link>
	);
}
