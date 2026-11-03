"use client";

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { getLenis } from "@/lib/fx/smooth-scroll";
import PrivacyPolicy from "./PrivacyPolicy";
import TermsOfUse from "./TermsOfUse";
import ContactDone from "./ContactDone";

const POPUPS = { privacy: PrivacyPolicy, terms: TermsOfUse, contact_done: ContactDone };
const PopupCtx = createContext({ open: () => {}, close: () => {} });
export const usePopup = () => useContext(PopupCtx);

/* 팝업 (개인정보처리방침 · 이용약관 · 상담 신청 완료) — 원본: js/layout.js + include/*.php
   열 때만 body 끝에 그림 → 닫으면 닫히는 애니메이션(0.3초) 뒤 지움
   열려 있는 동안 페이지 스크롤 멈춤 (html.is-pop, Lenis 포함), 닫기 · 바깥 · Esc로 닫힘, 닫으면 누른 곳으로 포커스 되돌림 */
export default function PopupProvider({ children }) {
	const [name, setName] = useState(null); // 그려져 있는 팝업
	// 단계: "mount"(방금 그림) → "open"(.is-open, 나타나는 애니메이션) → "closing"(닫히는 애니메이션) → null(지움)
	const [phase, setPhase] = useState(null);
	const from = useRef(null);
	const rmTimer = useRef(0);
	const elRef = useRef(null);

	const open = useCallback((n, origin) => {
		if (!POPUPS[n]) return;
		clearTimeout(rmTimer.current); // 닫히는 중에 다시 열면 지우지 않음
		from.current = origin || null;
		setName(n);
		setPhase("mount");
	}, []);

	const close = useCallback(() => setPhase((p) => (p === "open" || p === "mount" ? "closing" : p)), []);

	// 그린 다음 프레임에 .is-open → 나타나는 애니메이션
	useLayoutEffect(() => {
		if (phase !== "mount" || !elRef.current) return;
		void elRef.current.offsetWidth;
		setPhase("open");
	}, [phase, name]);

	// 열림 · 닫힘에 따라 html.is-pop · Lenis · 포커스 · 지우기
	useEffect(() => {
		const root = document.documentElement;
		if (phase === "open") {
			root.classList.add("is-pop");
			getLenis()?.stop();
			const el = elRef.current;
			const body = el?.querySelector(".policy_body");
			if (body) body.scrollTop = 0;
			el?.querySelector(".policy_close, [data-pop-close].policy_btn")?.focus();
		} else if (phase === "closing") {
			root.classList.remove("is-pop");
			getLenis()?.start();
			rmTimer.current = setTimeout(() => {
				setName(null); // 닫히는 애니메이션 뒤 지움
				setPhase(null);
				// 아이폰 사파리: 고정 헤더가 다시 그려지지 않는 경우가 있어 한 번 다시 그리게 함
				const hd = document.getElementById("hd");
				if (hd) {
					hd.style.opacity = "0.999";
					requestAnimationFrame(() => requestAnimationFrame(() => (hd.style.opacity = "")));
				}
			}, 300);
			from.current?.focus?.();
		}
	}, [phase]);
	const shown = phase === "open";

	useEffect(() => {
		const onKey = (e) => e.key === "Escape" && close();
		document.addEventListener("keydown", onKey);
		return () => {
			document.removeEventListener("keydown", onKey);
			clearTimeout(rmTimer.current);
			document.documentElement.classList.remove("is-pop");
		};
	}, [close]);

	const Content = name && POPUPS[name];
	return (
		<PopupCtx.Provider value={{ open, close }}>
			{children}
			{Content &&
				createPortal(
					<div ref={elRef} className="policy_pop-host" style={{ display: "contents" }}>
						<Content open={shown} onClose={close} />
					</div>,
					document.body,
				)}
		</PopupCtx.Provider>
	);
}
