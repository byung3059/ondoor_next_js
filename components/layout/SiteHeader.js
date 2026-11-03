"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import LogoTxt from "./LogoTxt";
import MenuTxt from "./MenuTxt";
import RollText from "./RollText";
import { goTo, posOf, SECTION_KEYS } from "@/lib/fx/nav";
import { useEdgeOff } from "@/lib/header-store";

const MENU = [
	{ key: "ondoor", href: "/#ondoor", label: "Ondoor" },
	{ href: "/page/ondoor", label: "About Us" }, // 회사소개
	{ key: "weare", href: "/#weare", label: "We Are" },
];

// 헤더 로고 색: 흰 배경 구간([data-hd-light])이 헤더 가운데 높이에 걸리면 .is-light (로고 #444)
// 메인 · 검정 구간이 섞인 회사소개는 스크롤 위치로, 나머지 페이지는 배경이 흰색이라 항상
const autoLight = (path) => path === "/" || path === "/page/ondoor";

/* 헤더 (원본: head.php + js/layout.js 메뉴 · 로고 색)
   [MENU] → 버튼 아래로 카드 3장이 차례로 내려옴 (html.is-menu, 스타일은 scss/layout.scss)
   메뉴 카드는 지금 보고 있는 위치에 점(.is-current), 바깥을 누르거나 Esc로 닫힘
   메인: 메뉴를 누르면 닫고 그 위치로 바로 이동 / 다른 페이지: /#weare 등으로 이동 → 메인 인트로가 끝나면 그 위치로 (Home) */
export default function SiteHeader({ title, blogUrl }) {
	const pathname = usePathname();
	const isMain = pathname === "/";
	const [light, setLight] = useState(!autoLight(pathname));
	const edgeOff = useEdgeOff();
	const [open, setOpen] = useState(false);
	const [gnbHidden, setGnbHidden] = useState(true);
	const [current, setCurrent] = useState("");
	const hdRef = useRef(null);
	const gnbRef = useRef(null);
	const btnRef = useRef(null);
	const timer = useRef(0);

	// 아이폰 사파리: 고정 헤더의 글자를 다시 그리지 않는 문제 → 한 번 다시 그리게 함
	const repaint = (el) => {
		if (!el) return;
		el.style.opacity = "0.999";
		requestAnimationFrame(() => requestAnimationFrame(() => (el.style.opacity = "")));
	};

	const openRef = useRef(false);

	const menuOpen = useCallback(() => {
		clearTimeout(timer.current);
		// 지금 보고 있는 위치 → 메뉴 카드의 점 (메인만)
		let cur = "";
		if (isMain) {
			const y = window.scrollY + 4;
			SECTION_KEYS.forEach((k) => posOf(k) <= y && (cur = k));
		}
		setCurrent(cur);
		document.documentElement.classList.remove("is-menu-out");
		openRef.current = true;
		setGnbHidden(false);
		setOpen(true);
	}, [isMain]);

	const menuClose = useCallback((focusBtn) => {
		if (!openRef.current) return;
		openRef.current = false;
		const root = document.documentElement;
		root.classList.add("is-menu-out"); // 닫히는 동안 로고 · MENU 글자색을 검정 화면과 같이 (layout.scss)
		setOpen(false);
		clearTimeout(timer.current);
		timer.current = setTimeout(() => {
			setGnbHidden(true); // 닫히는 애니메이션 뒤
			root.classList.remove("is-menu-out");
			repaint(btnRef.current);
		}, 520); // MENU 글자가 다시 내려오는 0.5초 뒤
		if (focusBtn) btnRef.current?.focus();
	}, []);

	// html.is-menu: hidden을 푼 다음 프레임에 붙여야 나타나는 애니메이션이 보임
	useLayoutEffect(() => {
		const root = document.documentElement;
		if (open) {
			void gnbRef.current?.offsetWidth;
			root.classList.add("is-menu");
		} else root.classList.remove("is-menu");
	}, [open]);

	// 바깥을 누르거나 Esc → 닫힘, 페이지가 바뀌면 닫힘
	useEffect(() => {
		const onDoc = (e) => {
			if (!document.documentElement.classList.contains("is-menu")) return;
			if (!gnbRef.current?.contains(e.target) && !btnRef.current?.contains(e.target)) menuClose(false);
		};
		const onKey = (e) => e.key === "Escape" && menuClose(true);
		const onShow = (e) => e.persisted && repaint(btnRef.current); // 뒤로 가기(bfcache)
		const onVV = () => repaint(btnRef.current); // 주소창이 접히고 펴질 때
		document.addEventListener("click", onDoc);
		document.addEventListener("keydown", onKey);
		addEventListener("pageshow", onShow);
		window.visualViewport?.addEventListener("resize", onVV);
		return () => {
			document.removeEventListener("click", onDoc);
			document.removeEventListener("keydown", onKey);
			removeEventListener("pageshow", onShow);
			window.visualViewport?.removeEventListener("resize", onVV);
			clearTimeout(timer.current);
		};
	}, [menuClose]);
	useEffect(() => {
		menuClose(false);
	}, [pathname, menuClose]);

	// 로고 색
	useLayoutEffect(() => {
		if (!autoLight(pathname)) return setLight(true);
		const hd = hdRef.current;
		let ticking = false;
		const check = () => {
			ticking = false;
			const y = hd.offsetHeight / 2;
			let on = false;
			document.querySelectorAll("[data-hd-light]").forEach((el) => {
				const r = el.getBoundingClientRect();
				if (r.top <= y && r.bottom >= y) on = true;
			});
			setLight(on);
		};
		const onScroll = () => {
			if (ticking) return;
			ticking = true;
			requestAnimationFrame(check); // 한 프레임에 한 번
		};
		addEventListener("scroll", onScroll, { passive: true });
		addEventListener("resize", onScroll);
		check();
		return () => {
			removeEventListener("scroll", onScroll);
			removeEventListener("resize", onScroll);
		};
	}, [pathname]);

	// 메인에선 누른 위치로 바로 이동 (다른 페이지에선 링크대로 메인으로)
	const onGo = (key) => (e) => {
		if (!isMain) return;
		e.preventDefault();
		menuClose(false);
		goTo(key);
	};

	const cls = [light && "is-light", edgeOff && "is-edge-off"].filter(Boolean).join(" ") || undefined;

	return (
		<header id="hd" className={cls} ref={hdRef}>
			<span className="hd_edge" aria-hidden="true"></span>
			<Link href="/" className="hd_logo" aria-label={`${title} 홈으로`}>
				<LogoTxt />
			</Link>
			<button
				type="button"
				className="hd_menu"
				aria-expanded={open}
				aria-controls="gnb"
				aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
				ref={btnRef}
				onClick={() => (open ? menuClose(false) : menuOpen())}
			>
				<span className="hd_menu_txt">
					<MenuTxt />
				</span>
			</button>

			<nav id="gnb" className="gnb" aria-label="주 메뉴" hidden={gnbHidden} ref={gnbRef}>
				<div className="gnb_card gnb_menu">
					<ul>
						{MENU.map((m) => (
							<li key={m.label} className={m.key && m.key === current ? "is-current" : undefined}>
								<Link href={m.href} data-go={m.key} onClick={m.key ? onGo(m.key) : undefined}>
									<RollText text={m.label} />
								</Link>
							</li>
						))}
					</ul>
				</div>

				{/* 블로그: 워드프레스(/blog/) — 이 프로젝트엔 없어서 실제 사이트로 */}
				<a href={blogUrl} className="gnb_card gnb_link gnb_blog">
					<span className="gnb_link_txt">
						<RollText as="b" text="Blog" />
						<small>인사이트 · 칼럼</small>
					</span>
					<i aria-hidden="true"></i>
				</a>

				<Link href="/page/contact" className="gnb_card gnb_link gnb_contact">
					<span className="gnb_link_txt">
						<RollText as="b" text="Contact" />
						<small>프로젝트 상담 문의</small>
					</span>
					<i aria-hidden="true"></i>
				</Link>
			</nav>
		</header>
	);
}
