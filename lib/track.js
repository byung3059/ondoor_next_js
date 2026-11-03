// 방문 기록 저장 (그누보드 lib/tracking.php와 같은 역할) — 서버에서만 불러옴
// - 사람: 사이트의 Tracker가 페이지를 볼 때마다 /api/track으로 알림 → 처음이면 방문 1건 + 페이지 조회 1건
// - 봇: 스크립트를 실행하지 않으므로 proxy.js가 페이지 요청을 보고 /api/track으로 알림 → 방문 1건(봇 이름 · 운영사 · 구분)
// IP는 끝자리를 가려서 저장 (1.2.3.x) — 같은 사람인지는 방문자 쿠키로 셈
import "server-only";
import { sql } from "./db";
import { botOf, deviceOf } from "./bots";

const cut = (s, n) => String(s || "").slice(0, n);

export function maskIp(ip) {
	const s = String(ip || "");
	if (/^\d+\.\d+\.\d+\.\d+$/.test(s)) return s.replace(/\.\d+$/, ".x");
	if (s.includes(":")) return s.split(":").slice(0, 4).join(":") + ":x";
	return s;
}

// 검색엔진 유입이면 검색어 (구글 · 네이버는 보통 검색어를 넘기지 않아 빈칸)
const KEY_PARAMS = [
	[/naver\./, "query"],
	[/daum\.|kakao\./, "q"],
	[/google\./, "q"],
	[/bing\./, "q"],
	[/yahoo\./, "p"],
	[/zum\./, "query"],
	[/duckduckgo\./, "q"],
	[/baidu\./, "wd"],
	[/yandex\./, "text"],
];
export function refInfo(ref, selfHost) {
	try {
		const u = new URL(ref);
		const host = u.hostname.replace(/^www\./, "");
		if (!/^https?:$/.test(u.protocol) || host === String(selfHost || "").replace(/^www\./, "")) return null; // 사이트 안에서 이동
		const kp = KEY_PARAMS.find(([re]) => re.test(host));
		return { host, url: cut(u.href, 500), keyword: cut(kp ? u.searchParams.get(kp[1]) || "" : "", 100) };
	} catch {
		return null;
	}
}

export async function recordVisit({ vid, sid, ip, ua, landing, ref, selfHost }) {
	const r = refInfo(ref, selfHost);
	await sql`insert into visits (vid, sid, ip, ref_host, ref_url, keyword, landing, ua, device)
		values (${vid}, ${sid}, ${maskIp(ip)}, ${r?.host || ""}, ${r?.url || ""}, ${r?.keyword || ""}, ${cut(landing, 300)}, ${cut(ua, 500)}, ${deviceOf(ua)})`;
}

export async function recordPageView({ sid, path, title }) {
	await sql`insert into page_views (sid, path, title) values (${sid}, ${cut(path, 300)}, ${cut(title, 200)})`;
}

export async function recordBot({ ip, ua, path, ref, selfHost }) {
	const bot = botOf(ua);
	if (!bot) return;
	const r = refInfo(ref, selfHost);
	await sql`insert into visits (ip, ref_host, ref_url, landing, ua, device, bot, bot_owner, bot_kind)
		values (${maskIp(ip)}, ${r?.host || ""}, ${r?.url || ""}, ${cut(path, 300)}, ${cut(ua, 500)}, 'bot', ${bot.name}, ${bot.owner}, ${bot.kind})`;
}
