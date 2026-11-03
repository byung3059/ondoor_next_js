"use client";

import { useLayoutEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/fx/gsap";
import { setLenis } from "@/lib/fx/smooth-scroll";

/* 부드러운 스크롤(Lenis) — 화면 1024px 이상에서만, 페이지마다 켜고 페이지를 떠나면 끔
   실제 스크롤 위치를 움직이는 방식이라 ScrollTrigger · sticky는 그대로 동작, 매 프레임 gsap 시계에 맞춰 갱신
   페이지의 다른 연출보다 먼저 켜지도록 페이지 맨 앞에 둠 (형제 컴포넌트는 앞에서부터 effect가 돎)
   respectReduce: 동작 줄이기 설정이면 끔 (회사소개 · 상담문의 — 원본 sub.js와 같음) */
export default function SmoothScroll({ respectReduce = false }) {
	useLayoutEffect(() => {
		if (innerWidth < 1024) return;
		if (respectReduce && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
		const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
		lenis.on("scroll", ScrollTrigger.update);
		const raf = (time) => lenis.raf(time * 1000);
		gsap.ticker.add(raf);
		gsap.ticker.lagSmoothing(0);
		setLenis(lenis);
		return () => {
			gsap.ticker.remove(raf);
			gsap.ticker.lagSmoothing(500, 33);
			lenis.destroy();
			setLenis(null);
		};
	}, [respectReduce]);
	return null;
}
