import { redirect } from "next/navigation";
import LoginForm from "@/components/admin/LoginForm";
import { isAdmin } from "@/lib/admin-auth";
import { adminPassword, DEV_PASSWORD } from "@/lib/admin-session";

export const metadata = { title: "로그인" };

export default async function AdminLogin({ searchParams }) {
	const { next } = await searchParams;
	if (await isAdmin()) redirect("/admin");
	// 로컬 개발에서 ADMIN_PASSWORD 없이 실행하면 기본 비밀번호 안내
	const devHint = !process.env.ADMIN_PASSWORD && adminPassword() === DEV_PASSWORD ? DEV_PASSWORD : null;
	return (
		<main className="adm_login">
			<LoginForm next={typeof next === "string" ? next : ""} devHint={devHint} disabled={!adminPassword()} />
		</main>
	);
}
