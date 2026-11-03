"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin, startSession } from "@/lib/admin-auth";
import { adminPassword, passwordOk } from "@/lib/admin-session";
import { deleteContact, updateContact } from "@/lib/contacts";
import { recordAdminLogin, requestIp } from "@/lib/dashboard";

// 비밀번호를 연달아 틀리면 잠시 막음 (같은 IP 10분에 10번 — 서버 인스턴스마다 따로 셈)
const fails = (globalThis.__ondoorLoginFails ??= new Map());
const safeNext = (n) => (typeof n === "string" && /^\/admin(\/|$|\?)/.test(n) ? n : "/admin");

export async function login(_prev, formData) {
	if (!adminPassword()) return { error: "관리자 비밀번호(ADMIN_PASSWORD)가 설정되지 않았습니다. Vercel 환경 변수에 넣어 주세요." };
	const ip = requestIp(await headers());
	const now = Date.now();
	const f = fails.get(ip);
	if (f && now - f.t < 600_000 && f.n >= 10) return { error: "여러 번 틀려서 잠시 막았습니다. 10분 뒤 다시 시도해 주세요." };

	if (!passwordOk(formData.get("password") || "")) {
		fails.set(ip, f && now - f.t < 600_000 ? { n: f.n + 1, t: f.t } : { n: 1, t: now });
		await new Promise((r) => setTimeout(r, 800)); // 대입 공격을 느리게
		return { error: "비밀번호가 맞지 않습니다." };
	}
	fails.delete(ip);
	await startSession();
	await recordAdminLogin(ip).catch(() => {}); // 대시보드의 '금일 첫 접속'
	redirect(safeNext(formData.get("next")));
}

export async function saveContact(formData) {
	await requireAdmin();
	const id = Number(formData.get("id"));
	await updateContact(id, {
		status: String(formData.get("status") || "new"),
		memo: String(formData.get("memo") || "").slice(0, 5000),
	});
	revalidatePath("/admin", "layout");
	redirect(`/admin/contacts/${id}?saved=1`);
}

export async function removeContact(formData) {
	await requireAdmin();
	await deleteContact(Number(formData.get("id")));
	revalidatePath("/admin", "layout");
	redirect("/admin/contacts?deleted=1");
}
