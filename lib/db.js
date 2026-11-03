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
