"use client";

import { useRef } from "react";
import DemoBox from "./DemoBox";
import { gsap, useGSAP } from "@/lib/fx/gsap";

const Btn = () => <span className="g_btn">Button</span>;
const Card = () => (
	<div className="g_blk g_card">
		<i className="g_img"></i>
		<i className="g_ln"></i>
		<i className="g_ln is-s"></i>
		<Btn />
	</div>
);

/* 데모 grid: 12칸 그리드가 깔리고 → 블록이 칸에 맞춰 배치 → 같은 버튼 컴포넌트 5개가 들어가고 함께 강조됨 */
export default function DemoGrid({ control }) {
	const ref = useRef(null);

	useGSAP(
		() => {
			const box = ref.current;
			const cols = [...box.querySelectorAll(".grid_cols i")];
			const blks = [...box.querySelectorAll(".g_blk")];
			const btns = [...box.querySelectorAll(".g_btn")];
			const reset = () => {
				box.classList.remove("is-same");
				gsap.set(cols, { scaleY: 0 });
				gsap.set(blks, { autoAlpha: 0, y: 16 });
				gsap.set(btns, { autoAlpha: 0, scale: 0.6 });
			};
			reset();
			const tl = gsap.timeline({ repeat: -1, paused: true });
			tl.to({}, { duration: 0.8 })
				.to(cols, { scaleY: 1, duration: 0.6, ease: "power3.out", stagger: 0.04 }) // 12칸 그리드
				.to(blks, { autoAlpha: 1, y: 0, duration: 0.6, ease: "power3.out", stagger: 0.12 }, "+=0.2") // 칸에 맞춰 블록 배치
				.to(btns, { autoAlpha: 1, scale: 1, duration: 0.5, ease: "back.out(2)", stagger: 0.1 }, "+=0.2") // 같은 버튼이 곳곳에
				.add(() => box.classList.add("is-same"), "+=0.3") // 같은 컴포넌트 강조
				.to({}, { duration: 3 })
				.add(reset)
				.to({}, { duration: 0.4 });
			control.setTimeline(tl);
			return () => {
				control.setTimeline(null);
				box.classList.remove("is-same");
			};
		},
		{ scope: ref },
	);

	return (
		<DemoBox kind="grid" control={control} boxRef={ref}>
			<div className="demo_bar">
				<code>
					GRID: <b>12</b> COL · GAP 8
				</code>
				<span className="g_note">Button × 5 · 같은 컴포넌트</span>
			</div>
			<div className="grid_stage">
				<div className="grid_cols">
					{Array.from({ length: 12 }, (_, i) => (
						<i key={i}></i>
					))}
				</div>
				<div className="grid_page">
					<div className="g_blk g_hd">
						<i className="g_logo"></i>
						<Btn />
					</div>
					<div className="g_blk g_hero">
						<i className="g_ln is-l"></i>
						<i className="g_ln is-l is-s"></i>
						<i className="g_ln"></i>
						<Btn />
					</div>
					<div className="g_blk g_side">
						<i className="g_img"></i>
					</div>
					<Card />
					<Card />
					<Card />
				</div>
			</div>
		</DemoBox>
	);
}
