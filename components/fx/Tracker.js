"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/* 방문 기록 — 페이지를 볼 때마다(사이트 안 이동 포함) /api/track에 알림 (관리자 대시보드의 접속 통계)
   sendBeacon: 페이지를 떠나는 중에도 보내지고 화면을 막지 않음
   들어온 곳(document.referrer)은 처음 한 번만 보냄 — 사이트 안에서 이동해도 바뀌지 않으므로 */
export default function Tracker() {
	const pathname = usePathname();
	const first = useRef(true);

	useEffect(() => {
		// 제목은 페이지가 바뀐 뒤에 갱신되므로 한 프레임 뒤에 읽음
		const t = setTimeout(() => {
			const body = JSON.stringify({ p: location.pathname, t: document.title, r: first.current ? document.referrer : "" });
			first.current = false;
			const blob = new Blob([body], { type: "application/json" });
			if (!navigator.sendBeacon?.("/api/track", blob)) fetch("/api/track", { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } }).catch(() => {});
		}, 50);
		return () => clearTimeout(t);
	}, [pathname]);

	return null;
}
