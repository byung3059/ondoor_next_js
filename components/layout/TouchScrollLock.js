"use client";

import { useEffect } from "react";

/* 팝업 · 모바일 메뉴 · 문의칸이 열린 동안 뒤 페이지 터치 스크롤 막기 (원본: js/layout.js)
   아이폰 사파리는 html overflow: hidden을 터치 스크롤에선 무시함
   → 열린 상자 안이 스크롤될 때만 그 안에서 스크롤, 끝에서 더 당기거나 바깥을 쓸면 막음
   팝업: html.is-pop / 메뉴: html.is-menu · 문의칸: html.is-cw (둘 다 768px 이하 전체 화면일 때만) */
export default function TouchScrollLock() {
	useEffect(() => {
		const docEl = document.documentElement;
		const mqMobile = matchMedia("(max-width: 768px)");
		let tx = 0,
			ty = 0;
		const openBox = () => {
			if (docEl.classList.contains("is-pop")) return document.querySelector(".policy_pop.is-open .policy_body");
			if (docEl.classList.contains("is-menu") && mqMobile.matches) return document.getElementById("gnb");
			if (docEl.classList.contains("is-cw") && mqMobile.matches) return document.querySelector(".cw_body");
			return undefined; // 잠글 것 없음
		};
		const onStart = (e) => ((tx = e.touches[0].clientX), (ty = e.touches[0].clientY));
		const onMove = (e) => {
			const box = openBox();
			if (box === undefined || e.touches.length > 1) return; // 두 손가락 확대는 그대로
			if (!box || !box.contains(e.target)) return e.preventDefault();
			const dx = e.touches[0].clientX - tx,
				dy = e.touches[0].clientY - ty;
			// 가로로 넘치는 표 등은 옆으로 쓸 때 그대로
			if (Math.abs(dx) > Math.abs(dy)) {
				for (let el = e.target; el && el !== box; el = el.parentElement) if (el.scrollWidth > el.clientWidth) return;
				return e.preventDefault();
			}
			if (box.scrollHeight <= box.clientHeight) return e.preventDefault();
			const atTop = box.scrollTop <= 0,
				atEnd = box.scrollTop + box.clientHeight >= box.scrollHeight - 1;
			if ((dy > 0 && atTop) || (dy < 0 && atEnd)) e.preventDefault();
		};
		document.addEventListener("touchstart", onStart, { passive: true });
		document.addEventListener("touchmove", onMove, { passive: false });
		return () => {
			document.removeEventListener("touchstart", onStart);
			document.removeEventListener("touchmove", onMove);
		};
	}, []);
	return null;
}
