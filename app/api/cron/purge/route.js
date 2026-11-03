import { purgeExpired } from "@/lib/contacts";

/* 보관 기간이 지난 상담 문의 자동 삭제 — Vercel Cron이 매일 부름 (vercel.json)
   개인정보처리방침: 상담이 끝난 날로부터 1년 보관 후 파기
   Vercel이 Authorization: Bearer CRON_SECRET 을 붙여 보냄 → 다른 곳에서 부르면 거절 */
export async function GET(req) {
	const secret = process.env.CRON_SECRET;
	if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return new Response("Unauthorized", { status: 401 });
	const deleted = await purgeExpired();
	return Response.json({ ok: true, deleted });
}
