"use client";

import { useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import DemoBox from "./DemoBox";
import { gsap, useGSAP, getTitleEase } from "@/lib/fx/gsap";
import { Chars } from "@/components/text/Split";

const WORD = "INTERACTIVE",
	POOL = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&*/<>";
const mobile = () => matchMedia("(max-width: 768px)").matches;

/* 데모 motion: 왼쪽 GSAP — 위: 글자 애니메이션 2개(굵은 글자가 올라옴 + 겹친 외곽선 글자 스크램블) / 아래: 카드 4장이 겹쳐 쌓였다 펼쳐짐
                오른쪽 WebGL(three.js) 인트로 격자 터널 — 마우스로 비틀림 · 시점, 클릭하면 빨라짐 */
export default function DemoMotion({ control }) {
	const ref = useRef(null);

	// GSAP 쪽
	useGSAP(
		() => {
			const box = ref.current;
			const c1 = [...box.querySelectorAll(".mo_t1 i")];
			const c2 = [...box.querySelectorAll(".mo_t2 i")];
			const cards = [...box.querySelectorAll(".mo_card")];
			const cardWrap = box.querySelector(".mo_cards");
			const STACK = { x: (i) => (i - 1.5) * 10, y: (i) => -i * 6, rotate: (i) => -6 + i * 4 }; // 겹침
			const FAN = { x: (i) => (i - 1.5) * cardWrap.clientWidth * 0.2, y: 0, rotate: (i) => (i - 1.5) * 6 }; // 펼침
			const scr = { p: 0 };
			// 무작위 글자가 섞이다가 왼쪽부터 제 글자로 맞춰짐
			const scramble = () =>
				c2.forEach((el, i) => {
					const at = (i / c2.length) * 0.7 + 0.2;
					el.textContent = scr.p >= at ? WORD[i] : scr.p <= 0 ? "" : POOL[(Math.random() * POOL.length) | 0];
				});
			gsap.set(cards, { xPercent: -50, yPercent: -50 }); // 카드 기준점 = 카드 영역 가운데
			const hideCards = () => gsap.set(cards, { x: 0, y: () => cardWrap.clientHeight, rotate: 0, autoAlpha: 0 });
			gsap.set(c1, { yPercent: 110, rotate: 10 });
			hideCards();
			scramble();
			const TITLE_EASE = getTitleEase();
			const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.4, paused: true });
			tl.to(c1, { yPercent: 0, rotate: 0, duration: 1 / 1.5, ease: TITLE_EASE, stagger: 1 / 30 }, 0)
				.to(scr, { p: 1, duration: 1.4, ease: "none", onUpdate: scramble }, 0.4)
				.to(cards, { ...STACK, autoAlpha: 1, duration: 0.7, ease: "back.out(1.4)", stagger: 0.1 }, 0.5) // 겹쳐 쌓임
				.to(cards, { ...FAN, duration: 0.8, ease: "power3.inOut", stagger: 0.04 }, 1.8) // 펼침
				.to(cards, { ...STACK, duration: 0.7, ease: "power3.inOut", stagger: { each: 0.04, from: "end" } }, 3) // 다시 겹침
				.to(c1, { yPercent: -110, rotate: -10, duration: 0.5, ease: "power2.in", stagger: 1 / 60 }, 4)
				.to(scr, { p: 0, duration: 0.5, ease: "none", onUpdate: scramble }, 4)
				.to(cards, { y: () => cardWrap.clientHeight, autoAlpha: 0, duration: 0.5, ease: "power2.in", stagger: { each: 0.05, from: "end" } }, 4)
				.set(c1, { yPercent: 110, rotate: 10 })
				.add(hideCards);
			control.setTimeline(tl);
			return () => {
				control.setTimeline(null);
				c2.forEach((el, i) => (el.textContent = WORD[i]));
			};
		},
		{ scope: ref },
	);

	// WebGL 쪽: 인트로의 격자 터널을 간단히 — 사각 틀이 앞으로 날아오며 비틀리고, 틀끼리 모서리를 선으로 이음
	const glRef = useRef(null);
	useLayoutEffect(() => {
		const glCol = glRef.current;
		// 캔버스는 매번 새로 만듦 (WebGL 컨텍스트를 해제한 캔버스는 다시 쓸 수 없음)
		const canvas = document.createElement("canvas");
		glCol.querySelector(".mo_view").appendChild(canvas);
		let renderer;
		try {
			// 모바일: 테두리 매끄럽게 처리(antialias) 끄고 해상도 1배 — 기기 픽셀 2 ~ 3배로 그리면 스크롤 중 버벅임
			renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile(), alpha: true, powerPreference: mobile() ? "low-power" : "default" });
		} catch (e) {
			glCol.style.display = "none"; // WebGL을 못 쓰면 WebGL 칸은 숨김
			return () => {
				glCol.style.display = "";
				canvas.remove();
			};
		}
		renderer.setPixelRatio(mobile() ? 1 : Math.min(2, window.devicePixelRatio || 1));
		const scene = new THREE.Scene(),
			cam = new THREE.PerspectiveCamera(60, 1, 0.05, 40);
		scene.fog = new THREE.Fog(0xf6f6f6, 2, 14); // 멀수록 배경색으로 흐려짐
		cam.position.z = 1.6;
		const N = 16; // 틀 개수 (깊이 1 간격)
		const SEG = N * 4 + (N - 1) * 4; // 틀 변 + 틀 사이 모서리 선
		const pos = new Float32Array(SEG * 2 * 3);
		const geo = new THREE.BufferGeometry();
		geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
		const mat = new THREE.LineBasicMaterial({ color: 0x222222, fog: true });
		scene.add(new THREE.LineSegments(geo, mat));
		// 크기가 실제로 바뀔 때만 다시 잡음 (같은 크기로 setSize해도 그리기 버퍼를 새로 만들어 버벅임)
		let lastW = 0,
			lastH = 0;
		const size = () => {
			const w = canvas.clientWidth,
				h = canvas.clientHeight;
			if (!w || !h || (w === lastW && h === lastH)) return;
			lastW = w;
			lastH = h;
			renderer.setSize(w, h, false);
			cam.aspect = w / h;
			cam.updateProjectionMatrix();
		};
		size();
		addEventListener("resize", size);

		const st = { off: 0, speed: 1.2, twist: 0.12, aim: 0.12, camY: 0, aimY: 0 };
		const onMove = (e) => {
			const r = canvas.getBoundingClientRect();
			st.aim = ((e.clientX - r.left) / r.width - 0.5) * 0.6; // 좌우 = 비틀림
			st.aimY = ((e.clientY - r.top) / r.height - 0.5) * -0.6; // 위아래 = 시점
		};
		const onLeave = () => ((st.aim = 0.12), (st.aimY = 0));
		const onClick = () => gsap.fromTo(st, { speed: 8 }, { speed: 1.2, duration: 1.6, ease: "power3.out" });
		canvas.addEventListener("pointermove", onMove);
		canvas.addEventListener("pointerleave", onLeave);
		canvas.addEventListener("click", onClick);

		let on = false,
			raf = 0,
			last = 0,
			t = 0;
		const corner = (z, a, k) => {
			const ang = a + (k * Math.PI) / 2 + Math.PI / 4;
			return [Math.cos(ang) * 1.41, Math.sin(ang) * 1.41, z];
		};
		const tick = (now) => {
			const dt = Math.min(0.05, ((now || 0) - (last || now || 0)) / 1000);
			last = now || 0;
			t += dt;
			st.off = (st.off + dt * st.speed) % 1;
			st.twist += (st.aim - st.twist) * 0.05;
			st.camY += (st.aimY - st.camY) * 0.05;
			cam.position.y = st.camY;
			cam.lookAt(0, 0, -6);
			// 틀 위치: 뒤(-N)에서 앞(0)으로, 깊이에 따라 비틀림
			const frames = [];
			for (let k = 0; k < N; k++) {
				const z = -N + k + st.off + 1;
				const a = z * st.twist + t * 0.15;
				frames.push([0, 1, 2, 3].map((c) => corner(z, a, c)));
			}
			let i = 0;
			const put = (p) => {
				pos[i++] = p[0];
				pos[i++] = p[1];
				pos[i++] = p[2];
			};
			frames.forEach((f, k) => {
				for (let c = 0; c < 4; c++) {
					put(f[c]);
					put(f[(c + 1) % 4]); // 틀 변
					if (k < N - 1) {
						put(f[c]);
						put(frames[k + 1][c]); // 다음 틀 모서리와 이음
					}
				}
			});
			geo.attributes.position.needsUpdate = true;
			renderer.render(scene, cam);
			raf = on ? requestAnimationFrame(tick) : ((last = 0), 0);
		};
		// 실제로 화면에 보이는 동안만 그림 (sticky로 고정된 실제 위치를 봄)
		const io = new IntersectionObserver(([en]) => {
			on = en.isIntersecting;
			if (on) {
				size();
				if (!raf) raf = requestAnimationFrame(tick);
			}
		});
		io.observe(canvas);
		tick(0);

		return () => {
			io.disconnect();
			cancelAnimationFrame(raf);
			removeEventListener("resize", size);
			canvas.removeEventListener("pointermove", onMove);
			canvas.removeEventListener("pointerleave", onLeave);
			canvas.removeEventListener("click", onClick);
			gsap.killTweensOf(st);
			geo.dispose();
			mat.dispose();
			renderer.dispose();
			renderer.forceContextLoss(); // 페이지를 오가도 WebGL 컨텍스트가 쌓이지 않게
			canvas.remove();
		};
	}, []);

	return (
		<DemoBox kind="motion" control={control} boxRef={ref}>
			<div className="mo_wrap">
				<div className="mo_col mo_gsap">
					<em>GSAP</em>
					<div className="mo_view mo_type">
						<div className="mo_txt">
							<p className="mo_t1">
								<span>
									<Chars text="SCROLL" />
								</span>
								<span>
									<Chars text="MOTION" />
								</span>
							</p>
							<p className="mo_t2">
								<Chars text={WORD} />
							</p>
						</div>
						<div className="mo_cards">
							{Array.from({ length: 4 }, (_, i) => (
								<i className="mo_card" key={i}>
									<b></b>
									<b></b>
								</i>
							))}
						</div>
					</div>
				</div>
				<div className="mo_col mo_gl" ref={glRef}>
					<em>WebGL</em>
					<div className="mo_view"></div>
				</div>
			</div>
		</DemoBox>
	);
}
