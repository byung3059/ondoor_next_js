// 상담 문의 조회 · 수정 — 관리자 화면 · 내려받기 · 자동 삭제가 같이 씀
import "server-only";
import { query, sql } from "./db";

export const STATUS = {
	new: "새 문의",
	contacted: "연락함",
	done: "완료",
};
export const PAGE_SIZE = 20;

// 목록 조건: 상태 · 접수일(대시보드 캘린더에서 넘어옴, YYYY-MM-DD 한국 시간) · 검색어(이름 · 연락처 · 내용 · 메모)
function where({ status, q, date }) {
	const conds = [],
		params = [];
	if (STATUS[status]) {
		params.push(status);
		conds.push(`status = $${params.length}`);
	}
	if (/^\d{4}-\d{2}-\d{2}$/.test(date || "")) {
		params.push(date);
		conds.push(`(created_at at time zone 'Asia/Seoul')::date = $${params.length}`);
	}
	if (q) {
		params.push(`%${q}%`);
		const p = `$${params.length}`;
		conds.push(`(name ilike ${p} or tel ilike ${p} or content ilike ${p} or memo ilike ${p} or job ilike ${p})`);
	}
	return { text: conds.length ? `where ${conds.join(" and ")}` : "", params };
}

export async function listContacts({ status = "", q = "", date = "", page = 1 } = {}) {
	const w = where({ status, q, date });
	const offset = (Math.max(1, page) - 1) * PAGE_SIZE;
	const [rows, [{ total }], counts] = await Promise.all([
		query(`select * from contacts ${w.text} order by created_at desc limit ${PAGE_SIZE} offset ${offset}`, w.params),
		query(`select count(*)::int as total from contacts ${w.text}`, w.params),
		sql`select status, count(*)::int as n from contacts group by status`,
	]);
	const byStatus = Object.fromEntries(counts.map((r) => [r.status, r.n]));
	return { rows, total, byStatus, all: counts.reduce((a, r) => a + r.n, 0) };
}

export async function exportContacts({ status = "", q = "", date = "" } = {}) {
	const w = where({ status, q, date });
	return query(`select * from contacts ${w.text} order by created_at desc`, w.params);
}

export async function getContact(id) {
	const [row] = await sql`select * from contacts where id = ${id}`;
	return row || null;
}

// 이전 · 다음 문의 (최신순 목록 기준)
export async function neighbors(row) {
	const [prev] = await sql`select id from contacts where created_at > ${row.created_at} order by created_at asc limit 1`;
	const [next] = await sql`select id from contacts where created_at < ${row.created_at} order by created_at desc limit 1`;
	return { prev: prev?.id || null, next: next?.id || null };
}

// 상태 · 메모 저장 — "완료"로 바뀐 순간을 done_at에 남김 (보관 1년 기준)
export async function updateContact(id, { status, memo }) {
	if (!STATUS[status]) throw new Error("잘못된 상태");
	await sql`update contacts set
		status = ${status},
		memo = ${memo},
		done_at = case when ${status} = 'done' then coalesce(done_at, now()) else null end,
		updated_at = now()
		where id = ${id}`;
}

export async function deleteContact(id) {
	await sql`delete from contacts where id = ${id}`;
}

// 개인정보처리방침: 상담이 끝난 날로부터 1년 보관 후 파기
// 완료된 문의는 완료한 날로부터, 완료 처리하지 않은 문의는 접수한 날로부터 1년이 지나면 지움
export async function purgeExpired() {
	const rows = await sql`delete from contacts
		where coalesce(done_at, created_at) < now() - interval '1 year'
		returning id`;
	await sql`delete from used_tokens where used_at < now() - interval '1 day'`;
	// 방문 기록도 1년 지난 것은 지움 (접속 통계는 최근 30일까지만 보여 줌)
	await sql`delete from visits where created_at < now() - interval '1 year'`;
	await sql`delete from page_views where created_at < now() - interval '1 year'`;
	return rows.length;
}
