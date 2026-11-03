// gsap + 플러그인 등록 (원본은 CDN — 여기선 npm 패키지, 클라이언트 컴포넌트에서만 불러옴)
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger, CustomEase, useGSAP);

// 글자 이징: 사이트 타이틀 · 섹션 제목이 같이 쓰는 곡선 (cubic-bezier(.35, 0, 0, 1))
let titleEase = null;
export const getTitleEase = () => (titleEase ??= CustomEase.create("lusionTitle", "M0,0 C0.35,0 0,1 1,1"));

export { gsap, ScrollTrigger, CustomEase, useGSAP };
