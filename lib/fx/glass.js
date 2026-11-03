/* glass.js — 메인 비주얼: 인트로(조각이 모여 유리 도형) + 유리 도형 + 타이틀 (원본: js/visual.js)
   createGlass(options) → destroy()  (컴포넌트가 사라질 때 WebGL · 이벤트 · 애니메이션을 모두 정리)
   마크업: .visual > .slg .tit h2 (타이틀 문구) + .canvas_wrap (캔버스 자리) + .brand p (글자마다 <i>, components/home/Visual.js가 나눠 둠)
   배경 전용(bgOnly — 회사소개): [data-glass-bg] 안에 유리 도형, [data-glass-title] 제목 (인트로 · 드래그 · 섹션 제목 없음)

   구성
     1. 설정
     2. 렌더러 · 타이틀 글자 캔버스
     3. 셰이더 (배경 · 글자 오버레이 · 유리 · 격자 유리 칸막이)
     4. 도형 (4 · 6각 너트 · 원형 링, 같은 정점 수로 만들어 바로 보간)
     5. 입력 (드래그 회전)
     6. 인트로 (조각이 하나씩 날아와 유리 도형 → 타이틀)
     7. 스크롤 (타이틀 위로 빠짐, 인트로 중 스크롤 잠금)
     8. 매 프레임 (변형 · 자세 · 렌더) */
import * as THREE from "three";
import { gsap, ScrollTrigger, getTitleEase } from "./gsap";
import { createScope } from "./scope";
import { glass, emitSecOut } from "./bridge";
import { getLenis } from "./smooth-scroll";

/* ───────── 1. 설정 ───────── */
const DEFAULTS = {
	// 배경
	bgColor: "#000000",
	bgColor2: "", // 오른쪽 위 은은한 빛 (비우면 단색)
	bgGlowSize: 0.5,
	// 유리
	refraction: 1, // 굴절 세기
	chroma: 0.12, // 무지개 번짐
	saturation: 0, // 채도 (0 = 흑백)
	blur: 0.03, // 유리 속 번짐
	clear: 1, // 투명도 0~1
	shine: 0.45, // 하이라이트 세기
	backBright: 0.65, // 뒷면 밝기
	rimWhite: 1, // 실루엣 흰 테두리
	lightReflect: 0.2, // 밝은 반사 띠
	envReflect: 0.95, // 스튜디오 조명 반사
	edgeLine: 0.8, // 모서리·옆면 흰 하이라이트
	holeHide: 1, // 1 = 유리 몸통 너머로는 구멍이 안 비침
	bloom: 0.9, // 밝은 부분 빛 번짐
	// 격자 유리 칸막이 (화면 전체)
	flute: 8, // 도형이 어긋나는 최대 거리(px)
	fluteText: 2, // 글자가 어긋나는 최대 거리(px)
	fluteWidth: 40, // 칸 하나 폭(px)
	// 타이틀 글자
	textColor: "#ffffff",
	pointColor: "#ffffff", // 마지막 "." 색
	fontFamily: "Paperlogy",
	textWeight: 900,
	textSize: 120, // px — 화면 1024px 초과 (섹션 제목 — 타이틀은 titleScale을 곱함)
	titleScale: 148 / 120, // 타이틀(ondoor.)만 키우는 배율
	textSizeM: 11.7, // vw — 화면 1024px 이하
	lineHeight: 1,
	textAnchor: "center", // "center" | "left-bottom" | "stagger"
	staggerGap: 0.5,
	titleLines: null,
	responsive: { 480: { textSizeM: 13 } },
	// 움직임
	scrollSpin: Math.PI / 4, // 화면 한 장 스크롤할 때 세로축(Y)으로 도는 각도
	morph: 3.0, // 변형 시간(초)
	autoMorph: 7.0, // 자동 변형 간격(초)
	spin: 0.8, // 계속 도는 속도(라디안/초)
	dragSpeed: 0.008,
	dragInertia: 0.95,
	introSpeed: 1.15, // 인트로 속도
	mobileDpr: 1.8,
	mobileSamples: 8,
};

export function createGlass(options = {}) {
	const CFG = Object.assign({}, DEFAULTS, options);
	const BG_ONLY = !!CFG.bgOnly;
	const sc = createScope(); // 이벤트 · 옵저버 · 만든 요소 정리
	const ctx = gsap.context(() => {}); // 이 안에서 만든 트윈 · 타임라인은 destroy 때 한꺼번에 정리
	const disposables = []; // WebGL 자원
	let dead = false,
		rafId = 0;

	const destroy = () => {
		dead = true;
		cancelAnimationFrame(rafId);
		ctx.revert();
		sc.dispose();
		disposables.forEach((d) => {
			try {
				d.dispose();
			} catch (e) {}
		});
	};

	init().catch((e) => console.error(e));
	return destroy;

	async function init() {
		const wrap = document.querySelector(BG_ONLY ? "[data-glass-bg]" : ".visual .canvas_wrap");
		if (!wrap) return;
		const root = document.documentElement;
		const reduce = false; // 움직임 줄이기 설정을 무시하고 항상 재생 (원본과 같음)
		const MOBILE = matchMedia("(hover: none) and (pointer: coarse)").matches;
		const SAMPLES = Math.max(1, Math.round(MOBILE ? CFG.mobileSamples : 16));
		const DPR = Math.min(window.devicePixelRatio || 1, MOBILE ? CFG.mobileDpr : 2);

		/* ───────── 2. 렌더러 · 글자 캔버스 ───────── */
		const keepPos = wrap.style.position;
		if (getComputedStyle(wrap).position === "static") wrap.style.position = "relative";
		sc.add(() => {
			wrap.style.position = keepPos;
			wrap.style.cursor = "";
		});
		const canvas = document.createElement("canvas");
		canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;";
		wrap.appendChild(canvas);
		sc.add(() => canvas.remove());
		let renderer;
		try {
			renderer = new THREE.WebGLRenderer({ canvas, antialias: !MOBILE });
		} catch (e) {
			// WebGL을 못 쓰면 DOM 타이틀을 그대로 보여줌
			canvas.remove();
			const host = wrap.closest(".visual") || document.body;
			host.classList.add("is-no-webgl");
			sc.add(() => host.classList.remove("is-no-webgl"));
			root.classList.remove("intro-pending", "intro-lock");
			return;
		}
		sc.add(() => {
			renderer.dispose();
			renderer.forceContextLoss(); // 페이지를 오가도 WebGL 컨텍스트가 쌓이지 않게
		});
		renderer.setPixelRatio(DPR);
		renderer.setClearColor(new THREE.Color(CFG.bgColor), 1);
		renderer.autoClear = false;

		// 타이틀 문구 (<br>로 줄 나눔, .point는 마지막 줄 끝 점) — DOM 글자는 숨기고 캔버스로 그림
		const titleEl = document.querySelector(BG_ONLY ? "[data-glass-title]" : ".slg .tit h2");
		let lines = BG_ONLY ? [] : ["DETAIL", "ORIENTED"],
			pointText = ".";
		if (titleEl) {
			lines = [""];
			pointText = "";
			titleEl.childNodes.forEach((nd) => {
				if (nd.nodeName === "BR") lines.push("");
				else if (nd.classList && nd.classList.contains("point")) pointText = nd.textContent.trim();
				else lines[lines.length - 1] += nd.textContent;
			});
			lines = lines.map((l) => l.trim().toUpperCase());
			if (pointText) lines[lines.length - 1] = lines[lines.length - 1].replace(/\.$/, "");
			titleEl.style.opacity = 0;
			sc.add(() => (titleEl.style.opacity = ""));
		}
		if (Array.isArray(CFG.titleLines) && CFG.titleLines.length) {
			lines = CFG.titleLines.map((l) => String(l).trim().toUpperCase());
			pointText = /\.$/.test(lines[lines.length - 1]) ? "." : "";
			if (pointText) lines[lines.length - 1] = lines[lines.length - 1].slice(0, -1);
		}
		// 아래 섹션 제목들 (What We Do …): 캔버스에 타이틀과 같은 방식으로 그려짐
		const secs = BG_ONLY
			? []
			: [...document.querySelectorAll(".service_tit h2, .project_tit h2")].map((el) => ({ el, text: el.textContent.trim().toUpperCase() })).filter((s) => s.text);
		sc.add(() => secs.forEach((s) => (s.el.style.fontSize = "")));

		// 브랜드 설명 (.visual .brand p): 스크롤하면 가운데 타이틀이 왼쪽으로 가면서 오른쪽에 나타나고, 스크롤한 만큼 글자가 채워짐
		const brand = BG_ONLY ? null : document.querySelector(".visual .brand");
		const FRONT = brand ? 1 : 0; // 맨 처음 구간: 타이틀은 제자리, 스크롤만큼 도형이 좌우로 돎
		const PAUSE = brand ? 0.5 : 0; // 타이틀이 옆으로 가기 전 제자리 구간
		const LEAD = FRONT + PAUSE;
		const HOLD = brand ? 2 : 0; // 앞 25%: 타이틀이 왼쪽 위로 이동 + 설명 나타남 / 25~90%: 글자 채움
		const brandP = brand && (brand.querySelector("p") || brand);
		const brandChars = brandP ? [...brandP.querySelectorAll("i")] : []; // 글자마다 <i> (Visual.js가 나눠 둠)
		if (brand)
			sc.add(() => {
				brand.style.opacity = brand.style.visibility = brand.style.top = "";
				brandP.style.transform = "";
				brandChars.forEach((el) => (el.style.color = ""));
			});
		const SLIDE = !!brand && CFG.textAnchor !== "left-bottom";
		const slide = { v: reduce ? 1 : 0, op: reduce ? 1 : 0, dx: 0, dy: 0, k: 1 };
		const scrollArrow = BG_ONLY ? null : document.querySelector(".visual .scroll_arrow");
		if (scrollArrow) sc.add(() => (scrollArrow.style.opacity = scrollArrow.style.visibility = ""));
		let brandOn = reduce;
		const showBrand = (o) => (brandOn = o);
		let brandHead = -1;
		function fillBrand(t) {
			if (!brandChars.length) return;
			const n = brandChars.length,
				SOFT = 6;
			const p = reduce ? 1 : Math.min(1, Math.max(0, (t - LEAD - HOLD * 0.25) / (HOLD * 0.65)));
			const head = Math.round(p * (n + SOFT) * 4) / 4;
			if (head === brandHead) return;
			brandHead = head;
			brandChars.forEach((el, i) => {
				const k = Math.min(1, Math.max(0, (head - i) / SOFT));
				el.style.color = `rgba(255, 255, 255, ${(0.2 + 0.8 * k).toFixed(2)})`;
			});
		}
		fillBrand(0);

		try {
			await document.fonts.load(`${CFG.textWeight} 120px "${CFG.fontFamily}"`);
		} catch (e) {}
		if (dead) return;

		// 글자 크기: 1024px 초과 = textSize(px), 이하 = textSizeM(vw)
		function fontSize(W) {
			if (W > 1024) return CFG.textSize;
			let m = CFG.textSizeM;
			Object.keys(CFG.responsive || {})
				.map(Number)
				.sort((a, b) => b - a)
				.forEach((bp) => {
					if (W <= bp && CFG.responsive[bp].textSizeM) m = CFG.responsive[bp].textSizeM;
				});
			return (W * m) / 100;
		}
		// 레이아웃 양옆 여백과 같은 값: 1660px 초과 80 / 768px 초과 40 / 이하 20
		const sideOf = (W) => (W > 1660 ? 80 : W > 768 ? 40 : 20);
		const LB = CFG.textAnchor === "left-bottom";

		function makeTextCanvas() {
			const c = document.createElement("canvas");
			const tex = new THREE.CanvasTexture(c);
			tex.minFilter = THREE.LinearFilter;
			tex.generateMipmaps = false;
			disposables.push(tex);
			return { c, ctx: c.getContext("2d"), tex };
		}
		const titleCv = makeTextCanvas(),
			secCv = makeTextCanvas();

		// 글자별 상태 v: -1 = 아래로 숨음 / 0 = 제자리 / 1 = 위로 숨음
		const PLAY_INTRO = !reduce && !BG_ONLY;
		const TITLE_RISE = PLAY_INTRO || BG_ONLY;
		const titleChars = lines.map((ln, i) => Array.from(ln + (i === lines.length - 1 ? pointText : "")).map(() => ({ v: TITLE_RISE ? -1 : 0 })));
		const titleFlat = titleChars.flat();
		secs.forEach((s) => {
			s.chars = Array.from(s.text).map(() => ({ v: -1 }));
			s.move = { p: 0 };
			s.rect = null;
		});
		const secChars = secs[0] ? secs[0].chars : [];
		const secMove = secs[0] ? secs[0].move : { p: 0 };
		let txtDirty = false;
		const markDirty = () => (txtDirty = true);

		const fontOf = (fs) => `${CFG.textWeight} ${fs}px ${CFG.fontFamily}, "Arial Black", sans-serif`;
		let titleFsW = -1,
			titleFsV = 0;
		function titleFs(W) {
			if (W === titleFsW) return titleFsV;
			const c2 = titleCv.ctx,
				fs = fontSize(W) * CFG.titleScale;
			c2.font = fontOf(fs);
			const widest = Math.max(...lines.map((ln, i) => c2.measureText(ln + (i === lines.length - 1 ? pointText : "")).width)),
				room = W - sideOf(W) * 2;
			titleFsW = W;
			titleFsV = widest > room ? (fs * room) / widest : fs;
			return titleFsV;
		}
		function prepCanvas({ c, ctx: c2 }, W, H, size) {
			const nw = Math.max(2, Math.floor(W * DPR)),
				nh = Math.max(2, Math.floor(H * DPR));
			if (c.width !== nw) c.width = nw;
			if (c.height !== nh) c.height = nh;
			c2.setTransform(DPR, 0, 0, DPR, 0, 0);
			c2.clearRect(0, 0, W, H);
			const fs = size || fontSize(W);
			c2.font = fontOf(fs);
			c2.textAlign = "left";
			c2.textBaseline = "alphabetic";
			return { fs, lh: fs * CFG.lineHeight, capH: c2.measureText("H").actualBoundingBoxAscent || fs * 0.72 };
		}
		// 한 줄을 글자별로 그림: 줄 마스크 안에서 글자가 위·아래로 이동 + 회전
		function drawCharsLine(c2, str, x, y, states, colorAt, capH, fs, lh, W) {
			c2.save();
			c2.beginPath();
			c2.rect(-fs, y - capH - fs * 0.2, W + fs * 2, capH + fs * 0.45);
			c2.clip();
			for (let k = 0; k < str.length; k++) {
				const v = states[k].v;
				if (Math.abs(v) >= 1 || str[k] === " ") continue;
				const cx = x + c2.measureText(str.slice(0, k)).width;
				const cw = c2.measureText(str[k]).width;
				c2.save();
				c2.translate(cx + cw / 2, y - capH / 2 - v * lh * 1.1);
				c2.rotate((-v * 10 * Math.PI) / 180);
				c2.fillStyle = colorAt(k);
				c2.fillText(str[k], -cw / 2, capH / 2);
				c2.restore();
			}
			c2.restore();
		}
		function drawTitle(W, H) {
			const { ctx: c2 } = titleCv;
			const { fs, lh, capH } = prepCanvas(titleCv, W, H, titleFs(W));
			const n = lines.length,
				side = sideOf(W);
			const ST = CFG.textAnchor === "stagger" && n > 1,
				stStep = capH * (1 + CFG.staggerGap),
				stH = capH + stStep * (n - 1);
			let base = ST ? H / 2 - stH / 2 + capH : LB ? H - side - lh * (n - 1) : H / 2 - (capH + lh * (n - 1)) / 2 + capH;
			// SLIDE: [타이틀 + 간격 + 브랜드 설명] 한 덩어리가 화면 세로 가운데에 오도록 — 이동 거리만 계산, 매 프레임 uOff로 레이어만 옮김
			const shrink = Math.min(1, fontSize(W) / fs);
			if (SLIDE && brandP) {
				const GAP = W > 768 ? 40 : 24,
					titleH = ST ? stH : capH + lh * (n - 1),
					titleH2 = titleH * shrink,
					descH = brandP.offsetHeight;
				slide.dy = (titleH2 - GAP - descH) / 2 - titleH / 2;
				brand.style.top = (H / 2 + (titleH2 + GAP - descH) / 2).toFixed(1) + "px";
			}
			slide.k = shrink;
			slide.dx = 0;
			let anchX = Infinity;
			lines.forEach((ln, i) => {
				const str = ln + (i === n - 1 ? pointText : "");
				const mt = c2.measureText(str);
				const xL = side + (mt.actualBoundingBoxLeft || 0),
					xC = W / 2 - mt.width / 2,
					xR = W - side - (mt.actualBoundingBoxRight || mt.width);
				if (SLIDE && !ST) slide.dx = Math.min(slide.dx, xL - xC);
				const x = ST ? (i === 0 ? xL : i === n - 1 ? xR : xC) : LB ? xL : xC;
				const y = base + (ST ? stStep : lh) * i;
				drawCharsLine(c2, str, x, y, titleChars[i], (k) => (k >= ln.length ? CFG.pointColor : CFG.textColor), capH, fs, lh, W);
				anchX = Math.min(anchX, x - (mt.actualBoundingBoxLeft || 0));
				if (i === n - 1) titleFx.uAnch.value.set(anchX * DPR, (H - y) * DPR);
			});
			titleCv.tex.needsUpdate = true;
		}
		// 섹션 제목: 화면 가운데에서 글자가 올라오고, move.p만큼 DOM 제목 자리로 이동
		const secVisible = (s) => s.chars.some((c) => Math.abs(c.v) < 1);
		function drawSec(W, H) {
			if (!secs.length) return;
			const { ctx: c2 } = secCv;
			const { fs, lh, capH } = prepCanvas(secCv, W, H);
			const side = sideOf(W);
			const setFont = (f) => (c2.font = `${CFG.textWeight} ${f}px ${CFG.fontFamily}, "Arial Black", sans-serif`);
			secs.forEach((s) => {
				// 1024px 이하는 왼쪽 여백(side) · 오른쪽 여백(side × 2)이 남도록 글자 폭을 화면에 맞춤 — DOM 제목도 같은 크기로
				let f = fs,
					k = 1;
				if (W <= 1024) {
					setFont(fs);
					f = (fs * (W - side * 3)) / (c2.measureText(s.text).width || 1);
					k = f / fs;
				}
				const domSize = W <= 1024 ? f.toFixed(1) + "px" : "";
				if (s.el.style.fontSize !== domSize) s.el.style.fontSize = domSize;
				if (!secVisible(s)) return;
				setFont(f);
				const mt = c2.measureText(s.text),
					abl = mt.actualBoundingBoxLeft || 0,
					c = capH * k;
				let x = LB ? side + abl : W / 2 - mt.width / 2,
					y = LB ? H - side : H / 2 + c / 2;
				s.drawn = null;
				if (s.move.p > 0) {
					const r = s.el.getBoundingClientRect();
					x += (r.left + abl - x) * s.move.p;
					y += (r.top + (r.height + c) / 2 - y) * s.move.p;
					if (r.top >= 0 && r.bottom <= H) s.drawn = { top: r.top, left: r.left };
				}
				drawCharsLine(c2, s.text, x, y, s.chars, () => CFG.textColor, c, f, lh * k, W);
			});
			secOff.value.set(0, 0);
			secCv.tex.needsUpdate = true;
		}

		/* ───────── 3. 셰이더 ───────── */
		const res = { value: new THREE.Vector2(1, 1) };
		const glow = { value: new THREE.Vector2(0, 0) };
		const morph = { value: 0 };
		const flash = { value: 0 }; // 공개 순간 번쩍임
		const orthoCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
		const SCREEN_VS = `void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }`;
		const track = (o) => (disposables.push(o), o);
		const fullScreen = (mat) => {
			const s = new THREE.Scene();
			s.add(new THREE.Mesh(track(new THREE.PlaneGeometry(2, 2)), track(mat)));
			return s;
		};

		// 배경: 단색 + 오른쪽 위 원형 빛
		const m = String(CFG.bgColor2).match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)/i);
		const bgScene = fullScreen(
			new THREE.ShaderMaterial({
				uniforms: {
					uRes: res,
					uGlow: glow,
					uBg1: { value: new THREE.Color(CFG.bgColor) },
					uBg2: { value: m ? new THREE.Color(m[1] / 255, m[2] / 255, m[3] / 255) : new THREE.Color(CFG.bgColor2 || CFG.bgColor) },
					uBg2A: { value: !CFG.bgColor2 ? 0 : m && m[4] !== undefined ? parseFloat(m[4]) : 1 },
					uGlowSize: { value: CFG.bgGlowSize },
				},
				vertexShader: SCREEN_VS,
				fragmentShader: `
      uniform vec2 uRes, uGlow; uniform vec3 uBg1, uBg2; uniform float uBg2A, uGlowSize;
      void main(){
        float d = length(gl_FragCoord.xy - uGlow) / length(uRes);
        gl_FragColor = vec4(mix(uBg1, uBg2, (1.0 - smoothstep(0.0, uGlowSize, d)) * uBg2A), 1.0);
      }`,
				depthTest: false,
				depthWrite: false,
			}),
		);

		// 글자 오버레이: uOff = 레이어 전체 이동량(px), uAnch · uScale = 왼쪽 아래 모서리 기준 크기
		const noFx = () => ({ uScale: { value: 1 }, uAnch: { value: new THREE.Vector2() } });
		const overlayScene = (tex, off, fx) =>
			fullScreen(
				new THREE.ShaderMaterial({
					blending: THREE.CustomBlending,
					blendSrc: THREE.SrcAlphaFactor,
					blendDst: THREE.OneMinusSrcAlphaFactor,
					blendSrcAlpha: THREE.OneFactor,
					blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
					uniforms: Object.assign({ tTex: { value: tex }, uRes: res, uOff: off || { value: new THREE.Vector2(0, 0) } }, fx || noFx()),
					vertexShader: SCREEN_VS,
					fragmentShader: `uniform sampler2D tTex; uniform vec2 uRes, uOff, uAnch; uniform float uScale;
        void main(){
          vec2 q = gl_FragCoord.xy - uOff;
          if (uScale != 1.0) q = uAnch + (q - uAnch) / uScale;
          vec2 uv = q / uRes;
          gl_FragColor = (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) ? vec4(0.0) : texture2D(tTex, uv);
        }`,
					transparent: true,
					depthTest: false,
					depthWrite: false,
				}),
			);
		const titleOff = { value: new THREE.Vector2(0, 0) };
		const secOff = { value: new THREE.Vector2(0, 0) };
		// 타이틀은 늘 도형 뒤(배경 레이어 — 유리가 굴절해서 보여 줌), 섹션 제목은 도형 앞(글자 레이어)
		const titleFx = noFx();
		const titleBackScene = overlayScene(titleCv.tex, titleOff, titleFx),
			secScene = overlayScene(secCv.tex, secOff);

		// 유리: 두 도형(A → B)을 uMorph로 보간, 배경을 파장별로 굴절해 합성 + 반사·하이라이트
		const glassVS = `
    attribute vec3 aPosB; attribute vec3 aNormB; attribute float aPart;
    uniform float uMorph;
    varying vec3 vN; varying vec3 vEye; varying float vPart;
    void main(){
      vec3 p = mix(position, aPosB, uMorph);
      vec3 n = mix(normal, aNormB, uMorph) + 1e-5;
      vec4 wp = modelMatrix * vec4(p, 1.0);
      vN = normalize(mat3(modelMatrix) * n);
      vEye = normalize(wp.xyz - cameraPosition);
      vPart = aPart;
      gl_Position = projectionMatrix * viewMatrix * wp;
    }`;
		const glassFS = `
    uniform sampler2D uTex; uniform vec2 uRes;
    uniform float uPower, uChroma, uSat, uSpec, uClear, uBlur, uRim, uLRefl, uEnv, uLine, uFlash, uHoleHide;    varying vec3 vN; varying vec3 vEye; varying float vPart;
    vec3 sat(vec3 c, float a){ return mix(vec3(dot(c, vec3(.2125,.7154,.0721))), c, a); }
    float lightBand(float y){
      return smoothstep(0.35, 0.55, y) * (1.0 - smoothstep(0.8, 0.95, y))
           + 0.5 * smoothstep(-0.3, -0.15, y) * (1.0 - smoothstep(-0.05, 0.08, y));
    }
    float studio(vec3 r){
      float top = smoothstep(0.6, 0.78, r.y) * (1.0 - smoothstep(0.45, 0.75, abs(r.x)));
      float left = (1.0 - smoothstep(-0.88, -0.72, r.x)) * (1.0 - smoothstep(0.35, 0.65, abs(r.y - 0.05)));
      float right = smoothstep(0.74, 0.9, r.x) * (1.0 - smoothstep(0.15, 0.4, abs(r.y + 0.15)));
      float dome = smoothstep(-0.3, 1.0, r.y) * 0.07;
      return top * 1.1 + left * 1.1 + right * 0.7 + dome;
    }
    vec3 samp(vec3 n, float ior, float off){
      vec3 r = refract(vEye, n, 1.0 / ior);
      return texture2D(uTex, gl_FragCoord.xy / uRes + r.xy * off * (1.0 - 0.65 * uClear)).rgb;
    }
    void main(){
      if (uHoleHide > 0.5 ? abs(vPart - 1.0) < 0.5 : vPart > 1.5) discard;
      vec3 n = normalize(vN);
      vec2 suv = gl_FragCoord.xy / uRes;
      vec3 col = vec3(0.0);
      for (int i = 0; i < SAMPLES; i++) {
        float s = float(i) / float(SAMPLES) * uBlur;
        float R = samp(n, 1.15, (uPower + s)       * uChroma).r;
        vec3 ty = samp(n, 1.16, (uPower + s * 1.5) * uChroma); float Y = (ty.r*2. + ty.g*2. - ty.b) / 6.;
        float G = samp(n, 1.18, (uPower + s * 2.0) * uChroma).g;
        vec3 tc = samp(n, 1.22, (uPower + s * 2.5) * uChroma); float C = (tc.g*2. + tc.b*2. - tc.r) / 6.;
        float B = samp(n, 1.22, (uPower + s * 3.0) * uChroma).b;
        vec3 tp = samp(n, 1.22, (uPower + s * 1.0) * uChroma); float P = (tp.b*2. + tp.r*2. - tp.g) / 6.;
        col.r += R + (2.*P + 2.*Y - C) / 3.;
        col.g += G + (2.*Y + 2.*C - P) / 3.;
        col.b += B + (2.*C + 2.*P - Y) / 3.;
      }
      col = sat(col / (float(SAMPLES) * 1.5), uSat);
      col = mix(col, texture2D(uTex, suv).rgb, uClear * 0.35);
      float facing = 1.0 - abs(dot(vEye, n));
      vec3 rr = reflect(vEye, n);
      col += uLRefl * (0.35 + 0.65 * facing) * lightBand(rr.y + rr.x * 0.35);
      col += studio(rr) * (0.1 + 0.9 * pow(facing, 3.0)) * uEnv;
      float g = smoothstep(0.28, 0.85, facing);
      float eLine = smoothstep(0.05, 0.3, length(fwidth(n)));
      col += (g * g * g * (0.25 + 0.6 * min(studio(rr), 1.0)) * 1.3 + eLine * 1.1) * uLine;
      col = mix(col, vec3(1.0), smoothstep(0.9, 1.0, facing) * uRim);
      float spec = pow(max(dot(n, normalize(normalize(vec3(1.0, 1.2, 1.0)) - vEye)), 0.0), 42.0);
      float bgL = dot(texture2D(uTex, suv).rgb, vec3(0.3333));
      col += (spec * 0.9 + pow(facing, 7.0) * 0.5 * (1.0 - 0.6 * uClear)) * uSpec * mix(1.0, 0.15, bgL);
      col += uFlash * (0.25 + 0.75 * facing * facing);
      gl_FragColor = vec4(col, 1.0);
    }`;
		const makeGlass = (side, spec) =>
			track(
				new THREE.ShaderMaterial({
					uniforms: {
						uTex: { value: null },
						uRes: res,
						uMorph: morph,
						uFlash: flash,
						uPower: { value: CFG.refraction },
						uChroma: { value: CFG.chroma },
						uSat: { value: CFG.saturation },
						uSpec: { value: spec * CFG.shine },
						uClear: { value: CFG.clear },
						uBlur: { value: CFG.blur },
						uRim: { value: CFG.rimWhite },
						uLRefl: { value: CFG.lightReflect },
						uEnv: { value: CFG.envReflect },
						uLine: { value: CFG.edgeLine },
						uHoleHide: { value: side === THREE.BackSide ? CFG.holeHide : 0 },
					},
					defines: { SAMPLES },
					extensions: { derivatives: true },
					vertexShader: glassVS,
					fragmentShader: glassFS,
					side,
				}),
			);
		const backMat = makeGlass(THREE.BackSide, CFG.backBright);
		const frontMat = makeGlass(THREE.FrontSide, 1);

		// 렌더 타깃: 배경 / 배경+뒷면 / 도형(투명 배경) / 글자(투명 배경)
		const rtBg = track(new THREE.WebGLRenderTarget(1, 1));
		const rtBack = track(new THREE.WebGLRenderTarget(1, 1));
		const rtShape = track(new THREE.WebGLRenderTarget(1, 1));
		const rtText = track(new THREE.WebGLRenderTarget(1, 1));
		const RTS = [rtBg, rtBack, rtShape, rtText];
		backMat.uniforms.uTex.value = rtBg.texture;
		frontMat.uniforms.uTex.value = rtBack.texture;

		// 격자 유리 칸막이: 세 레이어를 칸마다 원통 렌즈처럼 밀어 내고 합성 (+ 도형 빛 번짐)
		const fluteMat = new THREE.ShaderMaterial({
			uniforms: {
				tBase: { value: rtBg.texture },
				tShape: { value: rtShape.texture },
				tText: { value: rtText.texture },
				uRes: res,
				uW: { value: CFG.fluteWidth * DPR },
				uShift: { value: CFG.flute * DPR },
				uShiftT: { value: CFG.fluteText * DPR },
				uBloom: { value: CFG.bloom },
				uBloomR: { value: 13 * DPR },
				uSweep: { value: 999 },
			},
			vertexShader: SCREEN_VS,
			fragmentShader: `
      uniform sampler2D tBase, tShape, tText; uniform vec2 uRes; uniform float uW, uShift, uShiftT, uBloom, uBloomR, uSweep;
      vec4 flute(sampler2D t, vec2 p, vec2 b, float sh){
        vec2 uv = (p + b * 2.0 * sh) / uRes;
        vec2 px = vec2(1.0) / uRes * 1.1;
        return (texture2D(t, uv - px) + texture2D(t, uv) + texture2D(t, uv + px)) / 3.0;
      }
      void main(){
        vec2 p = gl_FragCoord.xy;
        vec2 b = fract(p / uW) - 0.5;
        float colD = abs(floor(p.x / uW) - floor(uRes.x * 0.5 / uW));
        float sw = clamp(uSweep - colD, 0.0, 1.0);
        b *= sw;
        vec4 base = flute(tBase, p, b, uShiftT);
        vec4 sh = flute(tShape, p, b, uShift);
        vec4 tx = flute(tText, p, b, uShiftT);
        vec3 c = base.rgb * (1.0 - sh.a) + sh.rgb;
        c = c * (1.0 - tx.a) + tx.rgb;
        vec2 uv = (p + b * 2.0 * uShift) / uRes;
        vec3 bl = vec3(0.0);
        for (int i = 0; i < 12; i++) {
          float a = float(i) * 0.5236;
          for (int j = 1; j <= 2; j++) bl += max(texture2D(tShape, uv + vec2(cos(a), sin(a)) * uBloomR * float(j) / uRes).rgb - 0.55, 0.0);
        }
        c += bl * uBloom / 24.0;
        c += sw * (1.0 - sw) * 0.24;
        gl_FragColor = vec4(c, 1.0);
      }`,
			depthTest: false,
			depthWrite: false,
		});
		const fluteScene = fullScreen(fluteMat);

		/* ───────── 4. 도형: 4 → 6각 너트 → 원형 링 (같은 토폴로지라 셰이더에서 바로 보간) ───────── */
		const scene = new THREE.Scene();
		const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
		camera.position.set(0, 0, 10);
		const N = 240,
			S = 16,
			K = S * 4;
		const SIDES = [4, 6, 0]; // 0 = 원형
		const CORNER = { 4: Math.PI / 4, 6: Math.PI / 2 };
		const R_CIRCLE = 0.92;
		const R_OUT = 2.1,
			R_IN = 1.18,
			HALF_T = 0.45;
		const R_IN_OF = { 4: 1.08 };
		const polyR = (n, corner) => (th) => {
			const seg = (Math.PI * 2) / n;
			const l = (((th - corner) % seg) + seg) % seg;
			return (R_OUT * Math.cos(Math.PI / n)) / Math.cos(l - Math.PI / n);
		};
		function buildNut(n) {
			const outR = n ? polyR(n, CORNER[n]) : () => R_OUT * R_CIRCLE;
			const rIn = R_IN_OF[n] || R_IN;
			const prof = (th) => {
				const ro = outR(th);
				const c = [
					[ro, -HALF_T],
					[ro, HALF_T],
					[rIn, HALF_T],
					[rIn, -HALF_T],
				];
				const pts = [];
				for (let e = 0; e < 4; e++) {
					const [r0, y0] = c[e],
						[r1, y1] = c[(e + 1) % 4];
					for (let i = 0; i < S; i++) {
						const f = i / S,
							r = r0 + (r1 - r0) * f;
						pts.push([Math.cos(th) * r, y0 + (y1 - y0) * f, Math.sin(th) * r]);
					}
				}
				return pts;
			};
			const pos = [],
				part = [];
			for (let i = 0; i < N; i++) {
				const a = prof((i / N) * Math.PI * 2),
					b = prof(((i + 1) / N) * Math.PI * 2);
				for (let k = 0; k < K; k++) {
					const k2 = (k + 1) % K;
					pos.push(...a[k], ...a[k2], ...b[k2], ...a[k], ...b[k2], ...b[k]);
					const f = Math.floor(k / S) === 2 ? 1 : 0;
					part.push(f, f, f, f, f, f);
				}
			}
			const nRing = pos.length / 3;
			for (let i = 0; i < N; i++) {
				const t0 = (i / N) * Math.PI * 2,
					t1 = ((i + 1) / N) * Math.PI * 2;
				const p = (t, y) => [Math.cos(t) * rIn, y, Math.sin(t) * rIn];
				pos.push(...p(t0, HALF_T), 0, HALF_T, 0, ...p(t1, HALF_T));
				pos.push(...p(t1, -HALF_T), 0, -HALF_T, 0, ...p(t0, -HALF_T));
				part.push(2, 2, 2, 2, 2, 2);
			}
			const g = new THREE.BufferGeometry();
			g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
			g.applyMatrix4(new THREE.Matrix4().makeRotationX(Math.PI / 2));
			g.computeVertexNormals();
			const out = { p: g.attributes.position.array, n: g.attributes.normal.array, part, nRing };
			g.dispose();
			return out;
		}
		const SHAPES = SIDES.map(buildNut);

		const geo = track(new THREE.BufferGeometry());
		const attr = (src) => new THREE.BufferAttribute(new Float32Array(src), 3);
		const aPos = attr(SHAPES[0].p),
			aNrm = attr(SHAPES[0].n),
			bPos = attr(SHAPES[1].p),
			bNrm = attr(SHAPES[1].n);
		geo.setAttribute("position", aPos);
		geo.setAttribute("normal", aNrm);
		geo.setAttribute("aPosB", bPos);
		geo.setAttribute("aNormB", bNrm);
		geo.setAttribute("aPart", new THREE.BufferAttribute(new Float32Array(SHAPES[0].part), 1));
		geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 4);
		function setPair(from, to) {
			aPos.array.set(SHAPES[from].p);
			aNrm.array.set(SHAPES[from].n);
			bPos.array.set(SHAPES[to].p);
			bNrm.array.set(SHAPES[to].n);
			aPos.needsUpdate = aNrm.needsUpdate = bPos.needsUpdate = bNrm.needsUpdate = true;
		}
		const prism = new THREE.Mesh(geo);
		prism.frustumCulled = false;
		scene.add(prism);

		sc.on(canvas, "webglcontextrestored", () => (titleCv.tex.needsUpdate = true));

		let W = 0,
			H = 0;
		function resize() {
			W = wrap.clientWidth || 1;
			H = wrap.clientHeight || 1;
			renderer.setSize(W, H, false);
			RTS.forEach((rt) => rt.setSize(W * DPR, H * DPR));
			res.value.set(W * DPR, H * DPR);
			glow.value.set(W * 0.95 * DPR, H * DPR);
			drawTitle(W, H);
			drawSec(W, H);
			camera.aspect = W / H;
			camera.position.z = W / H < 0.9 ? (10 / (W / H)) * 0.8 : 10; // 세로 화면은 뒤로 빠져서 다 보이게
			camera.updateProjectionMatrix();
		}
		sc.observe(new ResizeObserver(() => !dead && resize()), wrap);
		resize();
		document.fonts.ready.then(markDirty);

		/* ───────── 5. 입력: 도형 드래그 회전 (놓으면 관성) ───────── */
		const ray = new THREE.Raycaster(),
			hitMat = track(new THREE.MeshBasicMaterial({ side: THREE.DoubleSide })),
			ndc = new THREE.Vector2();
		function hitShape(e) {
			const r = wrap.getBoundingClientRect();
			if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) return false;
			ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
			ray.setFromCamera(ndc, camera);
			const keep = prism.material;
			prism.material = hitMat;
			const hit = ray.intersectObject(prism).some((h) => h.faceIndex < SHAPES[0].nRing / 3);
			prism.material = keep;
			return hit;
		}
		const isUI = (e) => e.target.closest && e.target.closest("a, button, input, label, select, textarea");
		function setCursor(s) {
			if (s) root.dataset.cursor = s;
			else delete root.dataset.cursor;
			wrap.style.cursor = { drag: "grab", grabbing: "grabbing" }[s] || "";
		}
		sc.add(() => delete root.dataset.cursor);
		const qUser = new THREE.Quaternion(),
			qStep = new THREE.Quaternion();
		const AX = new THREE.Vector3(1, 0, 0),
			AY = new THREE.Vector3(0, 1, 0),
			AZ = new THREE.Vector3(0, 0, 1);
		const drag = { on: false, x: 0, y: 0, vx: 0, vy: 0 };
		function spinBy(dx, dy) {
			qStep.setFromAxisAngle(AY, dx);
			qUser.premultiply(qStep);
			qStep.setFromAxisAngle(AX, dy);
			qUser.premultiply(qStep);
		}
		// 드래그는 타이틀이 What We Do로 바뀌기 전까지만, 모바일(터치) · 배경 전용은 드래그 없음
		const NO_DRAG = MOBILE || BG_ONLY;
		let titleOut = false; // 스크롤로 타이틀이 빠진 상태 (7번)
		sc.on(window, "pointerdown", (e) => {
			if (NO_DRAG || titleOut || isUI(e) || !hitShape(e)) return;
			e.preventDefault();
			Object.assign(drag, { on: true, x: e.clientX, y: e.clientY, vx: 0, vy: 0 });
			setCursor("grabbing");
		});
		sc.on(window, "pointermove", (e) => {
			if (!drag.on) return NO_DRAG || setCursor(!titleOut && !isUI(e) && hitShape(e) ? "drag" : "");
			const k = CFG.dragSpeed;
			drag.vx = (e.clientX - drag.x) * k;
			drag.vy = (e.clientY - drag.y) * k;
			drag.x = e.clientX;
			drag.y = e.clientY;
			spinBy(drag.vx, drag.vy);
		});
		const endDrag = () => {
			if (!drag.on) return;
			drag.on = false;
			setCursor("drag");
		};
		sc.on(window, "pointerup", endDrag);
		sc.on(window, "pointercancel", endDrag);
		sc.on(window, "touchmove", (e) => drag.on && e.preventDefault(), { passive: false });

		/* ───────── 6. 인트로: 흩어진 조각이 하나씩 날아와 유리 도형 → 타이틀 ───────── */
		const EASE_L = getTitleEase();
		const CH = { duration: 1 / 1.5, ease: EASE_L, stagger: 1 / 30, onUpdate: markDirty }; // 글자 하나 0.67초, 1/30초 간격
		// 나중에(스크롤 · 인트로 중) 만드는 트윈도 ctx에 기록 → destroy 때 같이 정리
		const showChars = (arr, v, delay = 0) => ctx.add(() => gsap.to(arr, { ...CH, v, delay }));

		const clock = new THREE.Clock();
		const intro = { done: true, s: 1, face: 0, rx: 0.4, ry: -0.55, px: 0, py: 0, spinK: 1 };
		const stage = { from: 0, to: 1, start: -1, last: 0 }; // 자동 변형 상태 (start < 0 = 대기)
		let curFrom = -1,
			introStart = null,
			spaceTick = null;

		if (PLAY_INTRO) {
			Object.assign(intro, { done: false, s: 0.0001, face: 1, rx: 0.4, ry: -0.55 }); // 유리 도형은 숨겨 두고, 조각이 다 모이면 그 자리에 나타남
			root.classList.remove("intro-pending");

			// 조각(점): 도형 바깥에서 날아와 도형 표면(aTarget)에 붙음
			const COUNT = MOBILE ? 2200 : 3600;
			const NF = 44,
				GAP = 2.6,
				L = NF * GAP;
			const S0 = 4.2;
			const pPos = new Float32Array(COUNT * 3),
				pTgt = new Float32Array(COUNT * 3),
				pRnd = new Float32Array(COUNT),
				pSeed = new Float32Array(COUNT * 3);
			const src = SHAPES[0].p,
				nSrc = SHAPES[0].nRing;
			for (let i = 0; i < COUNT; i++) {
				const Sx = S0 * (0.75 + Math.random() * 0.5),
					u = (Math.random() * 2 - 1) * Sx,
					side = Math.floor(Math.random() * 4);
				const [x, y] = side === 0 ? [u, -Sx] : side === 1 ? [u, Sx] : side === 2 ? [-Sx, u] : [Sx, u];
				pPos.set([x, y, Math.random() * L], i * 3);
				const k = Math.floor(Math.random() * nSrc) * 3;
				pTgt.set([src[k], src[k + 1], src[k + 2]], i * 3);
				pRnd[i] = Math.random();
				pSeed.set([Math.random(), Math.random(), Math.random()], i * 3);
			}

			const SMALL = innerWidth <= 640;
			const U = {
				uFly: { value: 0 },
				uSpin: { value: 0 },
				uTwist: { value: 0 },
				uSuck: { value: 0 },
				uFar: { value: SMALL ? 22 : 17 },
				uBend: { value: new THREE.Vector2() },
				uGather: { value: 0 },
				uFill: { value: 1 }, // 1 = 흩어진 조각 → 제자리 합체
				uAlpha: { value: 0 },
				uLineA: { value: 0 },
				uTime: { value: 0 },
				uL: { value: L },
				uMouse: { value: new THREE.Vector2(-9999, -9999) },
				uRes: res,
				uDpr: { value: DPR },
				uPrism: { value: new THREE.Matrix4() },
			};
			const COMMON = `
			uniform float uFly, uSpin, uTwist, uSuck, uFar, uGather, uFill, uAlpha, uLineA, uTime, uL, uDpr; uniform vec2 uBend, uMouse, uRes; uniform mat4 uPrism;
			varying float vA;
			vec3 tunnel(vec3 p, float base, out float far){
			  float z = mod(base + uFly * uL, uL) + (p.z - base);
			  far = 1.0 - z / uL;
			  float tw = uSpin + far * uTwist;
			  p.xy = mat2(cos(tw), sin(tw), -sin(tw), cos(tw)) * p.xy;
			  p.xy *= mix(1.0, 0.45, uSuck * far * far);
			  p.xy += uBend * far * far * 8.0;
			  p.z = z - uL + 9.0;
			  return p;
			}`;
			const blend = {
				transparent: true,
				depthTest: false,
				depthWrite: false,
				blending: THREE.CustomBlending,
				blendSrc: THREE.OneFactor,
				blendDst: THREE.OneFactor,
				blendSrcAlpha: THREE.OneFactor,
				blendDstAlpha: THREE.OneFactor,
			};
			const ptMat = track(
				new THREE.ShaderMaterial({
					uniforms: U,
					vertexShader:
						`attribute vec3 aTarget; attribute float aRnd; attribute vec3 aSeed;` +
						COMMON +
						`
			void main(){
			  float far; vec3 p = tunnel(position, position.z, far);
			  vec3 tgt = (uPrism * vec4(aTarget, 1.0)).xyz;
			  vec3 outDir = normalize(aTarget * vec3(1.0, 1.0, 0.6) + 0.0001);
			  vec3 jit = (vec3(aSeed.z, aRnd, fract(aSeed.x * 7.13 + aSeed.z * 3.7)) - 0.5) * 0.7;
			  vec3 shard = aTarget + normalize(outDir + jit) * (3.0 + aSeed.x * 4.0);
			  float g = uFill > 0.5 ? clamp((uGather - aSeed.y * 0.6) / 0.4, 0.0, 1.0) : clamp(uGather * 1.5 - aRnd * 0.5, 0.0, 1.0);
			  g = uFill > 0.5 ? 1.0 - pow(1.0 - g, 3.0) : g * g * (3.0 - 2.0 * g);
			  float sw = (1.0 - g) * 0.8;
			  shard.xz = mat2(cos(sw), sin(sw), -sin(sw), cos(sw)) * shard.xz;
			  vec3 w = uFill > 0.5 ? mix((uPrism * vec4(shard, 1.0)).xyz, tgt, g) : mix(p, tgt, g);
			  vec4 mv = viewMatrix * vec4(w, 1.0);
			  gl_Position = projectionMatrix * mv;
			  vec2 sp = (gl_Position.xy / gl_Position.w * 0.5 + 0.5) * uRes;
			  float md = (1.0 - smoothstep(0.0, 180.0 * uDpr, length(sp - uMouse))) * (1.0 - g);
			  float depth = -mv.z;
			  float vis = smoothstep(0.5, 4.0, depth) * (1.0 - smoothstep(uFar - 3.0, uFar, depth));
			  float glint = step(0.93, fract(sin(floor(uTime * 6.0 + aRnd * 97.0) * 12.9898 + aRnd * 78.2) * 43758.5));
			  float size = aRnd > 0.9 ? 5.0 : aRnd > 0.6 ? 3.0 : 1.6;
			  gl_PointSize = mix((size + md * 3.0) * (1.0 + 4.0 / max(depth, 1.0)), (1.0 + aRnd * 1.5) * (1.0 + 2.0 / max(depth, 1.0)), g) * uDpr;
			  vA = uAlpha * mix(vis * (0.35 + glint * 0.65 + md * 0.6), 0.85, g);
			  if (uFill > 0.5) {
			    float starA = (0.25 + glint * 0.5) * (1.0 - smoothstep(8.0, 28.0, depth)) * smoothstep(0.5, 3.0, depth);
			    vA = uAlpha * mix(starA, 0.85, g) * smoothstep(0.0, 0.25, g);
			    gl_PointSize = mix((0.8 + aRnd * 1.6) * (1.0 + 3.0 / max(depth, 1.0)), (1.0 + aRnd * 1.5) * (1.0 + 2.0 / max(depth, 1.0)), g) * uDpr;
			  }
			}`,
					fragmentShader: `varying float vA; void main(){ gl_FragColor = vec4(vec3(vA), vA); }`,
					...blend,
				}),
			);
			const ptGeo = track(new THREE.BufferGeometry());
			ptGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
			ptGeo.setAttribute("aTarget", new THREE.BufferAttribute(pTgt, 3));
			ptGeo.setAttribute("aRnd", new THREE.BufferAttribute(pRnd, 1));
			ptGeo.setAttribute("aSeed", new THREE.BufferAttribute(pSeed, 3));
			const tScene = new THREE.Scene();
			const pts = new THREE.Points(ptGeo, ptMat);
			pts.frustumCulled = false;
			tScene.add(pts);

			const ms = { x: 0, y: 0, px: -9999, py: -9999 };
			const onMove = sc.on(window, "pointermove", (e) => {
				ms.x = (e.clientX / window.innerWidth) * 2 - 1;
				ms.y = (e.clientY / window.innerHeight) * 2 - 1;
				ms.px = e.clientX * DPR;
				ms.py = (window.innerHeight - e.clientY) * DPR;
			});

			// 인트로 캡션 자리 (스타일: visual.scss .intro_tunnel)
			const box = document.createElement("div");
			box.className = "intro_tunnel";
			box.innerHTML = `<span class="cap cap_l"><i></i>Move to steer</span><span class="cap cap_r">DEPTH <b>0000</b></span>`;
			document.body.appendChild(box);
			sc.add(() => box.remove());
			const depEl = box.querySelector(".cap_r b");

			const fly = { v: 0, speed: 0 },
				bend = { x: 0, y: 0 },
				mInfl = { v: 1 };
			const mPrism = new THREE.Matrix4(),
				one = new THREE.Vector3(1, 1, 1);
			let lastT = -1;
			spaceTick = (t) => {
				const dt = lastT < 0 ? 0 : Math.min(0.05, t - lastT);
				lastT = t;
				fly.v += fly.speed * dt;
				U.uFly.value = fly.v;
				U.uSpin.value += 0.1 * dt;
				U.uTime.value = t;
				bend.x += (ms.x * mInfl.v - bend.x) * 0.04;
				bend.y += (-ms.y * 0.6 * mInfl.v - bend.y) * 0.04;
				U.uBend.value.set(bend.x, bend.y);
				U.uMouse.value.set(ms.px, ms.py);
				mPrism.compose(prism.position, prism.quaternion, one);
				U.uPrism.value.copy(mPrism);
				if (box.isConnected) depEl.textContent = String(Math.floor(fly.v * L * 10) % 10000).padStart(4, "0");
				renderer.render(tScene, camera);
			};

			let tl = null;
			const finish = () => {
				Object.assign(intro, { done: true, s: 1 });
				stage.last = clock.getElapsedTime();
				spaceTick = null;
				window.removeEventListener("pointermove", onMove);
				box.remove();
			};
			introStart = () =>
				ctx.add(() => {
					fly.speed = 0.05;
					tl = gsap.timeline({ onComplete: finish }).timeScale(CFG.introSpeed);
					tl.set(U.uAlpha, { value: 1 }, 0)
						.to(U.uGather, { value: 1, duration: 1.6, ease: "power1.out" }, 0) // 채워지는 시간 1.6초
						.to(mInfl, { v: 0, duration: 1.2, ease: "power2.in" }, 0)
						// 마지막 조각들이 붙는 동안 유리 도형이 겹쳐 자라나고 점은 그 안으로 녹아들듯 사라짐
						.to(intro, { s: 1, duration: 1.0, ease: "power2.out" }, 1.2)
						.add(() => ctx.add(() => gsap.fromTo(flash, { value: 0.25 }, { value: 0, duration: 1.2, ease: "power2.out" })), 1.3)
						.to(U.uAlpha, { value: 0, duration: 0.7, ease: "power1.inOut" }, 1.4)
						.to(intro, { face: 0, duration: 2.4, ease: "power3.inOut" }, 1.6)
						.add(() => !titleOut && (showChars(titleFlat, 0), showBrand(true)), 2.2)
						// 타이틀이 뜨고 0.5초 뒤: 스크롤 잠금 해제 → 헤더 로고 · MENU가 나타남 (도형 자세 전환은 계속)
						.add(
							() => {
								intro.done = true;
								stage.last = clock.getElapsedTime();
								if (scrollLock) unlockScroll();
							},
							2.2 + 0.5 * CFG.introSpeed,
						);
				});
			// 인트로 중 클릭하면 끝으로 건너뜀
			sc.on(window, "click", () => tl && !intro.done && tl.progress(1));
		} else {
			root.classList.remove("intro-pending");
			// 배경 전용: 인트로 없이 타이틀 글자만 올라옴
			if (BG_ONLY) ctx.add(() => gsap.delayedCall(0.3, () => !titleOut && showChars(titleFlat, 0)));
		}

		/* ───────── 7. 스크롤 ─────────
		   캔버스는 화면에 고정, 스크롤 양(화면 높이 단위)만 읽음 — 위치는 브랜드 설명 구간(LEAD + HOLD)만큼 뒤로 밀림 */
		const scr = { t: 0 };
		let secOut = false;
		// 화면 높이 단위 = CSS의 100svh (모바일 주소창이 접혀도 섹션 위치와 어긋나지 않게)
		const svhProbe = document.createElement("div");
		svhProbe.setAttribute("aria-hidden", "true");
		svhProbe.style.cssText = "position:absolute;top:0;left:0;width:0;height:100vh;height:100svh;visibility:hidden;pointer-events:none";
		document.body.appendChild(svhProbe);
		sc.add(() => svhProbe.remove());
		const unitPx = () => svhProbe.offsetHeight || window.innerHeight || 1;
		function setTitleOut(o) {
			if (o === titleOut) return;
			titleOut = o;
			if (o) {
				Object.assign(drag, { on: false, vx: 0, vy: 0 });
				setCursor("");
			}
			gsap.killTweensOf(titleFlat);
			gsap.killTweensOf(secChars);
			showBrand(!o);
			if (o) {
				showChars(titleFlat, 1);
				showChars(secChars, 0, 0.3);
			} else {
				showChars(secChars, -1);
				showChars(titleFlat, 0, 0.2);
			}
		}
		const T_OUT = 0.12 + LEAD + HOLD,
			T_BACK = 0.06 + LEAD + HOLD,
			S_OUT = 1.6 + LEAD + HOLD,
			S_BACK = 1.5 + LEAD + HOLD;
		function setSecOut(o) {
			if (o === secOut) return;
			secOut = o;
			gsap.killTweensOf(secMove);
			ctx.add(() => gsap.to(secMove, { p: o ? 1 : 0, duration: 1.1, ease: EASE_L, onUpdate: markDirty }));
			emitSecOut(o); // 서비스 카드도 같은 순간에 (제목 이동과 카드 등장이 따로 놀지 않게)
		}
		const secOf = (el) => secs.find((s) => s.el === el);
		if (!BG_ONLY) {
			glass.sec = {
				secOutAt: S_OUT,
				syncsService: true,
				get out() {
					return secOut;
				},
				unit: unitPx,
				show(el, o) {
					const s = secOf(el);
					if (!s) return;
					gsap.killTweensOf(s.chars);
					showChars(s.chars, o ? 0 : -1);
				},
				move(el, o) {
					const s = secOf(el);
					if (!s) return;
					gsap.killTweensOf(s.move);
					ctx.add(() => gsap.to(s.move, { p: o ? 1 : 0, duration: 1.1, ease: EASE_L, onUpdate: markDirty }));
				},
			};
			sc.add(() => (glass.sec = null));
		}
		sc.add(() => gsap.killTweensOf([...titleFlat, ...secs.flatMap((s) => [...s.chars, s.move]), flash, intro]));

		function onScroll() {
			scr.t = window.scrollY / unitPx();
			fillBrand(scr.t);
			if (!intro.done) return;
			if (scr.t > T_OUT) setTitleOut(true);
			else if (scr.t < T_BACK) {
				if (secOut) {
					gsap.killTweensOf(secMove);
					secMove.p = 0;
					emitSecOut(false);
				}
				secOut = false;
				setTitleOut(false);
			}
			if (titleOut) {
				if (scr.t > S_OUT) setSecOut(true);
				else if (scr.t < S_BACK) setSecOut(false);
			}
		}
		if (secs.length) {
			root.classList.add("has-sec-fx"); // 섹션 제목은 캔버스가 그리므로 DOM 제목은 CSS로 숨김 (자리 · SEO는 유지)
			sc.add(() => root.classList.remove("has-sec-fx"));
		}
		sc.on(window, "scroll", onScroll, { passive: true });
		onScroll();

		// 인트로 동안 스크롤 잠금 (html.intro-lock — Visual.js가 붙임): 휠 · 터치 · 키만 막음, 스크롤바를 끌어도 맨 위로
		let scrollLock = root.classList.contains("intro-lock");
		const LOCK_EVENTS = ["wheel", "touchmove", "keydown"];
		const SCROLL_KEYS = ["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " ", "Spacebar"];
		const blockScroll = (e) => {
			if (e.type === "keydown" && !SCROLL_KEYS.includes(e.key)) return;
			e.preventDefault();
			e.stopPropagation(); // Lenis까지 안 가게
		};
		const keepTop = () => window.scrollY && window.scrollTo(0, 0);
		const lockOff = () => {
			LOCK_EVENTS.forEach((ev) => window.removeEventListener(ev, blockScroll, { capture: true }));
			window.removeEventListener("scroll", keepTop);
		};
		if (scrollLock) {
			LOCK_EVENTS.forEach((ev) => window.addEventListener(ev, blockScroll, { capture: true, passive: false }));
			window.addEventListener("scroll", keepTop, { passive: true });
			sc.add(lockOff);
			keepTop();
		}
		function unlockScroll() {
			scrollLock = false;
			root.classList.remove("intro-lock");
			lockOff();
			const lenis = getLenis();
			if (lenis) (lenis.start(), lenis.scrollTo(0, { immediate: true, force: true }));
			ScrollTrigger.refresh();
		}

		/* ───────── 8. 매 프레임 ───────── */
		const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
		function stageAt(t) {
			if (stage.start < 0) return { from: stage.from, to: stage.to, u: 0 };
			const c = (t - stage.start) / CFG.morph;
			if (c < 1) return { from: stage.from, to: stage.to, u: ease(c) };
			stage.from = stage.to;
			stage.to = (stage.to + 1) % SHAPES.length;
			stage.start = -1;
			return { from: stage.from, to: stage.to, u: 0 };
		}
		const mo = reduce ? 0 : 1;
		const kick = { from: -1, acc: 0, amt: 0 };
		const qA = new THREE.Quaternion(),
			qB = new THREE.Quaternion(),
			qFx = new THREE.Quaternion(),
			qScr = new THREE.Quaternion();
		const eA = new THREE.Euler(),
			eB = new THREE.Euler(),
			eFx = new THREE.Euler();
		// 아래 섹션이 화면을 다 덮으면 렌더 멈춤 — 섹션 위치는 크기 · 고정 여백이 바뀔 때만 잼
		const coverEl = document.querySelector(BG_ONLY ? "[data-glass-cover]" : ".weare");
		let coverY = Infinity;
		const measureCover = () => {
			let y = 0;
			for (let el = coverEl; el; el = el.offsetParent) y += el.offsetTop;
			coverY = y;
		};
		if (coverEl) {
			measureCover();
			sc.on(window, "resize", measureCover);
			ScrollTrigger.addEventListener("refresh", measureCover);
			sc.add(() => ScrollTrigger.removeEventListener("refresh", measureCover));
		}
		let spinAcc = 0,
			scrollRot = 0,
			lastT = 0,
			frame = 0,
			visible = true,
			paused = false;
		sc.observe(new IntersectionObserver(([en]) => (visible = en.isIntersecting)), wrap);

		function tick() {
			if (dead) return;
			rafId = requestAnimationFrame(tick);
			if (scrollLock) intro.done ? unlockScroll() : keepTop();
			if (!visible) return (paused = true);
			// 아래 흰 섹션(We Are)이 화면을 완전히 덮으면 그리기 멈춤 (그라데이션 75% 지점에서 이미 흰색)
			if (coverEl && window.scrollY >= coverY + H * 0.75) return (paused = true);
			if (introStart && ++frame === 3) introStart(); // 셰이더 컴파일 멈칫 뒤에 시작
			const t = clock.getElapsedTime();
			if (paused) {
				paused = false;
				lastT = t;
				if (stage.start < 0) stage.last = t;
			}

			// 변형: 인트로가 끝나면 autoMorph초마다 다음 도형으로
			if (!reduce && intro.done && stage.start < 0 && !drag.on && t - stage.last >= CFG.autoMorph) stage.start = stage.last = t;
			const st = stageAt(t);
			if (st.from !== curFrom) {
				setPair(st.from, st.to);
				curFrom = st.from;
			}
			const u = st.u;
			morph.value = u;
			if (st.from !== kick.from) {
				kick.acc += kick.amt;
				kick.amt = 0;
				kick.from = st.from;
			}
			if (u > 0 && kick.amt === 0) kick.amt = (Math.PI * 2) / (SIDES[st.to] || 8);
			const bump = Math.sin(u * Math.PI);

			// 자세: 기본 흔들림 + 변형 중 젖힘 → (인트로 자세) → 정면 축 회전 → 드래그 → 계속 회전 → 스크롤 회전
			eA.set(0.42 + (Math.sin(t * 0.4) * 0.12 + bump * 0.35) * mo, -0.35 + Math.sin(t * 0.27) * 0.25 * mo, -0.12 + Math.sin(t * 0.2) * 0.05 * mo);
			prism.quaternion.setFromEuler(eA);
			if (intro.face > 0) {
				eB.set(intro.rx, intro.ry, 0);
				qB.setFromEuler(eB);
				prism.quaternion.slerp(qB, intro.face);
			}
			qA.setFromAxisAngle(AZ, (kick.acc + kick.amt * u) * mo);
			prism.quaternion.multiply(qA);
			if (!drag.on && (Math.abs(drag.vx) > 1e-5 || Math.abs(drag.vy) > 1e-5)) {
				spinBy(drag.vx, drag.vy);
				drag.vx *= CFG.dragInertia;
				drag.vy *= CFG.dragInertia;
			}
			prism.quaternion.premultiply(qUser);
			spinAcc += (t - lastT) * intro.spinK;
			lastT = t;
			eFx.set(0, spinAcc * CFG.spin * mo, 0);
			qFx.setFromEuler(eFx);
			prism.quaternion.premultiply(qFx);
			scrollRot += (scr.t * CFG.scrollSpin - scrollRot) * 0.12;
			qScr.setFromAxisAngle(AY, scrollRot * mo);
			prism.quaternion.premultiply(qScr);
			prism.position.set(intro.px, intro.py, 1.2);
			prism.scale.setScalar((1 + bump * 0.1) * intro.s);
			fluteMat.uniforms.uBloom.value = CFG.bloom * (1 + bump * 0.8 + flash.value * 2.0);

			// 타이틀 가운데 → 왼쪽 이동 + 브랜드 설명 나타남
			if (SLIDE) {
				const target = reduce || titleOut ? 1 : intro.done ? ease(Math.min(1, Math.max(0, (scr.t - LEAD) / (HOLD * 0.25)))) : 0;
				slide.v += (target - slide.v) * 0.12;
				if (Math.abs(target - slide.v) < 0.0005) slide.v = target;
				titleOff.value.set(slide.dx * slide.v * DPR, -slide.dy * slide.v * DPR);
				const op = brandOn ? slide.v : 0;
				if (Math.abs(op - slide.op) > 0.0005 || (op === 0 && slide.op !== 0)) {
					slide.op += (op - slide.op) * 0.12;
					if (Math.abs(op - slide.op) < 0.001) slide.op = op;
					brand.style.opacity = slide.op.toFixed(3);
					brand.style.visibility = slide.op < 0.005 ? "hidden" : "visible";
					brandP.style.transform = `translateX(${((1 - slide.op) * 48).toFixed(1)}px)`;
				}
			}
			const away = SLIDE ? slide.v : Math.min(1, scr.t / 0.3);
			titleFx.uScale.value = slide.v >= 1 ? slide.k : slide.v <= 0 ? 1 : 1 + (slide.k - 1) * slide.v;
			// 스크롤 안내 꺾쇠: 타이틀이 옆으로 가는 만큼 투명해짐 — 보이는 동안은 오른쪽 아래 문의칸 숨김 (html.is-hint)
			if (scrollArrow) {
				const ao = (1 - away).toFixed(3);
				if (ao !== scrollArrow.style.opacity) {
					scrollArrow.style.opacity = ao;
					scrollArrow.style.visibility = +ao < 0.005 ? "hidden" : "visible";
				}
				root.classList.toggle("is-hint", +ao >= 0.005);
			}
			// 섹션 제목이 제자리로 간 뒤 그 위치를 따라감 (하나만 보이면 레이어만 옮김, 아니면 다시 그림)
			const visSecs = secs.filter((s) => s.move.p > 0 && secVisible(s));
			if (visSecs.length === 1 && visSecs[0].move.p >= 1 && visSecs[0].drawn && !txtDirty) {
				const s = visSecs[0],
					r = s.el.getBoundingClientRect();
				secOff.value.set((r.left - s.drawn.left) * DPR, -(r.top - s.drawn.top) * DPR);
			} else {
				visSecs.forEach((s) => {
					const r = s.el.getBoundingClientRect();
					if (!s.rect || r.top !== s.rect.top || r.left !== s.rect.left) {
						s.rect = r;
						txtDirty = true;
					}
				});
			}
			if (txtDirty) {
				txtDirty = false;
				drawTitle(W, H);
				drawSec(W, H);
			}

			// 렌더: 배경(+ 도형 뒤 타이틀) → (배경 + 뒷면) → 앞면만 투명 레이어 → 섹션 제목 투명 레이어 → 칸막이로 합성
			renderer.setRenderTarget(rtBg);
			renderer.clear();
			renderer.render(bgScene, orthoCam);
			renderer.render(titleBackScene, orthoCam);
			renderer.setRenderTarget(rtBack);
			renderer.clear();
			renderer.render(bgScene, orthoCam);
			renderer.render(titleBackScene, orthoCam);
			prism.material = backMat;
			renderer.render(scene, camera);
			prism.material = frontMat;
			renderer.setClearAlpha(0);
			renderer.setRenderTarget(rtShape);
			renderer.clear();
			renderer.render(scene, camera);
			if (spaceTick) spaceTick(t); // 인트로 조각 (도형 레이어에 같이 그려서 칸막이 · 빛 번짐을 같이 받음)
			renderer.setRenderTarget(rtText);
			renderer.clear();
			if (secs.some(secVisible)) renderer.render(secScene, orthoCam);
			renderer.setClearAlpha(1);
			renderer.setRenderTarget(null);
			renderer.clear();
			renderer.render(fluteScene, orthoCam);
		}
		tick();
	}
}
