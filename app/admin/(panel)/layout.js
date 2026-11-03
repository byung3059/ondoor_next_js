import AdminShell from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/admin-auth";

// 로그인한 관리자 화면 공통 틀: 좌측 메뉴 · 모바일 상단 바 · 알림 · 내 정보 (로그인 화면은 이 틀 밖)
// 로그인 쿠키를 읽어 늘 요청마다 그리므로(동적) AdminShell의 useSearchParams에 Suspense가 필요 없음
export default async function PanelLayout({ children }) {
	await requireAdmin();
	return <AdminShell>{children}</AdminShell>;
}
