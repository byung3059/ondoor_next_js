"use client";

import { useRef } from "react";
import LineFigure from "@/components/fx/LineFigure";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/fx/gsap";
import { glass, onSecOut } from "@/lib/fx/bridge";

const SERVICES = [
	["Corporate Website", "기업 홈페이지 제작", "브랜드의 가치와 신뢰를 담은 기업 홈페이지를 기획부터 디자인, 개발까지 한 번에 제작합니다.", "cube"],
	["Hospital Website", "병원 홈페이지 제작", "진료과목의 특성과 환자 동선을 고려한 설계로 상담 · 예약까지 이어지는 병원 홈페이지를 만듭니다.", "ico"],
	["E-Commerce", "쇼핑몰 제작", "영카트 · 카페24 기반으로 결제와 상품 · 주문 관리까지 운영이 편한 쇼핑몰을 구축합니다.", "gem"],
	["Responsive Website", "반응형 홈페이지 제작", "PC · 태블릿 · 모바일 어떤 화면에서도 일관된 경험을 주는 반응형 웹을 제작합니다.", "devices"],
	["SEO / GEO", "SEO/GEO 최적화", "검색엔진과 ChatGPT · Gemini 같은 AI 검색에 잘 노출되도록 사이트 구조와 콘텐츠를 최적화합니다.", "globe"],
	["Admin System", "차별화된 관리자 시스템", "운영 방식에 꼭 맞춘 관리자 화면으로 콘텐츠 · 회원 · 문의를 쉽고 빠르게 관리합니다.", "hex"],
	["AI & Tracking", "AI 및 트래킹 추적", "GA4 · 광고 픽셀 · 전환 추적과 AI 기능을 연동해 방문자 행동을 데이터로 분석합니다.", "net"],
];

const H_WAIT = 0.9; // 카드가 다 올라온 뒤 0.9화면 더 스크롤하면 가로 이동 시작
const H_HOLD = 0.6; // 가로 이동이 끝난 뒤 0.6화면 더 머물렀다가 고정이 풀림

const absTop = (el) => {
	let y = 0;
	for (; el; el = el.offsetParent) y += el.offsetTop;
	return y;
};

/* 서비스(What We Do) 섹션 (원본: js/service.js)
   카드 영역이 화면에 고정된 동안:
     1) 캔버스에 큰 제목이 가운데에서 올라옴 (유리 도형 — 비주얼 타이틀이 빠질 때)
     2) 제목이 카드 줄 위 자리로 이동 + 카드가 왼쪽부터 하나씩 올라옴 (유리 도형이 신호를 줌 — 제목 이동과 같은 순간)
     3) 0.9화면 더 스크롤하면 카드 줄이 옆으로 흘러 마지막 카드까지 → 0.6화면 머문 뒤 고정 풀림 (되돌리면 반대로)
   카드마다 3D 선 아이콘(LineFigure) */
export default function Service() {
	const ref = useRef(null);

	useGSAP(
		(_, contextSafe) => {
			const sec = ref.current;
			const stage = sec.querySelector(".service_stage");
			const list = sec.querySelector(".service_list");
			const items = [...sec.querySelectorAll(".service_itm")];

			const S0 = () => absTop(stage);
			// 위치는 CSS와 같은 100svh 단위로 (유리 도형이 알려 줌, 없으면 innerHeight)
			const unit = () => (glass.sec ? glass.sec.unit() : innerHeight);
			// 유리 도형이 제목을 옮기는 위치 (브랜드 설명이 있으면 5.1화면) — 아직 없으면 .visual 높이로 계산
			const secOutAt = () => {
				if (glass.sec) return glass.sec.secOutAt;
				const v = document.querySelector(".visual");
				return v ? v.offsetHeight / unit() - 0.4 : 1.6;
			};
			const REVEAL = () => unit() * secOutAt();
			const H_START = () => REVEAL() + innerHeight * H_WAIT;
			// 가로 이동 거리 = 마지막 카드 오른쪽 끝 + 오른쪽 여백 - 화면 너비
			const dist = () => {
				const last = items[items.length - 1];
				const side = parseFloat(getComputedStyle(list).paddingLeft) || 0;
				return Math.max(0, last.offsetLeft + last.offsetWidth + side - list.clientWidth);
			};
			// 고정 구간 길이: 가로 이동이 끝나고 H_HOLD만큼 더 카드 영역이 화면에 붙어 있도록
			const setHeight = () => (stage.style.height = Math.max(innerHeight, H_START() + dist() + innerHeight * H_HOLD - S0() + innerHeight) + "px");
			setHeight();
			ScrollTrigger.addEventListener("refreshInit", setHeight);

			gsap.to(list, {
				x: () => -dist(),
				ease: "none",
				scrollTrigger: { start: H_START, end: () => H_START() + dist(), scrub: 0.6, invalidateOnRefresh: true },
			});

			// 카드 하나씩 등장 / 되돌리면 숨김
			gsap.set(items, { y: 80, autoAlpha: 0 });
			const show = contextSafe((o) => {
				gsap.killTweensOf(items);
				items.forEach((c, i) => {
					if (o) gsap.to(c, { y: 0, autoAlpha: 1, duration: 1, ease: "power3.out", delay: 0.2 + i * 0.1, onStart: () => c.classList.add("is-show") });
					else gsap.to(c, { y: 80, autoAlpha: 0, duration: 0.5, ease: "power2.in", onComplete: () => c.classList.remove("is-show") });
				});
			});

			// 유리 도형의 제목 이동 신호에 맞춰 카드도 (따로 판단하면 되돌릴 때 위치 차이 · 인트로 중 스크롤에서 어긋남)
			const synced = () => !!(glass.sec && glass.sec.syncsService);
			let shown = false;
			const off = onSecOut((o) => {
				if (!!o === shown) return;
				shown = !!o;
				show(shown);
			});
			// 이미 제목이 이동한 상태면 바로 맞춤
			if (synced() && glass.sec.out) {
				shown = true;
				show(true);
			}
			// 유리 도형이 없을 때(WebGL 불가 등)는 스크롤 위치로
			ScrollTrigger.create({
				start: REVEAL,
				onEnter: () => !synced() && show(true),
				onLeaveBack: () => !synced() && show(false),
			});

			return () => {
				off();
				ScrollTrigger.removeEventListener("refreshInit", setHeight);
				stage.style.height = "";
				items.forEach((c) => c.classList.remove("is-show"));
			};
		},
		{ scope: ref },
	);

	return (
		<section className="service is-h" ref={ref}>
			<div className="service_stage">
				<div className="service_pin">
					<div className="service_tit">
						<h2>What We Do</h2>
					</div>

					<div className="service_list">
						{SERVICES.map(([lbl, tit, desc, shape], i) => (
							<div className="service_itm" key={tit}>
								<span className="lbl">{lbl}</span>
								<h3>{tit}</h3>
								<p>{desc}</p>
								<LineFigure shape={shape} index={i} hoverSel=".service_itm" />
							</div>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}
