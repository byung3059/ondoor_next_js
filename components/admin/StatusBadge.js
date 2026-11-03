const LABEL = { new: "새 문의", contacted: "연락함", done: "완료" };

// 처리 상태 표시 (새 문의 · 연락함 · 완료)
export default function StatusBadge({ status }) {
	return <span className={`adm_badge is-${status}`}>{LABEL[status] || status}</span>;
}
