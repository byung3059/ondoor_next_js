import crypto from "node:crypto";
import { after } from "next/server";
import { cookies } from "next/headers";
import { clientIp } from "@/lib/contact";
import { signOk } from "@/lib/secret";
import { botOf } from "@/lib/bots";
import { recordBot, recordPageView, recordVisit } from "@/lib/track";

/* 방문 기록 받기 — 응답은 바로 보내고 저장은 그 뒤에 (방문자가 기다리지 않게)
   - 사이트(Tracker): { p: 주소, t: 제목, r: 들어온 곳 } → 방문자 쿠키(od_vid, 1년) · 방문 쿠키(od_sid, 브라우저를 닫으면 사라짐)
     od_sid가 없으면 새 방문 1건, 매번 페이지 조회 1건
   - 봇(proxy.js): x-od-bot 서명 머리글로 확인 → 봇 방문 1건 */
const id = () => crypto.randomBytes(12).toString("hex");
const done = () => new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });

export async function POST(req) {
	let body = {};
	try {
		body = await req.json();
	} catch {}
	const path = typeof body.p === "string" && body.p.startsWith("/") ? body.p : "";
	if (!path || path.startsWith("/admin") || path.startsWith("/api")) return done();
	const ip = clientIp(req);
	const selfHost = new URL(req.url).hostname;
	const ref = typeof body.r === "string" ? body.r : "";

	// 봇 (proxy.js가 보냄)
	const botSig = req.headers.get("x-od-bot");
	if (botSig) {
		const ua = req.headers.get("x-od-ua") || "";
		if (signOk(`bot|${ua}|${path}`, botSig)) after(() => recordBot({ ip: req.headers.get("x-od-ip") || ip, ua, path, ref, selfHost }).catch(console.error));
		return done();
	}

	const ua = req.headers.get("user-agent") || "";
	if (botOf(ua)) return done(); // 스크립트를 실행하는 봇은 proxy.js가 이미 기록함

	const jar = await cookies();
	let vid = jar.get("od_vid")?.value;
	let sid = jar.get("od_sid")?.value;
	const opts = { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" };
	if (!vid || !/^[a-f0-9]{24}$/.test(vid)) {
		vid = id();
		jar.set("od_vid", vid, { ...opts, maxAge: 365 * 86400 });
	}
	const isNew = !sid || !/^[a-f0-9]{24}$/.test(sid);
	if (isNew) {
		sid = id();
		jar.set("od_sid", sid, opts); // 만료 없음 = 브라우저를 닫으면 사라짐 (그누보드와 같은 '브라우저 세션당 1건')
	}
	const title = typeof body.t === "string" ? body.t : "";
	after(async () => {
		try {
			if (isNew) await recordVisit({ vid, sid, ip, ua, landing: path, ref, selfHost });
			await recordPageView({ sid, path, title });
		} catch (e) {
			console.error("방문 기록 실패", e);
		}
	});
	return done();
}
