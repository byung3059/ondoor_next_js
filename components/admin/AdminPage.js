// 관리자 페이지 본문: 페이지 제목(#container_title) + 본문(.container_wr) — 원본 그누보드 관리자와 같은 구조
// hideTitle: 대시보드처럼 제목 대신 카드로 시작하는 화면 (제목은 화면낭독기용으로만 — #container_title 모양을 쓰지 않음)
export default function AdminPage({ title, hideTitle = false, children }) {
	return (
		<>
			{hideTitle ? <h1 className="sound_only">{title}</h1> : <h1 id="container_title">{title}</h1>}
			<div className="container_wr">{children}</div>
		</>
	);
}
