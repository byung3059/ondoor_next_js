// 상담 폼 서버 쪽 공용 (서명 · 토큰 · IP) — 서버에서만 불러옴
// Vercel은 요청마다 다른 서버(인스턴스)가 받을 수 있어서 서버 메모리에 기억하지 않고,
// 서명(HMAC)으로 위조를 막고 한 번만 써야 하는 것은 DB(used_tokens)에 기록함
import "server-only";
import crypto from "node:crypto";

export { contactJobs, contactBudgets } from "./contact-options";

// 서명 키: CONTACT_SECRET (Vercel 환경 변수) — 없으면 DB 주소에서 만들고, 그것도 없으면(로컬) 고정값
const SECRET = process.env.CONTACT_SECRET || crypto.createHash("sha256").update(`ondoor:${process.env.DATABASE_URL || process.env.POSTGRES_URL || "local-dev"}`).digest("hex");

export const sign = (v, len = 32) => crypto.createHmac("sha256", SECRET).update(String(v)).digest("hex").slice(0, len);

// 서명이 맞는지 (길이가 달라도 예외 없이 false)
export function signOk(v, s, len = 32) {
	const a = Buffer.from(sign(v, len)),
		b = Buffer.from(String(s || ""));
	return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// 스팸 방지: 폼 토큰 = 폼을 보여 준 시각 + 서명 (원본은 세션의 ss_contact_token · ss_contact_time)
export function createFormToken() {
	const t = String(Date.now());
	return `${t}.${sign(t)}`;
}

// 토큰이 맞으면 폼을 보여 준 시각(ms), 아니면 0
export function readFormToken(token) {
	const [t, s] = String(token || "").split(".");
	return t && signOk(t, s) ? Number(t) : 0;
}

export function clientIp(req) {
	const xf = req.headers.get("x-forwarded-for");
	return ((xf ? xf.split(",")[0] : req.headers.get("x-real-ip")) || "127.0.0.1").trim();
}
