import { redirect } from "next/navigation";
import { endSession } from "@/lib/admin-auth";

// 로그아웃 (내 정보 메뉴의 링크) — 쿠키를 지우고 로그인 화면으로
export async function GET() {
	await endSession();
	redirect("/admin/login");
}
