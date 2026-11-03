// 서버 서명 키 — 상담 폼 토큰 · 자동등록방지 · 봇 기록 요청이 같이 씀 (proxy.js에서도 쓰므로 server-only 없이)
// CONTACT_SECRET (Vercel 환경 변수) — 없으면 DB 주소에서 만들고, 그것도 없으면(로컬) 고정값
import crypto from "node:crypto";

const SECRET = process.env.CONTACT_SECRET || crypto.createHash("sha256").update(`ondoor:${process.env.DATABASE_URL || process.env.POSTGRES_URL || "local-dev"}`).digest("hex");

export const sign = (v, len = 32) => crypto.createHmac("sha256", SECRET).update(String(v)).digest("hex").slice(0, len);

// 서명이 맞는지 (길이가 달라도 예외 없이 false)
export function signOk(v, s, len = 32) {
	const a = Buffer.from(sign(v, len)),
		b = Buffer.from(String(s || ""));
	return a.length === b.length && crypto.timingSafeEqual(a, b);
}
