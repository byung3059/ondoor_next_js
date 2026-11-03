"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Icon from "./Icon";
import NotifyPanel from "./NotifyPanel";
import useRailPanel from "./useRailPanel";
import { MENU } from "@/lib/admin-menu";

const BP_MD = 960,
	BP_SM = 640;
const STORE_PANEL = "adm_theme_panel",
	STORE_MODE = "adm_theme_mode";
const mq = (px) => typeof window !== "undefined" && matchMedia(`(max-width: ${px}px)`).matches;

// 지금 주소가 속한 메뉴 그룹 · 항목
const groupOf = (path) => (path.startsWith("/admin/contacts") ? "contact" : null);
const itemOn = (href, path, search) => {
	if (!href.startsWith("/admin")) return false;
	const [p, q = ""] = href.split("?");
	const status = new URLSearchParams(search).get("status") || "";
	return p === path && q === (status ? `status=${status}` : "");
};

/* 관리자 화면 틀 (원본: extend/adm_theme/js/adm_theme.js의 좌측 메뉴 · 상단 바 · 화면 모드 · 내 정보)
   - 좌측 아이콘 메뉴(#gnb) + 하위 메뉴 패널: 데스크톱은 항상 열려 있고 아이콘을 누르면 그 그룹으로 바뀜
   - 태블릿(~960px): 아이콘을 누르면 패널이 본문 위에 열림 / 모바일(~640px): 상단 바의 메뉴 버튼으로 서랍처럼 (html.adm-nav-open)
   - 하단 도구: 알림(새 상담 문의) · 홈페이지 · 화면 모드 · 내 정보 — 모바일에서는 상단 바로 옮김 */
export default function AdminShell({ children }) {
	const pathname = usePathname();
	const search = useSearchParams().toString();
	const isDashboard = pathname === "/admin";
	const current = groupOf(pathname);
	const [open, setOpen] = useState(current || MENU[0].key);
	const [navOpen, setNavOpen] = useState(false);
	const [mobile, setMobile] = useState(false);
	const [mode, setMode] = useState("light");
	const [profile, setProfile] = useState(false);
	const [notify, setNotify] = useState(false);
	const [count, setCount] = useState(0);

	// 처음: 화면 모드 · 마지막으로 연 그룹 · 입장 애니메이션
	useEffect(() => {
		const root = document.documentElement;
		setMode(root.getAttribute("data-theme") === "dark" ? "dark" : "light");
		if (!current) {
			try {
				const saved = localStorage.getItem(STORE_PANEL);
				if (saved && MENU.some((g) => g.key === saved)) setOpen(saved);
			} catch {}
		}
		root.classList.add("adm-theme-enter");
		const sm = matchMedia(`(max-width: ${BP_SM}px)`),
			md = matchMedia(`(max-width: ${BP_MD}px)`);
		const onSm = () => setMobile(sm.matches);
		const onMd = () => !md.matches && setNavOpen(false);
		onSm();
		sm.addEventListener("change", onSm);
		md.addEventListener("change", onMd);
		return () => {
			sm.removeEventListener("change", onSm);
			md.removeEventListener("change", onMd);
			root.classList.remove("adm-theme-enter", "adm-nav-open");
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// 페이지가 바뀌면: 지금 그룹을 열고, 태블릿 · 모바일 메뉴는 닫음
	useEffect(() => {
		if (current) setOpen(current);
		setNavOpen(false);
		setProfile(false);
	}, [pathname, current]);

	useEffect(() => {
		document.documentElement.classList.toggle("adm-nav-open", navOpen);
	}, [navOpen]);

	const openGroup = (key) => {
		setProfile(false);
		setNotify(false);
		if (mq(BP_MD) && !mq(BP_SM) && navOpen && open === key) return setNavOpen(false); // 태블릿: 같은 아이콘을 다시 누르면 닫힘
		setOpen(key);
		try {
			localStorage.setItem(STORE_PANEL, key);
		} catch {}
		if (mq(BP_MD)) setNavOpen(true);
	};

	const toggleMode = () => {
		const next = mode === "dark" ? "light" : "dark";
		document.documentElement.setAttribute("data-theme", next);
		try {
			localStorage.setItem(STORE_MODE, next);
		} catch {}
		setMode(next);
	};

	// 바깥을 누르거나 Esc → 내 정보 · 알림 · 메뉴 닫힘
	useEffect(() => {
		const onDoc = (e) => {
			if (!e.target.closest(".adm_popover, .adm_notify, [aria-controls]")) {
				setProfile(false);
				setNotify(false);
			}
		};
		const onKey = (e) => {
			if (e.key !== "Escape") return;
			setProfile(false);
			setNotify(false);
			setNavOpen(false);
		};
		document.addEventListener("click", onDoc);
		document.addEventListener("keydown", onKey);
		return () => {
			document.removeEventListener("click", onDoc);
			document.removeEventListener("keydown", onKey);
		};
	}, []);

	const closeAll = useCallback(() => {
		setProfile(false);
		setNotify(false);
		setNavOpen(false);
	}, []);

	const tools = (
		<ul className="adm_rail_tools">
			<li className="adm_rail_tool_item">
				<button
					type="button"
					className="adm_rail_tool"
					id="adm_notify_btn"
					aria-controls="adm_notify"
					aria-expanded={notify}
					title="알림"
					onClick={(e) => {
						e.stopPropagation();
						setProfile(false);
						setNotify((v) => !v);
					}}
				>
					<Icon name="notifications" />
					{count > 0 && <span className="adm_count">{count > 99 ? "99+" : count}</span>}
					<span className="sound_only">알림</span>
				</button>
			</li>
			<li className="adm_rail_tool_item">
				<a href="/" className="adm_rail_tool" target="_blank" rel="noopener" title="홈페이지 바로가기">
					<Icon name="public" />
					<span className="sound_only">홈페이지 바로가기</span>
				</a>
			</li>
			<li className="adm_rail_tool_item">
				<button type="button" className="adm_rail_tool" id="adm_mode_btn" title={mode === "dark" ? "라이트 모드" : "다크 모드"} onClick={toggleMode}>
					<Icon name={mode === "dark" ? "light_mode" : "dark_mode"} />
					<span className="sound_only">{mode === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"}</span>
				</button>
			</li>
			<li className="adm_rail_tool_item">
				<button
					type="button"
					className="adm_rail_tool adm_rail_avatar"
					aria-controls="adm_profile_menu"
					aria-expanded={profile}
					title="관리자"
					onClick={(e) => {
						e.stopPropagation();
						setNotify(false);
						setProfile((v) => !v);
					}}
				>
					<Icon name="account_circle" />
					<span className="sound_only">내 정보</span>
				</button>
			</li>
		</ul>
	);

	return (
		<div id="wrapper">
			{/* 모바일 상단 바: [메뉴] … [알림 · 홈페이지 · 화면 모드 · 내 정보] */}
			<div className="adm_topbar">
				<button
					type="button"
					className="adm_topbar_btn"
					id="adm_nav_btn"
					aria-controls="gnb"
					aria-expanded={navOpen}
					title={navOpen ? "메뉴 닫기" : "메뉴 열기"}
					onClick={(e) => {
						e.stopPropagation();
						setProfile(false);
						setNotify(false);
						setNavOpen((v) => !v);
					}}
				>
					<Icon name="menu" />
					<span className="sound_only">메뉴</span>
				</button>
				{mobile && tools}
			</div>

			<nav id="gnb" aria-label="관리자 메뉴">
				<ul className="gnb_ul">
					<li className={`gnb_li adm_rail_home${isDashboard ? " is-current" : ""}`}>
						<Link href="/admin" className="btn_op" title="대시보드" aria-label="대시보드">
							<Icon name="home" />
						</Link>
					</li>
					{MENU.map((g) => (
						<li key={g.key} className={["gnb_li", open === g.key && "is-open", current === g.key && "is-current"].filter(Boolean).join(" ")}>
							<button type="button" className="btn_op" title={g.title} aria-label={g.title} aria-haspopup="true" aria-expanded={open === g.key} onClick={() => openGroup(g.key)}>
								<Icon name={g.icon} />
							</button>
							<div className="gnb_oparea_wr">
								<div className="gnb_oparea">
									<h3>{g.title}</h3>
									<ul>
										{g.items.map(([label, href, ext]) => (
											<li key={label}>
												{ext ? (
													<a href={href} target="_blank" rel="noopener">
														{label}
													</a>
												) : (
													<Link href={href} className={itemOn(href, pathname, search) ? "on" : undefined}>
														{label}
													</Link>
												)}
											</li>
										))}
									</ul>
								</div>
							</div>
						</li>
					))}
				</ul>
				{!mobile && tools}
			</nav>

			<div className="adm_nav_dim" aria-hidden="true" onClick={closeAll}></div>
			<button type="button" className="adm_nav_close" title="메뉴 닫기" onClick={closeAll}>
				<Icon name="close" />
				<span className="sound_only">메뉴 닫기</span>
			</button>

			<div id="container">
				{children}
				<footer id="ft">
					<p>
						Copyright &copy; <b>ondoor</b>. All rights reserved.
					</p>
				</footer>
			</div>

			<NotifyPanel open={notify} onClose={() => setNotify(false)} onCount={setCount} />
			<ProfileMenu open={profile} onClose={() => setProfile(false)} />
		</div>
	);
}

function ProfileMenu({ open, onClose }) {
	const { hidden, closing } = useRailPanel(open);
	return (
		<div className={`adm_popover adm_profile_menu${closing ? " is-closing" : ""}`} id="adm_profile_menu" hidden={hidden}>
			<div className="adm_profile_head">
				<div className="adm_profile_who">
					<strong>관리자</strong>
					<span>ondoor</span>
				</div>
				<button type="button" className="adm_icon_btn" title="닫기" onClick={onClose}>
					<Icon name="close" />
					<span className="sound_only">내 정보 닫기</span>
				</button>
			</div>
			<a href="/" target="_blank" rel="noopener">
				<Icon name="public" />
				홈페이지 보기
			</a>
			<a href="/admin/logout" className="is-danger">
				<Icon name="logout" />
				로그아웃
			</a>
		</div>
	);
}
