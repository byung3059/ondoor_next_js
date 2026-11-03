"use client";

import { useLayoutEffect } from "react";
import { createGlass } from "@/lib/fx/glass";

/* 첫 화면 뒤 유리 도형 — 메인 비주얼(lib/fx/glass.js)을 배경 전용으로
   [data-glass-bg] 안에 도형이 돌고, [data-glass-title] 제목(ABOUT US)을 메인 타이틀처럼 그림 (인트로 · 드래그 없음)
   그라데이션([data-glass-cover])이 다 덮으면 그리기를 멈춤, 문장 뒤 어두운 막(.ab_glass_dim)은 SubFx가 움직임 */
export default function AboutGlass() {
	useLayoutEffect(() => createGlass({ bgOnly: true }), []);

	return (
		<div className="ab_glass_wrap" aria-hidden="true">
			<div className="ab_glass" data-glass-bg="">
				<i className="ab_glass_dim"></i>
			</div>
		</div>
	);
}
