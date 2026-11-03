/* 3D 선 아이콘 도형 (원본: js/service.js · js/sub.js의 SHAPES — 두 파일이 같은 코드)
   도형 = 정점 v, 실선 e, 점선 dash, 꼭짓점 점 dots, 신호가 오가는 선 sig
   data-shape: cube(정육면체 + 점선 외곽) | ico(정이십면체) | gem(다이아몬드 + 점선 축) | devices(PC · 태블릿 · 폰 화면)
               globe(위도·경도 구) | hex(육각기둥) | net(노드 연결 + 오가는 신호) */
const loop = (sh, pts, kind = "e") => {
	const o = sh.v.length;
	sh.v.push(...pts);
	pts.forEach((_, i) => sh[kind].push([o + i, o + ((i + 1) % pts.length)]));
};
const circle = (n, f) => Array.from({ length: n }, (_, i) => f((i / n) * Math.PI * 2));
const boxEdges = (sh, s, kind) => {
	const o = sh.v.length;
	for (let i = 0; i < 8; i++) sh.v.push([(i & 1 ? 1 : -1) * s, (i & 2 ? 1 : -1) * s, (i & 4 ? 1 : -1) * s]);
	for (let i = 0; i < 8; i++) for (const b of [1, 2, 4]) if (!(i & b)) sh[kind].push([o + i, o + (i | b)]);
	return o;
};
const blank = () => ({ v: [], e: [], dash: [], dots: [], sig: [] });

export const SHAPES = {
	// 기업 홈페이지: 정육면체 + 점선 외곽 상자
	cube() {
		const sh = blank();
		const o = boxEdges(sh, 0.62, "e");
		boxEdges(sh, 0.86, "dash");
		for (let i = 0; i < 8; i++) sh.dots.push(o + i);
		return sh;
	},
	// 병원 홈페이지: 정이십면체 (꼭짓점 12개, 거리가 같은 쌍을 이음)
	ico() {
		const sh = blank(),
			g = (1 + Math.sqrt(5)) / 2,
			n = Math.hypot(1, g);
		[
			[-1, g],
			[1, g],
			[-1, -g],
			[1, -g],
		].forEach(([a, b]) => sh.v.push([0, a / n, b / n], [a / n, b / n, 0], [b / n, 0, a / n]));
		for (let i = 0; i < 12; i++)
			for (let j = i + 1; j < 12; j++) {
				const [a, b] = [sh.v[i], sh.v[j]];
				if (Math.abs(Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) - 2 / n) < 0.01) sh.e.push([i, j]);
			}
		for (let i = 0; i < 12; i++) sh.dots.push(i);
		return sh;
	},
	// 쇼핑몰: 다이아몬드(팔면체) + 위아래 점선 축
	gem() {
		const sh = blank();
		sh.v.push([0, 1.05, 0], [0, -1.05, 0]);
		loop(
			sh,
			circle(4, (a) => [Math.cos(a) * 0.82, 0, Math.sin(a) * 0.82]),
		);
		for (let i = 2; i < 6; i++) sh.e.push([0, i], [1, i]);
		sh.v.push([0, 1.45, 0], [0, -1.45, 0]);
		sh.dash.push([0, 6], [1, 7]);
		loop(
			sh,
			circle(32, (a) => [Math.cos(a) * 1.15, 0, Math.sin(a) * 1.15]),
			"dash",
		);
		sh.dots.push(0, 1);
		return sh;
	},
	// 반응형: PC · 태블릿 · 폰 화면이 앞뒤로 겹쳐 있음 (안쪽 점선 = 화면)
	devices() {
		const sh = blank();
		const frame = (w, h, cy, z) => {
			const o = sh.v.length;
			loop(sh, [
				[-w, cy - h, z],
				[w, cy - h, z],
				[w, cy + h, z],
				[-w, cy + h, z],
			]);
			const i = 0.07;
			loop(
				sh,
				[
					[-w + i, cy - h + i, z],
					[w - i, cy - h + i, z],
					[w - i, cy + h - i, z],
					[-w + i, cy + h - i, z],
				],
				"dash",
			);
			sh.dots.push(o, o + 1, o + 2, o + 3);
		};
		frame(0.95, 0.58, 0.18, -0.4); // PC
		sh.v.push([0, -0.4, -0.4], [0, -0.72, -0.4], [-0.32, -0.72, -0.4], [0.32, -0.72, -0.4]); // 받침대
		const s = sh.v.length - 4;
		sh.e.push([s, s + 1], [s + 2, s + 3]);
		frame(0.46, 0.62, -0.05, 0.08); // 태블릿
		frame(0.24, 0.46, -0.2, 0.52); // 폰
		return sh;
	},
	// SEO/GEO: 위도 · 경도 구
	globe() {
		const sh = blank();
		[-0.6, -0.3, 0, 0.3, 0.6].forEach((y) => {
			const r = Math.sqrt(1 - y * y);
			loop(
				sh,
				circle(32, (a) => [Math.cos(a) * r, y, Math.sin(a) * r]),
			);
		});
		for (let m = 0; m < 4; m++) {
			const b = (m / 4) * Math.PI;
			loop(
				sh,
				circle(32, (a) => [Math.cos(a) * Math.cos(b), Math.sin(a), Math.cos(a) * Math.sin(b)]),
			);
		}
		sh.v.push([0, 1.3, 0], [0, -1.3, 0]);
		sh.dash.push([sh.v.length - 2, sh.v.length - 1]);
		return sh;
	},
	// 관리자 시스템: 육각기둥 + 가운데 점선 육각형
	hex() {
		const sh = blank(),
			hx = (y, r) => circle(6, (a) => [Math.cos(a) * r, y, Math.sin(a) * r]);
		loop(sh, hx(0.62, 0.86));
		loop(sh, hx(-0.62, 0.86));
		for (let i = 0; i < 6; i++) sh.e.push([i, i + 6]);
		loop(sh, hx(0, 0.86), "dash");
		for (let i = 0; i < 12; i++) sh.dots.push(i);
		return sh;
	},
	// AI · 트래킹: 사면체 노드 연결 + 가운데 노드, 선 위로 신호가 오감
	net() {
		const sh = blank(),
			k = 0.9;
		sh.v.push([k, k, k], [k, -k, -k], [-k, k, -k], [-k, -k, k], [0, 0, 0]);
		sh.v = sh.v.map(([x, y, z]) => [x * 0.75, y * 0.75, z * 0.75]);
		sh.e.push([0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]);
		sh.dash.push([4, 0], [4, 1], [4, 2], [4, 3]);
		sh.dots.push(0, 1, 2, 3, 4);
		sh.sig = [0, 3, 5, 1];
		return sh;
	},
};

// 회전 → 원근 투영: 화면 좌표 [x, y, z] (z가 클수록 멀리)
export function project(v, t, rySpeed, C, S) {
	const ry = t * rySpeed,
		rx = 0.38 + Math.sin(t * 0.3) * 0.12;
	const cy = Math.cos(ry),
		sy = Math.sin(ry),
		cx = Math.cos(rx),
		sx = Math.sin(rx);
	return v.map(([x, y, z]) => {
		const x1 = x * cy + z * sy,
			z1 = -x * sy + z * cy;
		const y1 = y * cx - z1 * sx,
			z2 = y * sx + z1 * cx;
		const k = 3.2 / (3.2 + z2);
		return [C + x1 * S * k, C - y1 * S * k, z2];
	});
}

export const seg = (p, [a, b]) => `M${p[a][0].toFixed(1)} ${p[a][1].toFixed(1)}L${p[b][0].toFixed(1)} ${p[b][1].toFixed(1)}`;
