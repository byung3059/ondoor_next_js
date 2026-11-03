// 상담 폼 서버 쪽 공용 (토큰 · 메모리 · IP) — 서버에서만 불러옴
import "server-only";
import crypto from "node:crypto";

export { contactJobs, contactBudgets } from "./contact-options";

// 서버 메모리 (원본의 PHP 세션 대신) — 개발 서버가 코드를 다시 불러와도 유지되게 globalThis에 둠
export const mem = (globalThis.__ondoorMem ??= {
	secret: process.env.CONTACT_SECRET || crypto.randomBytes(32).toString("hex"),
	captcha: new Map(), // 문제 토큰 → { answer, time, ip, attempts }
	captchaOk: new Map(), // 통과 표시 → { time, ip }
	rate: new Map(), // IP → { n, t } (자동등록방지 1분 30번)
	lastSent: new Map(), // IP → 마지막 접수 시각 (30초 안에 다시 보내면 거부)
});

const sign = (v) => crypto.createHmac("sha256", mem.secret).update(v).digest("hex").slice(0, 32);

// 스팸 방지: 폼 토큰 = 폼을 보여 준 시각 + 서명 (원본은 세션의 ss_contact_token · ss_contact_time)
export function createFormToken() {
	const t = String(Date.now());
	return `${t}.${sign(t)}`;
}

// 토큰이 맞으면 폼을 보여 준 시각(ms), 아니면 0
export function readFormToken(token) {
	const [t, s] = String(token || "").split(".");
	if (!t || !s || s.length !== 32) return 0;
	const ok = crypto.timingSafeEqual(Buffer.from(sign(t)), Buffer.from(s));
	return ok ? Number(t) : 0;
}

export function clientIp(req) {
	const xf = req.headers.get("x-forwarded-for");
	return (xf ? xf.split(",")[0] : req.headers.get("x-real-ip")) || "127.0.0.1";
}
