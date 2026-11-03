"use client";

import { useMemo, useRef } from "react";
import { gsap, ScrollTrigger, useGSAP, getTitleEase } from "@/lib/fx/gsap";
import { createDemoControl } from "@/lib/fx/demo-control";
import { Chars } from "@/components/text/Split";
import DemoLH from "./DemoLH";
import DemoCMP from "./DemoCMP";
import DemoGrid from "./DemoGrid";
import DemoMotion from "./DemoMotion";
import DemoSEO from "./DemoSEO";

// 강점 — [영문 제목, 한글 제목, 번호, 설명 제목, 설명 줄들, 데모]
const ITEMS = [
	[
		"Detail",
		"디테일",
		"픽셀 단위까지 맞추는 디테일",
		["디자인 시안과 실제 화면이 다르지 않도록", "여백, 글자 간격, 움직임 하나까지 직접 맞춥니다.", "작은 차이가 브랜드의 인상을 만든다고 믿습니다."],
		DemoLH,
	],
	[
		"Style",
		"타이포 · 컬러 · 라운드",
		"오래 봐도 눈이 편한 디자인",
		["같은 내용이라도 정해진 컬러와", "굵기, 라운드,간격으로 정리하면 훨씬 편하게 읽힙니다.", "눈이 편한 화면은 방문자를 더 오래 머물게 합니다."],
		DemoCMP,
	],
	[
		"Grid",
		"그리드 · 컴포넌트 · 통일성",
		"그리드와 같은 컴포넌트로 만드는 화면",
		["12칸 그리드 위에 모든 요소를 배치하고,", "버튼 · 카드 같은 컴포넌트는 한 번 만든 것을 사이트 전체에서 똑같이 씁니다.", "페이지가 늘어나도 흐트러지지 않는, 눈이 편한 사이트가 됩니다."],
		DemoGrid,
	],
	[
		"Motion",
		"인터랙션",
		"GSAP · WebGL 인터랙티브 사이트",
		["GSAP 스크롤 애니메이션과 WebGL 3D 그래픽으로,", "보는 것만으로 기억에 남는 인터랙티브 사이트를 만듭니다.", "지금 보고 계신 이 사이트처럼요."],
		DemoMotion,
	],
	[
		"Search",
		"검색 · 마케팅",
		"검색 노출부터 마케팅 도구까지",
		["메타 태그 · 구조화 데이터로 검색 최적화(SEO · GEO)를 하고,", "구글 서치콘솔 · 네이버 서치어드바이저 등록과 GA4 애널리틱스 설치까지", "대신해 드립니다. 오픈 첫날부터 방문 데이터를 보며 마케팅을 시작할 수 있습니다."],
		DemoSEO,
	],
];
const CONTACT = ["Contact", "상담 문의"];

const lines = (arr) => arr.flatMap((t, i) => (i ? [<br key={i} />, t] : [t]));
const mobile = () => matchMedia("(max-width: 768px)").matches;

/* We Are (강점) 섹션 (원본: js/weare.js)
   - 제목 WE ARE: PC는 3화면 동안 고정 (글자 올라옴 → 투명 → 세로선 → 아래 내용이 올라와 덮음), 모바일은 글자만 올라옴
   - 왼쪽 반(.weare_side)은 화면에 고정, 강점 제목이 한 칸에 겹쳐 있음
     오른쪽 설명(.weare_itm)이 화면 가운데를 지날 때마다 왼쪽 제목이 바뀜 (글자가 위로 빠지며 10° 회전 → 새 제목이 아래에서 올라옴)
   - 설명은 화면에 들어오면 번호 · 제목 · 글 · 데모가 차례로 아래에서 올라옴, 데모는 그때부터 반복 재생
   - 설명 칸 내용은 .weare_body로 감쌈 → CSS가 한 칸을 160svh로 늘리고 내용을 화면에 고정 (.is-pin)
   - 모바일(768px 이하)용 제목: 설명 칸마다 맨 위에 큰 제목(.weare_mword — PC에선 CSS로 숨김)
   contactForm: 마지막 칸 상담 폼 (서버에서 토큰을 넣어 만든 <ContactForm />) */
export default function Weare({ contactForm }) {
	const ref = useRef(null);
	const controls = useMemo(() => ITEMS.map(() => createDemoControl()), []);

	useGSAP(
		(_, contextSafe) => {
			const section = ref.current;
			// 모바일 주소창이 나타나고 사라질 때(높이만 바뀜) 트리거 위치를 다시 계산하지 않음
			ScrollTrigger.config({ ignoreMobileResize: true });
			const TITLE_EASE = getTitleEase();
			const words = [...section.querySelectorAll(".weare_words li")];
			const panels = [...section.querySelectorAll(".weare_itm")];
			const countEl = section.querySelector(".weare_count b");
			const offs = [];

			// 화면보다 긴 내용 상자(상담 폼 등): 위가 아니라 아랫부분이 화면 바닥에 닿은 채 고정 — 내용 높이가 바뀌면 다시 계산
			const fitSticky = (b) => (b.style.top = Math.min(0, innerHeight - b.offsetHeight) + "px");
			const bodies = [...section.querySelectorAll(".weare_body")];
			const ro = new ResizeObserver((ens) => ens.forEach((en) => fitSticky(en.target)));
			bodies.forEach((b) => ro.observe(b));
			const onResize = () => bodies.forEach(fitSticky);
			addEventListener("resize", onResize);
			offs.push(() => {
				ro.disconnect();
				removeEventListener("resize", onResize);
				bodies.forEach((b) => (b.style.top = ""));
			});

			/* ---------- 섹션 제목 WE ARE ---------- */
			const titEl = section.querySelector(".weare_tit");
			const intro = section.querySelector(".weare_intro");
			const tChars = [...titEl.children];
			const tLine = intro.querySelector(".weare_tit_line");
			gsap.set(tChars, { yPercent: 110, rotate: 10, force3D: true, willChange: "transform" }); // 아래로 숨음
			// 처음부터 끝까지 같은 그리기 층(GPU 레이어)으로 고정 — 그리기 방식이 바뀌며 글자가 미세하게 "확" 튀던 것 방지
			gsap.set(titEl, { willChange: "opacity" });
			const charsIn = contextSafe(() => {
				gsap.killTweensOf(tChars);
				gsap.to(tChars, { yPercent: 0, rotate: 0, duration: 1 / 1.5, ease: TITLE_EASE, stagger: 1 / 30, force3D: true });
			});
			const charsOut = contextSafe(() => {
				gsap.killTweensOf(tChars);
				gsap.to(tChars, { yPercent: 110, rotate: 10, duration: 0.4, ease: "power2.in", stagger: 1 / 60, force3D: true });
			});
			const pinEl = intro.querySelector(".weare_intro_pin") || intro;
			if (mobile()) {
				// 모바일: 고정하지 않음 (손가락 스크롤과 고정이 어긋나 흔들림) — 화면에 들어오면 글자만 올라옴
				ScrollTrigger.create({ trigger: pinEl, start: "top 70%", onEnter: charsIn, onLeaveBack: charsOut });
			} else {
				// PC: .weare_intro.is-hold가 300svh 높이로 자리를 만듦 → 마지막 1화면 동안 아래 내용이 위로 올라와 덮음
				intro.classList.add("is-hold");
				offs.push(() => intro.classList.remove("is-hold"));
				gsap.timeline({
					defaults: { ease: "none" },
					scrollTrigger: {
						trigger: pinEl,
						start: "top top", // 고정 시작 = 그라데이션 끝
						end: "+=300%",
						pin: true,
						pinSpacing: false, // 고정된 동안 뒤 내용이 위로 올라와 덮도록
						scrub: true, // 스크롤과 1:1 (부드러움은 Lenis가 이미 줌)
						onEnter: charsIn,
						onEnterBack: charsIn,
						onLeaveBack: charsOut,
					},
				})
					.to(titEl, { autoAlpha: 0, duration: 0.6, ease: "power1.inOut" }, 0.75) // 0.75 ~ 1.35화면: 투명
					.fromTo(tLine, { scaleY: 0 }, { scaleY: 1, duration: 0.8, ease: "power1.inOut" }, 0.95) // 0.95 ~ 1.75화면: 세로선 내려옴
					.to({}, { duration: 1.25 }, 1.75); // 1.75 ~ 3화면: 그대로 (아래 내용이 올라와 덮음)
			}
			ScrollTrigger.refresh(); // 고정으로 바뀐 위치만큼 아래 트리거 위치 다시 계산

			/* ---------- 왼쪽 제목 전환 + 설명 등장 ---------- */
			const parts = words.map((li) => ({ big: [...li.querySelectorAll("b i")], small: [...li.querySelectorAll("span i")] }));
			const CH = { duration: 1 / 1.5, ease: TITLE_EASE };
			const pose = (v) => ({ yPercent: -110 * v, rotate: -10 * v }); // v: -1 아래로 숨음 / 0 제자리 / 1 위로 숨음
			parts.forEach(({ big, small }) => gsap.set([...big, ...small], pose(-1)));

			// 빠른 스크롤(px/초)이면 애니메이션 없이 바로 끝 상태로 (여러 칸 애니메이션이 한꺼번에 몰려 버벅이지 않게)
			const FAST = 2500;
			const isFast = (self) => Math.abs(self.getVelocity()) > FAST;
			const setCount = (next) => {
				const isContact = !!words[next] && words[next].classList.contains("is-contact"); // 상담 문의는 번호 없이 숨김
				countEl.parentNode.classList.toggle("is-hide", isContact);
				if (!isContact) countEl.textContent = String(next + 1).padStart(2, "0");
			};
			offs.push(() => {
				countEl.parentNode.classList.remove("is-hide");
				countEl.textContent = "01";
			});

			let cur = -1;
			const go = contextSafe((next, instant) => {
				if (next === cur) return;
				const prev = cur,
					dir = next > prev ? 1 : -1; // 1: 아래로 스크롤 (위로 빠지고 아래에서 올라옴)
				cur = next;
				if (instant) {
					parts.forEach(({ big, small }, j) => {
						gsap.killTweensOf([...big, ...small]);
						gsap.set([...big, ...small], pose(j === next ? 0 : -1));
					});
					if (next >= 0) setCount(next);
					return;
				}
				// 지금 · 이전 칸 말고는 바로 숨김 (빠르게 훑고 지나간 칸의 애니메이션이 남지 않게)
				parts.forEach(({ big, small }, j) => {
					if (j === next || j === prev) return;
					gsap.killTweensOf([...big, ...small]);
					gsap.set([...big, ...small], pose(-1));
				});
				if (prev >= 0) {
					const { big, small } = parts[prev];
					gsap.killTweensOf([...big, ...small]);
					gsap.to(big, { ...CH, ...pose(dir), stagger: 1 / 30 });
					gsap.to(small, { ...CH, ...pose(dir), stagger: 1 / 60 });
				}
				const delay = prev >= 0 ? 0.2 : 0;
				if (next >= 0 && parts[next]) {
					const { big, small } = parts[next];
					gsap.killTweensOf([...big, ...small]);
					gsap.fromTo(big, pose(-dir), { ...CH, ...pose(0), stagger: 1 / 30, delay });
					gsap.fromTo(small, pose(-dir), { ...CH, ...pose(0), stagger: 1 / 60, delay: delay + 0.15 });
					setCount(next);
				}
			});
			// 한 프레임에 여러 칸을 지나가면 마지막 칸으로 한 번만 전환 (그 사이 한 번이라도 빠르게 지나갔으면 애니메이션 없이)
			let goNext = null,
				goFast = false,
				goRaf = 0;
			const goSoon = (next, fast) => {
				if (mobile()) return; // 모바일은 왼쪽 제목 영역이 숨겨져 있음
				goNext = next;
				goFast = goFast || fast;
				if (!goRaf)
					goRaf = requestAnimationFrame(() => {
						goRaf = 0;
						go(goNext, goFast);
						goFast = false;
					});
			};
			offs.push(() => cancelAnimationFrame(goRaf));

			panels.forEach((panel, i) => {
				// PC: 설명 칸 맨 위가 화면 50%에 오면 왼쪽 제목 → 20%에 오면 오른쪽 내용 / 모바일: 60% 제목 · 70% 내용
				const body = panel.querySelector(".weare_body") || panel;
				ScrollTrigger.create({
					trigger: panel,
					start: () => (mobile() ? "top 60%" : "top 50%"),
					end: () => (mobile() ? "bottom 60%" : "bottom 50%"),
					onEnter: (self) => goSoon(i, isFast(self)),
					onEnterBack: (self) => goSoon(i, isFast(self)),
					onLeaveBack: (self) => i === 0 && goSoon(-1, isFast(self)),
				});
				// 설명 내용: 차례로 아래에서 올라옴 → 위로 되돌리면 2.5배 빠르게 되감음 · 빠르게 훑으면 바로 끝 상태로
				const demo = controls[i];
				const rev = gsap.from(body.children, { y: 60, autoAlpha: 0, duration: 1, ease: "power3.out", stagger: 0.12, paused: true });
				ScrollTrigger.create({
					trigger: panel,
					start: () => (mobile() ? "top 70%" : "top 20%"),
					onEnter: (self) => {
						if (isFast(self)) rev.timeScale(1).progress(1).pause();
						else rev.timeScale(1).play();
						demo?.start();
					},
					onLeaveBack: (self) => {
						if (isFast(self)) rev.progress(0).pause();
						else rev.timeScale(2.5).reverse();
						demo?.stop();
					},
				});
			});
			offs.push(() => controls.forEach((c) => c.stop()));

			return () => offs.forEach((fn) => fn());
		},
		{ scope: ref },
	);

	return (
		<section className="weare is-pin is-fx" ref={ref}>
			<div className="weare_head"></div>
			<div className="weare_intro" data-hd-light="">
				<div className="weare_intro_pin">
					<h2 className="weare_tit">
						<Chars text="We Are" />
					</h2>
					<i className="weare_tit_line" aria-hidden="true"></i>
				</div>
			</div>
			<div className="weare_inner" data-hd-light="">
				<div className="weare_side">
					<ul className="weare_words" aria-hidden="true">
						{[...ITEMS, CONTACT].map(([en, ko]) => (
							<li key={en} className={en === CONTACT[0] ? "is-contact" : undefined}>
								<b>
									<Chars text={en} />
								</b>
								<span>
									<Chars text={ko} />
								</span>
							</li>
						))}
					</ul>
					<p className="weare_count">
						<b>01</b> / 05
					</p>
				</div>

				<div className="weare_list">
					{ITEMS.map(([en, ko, tit, desc, Demo], i) => (
						<article className="weare_itm" key={en}>
							<div className="weare_body">
								<p className="weare_mword" aria-hidden="true">
									<b>{en}</b>
									<span>{ko}</span>
								</p>
								<span className="num">{String(i + 1).padStart(2, "0")}</span>
								<h3>{tit}</h3>
								<p>{lines(desc)}</p>
								<Demo control={controls[i]} />
							</div>
						</article>
					))}
					<article className="weare_itm weare_contact">
						<div className="weare_body">
							<p className="weare_mword is-contact" aria-hidden="true">
								<b>{CONTACT[0]}</b>
								<span>{CONTACT[1]}</span>
							</p>
							<h3>프로젝트 상담 문의</h3>
							{contactForm}
						</div>
					</article>
				</div>
			</div>
		</section>
	);
}
