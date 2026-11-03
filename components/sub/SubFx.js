"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/fx/gsap";
import { setEdgeOff } from "@/lib/header-store";

/* 서브 페이지 스크롤 연출 (원본: js/sub.js) — 회사소개 · 상담문의, 모양은 scss/sub.scss
   있는 요소만 동작 — 상담문의는 글자 올라옴 · 아래에서 올라옴만 씀
   ① 첫 화면이 고정된 채: 바탕(유리 도형 + ABOUT US)이 어두워지며 → 소개 문장이 단어마다 밝아짐
   ② 고정된 채: 가운데 문장이 나타난 뒤 서비스 카드가 아래에서 올라와 문장을 덮음 (769px 이상: 열마다 시차 · 768px 이하: 카드 묶음이 화면을 지나감)
   ③ 진행 과정: 점선 화살표가 스크롤에 따라 위에서 아래로 그어짐
   [data-split] 글자가 마스크 안에서 아래에서 올라옴 / [data-rise] 아래에서 올라오며 나타남 (같은 때 들어온 것끼리 차례로)
   처음 들어올 땐 html.sub-wait로 숨겨 둠(layout 인라인 스크립트) → 첫 상태를 잡은 뒤 해제
   동작 줄이기 설정이면 연출 없이 그대로 보여 줌 (.is-fx를 붙이지 않아 CSS도 보통 배치)
   글자 · 단어는 처음부터 나뉜 모양으로 그려져 있음 (components/text/Split.js) */
export default function SubFx({ className, noLenis, hdAuto, children }) {
	const ref = useRef(null);

	useGSAP(
		(_, contextSafe) => {
			const docEl = document.documentElement;
			const root = ref.current;
			const ready = () => docEl.classList.remove("sub-wait");
			if (matchMedia("(prefers-reduced-motion: reduce)").matches) return ready();
			root.classList.add("is-fx"); // 고정 장면 배치 켬 (CSS)

			const pick = (sel) => root.querySelector(sel);
			const pickAll = (sel) => [...root.querySelectorAll(sel)];
			const splits = new Map(pickAll("[data-split]").map((el) => [el, [...el.querySelectorAll("i")]]));
			const rises = pickAll("[data-rise]");

			// 스크롤 중에 만드는 트윈도 정리 대상에 들어가게 contextSafe
			const charsIn = contextSafe((el) => gsap.to(splits.get(el) || [], { yPercent: 0, rotate: 0, duration: 1, ease: "power3.out", stagger: 0.03 }));
			const riseIn = contextSafe((els) => gsap.to(els, { y: 0, autoAlpha: 1, duration: 1, ease: "power3.out", stagger: 0.08 }));

			// 첫 상태
			splits.forEach((chars) => gsap.set(chars, { yPercent: 110, rotate: 8, transformOrigin: "0% 100%" }));
			gsap.set(rises, { y: 40, autoAlpha: 0 });

			/* ① 첫 화면 + 소개 문장 */
			const intro = pick(".ab_intro");
			const hero = pick(".ab_hero");
			const statement = pick(".ab_statement");
			const words = statement ? [...statement.querySelectorAll(".w")] : [];
			if (statement) {
				gsap.set(statement, { autoAlpha: 0 });
				gsap.set(words, { opacity: 0.16 });
			}

			/* ② 서비스 카드 — 가운데 문장은 소개 문장과 같은 연출 */
			const works = pick(".ab_works");
			const worksMsg = pick(".ab_works_msg");
			const worksTit = pick(".ab_works_tit");
			const worksWords = worksTit ? [...worksTit.querySelectorAll(".w")] : [];
			const workCards = pickAll(".ab_work");
			const glassDim = pick(".ab_glass_dim"); // 유리 도형 위 어두운 막 (첫 화면 · 서비스 장면이 같이 씀)

			/* ③ 진행 과정 점선 */
			const flowLines = pickAll(".ab_flow_line");
			gsap.set(flowLines, { scaleY: 0 });

			ready();

			// 첫 화면 순서: 라벨 → 큰 제목 글자
			const tl0 = gsap.timeline({ delay: 0.15 });
			const heroLbl = hero && hero.querySelector(".ab_lbl"),
				heroTit = hero && hero.querySelector(".ab_hero_tit");
			if (heroLbl) tl0.add(riseIn(heroLbl), 0);
			if (heroTit) tl0.add(charsIn(heroTit), 0.15);

			// ① 고정된 채: 제목이 위로 빠지고 → 바탕이 어두워지며 → 문장 단어가 차례로 밝아짐
			if (intro && statement) {
				const tl = gsap.timeline({ scrollTrigger: { trigger: intro, start: "top top", end: "bottom bottom", scrub: 0.6 } });
				tl.to(hero, { yPercent: -40, autoAlpha: 0, ease: "none", duration: 0.24 }, 0)
					.to(pick(".ab_scroll"), { autoAlpha: 0, duration: 0.08 }, 0)
					.fromTo(glassDim, { opacity: 0 }, { opacity: 0.7, ease: "none", duration: 0.4 }, 0)
					.to(statement, { autoAlpha: 1, duration: 0.08 }, 0.16)
					.to(words, { opacity: 1, ease: "none", duration: 0.04, stagger: 0.6 / Math.max(1, words.length) }, 0.2)
					.to({}, { duration: 0.12 }) // 다 밝아진 뒤 잠깐 머묾
					// 제자리에서 문장이 사라짐 → 같은 자리에 겹쳐 고정되는 서비스 장면으로 그대로 이어짐 (어두운 막은 이어서 씀)
					.to(statement, { autoAlpha: 0, ease: "none", duration: 0.1 });
			}

			// ② 서비스 카드 — 고정된 채 문장이 밝아진 뒤 카드가 올라와 덮음
			const mm = gsap.matchMedia();
			mm.add("(min-width: 769px)", () => {
				if (!works || !workCards.length) return;
				const grid = pick(".ab_works_grid");
				const cols = () => getComputedStyle(grid).gridTemplateColumns.split(" ").length;
				const tl = gsap.timeline({ scrollTrigger: { trigger: works, start: "top top", end: "bottom bottom", scrub: 0.6, invalidateOnRefresh: true } });
				// 어두운 막 위에 문장이 나타나 단어마다 밝아짐 → 카드가 그 위로 올라와 덮음 → 덮이는 동안 문장 · 어두운 막이 서서히 사라짐
				tl.fromTo(worksMsg, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.06 }, 0.02).fromTo(
					worksWords,
					{ opacity: 0.16 },
					{ opacity: 1, ease: "none", duration: 0.03, stagger: 0.34 / Math.max(1, worksWords.length) },
					0.04,
				);
				workCards.forEach((card, i) => {
					// 열마다 출발 높이를 다르게(오른쪽 열일수록 · 아래 줄일수록 더 아래에서) → 시차를 두고 올라옴
					const from = () => innerHeight * (0.9 + (i % cols()) * 0.3 + Math.floor(i / cols()) * 0.4);
					tl.fromTo(card, { y: from }, { y: 0, ease: "power2.out", duration: 0.46 }, 0.44);
				});
				tl.to(worksMsg, { autoAlpha: 0, ease: "none", duration: 0.2 }, 0.62)
					.fromTo(glassDim, { opacity: 0.7 }, { opacity: 0, ease: "none", duration: 0.2, immediateRender: false }, 0.62)
					.to({}, { duration: 0.1 }, 0.9);
			});
			mm.add("(max-width: 768px)", () => {
				if (!works || !workCards.length) return;
				const grid = pick(".ab_works_grid");
				// 카드 묶음 맨 위가 화면 아래 끝에서 출발 → 문장을 덮으며 올라가 맨 아래 카드가 화면 아래 40px에 닿을 때까지
				const fromY = () => innerHeight - grid.offsetTop;
				const toY = () => Math.min(0, innerHeight - 40 - grid.offsetTop - grid.offsetHeight);
				const tl = gsap.timeline({ scrollTrigger: { trigger: works, start: "top top", end: "bottom bottom", scrub: 0.6, invalidateOnRefresh: true } });
				tl.fromTo(worksMsg, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.05 }, 0.02)
					.fromTo(worksWords, { opacity: 0.16 }, { opacity: 1, ease: "none", duration: 0.03, stagger: 0.24 / Math.max(1, worksWords.length) }, 0.04)
					.fromTo(grid, { y: fromY }, { y: toY, ease: "none", duration: 0.65 }, 0.33)
					.to(worksMsg, { autoAlpha: 0, ease: "none", duration: 0.15 }, 0.47)
					.fromTo(glassDim, { opacity: 0.7 }, { opacity: 0, ease: "none", duration: 0.15, immediateRender: false }, 0.47)
					.to({}, { duration: 0.02 }, 0.98);
			});

			// ③ 진행 과정: 위 점선 2개 → 아래 점선 2개가 스크롤에 따라 그어짐
			if (flowLines.length) {
				const tl = gsap.timeline({ scrollTrigger: { trigger: pick(".ab_flow_panel"), start: "top 70%", end: "bottom 70%", scrub: 0.6 } });
				tl.to(flowLines.slice(0, 2), { scaleY: 1, ease: "none", duration: 1 }, 0).to(flowLines.slice(2), { scaleY: 1, ease: "none", duration: 1 }, 1.4);
			}

			// 그라데이션(.ab_grad)이 화면 맨 위에 걸린 동안 헤더 맨 위 배경색 띠(.hd_edge)를 숨김 (밝아지는 그라데이션 위에 검은 줄로 보이지 않게)
			const grad = pick(".ab_grad");
			if (grad) ScrollTrigger.create({ trigger: grad, start: "top top", end: "bottom top", onToggle: (st) => setEdgeOff(st.isActive) });

			// 공통: 글자 올라옴 · 아래에서 올라옴 (첫 화면 것은 위 순서대로)
			const isFirst = (el) => !!el.closest(".ab_hero");
			splits.forEach((_, el) => {
				if (!isFirst(el)) ScrollTrigger.create({ trigger: el, start: "top 88%", once: true, onEnter: () => charsIn(el) });
			});
			ScrollTrigger.batch(
				rises.filter((el) => !isFirst(el)),
				{ start: "top 88%", once: true, onEnter: (batch) => riseIn(batch) },
			);

			// 글꼴이 늦게 불러와져 높이가 바뀌면 위치 다시 계산
			let alive = true;
			document.fonts?.ready.then(() => alive && ScrollTrigger.refresh());

			return () => {
				alive = false;
				mm.revert();
				setEdgeOff(false);
				root.classList.remove("is-fx");
				ready();
			};
		},
		{ scope: ref },
	);

	return (
		<div className={className} data-no-lenis={noLenis ? "" : undefined} data-hd-auto={hdAuto ? "" : undefined} ref={ref}>
			{children}
		</div>
	);
}
