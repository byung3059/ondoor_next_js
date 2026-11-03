"use client";

import { useEffect } from "react";
import { goTo, SECTION_KEYS } from "@/lib/fx/nav";

/* 다른 페이지에서 /#weare 처럼 들어온 경우: 인트로가 끝나 스크롤 잠금이 풀리면 그 위치로 (원본: js/layout.js)
   메인 섹션들의 연출이 다 준비된 뒤 돌도록 메인 페이지 맨 끝에 둠 */
export default function HashJump() {
	useEffect(() => {
		const key = location.hash.slice(1);
		if (!SECTION_KEYS.includes(key)) return;
		const root = document.documentElement;
		let raf = 0;
		// 주소의 #은 실제로 옮길 때 지움 (개발 모드에서 effect가 두 번 돌아도 두 번째가 #을 읽을 수 있게)
		const jump = () =>
			(raf = requestAnimationFrame(
				() =>
					(raf = requestAnimationFrame(() => {
						history.replaceState(history.state, "", location.pathname + location.search);
						goTo(key);
					})),
			));
		if (!root.classList.contains("intro-lock")) {
			jump();
			return () => cancelAnimationFrame(raf);
		}
		const mo = new MutationObserver(() => {
			if (root.classList.contains("intro-lock")) return;
			mo.disconnect();
			jump();
		});
		mo.observe(root, { attributes: true, attributeFilter: ["class"] });
		return () => {
			mo.disconnect();
			cancelAnimationFrame(raf);
		};
	}, []);
	return null;
}
