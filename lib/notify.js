// 새 상담 알림 메일 (Resend) — RESEND_API_KEY · NOTIFY_EMAIL이 있을 때만 보냄, 실패해도 접수에는 영향 없음
// 보내는 주소: NOTIFY_FROM (Resend에서 인증한 도메인 주소) — 없으면 Resend 테스트 주소(계정 주인에게만 보낼 수 있음)
import "server-only";
import { SITE_URL } from "./site";

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

export async function notifyNewContact(c) {
	const key = process.env.RESEND_API_KEY,
		to = process.env.NOTIFY_EMAIL;
	if (!key || !to) return;
	const base = (process.env.ADMIN_URL || SITE_URL).replace(/\/$/, "");
	const rows = [
		["이름", c.name],
		["연락처", c.tel],
		["직종", c.job || "-"],
		["예산", c.budget || "-"],
	]
		.map(([k, v]) => `<tr><th align="left" style="padding:4px 12px 4px 0;color:#888">${k}</th><td>${esc(v)}</td></tr>`)
		.join("");
	const html = `<div style="font-family:sans-serif;font-size:14px;color:#222">
		<p><b>${c.quick ? "빠른 상담" : "상담"} 문의가 들어왔습니다.</b></p>
		<table>${rows}</table>
		<p style="white-space:pre-wrap;background:#f6f6f6;padding:12px;border-radius:8px">${esc(c.content)}</p>
		<p><a href="${base}/admin/contacts/${c.id}">관리자 화면에서 보기</a></p></div>`;
	try {
		await fetch("https://api.resend.com/emails", {
			method: "POST",
			headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
			body: JSON.stringify({
				from: process.env.NOTIFY_FROM || "Ondoor <onboarding@resend.dev>",
				to: to.split(",").map((s) => s.trim()),
				subject: `[상담 문의] ${c.name} · ${c.quick ? "빠른 상담" : `${c.job} · ${c.budget}`}`,
				html,
			}),
		});
	} catch (e) {
		console.error("알림 메일 실패", e);
	}
}
