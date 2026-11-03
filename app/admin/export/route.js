import { isAdmin } from "@/lib/admin-auth";
import { exportContacts, STATUS } from "@/lib/contacts";
import { formatDateTime } from "@/lib/format";

// CSV 내려받기 — 목록과 같은 조건(상태 · 검색어), 엑셀에서 한글이 깨지지 않게 BOM을 붙임
export async function GET(req) {
	if (!(await isAdmin())) return new Response("Unauthorized", { status: 401 });
	const sp = new URL(req.url).searchParams;
	const rows = await exportContacts({ status: STATUS[sp.get("status")] ? sp.get("status") : "", q: (sp.get("q") || "").slice(0, 50) });

	const cell = (v) => {
		let s = String(v ?? "");
		if (/^[=+\-@]/.test(s)) s = "'" + s; // 엑셀 수식으로 실행되지 않게
		return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
	};
	const head = ["번호", "접수일시", "상태", "구분", "이름", "연락처", "직종", "예산", "문의내용", "메모", "완료일시", "IP"];
	const lines = rows.map((r) =>
		[r.id, formatDateTime(r.created_at), STATUS[r.status] || r.status, r.quick ? "빠른 상담" : "상담", r.name, r.tel, r.job, r.budget, r.content, r.memo, r.done_at ? formatDateTime(r.done_at) : "", r.ip]
			.map(cell)
			.join(","),
	);
	const today = formatDateTime(new Date()).slice(0, 10).replace(/\./g, "");
	return new Response("﻿" + [head.join(","), ...lines].join("\r\n"), {
		headers: {
			"Content-Type": "text/csv; charset=utf-8",
			"Content-Disposition": `attachment; filename="ondoor-contacts-${today}.csv"`,
			"Cache-Control": "no-store",
		},
	});
}
