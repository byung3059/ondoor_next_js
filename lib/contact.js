// 상담 폼 서버 쪽 공용 (서명 · 토큰 · IP) — 서버에서만 불러옴
// Vercel은 요청마다 다른 서버(인스턴스)가 받을 수 있어서 서버 메모리에 기억하지 않고,
// 서명(HMAC)으로 위조를 막고 한 번만 써야 하는 것은 DB(used_tokens)에 기록함
import "server-only";
import { sign, signOk } from "./secret";

export { contactJobs, contactBudgets } from "./contact-options";
export { sign, signOk };

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
