// 관리자 대시보드 집계 (원본: extend/adm_theme/lib/adm_theme.lib.php) — 날짜는 모두 한국 시간
import "server-only";
import { query, sql, usingLocalDb } from "./db";
import { SITE_URL } from "./site";
import nextPkg from "next/package.json";
import reactPkg from "react/package.json";

const TZ = "Asia/Seoul";
const kstDate = (d = new Date()) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d); // YYYY-MM-DD
const addDays = (ymd, n) => {
	const d = new Date(`${ymd}T00:00:00Z`);
	d.setUTCDate(d.getUTCDate() + n);
	return d.toISOString().slice(0, 10);
};
export const today = () => kstDate();
const LOCAL = `(created_at at time zone '${TZ}')`; // 한국 시간

/* 접속 통계: 오늘 시간대별, 최근 30일 일별, 기기별(PC · 모바일 · AI·검색 봇) — 사람 방문은 브라우저 세션당 1건 */
export async function visitStats() {
	const t = today(),
		d7 = addDays(t, -6),
		d30 = addDays(t, -29);
	const [hourRows, dayRows, devRows] = await Promise.all([
		query(`select extract(hour from ${LOCAL})::int as h, count(*)::int as n from visits where bot = '' and ${LOCAL}::date = $1 group by h`, [t]),
		query(`select to_char(${LOCAL}::date, 'YYYY-MM-DD') as d, count(*)::int as n from visits where bot = '' and ${LOCAL}::date >= $1 group by d`, [d30]),
		query(
			`select case when bot <> '' then 'bot' when device in ('mobile', 'tablet') then 'mobile' else 'pc' end as dev,
				count(*) filter (where ${LOCAL}::date = $1)::int as c_today,
				count(*) filter (where ${LOCAL}::date >= $2)::int as c_7,
				count(*)::int as c_30
			from visits where ${LOCAL}::date >= $3 group by dev`,
			[t, d7, d30],
		),
	]);
	const hourly = Array(24).fill(0);
	hourRows.forEach((r) => (hourly[r.h] = r.n));
	const daily = {};
	for (let i = 29; i >= 0; i--) daily[addDays(t, -i)] = 0;
	dayRows.forEach((r) => r.d in daily && (daily[r.d] = r.n));
	const device = { today: { pc: 0, mobile: 0, bot: 0 }, 7: { pc: 0, mobile: 0, bot: 0 }, 30: { pc: 0, mobile: 0, bot: 0 } };
	devRows.forEach((r) => {
		device.today[r.dev] += r.c_today;
		device[7][r.dev] += r.c_7;
		device[30][r.dev] += r.c_30;
	});
	return { hourly, daily, device };
}

/* 인사 카드: 오늘 방문자 · 상담 문의 + 처리 대기 */
export async function todaySummary() {
	const t = today();
	const [[v], [c]] = await Promise.all([
		query(`select count(*)::int as n from visits where bot = '' and ${LOCAL}::date = $1`, [t]),
		query(`select count(*)::int as n from contacts where ${LOCAL}::date = $1`, [t]),
	]);
	return { visit: v.n, contact: c.n };
}

export async function pendingTasks() {
	const t = today();
	const [[now], [st], [bot]] = await Promise.all([
		sql`select count(distinct sid)::int as n from page_views where created_at > now() - interval '5 minutes'`,
		sql`select count(*) filter (where status = 'new')::int as new, count(*) filter (where status = 'contacted')::int as contacted from contacts`,
		query(`select count(*)::int as n from visits where bot <> '' and bot_kind = 'AI' and ${LOCAL}::date = $1`, [t]),
	]);
	return [
		{ label: "현재 접속자", count: now.n, unit: "명", href: "/admin#visit" },
		{ label: "새 상담 문의", count: st.new, href: "/admin/contacts?status=new" },
		{ label: "연락 중인 문의", count: st.contacted, href: "/admin/contacts?status=contacted" },
		{ label: "오늘 AI 봇 접속", count: bot.n, unit: "회", href: "/admin#bots" },
	];
}

/* 내 접속 정보: 오늘 첫 로그인 시각 · IP, 지금 IP가 다르면 표시 */
export const requestIp = (h) => (h.get("x-forwarded-for") || "").split(",")[0].trim() || h.get("x-real-ip") || "-";
export async function recordAdminLogin(ip) {
	await sql`insert into admin_logins (ip) values (${ip})`;
	await sql`delete from admin_logins where created_at < now() - interval '90 days'`;
}
export async function loginInfo(currentIp) {
	const [row] = await query(`select created_at, ip from admin_logins where ${LOCAL}::date = $1 order by created_at asc limit 1`, [today()]);
	if (!row) return null;
	return { time: row.created_at, ip: row.ip, currentIp, changed: !!currentIp && !!row.ip && currentIp !== row.ip };
}

/* 상담 문의 요약 (원본의 1:1 문의 카드) */
export async function contactSummary(limit = 4) {
	const [[s], list] = await Promise.all([
		sql`select count(*)::int as total, count(*) filter (where status = 'new')::int as wait from contacts`,
		sql`select id, name, job, budget, quick, status, created_at from contacts order by created_at desc limit ${limit}`,
	]);
	return { ...s, list };
}

/* 최근 7일 순위: 유입 경로 · 많이 본 페이지 · AI·검색 봇 */
export async function rankings() {
	const since = addDays(today(), -6);
	const [refs, [direct], pages, bots] = await Promise.all([
		query(`select ref_host as name, count(*)::int as n from visits where bot = '' and ref_host <> '' and ${LOCAL}::date >= $1 group by ref_host order by n desc limit 5`, [since]),
		query(`select count(*)::int as n from visits where bot = '' and ref_host = '' and ${LOCAL}::date >= $1`, [since]),
		query(`select path as name, max(title) as title, count(*)::int as n from page_views where ${LOCAL}::date >= $1 group by path order by n desc limit 5`, [since]),
		query(`select bot as name, max(bot_owner) as owner, max(bot_kind) as kind, count(*)::int as n from visits where bot <> '' and ${LOCAL}::date >= $1 group by bot order by n desc limit 5`, [since]),
	]);
	return { refs, direct: direct.n, pages, bots };
}

/* 캘린더: 한 달 동안 날짜별 상담 문의 · 처리 완료 · 블로그 글 수 */
export const CAL_TYPES = ["contact", "done", "blog"];
export async function calendar(ym) {
	if (!/^\d{4}-\d{2}$/.test(ym || "")) ym = today().slice(0, 7);
	const start = `${ym}-01`;
	const end = addDays(addDays(start, 32).slice(0, 7) + "-01", -1);
	const days = {};
	const add = (d, type, n) => ((days[d] ??= {})[type] = n);
	const [contacts, done, blog] = await Promise.all([
		query(`select to_char(${LOCAL}::date, 'YYYY-MM-DD') as d, count(*)::int as n from contacts where ${LOCAL}::date between $1 and $2 group by d`, [start, end]),
		query(
			`select to_char((done_at at time zone '${TZ}')::date, 'YYYY-MM-DD') as d, count(*)::int as n from contacts where done_at is not null and (done_at at time zone '${TZ}')::date between $1 and $2 group by d`,
			[start, end],
		),
		blogPosts({ after: `${start}T00:00:00`, before: `${end}T23:59:59`, perPage: 100 }),
	]);
	contacts.forEach((r) => add(r.d, "contact", r.n));
	done.forEach((r) => add(r.d, "done", r.n));
	(blog || []).forEach((p) => {
		const d = p.date.slice(0, 10);
		add(d, "blog", (days[d]?.blog || 0) + 1);
	});
	return { ym, types: CAL_TYPES, days };
}

/* 블로그 최근 글 (워드프레스 REST API, 10분 캐시) — 원본의 최근게시물 카드 */
export async function blogPosts({ perPage = 5, after, before } = {}) {
	const u = new URL(`${SITE_URL}/blog/wp-json/wp/v2/posts`);
	u.searchParams.set("per_page", String(perPage));
	u.searchParams.set("_fields", "id,date,link,title");
	if (after) u.searchParams.set("after", after);
	if (before) u.searchParams.set("before", before);
	try {
		const res = await fetch(u, { next: { revalidate: 600 }, signal: AbortSignal.timeout(4000) });
		if (!res.ok) return null;
		const list = await res.json();
		return list.map((p) => ({ id: p.id, date: p.date, link: p.link, title: decodeEntities(p.title?.rendered || "") }));
	} catch {
		return null;
	}
}
const decodeEntities = (s) =>
	s
		.replace(/<[^>]*>/g, "")
		.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
		.replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
		.replace(/&(amp|lt|gt|quot|#039|apos);/g, (m) => ({ "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#039;": "'", "&apos;": "'" })[m]);

/* 서버정보 (원본: 그누보드 · PHP · DB 버전 등) */
export async function serverInfo() {
	let dbVer = "-",
		dbSize = "-";
	try {
		const [r] = await sql`select version() as v, pg_database_size(current_database()) as s`;
		dbVer = String(r.v).split(" ").slice(0, 2).join(" ");
		dbSize = formatBytes(Number(r.s));
	} catch {}
	const env = process.env;
	return {
		"Next.js": nextPkg.version,
		React: reactPkg.version,
		Node: process.version.replace(/^v/, ""),
		배포: env.VERCEL_ENV ? `Vercel (${env.VERCEL_ENV})` : "로컬 개발",
		지역: env.VERCEL_REGION || "-",
		커밋: env.VERCEL_GIT_COMMIT_SHA ? env.VERCEL_GIT_COMMIT_SHA.slice(0, 7) : "-",
		DB: `${usingLocalDb ? "내장(PGlite)" : "Neon"} · ${dbVer}`,
		"DB 크기": dbSize,
		"알림 메일": env.RESEND_API_KEY && env.NOTIFY_EMAIL ? "켜짐" : "꺼짐",
		"자동 삭제": env.CRON_SECRET ? "켜짐 (매일 03:00)" : "꺼짐 (CRON_SECRET 없음)",
	};
}
function formatBytes(b) {
	const u = ["B", "KB", "MB", "GB"];
	let i = 0;
	while (b >= 1024 && i < u.length - 1) (b /= 1024), i++;
	return `${b.toFixed(i ? 2 : 0)} ${u[i]}`;
}

/* 알림: 새 상담 문의 (처리 상태가 '새 문의'인 것) */
export async function notifications(limit = 20) {
	const [[c], list] = await Promise.all([
		sql`select count(*)::int as n from contacts where status = 'new'`,
		sql`select id, name, job, budget, quick, content, created_at from contacts where status = 'new' order by created_at desc limit ${limit}`,
	]);
	return { count: c.n, items: list };
}
