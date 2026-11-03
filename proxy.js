import { NextResponse } from "next/server";
import { SESSION_COOKIE, sessionValid } from "@/lib/admin-session";
import { botOf } from "@/lib/bots";
import { sign } from "@/lib/secret";

/* 요청 앞단 (Next.js 16 Proxy — 예전 이름 middleware)
   1) /admin 아래: 로그인 쿠키가 없거나 잘못됐으면 로그인 화면으로 (로그인 화면 자체는 제외)
      실제 권한 확인은 각 화면 · 동작에서 다시 함 (lib/admin-auth.js)
   2) 사이트 페이지: AI · 검색 봇이면 방문 기록 (봇은 스크립트를 실행하지 않아 Tracker가 알리지 못함)
      응답을 늦추지 않도록 기록 요청은 응답 뒤에 (waitUntil) */
export function proxy(req, event) {
	const { pathname, search } = req.nextUrl;

	if (pathname === "/admin" || pathname.startsWith("/admin/")) {
		if (pathname === "/admin/login") return NextResponse.next();
		if (sessionValid(req.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.next();
		// 화면이 아니라 데이터 요청(/admin/api, 내려받기)이면 401
		if (pathname.startsWith("/admin/api/") || pathname === "/admin/export") return new NextResponse("Unauthorized", { status: 401 });
		const url = new URL("/admin/login", req.url);
		if (pathname !== "/admin") url.searchParams.set("next", pathname + search);
		return NextResponse.redirect(url);
	}

	const ua = req.headers.get("user-agent") || "";
	if (req.method === "GET" && botOf(ua)) {
		event.waitUntil(
			fetch(new URL("/api/track", req.url), {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"x-od-bot": sign(`bot|${ua}|${pathname}`),
					"x-od-ua": ua,
					"x-od-ip": (req.headers.get("x-forwarded-for") || "").split(",")[0].trim(),
				},
				body: JSON.stringify({ p: pathname, r: req.headers.get("referer") || "" }),
			}).catch(() => {}),
		);
	}
	return NextResponse.next();
}

export const config = {
	matcher: ["/", "/page/:path*", "/admin", "/admin/:path*"],
};
