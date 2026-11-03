"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import IcoFigure from "./IcoFigure";

/* 오른쪽 아래 빠른 상담 문의칸 (.cw, 원본: tail.php + js/contact_form.js)
   버튼을 누르면 버튼 위로 상자가 오른쪽 아래를 기준으로 커지며 펼쳐짐 (채널톡처럼, 모양은 scss/layout.scss)
   html.is-cw: 열린 동안 (모바일은 화면 가득 — 뒤 페이지 터치 스크롤은 TouchScrollLock이 막음)
   닫기: 버튼 다시 누르기 · 상자의 X · Esc · 접수 완료(cf:done)
   상담문의 페이지(/page/contact)는 같은 폼이 본문에 있어 띄우지 않음
   children: 빠른 상담 폼 (서버에서 토큰을 넣어 만든 <ContactForm quick />) */
export default function ContactWidget({ children }) {
	const pathname = usePathname();
	const [open, setOpen] = useState(false);
	const [panelHidden, setPanelHidden] = useState(true);
	const openRef = useRef(false);
	const timer = useRef(0);
	const cwRef = useRef(null),
		panelRef = useRef(null),
		btnRef = useRef(null),
		bodyRef = useRef(null);

	const show = () => {
		clearTimeout(timer.current);
		openRef.current = true;
		setPanelHidden(false);
		setOpen(true);
	};
	const close = (focusBtn) => {
		if (!openRef.current) return;
		openRef.current = false;
		setOpen(false);
		timer.current = setTimeout(() => setPanelHidden(true), 400); // 접히는 애니메이션 뒤
		if (focusBtn) btnRef.current?.focus();
	};

	// 펼칠 때: hidden을 푼 다음 .is-open (펼쳐지는 애니메이션), 첫 칸에 포커스 (휴대폰은 키보드가 바로 올라오지 않게)
	const [shown, setShown] = useState(false);
	useEffect(() => {
		const root = document.documentElement;
		if (!open) {
			setShown(false);
			root.classList.remove("is-cw");
			return;
		}
		void panelRef.current?.offsetWidth;
		setShown(true);
		root.classList.add("is-cw");
		if (bodyRef.current) bodyRef.current.scrollTop = 0;
		const first = panelRef.current?.querySelector("input:not([type=hidden]):not([tabindex='-1'])");
		if (!first || !matchMedia("(hover: hover) and (pointer: fine)").matches) return;
		const id = setTimeout(() => first.focus({ preventScroll: true }), 300);
		return () => clearTimeout(id);
	}, [open]);

	useEffect(() => {
		const cw = cwRef.current;
		if (!cw) return;
		const root = document.documentElement;
		const onDone = () => close(false);
		const onKey = (e) => {
			// 셀렉트 목록 · 정책 팝업이 열려 있으면 그쪽이 먼저 닫힘
			if (e.key !== "Escape" || root.classList.contains("is-pop") || cw.querySelector(".cf_select.is-open")) return;
			close(true);
		};
		// 다른 곳에서 열기: [data-cw-open]
		const onOpen = (e) => {
			if (!e.target.closest("[data-cw-open]")) return;
			e.preventDefault();
			show();
		};
		cw.addEventListener("cf:done", onDone);
		document.addEventListener("keydown", onKey);
		document.addEventListener("click", onOpen);
		return () => {
			cw.removeEventListener("cf:done", onDone);
			document.removeEventListener("keydown", onKey);
			document.removeEventListener("click", onOpen);
		};
	});

	// 페이지가 바뀌면 닫음
	useEffect(() => {
		close(false);
	}, [pathname]);
	useEffect(
		() => () => {
			clearTimeout(timer.current);
			document.documentElement.classList.remove("is-cw");
		},
		[],
	);

	if (pathname === "/page/contact") return null;

	return (
		<div className={shown ? "cw is-open" : "cw"} id="cw" ref={cwRef}>
			<section className="cw_panel" id="cw_panel" role="dialog" aria-modal="false" aria-labelledby="cw_tit" hidden={panelHidden} ref={panelRef}>
				<header className="cw_head">
					<div>
						<p className="cw_lbl">Contact</p>
						<h2 className="cw_tit" id="cw_tit">
							프로젝트 상담 문의
						</h2>
						<p className="cw_desc">남겨 주신 내용을 확인한 뒤 연락드립니다.</p>
					</div>
					<button type="button" className="cw_close" data-cw-close="" aria-label="닫기" onClick={() => close(true)}></button>
				</header>
				<div className="cw_body" data-lenis-prevent="" ref={bodyRef}>
					{children}
				</div>
			</section>
			<button
				type="button"
				className="cw_btn"
				aria-expanded={open}
				aria-controls="cw_panel"
				aria-label={open ? "상담 문의 닫기" : "상담 문의 열기"}
				ref={btnRef}
				onClick={() => (openRef.current ? close(true) : show())}
			>
				<IcoFigure />
				<i className="cw_ico is-close" aria-hidden="true"></i>
			</button>
		</div>
	);
}
