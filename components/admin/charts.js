"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

/* 그래프 (원본: extend/adm_theme/js/adm_chart.js) — 외부 라이브러리 없이 SVG
   색은 CSS 변수(var(--adm-c1) 등)라 다크 모드로 바꿔도 다시 그리지 않음
   첫 등장: 화면에 보일 때 한 번만 — 선은 왼쪽부터 그려지고 면 · 점이 뒤따름 / 도넛은 0에서 채워지며 가운데 숫자가 올라감 */
export const numberFormat = (v) => Math.round(Number(v) || 0).toLocaleString("ko-KR");
const shortNumber = (v) => (v >= 1e8 ? (v / 1e8).toFixed(v % 1e8 ? 1 : 0) + "억" : v >= 1e4 ? (v / 1e4).toFixed(v % 1e4 ? 1 : 0) + "만" : numberFormat(v));

// y축 최댓값을 4칸으로 나누어 떨어지는 보기 좋은 값으로
function niceMax(max) {
	if (max <= 4) return 4;
	const raw = max / 4,
		pow = Math.pow(10, Math.floor(Math.log10(raw)));
	for (const s of [1, 2, 2.5, 5, 10]) if (raw <= s * pow) return s * pow * 4;
	return Math.ceil(raw / pow) * pow * 4;
}

const reduceMotion = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const DRAW_EASE = "cubic-bezier(.65, 0, .35, 1)";
const ENTER_DELAY = 450,
	ENTER_LINE = 1800,
	ENTER_DONUT = 1600,
	ENTER_COUNT = 1600;

// 화면에 25% 이상 보이면 (카드가 떠오르는 애니메이션과 겹치지 않게 조금 늦게) 실행
function whenVisible(el, fn) {
	let timer = 0;
	const io = new IntersectionObserver(
		(ens) => {
			if (!ens[0].isIntersecting) return;
			io.disconnect();
			timer = setTimeout(fn, ENTER_DELAY);
		},
		{ threshold: 0.25 },
	);
	io.observe(el);
	return () => (io.disconnect(), clearTimeout(timer));
}

function useSize(ref) {
	const [size, setSize] = useState({ w: 0, h: 0 });
	useLayoutEffect(() => {
		const el = ref.current;
		let timer = 0;
		const measure = () => setSize((s) => (s.w === el.clientWidth && s.h === el.clientHeight ? s : { w: el.clientWidth, h: el.clientHeight }));
		measure();
		const ro = new ResizeObserver(() => {
			clearTimeout(timer);
			timer = setTimeout(measure, 80);
		});
		ro.observe(el);
		return () => (ro.disconnect(), clearTimeout(timer));
	}, [ref]);
	return size;
}

/* 선 그래프 — flush: 양옆 여백 없이 가는 선 (관리자 메인) */
export function LineChart({ labels = [], tipLabels, series = [], format = numberFormat, title = "그래프", flush = true, className = "" }) {
	const boxRef = useRef(null);
	const svgRef = useRef(null);
	const guideRef = useRef(null);
	const tipRef = useRef(null);
	const entered = useRef(false);
	const { w, h } = useSize(boxRef);
	const width = Math.max(w, 240),
		height = Math.max(h, 160);

	const pad = flush ? { top: 24, right: 4, bottom: 32, left: 4 } : { top: 16, right: 16, bottom: 32, left: 48 };
	const gridLeft = flush ? 0 : pad.left,
		gridRight = flush ? width : width - pad.right;
	const cw = width - pad.left - pad.right,
		ch = height - pad.top - pad.bottom;
	const max = niceMax(Math.max(0, ...series.flatMap((s) => s.values.map((v) => Number(v) || 0))));
	const step = labels.length > 1 ? cw / (labels.length - 1) : 0;
	const xPos = (i) => (labels.length > 1 ? pad.left + step * i : pad.left + cw / 2);
	const yPos = (v) => pad.top + ch - ((Number(v) || 0) / max) * ch;

	// 가로축 글자: every 칸마다 + 마지막 (마지막이 바로 앞 글자와 56px 안이면 앞의 것을 뺌)
	const every = Math.max(1, Math.ceil(labels.length / 8));
	const shown = labels.map((_, i) => i).filter((i) => i % every === 0);
	const last = labels.length - 1;
	if (last > 0 && shown[shown.length - 1] !== last) {
		if (shown.length > 1 && (last - shown[shown.length - 1]) * step < 56) shown.pop();
		shown.push(last);
	}
	const showDots = labels.length <= 31;
	const ticks = [0, 1, 2, 3, 4].map((i) => ({ y: pad.top + ch * (i / 4), v: shortNumber(max * (1 - i / 4)) }));

	// 첫 등장
	useEffect(() => {
		if (!w || entered.current || reduceMotion()) return;
		entered.current = true;
		const root = svgRef.current;
		const lines = [...root.querySelectorAll(".adm_chart_line")];
		lines.forEach((ln) => {
			const len = ln.getTotalLength();
			ln.style.strokeDasharray = `${len} ${len}`;
			ln.style.strokeDashoffset = len;
		});
		root.classList.add("is-enter");
		let clear = 0,
			started = false;
		const reset = () => lines.forEach((ln) => (ln.style.strokeDasharray = ln.style.strokeDashoffset = ln.style.transition = ""));
		const stop = whenVisible(root, () => {
			started = true;
			lines.forEach((ln, i) => {
				ln.getBoundingClientRect();
				ln.style.transition = `stroke-dashoffset ${ENTER_LINE}ms ${DRAW_EASE} ${i * 200}ms`;
				ln.style.strokeDashoffset = 0;
			});
			root.classList.add("is-drawn");
			// 다 그린 뒤엔 선 길이 표시를 지움 (기간을 바꿔 다시 그릴 때 선이 잘리지 않게)
			clear = setTimeout(reset, ENTER_LINE + 600);
		});
		return () => {
			stop();
			clearTimeout(clear);
			// 시작 전에 정리되면(개발 모드에서 effect가 두 번 도는 경우 등) 다음에 다시 시작할 수 있게 되돌림
			if (!started) {
				reset();
				root.classList.remove("is-enter");
				entered.current = false;
			}
		};
	}, [w]);

	const show = (e) => {
		if (!labels.length) return;
		const rect = svgRef.current.getBoundingClientRect();
		const index = Math.max(0, Math.min(last, step ? Math.round((e.clientX - rect.left - pad.left) / step) : 0));
		const x = xPos(index);
		const g = guideRef.current,
			tip = tipRef.current;
		g.setAttribute("x1", x);
		g.setAttribute("x2", x);
		g.style.display = "";
		tip.replaceChildren();
		const b = document.createElement("b");
		b.textContent = tipLabels ? tipLabels[index] : labels[index];
		tip.appendChild(b);
		series.forEach((s) => {
			const row = document.createElement("span");
			const dot = document.createElement("i");
			dot.style.background = s.color;
			row.append(dot, `${s.name} ${format(s.values[index])}`);
			tip.appendChild(row);
		});
		tip.hidden = false;
		let left = x + 12;
		if (left + tip.offsetWidth > width) left = x - tip.offsetWidth - 12;
		tip.style.left = Math.max(0, left) + "px";
		tip.style.top = pad.top + "px";
	};
	const hide = () => {
		guideRef.current.style.display = "none";
		tipRef.current.hidden = true;
	};

	const tickEls = (
		<g className={flush ? "adm_chart_ticks is-inside" : "adm_chart_ticks"}>
			{ticks.map((t, i) =>
				flush ? (
					<text key={i} x={0} y={t.y - 6} textAnchor="start" className="adm_chart_tick">
						{t.v}
					</text>
				) : (
					<text key={i} x={pad.left - 8} y={t.y} textAnchor="end" dominantBaseline="middle" className="adm_chart_tick">
						{t.v}
					</text>
				),
			)}
		</g>
	);

	return (
		<div className={`adm_chart${flush ? " is-flush" : ""} ${className}`} ref={boxRef}>
			{w > 0 && (
				<svg ref={svgRef} width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title} className="adm_chart_svg">
					{ticks.map((t, i) => (
						<line key={i} x1={gridLeft} y1={t.y} x2={gridRight} y2={t.y} className="adm_chart_grid" />
					))}
					{!flush && tickEls}
					{shown.map((i) => {
						let anchor = "middle";
						if (flush && labels.length > 1 && i === 0) anchor = "start";
						if (flush && labels.length > 1 && i === last) anchor = "end";
						return (
							<text key={i} x={xPos(i)} y={height - 8} textAnchor={anchor} className="adm_chart_tick">
								{labels[i]}
							</text>
						);
					})}
					{series
						.map((s, si) => {
							const pts = labels.map((_, j) => `${xPos(j).toFixed(1)},${yPos(s.values[j]).toFixed(1)}`);
							return (
								<g key={s.name}>
									{si === 0 && <path d={`M${xPos(0)},${pad.top + ch} L${pts.join(" L")} L${xPos(last)},${pad.top + ch} Z`} className="adm_chart_area" style={{ fill: s.color }} />}
									<polyline points={pts.join(" ")} className="adm_chart_line" style={{ stroke: s.color }} />
									{showDots && labels.map((_, j) => <circle key={j} cx={xPos(j)} cy={yPos(s.values[j])} r={flush ? 2.5 : 3} className="adm_chart_dot" style={{ stroke: s.color }} />)}
								</g>
							);
						})
						.reverse()}
					{flush && tickEls}
					<line ref={guideRef} x1={0} y1={pad.top} x2={0} y2={pad.top + ch} className="adm_chart_guide" style={{ display: "none" }} />
					<rect x={pad.left} y={pad.top} width={cw} height={ch} fill="transparent" onMouseMove={show} onMouseLeave={hide} />
				</svg>
			)}
			<div className="adm_chart_tip" ref={tipRef} hidden></div>
		</div>
	);
}

/* 도넛 그래프 + 범례 */
export function DonutChart({ items = [], total, caption = "", title = "도넛 그래프", lg = true }) {
	const size = 160,
		stroke = 24,
		r = (size - stroke) / 2,
		c = 2 * Math.PI * r;
	const sum = items.reduce((a, it) => a + (Number(it.value) || 0), 0);
	const centerTotal = total !== undefined ? Number(total) || 0 : sum;
	const boxRef = useRef(null);
	const entered = useRef(false);
	const [counting, setCounting] = useState(null); // 첫 등장 때 올라가는 중인 숫자 (null이면 실제 값)

	let offset = 0;
	const segs =
		sum > 0
			? items
					.filter((it) => Number(it.value) > 0)
					.map((it) => {
						const len = (Number(it.value) / sum) * c;
						const seg = { color: it.color, len, offset };
						offset += len;
						return seg;
					})
			: [];

	useEffect(() => {
		if (entered.current || reduceMotion()) return;
		entered.current = true;
		const box = boxRef.current;
		const els = [...box.querySelectorAll(".adm_donut_seg")];
		els.forEach((s) => {
			s.dataset.dash = s.getAttribute("stroke-dasharray");
			s.setAttribute("stroke-dasharray", `0 ${c}`);
		});
		setCounting(0);
		let raf = 0,
			started = false;
		const stop = whenVisible(box, () => {
			started = true;
			els.forEach((s, i) => {
				s.getBoundingClientRect();
				s.style.transition = `stroke-dasharray ${ENTER_DONUT}ms ${DRAW_EASE} ${i * 140}ms`;
				s.setAttribute("stroke-dasharray", s.dataset.dash);
			});
			// 가운데 숫자 올라가기 (끝나면 실제 값으로)
			let start = null;
			const target = centerTotal;
			const frame = (now) => {
				if (start === null) start = now;
				const t = Math.min(1, (now - start) / ENTER_COUNT);
				setCounting(t < 1 ? target * (1 - Math.pow(1 - t, 3)) : null);
				if (t < 1) raf = requestAnimationFrame(frame);
			};
			raf = requestAnimationFrame(frame);
		});
		return () => {
			stop();
			cancelAnimationFrame(raf);
			if (!started) {
				els.forEach((s) => s.setAttribute("stroke-dasharray", s.dataset.dash));
				setCounting(null);
				entered.current = false;
			}
		};
		// 첫 등장만
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<>
			<div className={`adm_donut${lg ? " is-lg" : ""}`} ref={boxRef}>
				<svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label={title} className="adm_donut_svg">
					<circle cx={size / 2} cy={size / 2} r={r} className="adm_donut_track" strokeWidth={stroke} />
					{segs.map((s, i) => (
						<circle
							key={`${s.color}-${i}`}
							cx={size / 2}
							cy={size / 2}
							r={r}
							className="adm_donut_seg"
							strokeWidth={stroke}
							strokeDasharray={`${s.len} ${c - s.len}`}
							strokeDashoffset={-s.offset}
							transform={`rotate(-90 ${size / 2} ${size / 2})`}
							style={{ stroke: s.color }}
						/>
					))}
				</svg>
				<div className="adm_donut_center">
					<strong>{numberFormat(counting ?? centerTotal)}</strong>
					<span>{caption}</span>
				</div>
			</div>
			<ul className="adm_donut_legend">
				{items.length ? (
					items.map((it) => (
						<li key={it.label} title={numberFormat(it.value)}>
							<span className="adm_donut_name">
								<i style={{ background: it.color }}></i>
								{it.label}
							</span>
							<span className="adm_donut_value">{(sum ? ((Number(it.value) || 0) / sum) * 100 : 0).toFixed(1)}%</span>
						</li>
					))
				) : (
					<li className="adm_donut_empty">해당 기간의 자료가 없습니다.</li>
				)}
			</ul>
		</>
	);
}
