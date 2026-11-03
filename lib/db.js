// DB 연결 — 서버에서만 불러옴
// - DATABASE_URL(또는 POSTGRES_URL)이 있으면 Neon Postgres (Vercel → Storage → Neon을 만들면 자동으로 들어감)
// - 없으면 로컬 개발용 내장 Postgres(PGlite, data/pglite 폴더) — 따로 설치 · 가입 없이 바로 실행
// 사용: await sql`select * from contacts where id = ${id}` → 행 배열
import "server-only";

const DB_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;

// 표 만들기 (처음 쓸 때 한 번, 이미 있으면 그대로)
const SCHEMA = [
	`create table if not exists contacts (
		id serial primary key,
		created_at timestamptz not null default now(),
		name text not null,
		tel text not null,
		job text not null default '',
		budget text not null default '',
		content text not null,
		quick boolean not null default false,
		ip text not null default '',
		agreed_at timestamptz not null default now(),
		status text not null default 'new',
		memo text not null default '',
		done_at timestamptz,
		updated_at timestamptz not null default now()
	)`,
	`create index if not exists contacts_created_idx on contacts (created_at desc)`,
	`create index if not exists contacts_ip_idx on contacts (ip, created_at desc)`,
	// 자동등록방지 통과 표시 한 번만 쓰기 (쓴 것 기록, 하루 지나면 지움)
	`create table if not exists used_tokens (token text primary key, used_at timestamptz not null default now())`,
	// 방문 기록 (그누보드 g5_access_url과 같은 역할) — 브라우저 세션당 1건, 봇은 요청마다 1건
	`create table if not exists visits (
		id bigserial primary key,
		created_at timestamptz not null default now(),
		vid text not null default '',
		sid text not null default '',
		ip text not null default '',
		ref_host text not null default '',
		ref_url text not null default '',
		keyword text not null default '',
		landing text not null default '',
		ua text not null default '',
		device text not null default 'pc',
		bot text not null default '',
		bot_owner text not null default '',
		bot_kind text not null default ''
	)`,
	`create index if not exists visits_created_idx on visits (created_at desc)`,
	// 페이지 조회 (그누보드 g5_access_page) — 페이지를 볼 때마다 (사이트 안 이동 포함)
	`create table if not exists page_views (
		id bigserial primary key,
		created_at timestamptz not null default now(),
		sid text not null default '',
		path text not null,
		title text not null default ''
	)`,
	`create index if not exists page_views_created_idx on page_views (created_at desc)`,
	// 관리자 로그인 기록 (대시보드의 '금일 첫 접속')
	`create table if not exists admin_logins (id serial primary key, created_at timestamptz not null default now(), ip text not null default '')`,
];

const g = (globalThis.__ondoorDb ??= { run: null, ready: null });

async function connect() {
	if (DB_URL) {
		const { neon } = await import("@neondatabase/serverless");
		const q = neon(DB_URL);
		return (text, params) => q.query(text, params);
	}
	if (process.env.VERCEL) throw new Error("DATABASE_URL이 없습니다 — Vercel 프로젝트 Storage에서 Neon DB를 연결해 주세요.");
	// 로컬: 내장 Postgres (개발 서버를 다시 켜도 data/pglite에 남음)
	const { PGlite } = await import("@electric-sql/pglite");
	const path = await import("node:path");
	const db = await PGlite.create(path.join(process.cwd(), "data", "pglite"));
	return async (text, params) => (await db.query(text, params)).rows;
}

async function ready() {
	g.ready ??= (async () => {
		g.run = await connect();
		for (const s of SCHEMA) await g.run(s);
	})().catch((e) => {
		g.ready = null; // 실패하면 다음 요청에서 다시 시도
		throw e;
	});
	await g.ready;
	return g.run;
}

// 텍스트 + 매개변수($1, $2 …)로 실행
export async function query(text, params = []) {
	return (await ready())(text, params);
}

// 태그 템플릿: 값은 모두 매개변수로 넘어가 SQL 삽입 걱정 없음
export function sql(strings, ...values) {
	const text = strings.reduce((a, s, i) => a + "$" + i + s);
	return query(text, values);
}

export const usingLocalDb = !DB_URL;
