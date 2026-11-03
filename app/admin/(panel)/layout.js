import { Suspense } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/admin-auth";

// 로그인한 관리자 화면 공통 틀: 좌측 메뉴 · 모바일 상단 바 · 알림 · 내 정보 (로그인 화면은 이 틀 밖)
export default async function PanelLayout({ children }) {
	await requireAdmin();
	return (
		<Suspense>
			<AdminShell>{children}</AdminShell>
		</Suspense>
	);
}
