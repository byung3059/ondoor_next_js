"use client";

import { useLayoutEffect } from "react";
import { createGlass } from "@/lib/fx/glass";
import { InlineChars } from "@/components/text/Split";

// 브랜드 설명 줄 (스크롤하면 타이틀이 왼쪽으로 가며 오른쪽에 나타나고, 스크롤한 만큼 글자가 채워짐)
const BRAND = [
	"오프라인의 가치를 온라인의 언어로 번역합니다.",
	"문을 열고 들어서는 순간처럼, 처음 마주하는 고객에게",
	"브랜드의 이야기가 자연스럽게 펼쳐지는 첫 문을 설계합니다.",
	"기획부터 디자인, 개발까지, 열리는 모든 순간을 만드는 곳.",
];

/* 메인 비주얼 — 인트로(조각이 모여 유리 도형) + 유리 도형 + 타이틀 (WebGL: lib/fx/glass.js)
   인트로 동안 스크롤 잠금 · 아래 섹션 숨김 (html.intro-lock), 스크롤 안내 꺾쇠가 보이는 동안 문의칸 숨김 (html.is-hint)
   — 처음 들어올 땐 layout의 인라인 스크립트가, 다른 페이지에서 넘어올 땐 여기서 붙임 (20초 뒤 자동 해제: 실패해도 잠긴 채 남지 않게) */
export default function Visual() {
	useLayoutEffect(() => {
		const root = document.documentElement;
		clearTimeout(window.__introSafety); // 처음 들어올 때 layout 인라인 스크립트가 건 타이머 → 아래에서 다시 검
		const keep = history.scrollRestoration;
		history.scrollRestoration = "manual"; // 새로고침 때 스크롤 위치 복원 막기
		root.classList.add("intro-lock", "is-hint");
		const safety = setTimeout(() => root.classList.remove("intro-lock", "is-hint"), 20000);
		const destroy = createGlass();
		return () => {
			clearTimeout(safety);
			destroy();
			root.classList.remove("intro-lock", "is-hint", "intro-pending");
			history.scrollRestoration = keep;
		};
	}, []);

	return (
		<section className="visual">
			<div className="slg">
				<div className="tit">
					<h2>ondoor.</h2>
				</div>
				<svg className="scroll_arrow" width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
					<path d="M5 12L20 28L35 12" strokeWidth="4" stroke="white" />
				</svg>
			</div>
			<div className="brand">
				<p>
					{/* 줄 사이 띄어쓰기: 480px 이하에서 <br>을 숨겨도 단어가 붙지 않게 */}
					{BRAND.map((ln, i) => [<InlineChars key={i} text={ln} />, <br key={`b${i}`} />, " "])}
					<InlineChars text="그래서 우리는 " />
					<strong>
						<InlineChars text="Ondoor" />
					</strong>
					<InlineChars text="입니다." />
				</p>
			</div>
			<div className="canvas_wrap"></div>
		</section>
	);
}
