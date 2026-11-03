// 관리자 확인 — 관리자 화면(서버 컴포넌트) · Server Action · 내려받기 라우트에서 매번 확인
// (proxy.js는 앞단에서 로그인 화면으로 돌려보내는 빠른 확인일 뿐이라, 실제 데이터를 다루는 곳에서 다시 확인)
import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, SESSION_DAYS, createSessionValue, sessionValid } from "./admin-session";

export async function isAdmin() {
	return sessionValid((await cookies()).get(SESSION_COOKIE)?.value);
}

export async function requireAdmin() {
	if (!(await isAdmin())) redirect("/admin/login");
}

export async function startSession() {
	(await cookies()).set(SESSION_COOKIE, createSessionValue(), {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		path: "/",
		maxAge: SESSION_DAYS * 86400,
	});
}

export async function endSession() {
	(await cookies()).delete(SESSION_COOKIE);
}
