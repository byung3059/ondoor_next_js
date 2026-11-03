import { NextResponse } from "next/server";
import { SESSION_COOKIE, sessionValid } from "@/lib/admin-session";

/* 요청 앞단 확인 (Next.js 16 Proxy — 예전 이름 middleware)
   /admin 아래는 로그인 쿠키가 없거나 잘못됐으면 로그인 화면으로 (로그인 화면 자체는 제외)
   실제 권한 확인은 각 화면 · 동작에서 다시 함 (lib/admin-auth.js) */
export function proxy(req) {
	const { pathname, search } = req.nextUrl;
	if (pathname === "/admin/login") return NextResponse.next();
	if (sessionValid(req.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.next();
	const url = new URL("/admin/login", req.url);
	if (pathname !== "/admin") url.searchParams.set("next", pathname + search);
	return NextResponse.redirect(url);
}

export const config = {
	matcher: ["/admin", "/admin/:path*"],
};
