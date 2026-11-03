"use client";

import { useEffect, useRef, useState } from "react";

// 좌측 메뉴 하단에서 뜨는 패널(알림 · 내 정보) 열고 닫기
// 열 때는 hidden만 풀면 CSS가 튀어 오르고, 닫을 때는 .is-closing 애니메이션 뒤 hidden (원본 adm_theme.js의 showPanel · hidePanel)
export default function useRailPanel(open) {
	const [hidden, setHidden] = useState(!open);
	const [closing, setClosing] = useState(false);
	const timer = useRef(0);
	const was = useRef(open);
	useEffect(() => {
		clearTimeout(timer.current);
		if (open) {
			setClosing(false);
			setHidden(false);
		} else if (was.current) {
			setClosing(true);
			timer.current = setTimeout(() => {
				setHidden(true);
				setClosing(false);
			}, 200);
		}
		was.current = open;
		return () => clearTimeout(timer.current);
	}, [open]);
	return { hidden, closing };
}
