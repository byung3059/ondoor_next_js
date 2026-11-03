// 관리자 로그인 쿠키 — 만료시각.서명 (서버가 기억하지 않음, 비밀번호를 바꾸면 기존 로그인은 모두 풀림)
// proxy.js(요청 앞단)와 서버 컴포넌트 · Server Action이 같이 씀
import crypto from "node:crypto";

export const SESSION_COOKIE = "od_admin";
export const SESSION_DAYS = 7;

// 관리자 비밀번호: Vercel 환경 변수 ADMIN_PASSWORD — 로컬 개발에서만 없으면 기본값
export const DEV_PASSWORD = "ondoor-admin";
export function adminPassword() {
	if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
	return process.env.VERCEL || process.env.NODE_ENV === "production" ? null : DEV_PASSWORD;
}

const key = () =>
	crypto
		.createHash("sha256")
		.update(`admin|${process.env.CONTACT_SECRET || process.env.DATABASE_URL || process.env.POSTGRES_URL || "local-dev"}|${adminPassword() || ""}`)
		.digest();
const mac = (v) => crypto.createHmac("sha256", key()).update(v).digest("hex");

export function createSessionValue() {
	const exp = Date.now() + SESSION_DAYS * 864e5;
	return `${exp}.${mac(`s|${exp}`)}`;
}

export function sessionValid(value) {
	if (!adminPassword()) return false;
	const m = /^(\d{13})\.([a-f0-9]{64})$/.exec(String(value || ""));
	if (!m || Number(m[1]) < Date.now()) return false;
	const a = Buffer.from(mac(`s|${m[1]}`)),
		b = Buffer.from(m[2]);
	return crypto.timingSafeEqual(a, b);
}

// 비밀번호 비교 (길이가 달라도 같은 시간)
export function passwordOk(input) {
	const pw = adminPassword();
	if (!pw) return false;
	const h = (s) => crypto.createHash("sha256").update(String(s)).digest();
	return crypto.timingSafeEqual(h(input), h(pw));
}
