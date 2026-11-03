import "./admin.css";

export const metadata = {
	title: { template: "%s | ondoor 관리자", default: "ondoor 관리자" },
	robots: { index: false, follow: false },
};

// 관리자 화면 틀 — 사이트 헤더 · 푸터 · 애니메이션 없이 따로 (사이트는 app/(site)/layout.js)
export default function AdminLayout({ children }) {
	return <div className="adm">{children}</div>;
}
