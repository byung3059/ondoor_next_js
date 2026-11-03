"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { SHAPES, project, seg } from "@/lib/fx/line-shapes";

const V = 200,
	C = V / 2,
	S = 56; // 뷰박스 · 중심 · 크기

/* 3D 선 아이콘 (.fig) — 메인 서비스 카드 · 회사소개 서비스 카드
   - 와이어프레임이 천천히 돌아감, 실선은 앞(진하게) · 뒤(흐리게) 2개 path, 점선 · 꼭짓점 점
   - 화면에 보일 때만 움직임, 처음 보이면 .is-in (CSS), 카드(hoverSel)에 마우스를 올리면 빨라짐
   index: 카드 순서 (도형마다 시작 각도를 다르게) */
export default function LineFigure({ shape, index = 0, hoverSel }) {
	const sh = useMemo(() => (SHAPES[shape] ? SHAPES[shape]() : null), [shape]);
	const ref = useRef(null);

	useLayoutEffect(() => {
		const fig = ref.current;
		if (!sh || !fig) return;
		const svg = fig.firstChild;
		const [back, dash, front] = svg.querySelectorAll("path");
		const dots = [...svg.querySelectorAll("circle.d")];
		const sigs = [...svg.querySelectorAll("circle.s")];
		let t = index * 1.7,
			speed = 1,
			target = 1,
			last = 0,
			raf = 0,
			on = false;

		const draw = () => {
			const p = project(sh.v, t, 0.5, C, S);
			let f = "",
				b = "";
			for (const ed of sh.e) p[ed[0]][2] + p[ed[1]][2] > 0 ? (b += seg(p, ed)) : (f += seg(p, ed));
			front.setAttribute("d", f);
			back.setAttribute("d", b);
			dash.setAttribute("d", sh.dash.map((ed) => seg(p, ed)).join(""));
			dots.forEach((el, i) => {
				const q = p[sh.dots[i]];
				el.setAttribute("cx", q[0].toFixed(1));
				el.setAttribute("cy", q[1].toFixed(1));
				el.setAttribute("fill-opacity", (q[2] > 0 ? 0.35 : 0.95).toFixed(2));
			});
			sigs.forEach((el, i) => {
				const [a, c] = sh.e[sh.sig[i]],
					k = (t * 0.7 + i * 0.27) % 1;
				el.setAttribute("cx", (p[a][0] + (p[c][0] - p[a][0]) * k).toFixed(1));
				el.setAttribute("cy", (p[a][1] + (p[c][1] - p[a][1]) * k).toFixed(1));
				el.setAttribute("fill-opacity", Math.sin(k * Math.PI).toFixed(2));
			});
		};
		const tick = (now) => {
			const dt = Math.min(0.05, (now - (last || now)) / 1000);
			last = now;
			speed += (target - speed) * 0.08;
			t += dt * speed;
			draw();
			raf = on ? requestAnimationFrame(tick) : ((last = 0), 0);
		};

		const card = hoverSel ? fig.closest(hoverSel) : null;
		const enter = () => (target = 3),
			leave = () => (target = 1);
		card?.addEventListener("pointerenter", enter);
		card?.addEventListener("pointerleave", leave);

		draw();
		const io = new IntersectionObserver(([en]) => {
			on = en.isIntersecting;
			if (on) fig.classList.add("is-in");
			if (on && !raf) raf = requestAnimationFrame(tick);
		});
		io.observe(fig);

		return () => {
			io.disconnect();
			cancelAnimationFrame(raf);
			card?.removeEventListener("pointerenter", enter);
			card?.removeEventListener("pointerleave", leave);
			fig.classList.remove("is-in");
		};
	}, [sh, index, hoverSel]);

	return (
		<div className="fig" data-shape={shape} aria-hidden="true" ref={ref}>
			{sh && (
				<svg viewBox={`0 0 ${V} ${V}`} fill="none" stroke="#fff" strokeWidth="0.8" strokeLinejoin="round">
					<path strokeOpacity="0.28" />
					<path strokeOpacity="0.4" strokeDasharray="2 3" />
					<path strokeOpacity="0.95" />
					{sh.dots.map((_, i) => (
						<circle key={`d${i}`} className="d" r="1.8" fill="#fff" stroke="none" />
					))}
					{sh.sig.map((_, i) => (
						<circle key={`s${i}`} className="s" r="2.4" fill="#fff" stroke="none" />
					))}
				</svg>
			)}
		</div>
	);
}
