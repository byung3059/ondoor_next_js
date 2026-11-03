import Link from "next/link";
import { logout } from "@/app/admin/actions";
import { usingLocalDb } from "@/lib/db";

// 관리자 화면 머리: 로고 · 메뉴 · 사이트 보기 · 로그아웃
export default function AdminHeader({ current = "contacts" }) {
	return (
		<header className="adm_hd">
			<Link href="/admin" className="adm_logo">
				ondoor<small>관리자</small>
			</Link>
			<nav className="adm_nav">
				<Link href="/admin" className={current === "contacts" ? "is-on" : undefined}>
					상담 문의
				</Link>
			</nav>
			<div className="adm_hd_r">
				{usingLocalDb && <span className="adm_who">로컬 DB</span>}
				<a href="/" target="_blank" rel="noopener">
					사이트 보기
				</a>
				<form action={logout}>
					<button type="submit" className="adm_btn is-sm">
						로그아웃
					</button>
				</form>
			</div>
		</header>
	);
}
