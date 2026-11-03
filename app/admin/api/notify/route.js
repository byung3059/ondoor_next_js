import { isAdmin } from "@/lib/admin-auth";
import { notifications } from "@/lib/dashboard";

// 알림 패널 자료: 새 상담 문의 수 · 목록
export async function GET() {
	if (!(await isAdmin())) return new Response("Unauthorized", { status: 401 });
	return Response.json(await notifications(), { headers: { "Cache-Control": "no-store" } });
}
