"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { SHAPES, project, seg } from "@/lib/fx/line-shapes";

const V = 100,
	C = V / 2,
	S = 34; // 뷰박스 · 중심 · 크기

/* 오른쪽 아래 문의 버튼 아이콘: 계속 도는 정이십면체 (서비스 카드 "병원 홈페이지 제작" 아이콘과 같은 도형)
   앞쪽 선은 진하게 · 뒤쪽 선은 흐리게, 꼭짓점 점 — 탭이 안 보이면 멈춤 */
export default function IcoFigure() {
	const sh = useMemo(() => SHAPES.ico(), []);
	const ref = useRef(null);

	useLayoutEffect(() => {
		const svg = ref.current;
		const [back, front] = svg.querySelectorAll("path");
		const dots = [...svg.querySelectorAll("circle")];
		let t = 0,
			last = 0,
			raf = 0;
		const draw = () => {
			const p = project(sh.v, t, 0.6, C, S);
			let f = "",
				b = "";
			for (const ed of sh.e) p[ed[0]][2] + p[ed[1]][2] > 0 ? (b += seg(p, ed)) : (f += seg(p, ed));
			front.setAttribute("d", f);
			back.setAttribute("d", b);
			dots.forEach((el, i) => {
				el.setAttribute("cx", p[i][0].toFixed(1));
				el.setAttribute("cy", p[i][1].toFixed(1));
				el.setAttribute("fill-opacity", p[i][2] > 0 ? 0.35 : 1);
			});
		};
		const tick = (now) => {
			const dt = Math.min(0.05, (now - (last || now)) / 1000);
			t += dt;
			last = now;
			draw();
			raf = requestAnimationFrame(tick);
		};
		const play = () => !raf && (raf = requestAnimationFrame(tick));
		const stop = () => (cancelAnimationFrame(raf), (raf = 0), (last = 0));
		const onVis = () => (document.hidden ? stop() : play());
		draw();
		play();
		document.addEventListener("visibilitychange", onVis);
		return () => {
			stop();
			document.removeEventListener("visibilitychange", onVis);
		};
	}, [sh]);

	return (
		<span className="cw_ico is-fig" aria-hidden="true">
			<svg viewBox={`0 0 ${V} ${V}`} fill="none" stroke="#fff" strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" ref={ref}>
				<path strokeOpacity="0.3" />
				<path strokeOpacity="1" />
				{sh.v.map((_, i) => (
					<circle key={i} r="3.2" fill="#fff" stroke="none" />
				))}
			</svg>
		</span>
	);
}
