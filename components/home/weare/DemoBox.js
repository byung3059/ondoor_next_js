"use client";

import { useLayoutEffect, useRef } from "react";

/* 데모 상자 (.weare_demo)
   - 화면에 보이는지 control에 알려 줌 (보일 때만 재생)
   - 높이 고정: 반복 재생 중 가장 컸던 높이 아래로는 줄어들지 않게 (min-height를 올리기만 함)
     (높이가 커졌다 줄면 모바일(고정 없이 흐르는 배치)에서 아래 내용이 위아래로 밀려 화면이 흔들림 — iOS Safari는 특히 심함)
     화면 너비가 바뀌면(회전 등) 처음부터 다시 잼, 주소창이 나타나고 사라지는 높이 변화는 무시 */
export default function DemoBox({ kind, control, boxRef, children }) {
	const own = useRef(null);
	const ref = boxRef || own;

	useLayoutEffect(() => {
		const box = ref.current;
		const io = new IntersectionObserver(([en]) => control.setInView(en.isIntersecting));
		io.observe(box);

		let max = 0,
			lastW = innerWidth;
		const grow = () => {
			const h = box.offsetHeight;
			if (h > max) box.style.minHeight = (max = h) + "px";
		};
		const ro = new ResizeObserver(grow);
		ro.observe(box);
		const onResize = () => {
			if (innerWidth === lastW) return;
			lastW = innerWidth;
			max = 0;
			box.style.minHeight = "";
			grow();
		};
		addEventListener("resize", onResize);
		grow();
		return () => {
			io.disconnect();
			ro.disconnect();
			removeEventListener("resize", onResize);
			box.style.minHeight = "";
		};
	}, [control, ref]);

	return (
		<div className="weare_demo" data-demo={kind} aria-hidden="true" ref={ref}>
			{children}
		</div>
	);
}
