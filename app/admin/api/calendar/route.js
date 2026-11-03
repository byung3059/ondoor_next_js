import { isAdmin } from "@/lib/admin-auth";
import { calendar } from "@/lib/dashboard";

// 대시보드 캘린더: 다른 달로 넘길 때 그 달의 날짜별 건수 (?ym=YYYY-MM)
export async function GET(req) {
	if (!(await isAdmin())) return new Response("Unauthorized", { status: 401 });
	const ym = new URL(req.url).searchParams.get("ym") || "";
	return Response.json(await calendar(ym), { headers: { "Cache-Control": "no-store" } });
}
