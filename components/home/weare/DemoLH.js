"use client";

import { useRef } from "react";
import DemoBox from "./DemoBox";
import { gsap, useGSAP } from "@/lib/fx/gsap";

const GAP = 16; // margin-bottom (글자 크기는 CSS .lh_row — PC 28px · 모바일 22px)
const FONTS = [
	["Paperlogy", '"Paperlogy", sans-serif'],
	["Georgia", 'Georgia, "Times New Roman", serif'],
	["Courier", '"Courier New", monospace'],
];

/* 데모 lh: line-height와 간격
   폰트 3개에 같은 margin-bottom을 줘도 line-height: normal이면 보이는 간격이 제각각 → line-height: 1이면 모두 같아짐 */
export default function DemoLH({ control }) {
	const ref = useRef(null);

	useGSAP(
		(_, contextSafe) => {
			const box = ref.current;
			let alive = true;
			// 폰트가 다 로드된 뒤 줄 높이를 잼
			const build = contextSafe(() => {
				if (!alive) return;
				const code = box.querySelector("code b");
				const rows = [...box.querySelectorAll(".lh_row")];
				const marks = [...box.querySelectorAll(".lh_mark")];
				rows.forEach((r) => (r.style.lineHeight = "normal"));
				const FS = parseFloat(getComputedStyle(rows[0]).fontSize) || 28;
				const normals = rows.map((r) => r.getBoundingClientRect().height); // 폰트마다 다른 normal 줄 높이
				rows.forEach((r, i) => (r.style.lineHeight = normals[i] + "px"));

				// 줄 사이: 위 글자 칸 아래 ~ 아래 글자 칸 위 = 눈에 보이는 간격 (상자 안 기준 offsetTop — 스크롤 중에도 가벼움)
				const update = () => {
					marks.forEach((m, i) => {
						const a = rows[i],
							b = rows[i + 1];
						const t = a.offsetTop + a.offsetHeight - (a.offsetHeight - FS) / 2,
							d = b.offsetTop + (b.offsetHeight - FS) / 2;
						m.style.top = t + "px";
						m.style.height = d - t + "px";
						m.firstChild.textContent = Math.round(d - t) + "px";
						m.classList.toggle("is-even", Math.round(d - t) === GAP);
					});
				};
				update();

				const setCode = (v) => () => {
					code.textContent = v;
					box.classList.toggle("is-one", v === "1");
				};
				const tl = gsap.timeline({ repeat: -1, paused: true }); // 간격 표시는 줄높이가 바뀌는 동안만 다시 계산
				tl.to({}, { duration: 1.8 })
					.add(setCode("1"))
					.to(rows, { lineHeight: FS + "px", duration: 1, ease: "power3.inOut", onUpdate: update })
					.to({}, { duration: 2.2 })
					.add(setCode("normal"))
					.to(rows, { lineHeight: (i) => normals[i] + "px", duration: 1, ease: "power3.inOut", onUpdate: update });
				control.setTimeline(tl);
			});
			document.fonts.ready.then(build, build);
			return () => {
				alive = false;
				control.setTimeline(null);
				box.classList.remove("is-one");
			};
		},
		{ scope: ref },
	);

	return (
		<DemoBox kind="lh" control={control} boxRef={ref}>
			<div className="demo_bar">
				<code>
					line-height: <b>normal</b>;
				</code>
				<span>margin-bottom: {GAP}px</span>
			</div>
			<div className="lh_stage">
				{FONTS.map(([name, ff], i) => (
					<div className="lh_row" key={name} style={{ fontFamily: ff, marginBottom: i < FONTS.length - 1 ? GAP + "px" : 0, lineHeight: "normal" }}>
						Ag 가나다 <small>{name}</small>
					</div>
				))}
				{FONTS.slice(1).map((_, i) => (
					<div className="lh_mark" key={i}>
						<em></em>
					</div>
				))}
			</div>
		</DemoBox>
	);
}
