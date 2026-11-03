// 날짜 · 시간을 한국 시간으로 (서버가 어디서 돌든 같게)
const fmt = (opts) => new Intl.DateTimeFormat("ko-KR", { timeZone: "Asia/Seoul", ...opts });
const dt = fmt({ year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false });

export function formatDateTime(v) {
	if (!v) return "-";
	const p = Object.fromEntries(dt.formatToParts(new Date(v)).map((x) => [x.type, x.value]));
	return `${p.year}.${p.month}.${p.day} ${p.hour}:${p.minute}`;
}

// 목록용: 오늘이면 시각만, 아니면 날짜
export function formatShort(v) {
	const d = new Date(v);
	const day = fmt({ year: "numeric", month: "2-digit", day: "2-digit" });
	return day.format(d) === day.format(new Date()) ? formatDateTime(v).slice(11) : formatDateTime(v).slice(0, 10);
}
